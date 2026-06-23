import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { loadEnvConfig } from '@next/env'

// Load env vars from .env files!
loadEnvConfig(process.cwd())

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)


// Use dynamic imports to ensure they load AFTER env is populated
const startServer = async () => {
  const { WebSocketServer } = await import('ws')
  const { verifyToken } = await import('./lib/auth')
  const { supabaseAdmin } = await import('./lib/supabase')
  const { default: Docker } = await import('dockerode')
  const { recordActivity, isIdle, getTrackedProjects } = await import('./lib/activityTracker')
  const { stopContainer, ensureSidecarRunning } = await import('./lib/docker')
  const { getTierConfig } = await import('./lib/tiers')

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

      // Universal preview proxy rewrite:
      // - /cc-api/* routes are CloudCode platform endpoints — never proxy these
      // - /api/preview/* is the preview proxy handler itself — let Next.js handle it
      // - /_next/* are Next.js internal assets — never proxy these
      // - Everything else (including user /api/* routes) gets proxied to the container
      const cookies = req.headers.cookie || ''
      const projectIdCookie = cookies.match(/preview_project_id=([^;]+)/)?.[1]

      let refererProjectId = ''
      const referer = req.headers.referer || ''
      const match = referer.match(/\/api\/preview\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
      if (match) {
        refererProjectId = match[1]
      }

      // If the Referer header indicates this request originated from a preview,
      // we MUST rewrite it (including /_next, /static, /api, and favicon.ico) so that
      // ALL sub-resources are served from the container — not the CloudCode backend.
      if (refererProjectId && !pathname.startsWith('/cc-api') && !pathname.startsWith('/api/preview')) {
        req.url = `/api/preview/${refererProjectId}${req.url}`
        parsedUrl = parse(req.url, true)
      } else if (
        projectIdCookie &&
        !pathname.startsWith('/cc-api') &&
        !pathname.startsWith('/api/preview') &&
        !pathname.startsWith('/_next')
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

    if (pathname?.startsWith('/cc-api/terminal/')) {
      // CloudCode platform terminal WebSocket — handle directly
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      // Universal WebSocket proxy: forward ALL other upgrades to the container.
      // This covers Vite HMR, Webpack HMR, Socket.io, custom WS endpoints,
      // and any framework-specific WebSocket paths.
      handleWebSocketProxy(request, socket, head)
    }
  })

  async function handleWebSocketProxy(request: any, socket: any, head: any) {
    try {
      const { pathname, search } = parse(request.url || '', true)
      const cookies = request.headers.cookie || ''
      let projectId = cookies.match(/preview_project_id=([^;]+)/)?.[1]
      let port = cookies.match(/preview_port=([^;]+)/)?.[1]

      if (!projectId) {
        const referer = request.headers.referer || ''
        const match = referer.match(/\/api\/preview\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
        if (match) {
          projectId = match[1]
        }
      }

      if (!projectId) {
        socket.destroy()
        return
      }

      // Track WebSocket proxy connections as activity (HMR, live reload, etc.)
      recordActivity(projectId)

      const { supabaseAdmin } = await import('./lib/supabase')
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('container_id, port')
        .eq('id', projectId)
        .single()

      if (!project?.container_id) {
        socket.destroy()
        return
      }

      const info = await docker.getContainer(project.container_id).inspect()
      const networks = (info.NetworkSettings as any).Networks
      const firstNetwork = networks ? Object.values(networks)[0] as any : null
      const containerIp = firstNetwork?.IPAddress

      if (!containerIp) {
        socket.destroy()
        return
      }

      // Resolve internal port from cookies, referer, or DB default
      let internalPort = '3000'
      if (!port) {
        const referer = request.headers.referer || ''
        const iportMatch = referer.match(/[\?&]iport=(\d+)/)
        const portMatch = referer.match(/[\?&]port=(\d+)/)
        if (iportMatch) {
          internalPort = iportMatch[1]
        } else if (portMatch) {
          internalPort = portMatch[1]
        }
      } else {
        internalPort = port
      }

      // Ensure the sidecar is running inside the container
      await ensureSidecarRunning(project.container_id)

      // Route WebSocket through the sidecar on port 9999 with X-Target-Port header
      const SIDECAR_PORT = 9999
      const { default: WebSocket, WebSocketServer } = await import('ws')
      const targetUrl = `ws://${containerIp}:${SIDECAR_PORT}${pathname}${search || ''}`
      
      const targetWs = new WebSocket(targetUrl, {
        headers: {
          Host: `localhost:${internalPort}`,
          Cookie: request.headers.cookie || '',
          Origin: `http://localhost:${internalPort}`,
          'X-Forwarded-Host': `localhost:${internalPort}`,
          'X-Forwarded-Proto': 'http',
          'X-Target-Port': internalPort,
        },
        origin: `http://localhost:${internalPort}`
      })

      targetWs.on('open', () => {
        const wssBridge = new WebSocketServer({ noServer: true })
        wssBridge.handleUpgrade(request, socket, head, (clientWs) => {
          clientWs.on('message', (data) => {
            if (targetWs.readyState === WebSocket.OPEN) targetWs.send(data)
          })
          targetWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data)
          })
          clientWs.on('close', () => targetWs.close())
          targetWs.on('close', () => clientWs.close())
          clientWs.on('error', () => targetWs.close())
          targetWs.on('error', () => clientWs.close())
        })
      })

      targetWs.on('error', () => {
        socket.destroy()
      })

    } catch (err) {
      console.error('WebSocket proxy error:', err)
      socket.destroy()
    }
  }

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

    // Get container mapping from DB to check ownership first
    const { data: initialProject } = await supabaseAdmin
      .from('projects')
      .select('container_id, user_github_id')
      .eq('id', projectId)
      .single()

    if (!initialProject || initialProject.user_github_id !== user.id || !initialProject.container_id) {
      ws.close(4003, 'Unauthorized or container not found')
      return
    }

    try {
      // Auto-wake container if stopped/sleeping
      const { ensureContainerRunning } = await import('./lib/docker')
      await ensureContainerRunning(projectId)

      // Fetch the project details again to get the updated container_id in case it was recreated
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('container_id, name')
        .eq('id', projectId)
        .single()

      if (!project || !project.container_id) {
        ws.close(4003, 'Container not found after wake')
        return
      }

      const projectName = project.name || 'workspace'
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
          if (parsed.type === 'input') {
            stream.write(parsed.data)
            recordActivity(projectId) // Track terminal input as activity
          }
          if (parsed.type === 'resize') exec.resize({ h: parsed.rows, w: parsed.cols }).catch(() => {})
        } catch {}
      })

      ws.on('close', () => {
        stream.destroy()
        // Container idle management is now handled by the background cron,
        // not per-terminal-session tmux timeouts.
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
    console.log(`> Container idle auto-stop cron active (10 min threshold for Free tier)`)
  })

  // ── Container Idle Auto-Stop Cron ──
  // Runs every 2 minutes. Stops containers dynamically based on user's subscription tier.
  const IDLE_CHECK_INTERVAL_MS = 2 * 60 * 1000 // Check every 2 minutes

  setInterval(async () => {
    try {
      // Get all projects with running containers, joining users to get their tier
      const { data: activeProjects } = await supabaseAdmin
        .from('projects')
        .select('id, name, container_id, status, user_github_id, users:users!projects_user_github_id_fkey(tier)')
        .not('container_id', 'is', null)
        .in('status', ['ready', 'running']) as any

      if (!activeProjects || activeProjects.length === 0) return

      for (const project of activeProjects) {
        if (!project.container_id) continue

        // Resolve tier name and dynamic idle threshold
        const userTier = project.users?.tier || 'free'
        const tierConfig = getTierConfig(userTier)
        const idleMinutes = tierConfig.container.idleTimeoutMinutes

        // If idleMinutes is 0, container is user-defined / always-on (bypass auto-stop)
        if (idleMinutes === 0) {
          continue
        }

        const thresholdMs = idleMinutes * 60 * 1000

        if (isIdle(project.id, thresholdMs)) {
          try {
            await stopContainer(project.container_id)
            await supabaseAdmin
              .from('projects')
              .update({ status: 'sleeping' })
              .eq('id', project.id)

            console.log(`[Idle Auto-Stop] Stopped container for "${project.name}" (${project.id}) after ${idleMinutes} min inactivity (${userTier} tier)`)
          } catch (err) {
            console.error(`[Idle Auto-Stop] Failed to stop container for ${project.id}:`, err)
          }
        }
      }
    } catch (err) {
      console.error('[Idle Auto-Stop] Cron error:', err)
    }
  }, IDLE_CHECK_INTERVAL_MS)
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

