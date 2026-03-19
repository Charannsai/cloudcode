import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { verifyToken } from './lib/auth'
import { supabaseAdmin } from './lib/supabase'
import Docker from 'dockerode'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Load Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // ── WebSocket Terminal Server ──
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true)

    if (pathname?.startsWith('/api/terminal/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', async (ws, req: any) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')
    const pathParts = url.pathname.split('/')
    const projectId = pathParts[pathParts.length - 1]

    if (!token || !projectId) {
      ws.close(4001, 'Missing token or project ID')
      return
    }

    const user = verifyToken(token)
    if (!user) {
      ws.close(4001, 'Invalid token')
      return
    }

    // Get container mapping from DB
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('container_id, user_github_id')
      .eq('id', projectId)
      .single()

    if (!project || project.user_github_id !== user.id || !project.container_id) {
      ws.close(4003, 'Unauthorized or container not found')
      return
    }

    try {
      const container = docker.getContainer(project.container_id)
      const exec = await container.exec({
        Cmd: ['/bin/sh'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      })

      const stream = await exec.start({ hijack: true, stdin: true, Tty: true })

      // Bridge WebSocket <-> Docker Stream
      stream.on('data', (chunk: Buffer) => {
        if (ws.readyState === 1 /* OPEN */) {
          ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }))
        }
      })

      ws.on('message', (msg) => {
        try {
          const parsed = JSON.parse(msg.toString())
          if (parsed.type === 'input') stream.write(parsed.data)
          if (parsed.type === 'resize') exec.resize({ h: parsed.rows, w: parsed.cols }).catch(() => {})
        } catch {}
      })

      ws.on('close', () => stream.destroy())
      stream.on('end', () => ws.close(1000, 'Process ended'))

      ws.send(JSON.stringify({ type: 'ready', message: `Connected to container for ${projectId}` }))

    } catch (err) {
      ws.close(4005, 'Failed to connect to container shell')
    }
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket terminal proxy active`)
  })
})
