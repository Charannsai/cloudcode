import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { verifyToken } from './auth'
import Docker from 'dockerode'
import { supabaseAdmin } from './supabase'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

let wss: WebSocketServer | null = null

export function getWss(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true })
    wss.on('connection', handleTerminalConnection)
  }
  return wss
}

/**
 * Handle a new WebSocket terminal connection.
 * URL: ws://server/api/terminal/<project-id>?token=<jwt>
 */
async function handleTerminalConnection(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  const pathParts = url.pathname.split('/')
  const projectId = pathParts[pathParts.length - 1]

  // Verify our own JWT (not Supabase)
  if (!token) {
    ws.close(4001, 'Missing auth token')
    return
  }

  const user = verifyToken(token)
  if (!user) {
    ws.close(4001, 'Invalid or expired token')
    return
  }

  // Get project + container_id from DB
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_github_id !== user.id) {
    ws.close(4003, 'Project not found or unauthorized')
    return
  }

  if (!project.container_id) {
    ws.close(4004, 'Container not running')
    return
  }

  // Attach PTY to the Docker container
  const container = docker.getContainer(project.container_id)

  try {
    const exec = await container.exec({
      Cmd: [process.env.SHELL || '/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    })

    const stream = await exec.start({ hijack: true, stdin: true, Tty: true })

    // Container output → WebSocket client
    stream.on('data', (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }))
      }
    })

    // WebSocket client input → container stdin
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

    stream.on('end', () => ws.close(1000, 'Terminal closed'))
    ws.on('close', () => stream.destroy())
    ws.on('error', () => stream.destroy())

    ws.send(JSON.stringify({ type: 'ready', message: `Terminal ready — ${user.login}@cloudcode` }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to attach terminal'
    ws.close(4005, message)
  }
}
