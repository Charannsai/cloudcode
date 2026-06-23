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

// ── HTTP Request Proxy ──────────────────────────────────────────────────────

const server = http.createServer((clientReq, clientRes) => {
  const targetPort = parseInt(clientReq.headers['x-target-port'] || DEFAULT_TARGET_PORT, 10);
  console.log(`[Sidecar] HTTP ${clientReq.method} ${clientReq.url} -> localhost:${targetPort}`);

  // Clone headers, removing sidecar-specific ones before forwarding
  const forwardHeaders = { ...clientReq.headers };
  delete forwardHeaders['x-target-port'];
  // Preserve the original Host header from the proxy for framework compatibility
  forwardHeaders['host'] = `localhost:${targetPort}`;

  const options = {
    hostname: 'localhost',
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
    // Target port is not active — return a clear 502
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end(
        `Sidecar: Cannot connect to localhost:${targetPort}. ` +
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

server.on('upgrade', (clientReq, clientSocket, clientHead) => {
  const targetPort = parseInt(clientReq.headers['x-target-port'] || DEFAULT_TARGET_PORT, 10);
  console.log(`[Sidecar] WS Upgrade ${clientReq.url} -> localhost:${targetPort}`);

  // Open a raw TCP connection to the target port
  const targetSocket = net.connect(targetPort, 'localhost', () => {
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
    // If target isn't reachable, send a 502 and close the socket
    clientSocket.write(
      'HTTP/1.1 502 Bad Gateway\r\n' +
      'Content-Type: text/plain\r\n' +
      '\r\n' +
      `Sidecar: WebSocket target localhost:${targetPort} is not reachable. (${err.code || err.message})`
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
