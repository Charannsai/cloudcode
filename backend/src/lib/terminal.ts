import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { supabaseAdmin } from './supabase'
import Docker from 'dockerode'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

/**
 * Global WebSocket server for terminal streaming.
 * Initialize this in your custom server or Next.js instrumentation.
 */
let wss: WebSocketServer | null = null

export function getWss(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true })
    wss.on('connection', handleTerminalConnection)
  }
  return wss
}

/**
 * Handle a new WebSocket connection.
 * URL format: ws://server/api/terminal/<project-id>?token=<jwt>
 */
async function handleTerminalConnection(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  const pathParts = url.pathname.split('/')
  const projectId = pathParts[pathParts.length - 1]

  // Authenticate user
  if (!token) {
    ws.close(4001, 'Missing auth token')
    return
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    ws.close(4001, 'Invalid auth token')
    return
  }

  // Get project + container ID from DB
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== data.user.id) {
    ws.close(4003, 'Project not found or unauthorized')
    return
  }

  if (!project.container_id) {
    ws.close(4004, 'Container not running')
    return
  }

  // Create a PTY exec inside the container
  const container = docker.getContainer(project.container_id)
  
  try {
    const exec = await container.exec({
      Cmd: ['/bin/sh'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    })

    const stream = await exec.start({ hijack: true, stdin: true, Tty: true })

    // Forward container output → WebSocket client
    stream.on('data', (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }))
      }
    })

    // Forward WebSocket input → container stdin
    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString())
        if (parsed.type === 'input') {
          stream.write(parsed.data)
        } else if (parsed.type === 'resize') {
          exec.resize({ h: parsed.rows, w: parsed.cols }).catch(() => {})
        }
      } catch {
        // Ignore malformed messages
      }
    })

    stream.on('end', () => {
      ws.close(1000, 'Terminal closed')
    })

    ws.on('close', () => {
      stream.destroy()
    })

    ws.on('error', () => {
      stream.destroy()
    })

    ws.send(JSON.stringify({ type: 'ready', message: 'Terminal connected' }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to attach terminal'
    ws.close(4005, message)
  }
}
