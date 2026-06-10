import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { loadEnvConfig } from '@next/env'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Load env vars from .env files!
loadEnvConfig(process.cwd())

// Use dynamic imports to ensure they load AFTER env is populated
const startServer = async () => {
  const { WebSocketServer } = await import('ws')
  const { verifyToken } = await import('./lib/auth')
  const { supabaseAdmin } = await import('./lib/supabase')
  const { default: Docker } = await import('dockerode')

  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()

  const docker = new Docker({
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
  })

  await app.prepare()

  const httpServer = createServer(async (req, res) => {
    try {
      let parsedUrl = parse(req.url!, true)
      const pathname = parsedUrl.pathname || ''

      // Custom proxy rewrite: if request has the preview_project_id cookie set, and it is an absolute asset
      // load (not Next.js files, not API calls, not standard routes), rewrite it to the preview proxy!
      const cookies = req.headers.cookie || ''
      const projectIdCookie = cookies.match(/preview_project_id=([^;]+)/)?.[1]

      if (
        projectIdCookie &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/static') &&
        pathname !== '/favicon.ico'
      ) {
        req.url = `/api/preview/${projectIdCookie}${req.url}`
        parsedUrl = parse(req.url, true)
      }

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // ── WebSocket Terminal Server ──
  const wss = new WebSocketServer({ noServer: true })
  const disconnectTimeouts = new Map<string, NodeJS.Timeout>()

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

    const terminalId = url.searchParams.get('terminalId') || 'main'
    const cleanTerminalId = terminalId.replace(/[^a-zA-Z0-9_\-]/g, '')
    const sessionKey = `${projectId}-${cleanTerminalId}`

    // Clear any pending disconnect timeout for this session
    if (disconnectTimeouts.has(sessionKey)) {
      clearTimeout(disconnectTimeouts.get(sessionKey)!)
      disconnectTimeouts.delete(sessionKey)
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
      // Get project name for the prompt
      const { data: projDetails } = await supabaseAdmin.from('projects').select('name').eq('id', projectId).single()
      const projectName = projDetails?.name || 'workspace'

      const container = docker.getContainer(project.container_id)
      const exec = await container.exec({
        // Try to attach to/create a tmux session. If tmux isn't installed, fall back to sh.
        Cmd: [
          '/bin/sh',
          '-c',
          `if command -v tmux >/dev/null 2>&1; then exec tmux new-session -A -s "cloudcode-${cleanTerminalId}"; else export PS1="${projectName} # "; exec /bin/sh; fi`
        ],
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

      ws.on('close', () => {
        stream.destroy()

        // Start a 5-minute idle timer to kill the tmux session inside container
        const timeout = setTimeout(async () => {
          try {
            const container = docker.getContainer(project.container_id)
            const exec = await container.exec({
              Cmd: ['tmux', 'kill-session', '-t', `cloudcode-${cleanTerminalId}`],
            })
            await exec.start({ hijack: true, stdin: false })
            console.log(`[Idle Timeout] Killed terminal session cloudcode-${cleanTerminalId} for project ${projectId}`)
          } catch (err) {
            // Ignore error if already killed
          } finally {
            disconnectTimeouts.delete(sessionKey)
          }
        }, 5 * 60 * 1000) // 5 minutes

        disconnectTimeouts.set(sessionKey, timeout)
      })

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
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

