#!/usr/bin/env node
/**
 * CloudCode Sidecar Proxy Agent
 * 
 * A lightweight reverse proxy that runs inside every CloudCode container on port 9999.
 * It receives all preview traffic from the host's Next.js server and dynamically
 * forwards it to the correct internal port (e.g., 3000, 5173, 8080, or any other).
 * 
 * Since this runs INSIDE the container, it can reach servers bound to 127.0.0.1
 * (localhost) directly — eliminating the need for external loopback bridge hacks.
 * 
 * Protocol:
 *   - The host proxy sends requests to http://<container-ip>:9999/...
 *   - The target port is specified via the X-Target-Port header (defaults to 3000)
 *   - WebSocket upgrades are also forwarded using the same header
 * 
 * Zero external dependencies — uses only Node.js built-in modules.
 */

const http = require('http');
const net = require('net');

const SIDECAR_PORT = 9999;
const DEFAULT_TARGET_PORT = 3000;

// Caches the correct loopback hostname ('127.0.0.1' or '::1') for each target port
const activeHostnames = {};

/**
 * Dynamically check if the target port is bound to IPv4 (127.0.0.1) or IPv6 (::1).
 * Caches the result to prevent TCP handshake overhead on subsequent requests.
 */
function getActiveHostname(port) {
  if (activeHostnames[port]) {
    return Promise.resolve(activeHostnames[port]);
  }

  return new Promise((resolve) => {
    // 1. Try connecting to 127.0.0.1 (IPv4 loopback)
    const socket4 = net.connect({ port, host: '127.0.0.1', timeout: 300 }, () => {
      socket4.destroy();
      activeHostnames[port] = '127.0.0.1';
      resolve('127.0.0.1');
    });

    socket4.on('error', () => {
      // 2. Fallback: Try connecting to ::1 (IPv6 loopback)
      const socket6 = net.connect({ port, host: '::1', timeout: 300 }, () => {
        socket6.destroy();
        activeHostnames[port] = '::1';
        resolve('::1');
      });

      socket6.on('error', () => {
        // Fallback to localhost if both checks fail (let the standard client connection throw error)
        resolve('localhost');
      });
    });
  });
}

// ── HTTP Request Proxy ──────────────────────────────────────────────────────

const server = http.createServer(async (clientReq, clientRes) => {
  const targetPort = parseInt(clientReq.headers['x-target-port'] || DEFAULT_TARGET_PORT, 10);
  const hostname = await getActiveHostname(targetPort);
  console.log(`[Sidecar] HTTP ${clientReq.method} ${clientReq.url} -> ${hostname}:${targetPort}`);

  // Clone headers, removing sidecar-specific ones before forwarding
  const forwardHeaders = { ...clientReq.headers };
  delete forwardHeaders['x-target-port'];
  // Preserve the original Host header from the proxy for framework compatibility
  forwardHeaders['host'] = `localhost:${targetPort}`;

  const options = {
    hostname: hostname,
    port: targetPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: forwardHeaders,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Sidecar] HTTP proxy error connecting to ${hostname}:${targetPort}: ${err.message}`, err);
    
    // Clear cache if the connection failed, forcing re-detection on next request
    delete activeHostnames[targetPort];

    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end(
        `Sidecar: Cannot connect to ${hostname}:${targetPort}. ` +
        `Make sure your development server is running. (${err.code || err.message})`
      );
    }
  });

  // Pipe the incoming request body to the target
  clientReq.pipe(proxyReq, { end: true });

  // Handle client disconnect
  clientReq.on('error', () => proxyReq.destroy());
});

// ── WebSocket Upgrade Proxy ─────────────────────────────────────────────────

server.on('upgrade', async (clientReq, clientSocket, clientHead) => {
  const targetPort = parseInt(clientReq.headers['x-target-port'] || DEFAULT_TARGET_PORT, 10);
  const hostname = await getActiveHostname(targetPort);
  console.log(`[Sidecar] WS Upgrade ${clientReq.url} -> ${hostname}:${targetPort}`);

  // Open a raw TCP connection to the target port
  const targetSocket = net.connect(targetPort, hostname, () => {
    // Reconstruct the HTTP upgrade request to send to the target
    const forwardHeaders = { ...clientReq.headers };
    delete forwardHeaders['x-target-port'];
    forwardHeaders['host'] = `localhost:${targetPort}`;

    let reqLine = `${clientReq.method} ${clientReq.url} HTTP/1.1\r\n`;
    for (const [key, value] of Object.entries(forwardHeaders)) {
      if (Array.isArray(value)) {
        value.forEach(v => { reqLine += `${key}: ${v}\r\n`; });
      } else if (value !== undefined) {
        reqLine += `${key}: ${value}\r\n`;
      }
    }
    reqLine += '\r\n';

    targetSocket.write(reqLine);
    if (clientHead && clientHead.length > 0) {
      targetSocket.write(clientHead);
    }

    // Bidirectional pipe: client <-> target
    targetSocket.pipe(clientSocket);
    clientSocket.pipe(targetSocket);
  });

  targetSocket.on('error', (err) => {
    console.error(`[Sidecar] WebSocket proxy error connecting to ${hostname}:${targetPort}: ${err.message}`, err);
    
    // Clear cache if the connection failed
    delete activeHostnames[targetPort];

    clientSocket.write(
      'HTTP/1.1 502 Bad Gateway\r\n' +
      'Content-Type: text/plain\r\n' +
      '\r\n' +
      `Sidecar: WebSocket target ${hostname}:${targetPort} is not reachable. (${err.code || err.message})`
    );
    clientSocket.destroy();
  });

  clientSocket.on('error', () => targetSocket.destroy());
});

// ── Start Listening ─────────────────────────────────────────────────────────

server.listen(SIDECAR_PORT, '0.0.0.0', () => {
  console.log(`[CloudCode Sidecar] Listening on 0.0.0.0:${SIDECAR_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
