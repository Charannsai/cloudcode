import Docker from 'dockerode'
import path from 'path'
import fs from 'fs'
import net from 'net'
import { supabaseAdmin } from './supabase'
import { getTierConfig, getTierDockerLimits, type TierName } from './tiers'

function ensureProjectDir(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
}

// Connect to Docker daemon (works locally AND on VPS)
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

const IMAGE = process.env.DOCKER_IMAGE || 'cloudcode-base'
const WORKSPACE_ROOT = process.env.CONTAINER_WORKSPACE || '/workspace'

export interface ContainerInfo {
  containerId: string
  status: string
  port?: string
}

/**
 * Create and start a Docker container for a project.
 * Mounts a host directory to /workspace inside the container.
 */
export async function createContainer(projectId: string, userTier?: TierName): Promise<ContainerInfo> {
  const hostPath = getWorkspacePath(projectId)
  ensureProjectDir(hostPath)

  const { data: project } = await supabaseAdmin.from('projects').select('user_github_id').eq('id', projectId).single()
  const userId = project?.user_github_id || 'default'
  const sshVolumeName = `cloudcode-ssh-${userId}`

  // Resolve tier-based resource limits
  const tier = getTierConfig(userTier)
  const dockerLimits = getTierDockerLimits(tier)

  let container
  try {
    container = await docker.createContainer({
      Image: IMAGE,
      name: `cloudcode-${projectId}`,
      Entrypoint: ['tail', '-f', '/dev/null'], // Override image entrypoint to prevent auto-starts!
      Cmd: [],
      WorkingDir: WORKSPACE_ROOT,
      Env: ['HOST=0.0.0.0', 'HOSTNAME=0.0.0.0'], // Force Next.js & Vite to listen on all interfaces
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      ExposedPorts: {
        '3000/tcp': {},
        '5000/tcp': {},
        '5173/tcp': {},
        '8000/tcp': {},
        '8080/tcp': {},
      },
      HostConfig: {
        Binds: [`${hostPath}:${WORKSPACE_ROOT}`, `${sshVolumeName}:/home/coder/.ssh`],
        // Tier-based resource limits (from tiers.ts)
        NanoCpus: dockerLimits.NanoCpus,
        Memory: dockerLimits.Memory,
        StorageOpt: dockerLimits.StorageOpt,
        PortBindings: {
          '3000/tcp': [{ HostPort: '' }],
          '5000/tcp': [{ HostPort: '' }],
          '5173/tcp': [{ HostPort: '' }],
          '8000/tcp': [{ HostPort: '' }],
          '8080/tcp': [{ HostPort: '' }],
        },
        // SECURITY: ICC (Inter-Container Communication) is disabled at daemon level via docker-daemon.json
        NetworkMode: 'bridge',
        RestartPolicy: { Name: 'no' },  // Managed by idle auto-stop — don't auto-restart
      },
    })
  } catch (err: any) {
    const errMsg = err.message || ''
    if (errMsg.includes('storage-opt') || errMsg.includes('StorageOpt')) {
      console.warn(`[Docker] Storage limits (StorageOpt) not supported by host filesystem. Falling back without storage limits...`)
      container = await docker.createContainer({
        Image: IMAGE,
        name: `cloudcode-${projectId}`,
        Entrypoint: ['tail', '-f', '/dev/null'],
        Cmd: [],
        WorkingDir: WORKSPACE_ROOT,
        Env: ['HOST=0.0.0.0', 'HOSTNAME=0.0.0.0'],
        Tty: true,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        ExposedPorts: {
          '3000/tcp': {},
          '5000/tcp': {},
          '5173/tcp': {},
          '8000/tcp': {},
          '8080/tcp': {},
        },
        HostConfig: {
          Binds: [`${hostPath}:${WORKSPACE_ROOT}`, `${sshVolumeName}:/home/coder/.ssh`],
          NanoCpus: dockerLimits.NanoCpus,
          Memory: dockerLimits.Memory,
          PortBindings: {
            '3000/tcp': [{ HostPort: '' }],
            '5000/tcp': [{ HostPort: '' }],
            '5173/tcp': [{ HostPort: '' }],
            '8000/tcp': [{ HostPort: '' }],
            '8080/tcp': [{ HostPort: '' }],
          },
          NetworkMode: 'bridge',
          RestartPolicy: { Name: 'no' },
        },
      })
    } else {
      throw err
    }
  }

  await container.start()
  const info = await container.inspect()

  // Configure git directory access & automatic init
  try {
    // 1. Bypass dubious ownership checks inside the container system-wide
    await execInContainer(info.Id, ['git', 'config', '--system', '--add', 'safe.directory', '*'], () => {}, 'root')

    // 2. Disable system-wide core.fileMode validation inside container
    await execInContainer(info.Id, ['git', 'config', '--system', 'core.fileMode', 'false'], () => {}, 'root')

    // 3. Automatically git init if the repository doesn't have a .git folder (preserves cloned history if imported)
    await execInContainer(
      info.Id,
      ['sh', '-c', 'if [ ! -d "/workspace/.git" ]; then git init && git config user.name "CloudCode" && git config user.email "coder@cloudcode.dev" && git add . && git commit -m "Initial commit"; fi'],
      () => {}
    )
  } catch (err) {
    console.error('Failed to auto-configure git in container:', err)
  }

  const port = info.NetworkSettings.Ports['3000/tcp']?.[0]?.HostPort

  return {
    containerId: info.Id,
    status: info.State.Status,
    port,
  }
}

/**
 * Execute a command inside a running container and stream output.
 */
export async function execInContainer(
  containerId: string,
  command: string[],
  onData: (data: string) => void,
  user?: string,
  env?: string[]
): Promise<number> {
  const container = docker.getContainer(containerId)

  // Fail-safe: Auto-wake container if it is stopped
  try {
    const info = await container.inspect()
    if (info.State.Status !== 'running') {
      console.log(`[execInContainer] Container ${containerId} is stopped. Auto-waking...`)
      await container.start()
      // Brief sleep to ensure services are warm
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch (inspectErr) {
    console.warn(`[execInContainer] Failed to inspect/start container ${containerId}:`, inspectErr)
  }

  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    ...(user ? { User: user } : {}),
    ...(env ? { Env: env } : {}),
  })

  return new Promise((resolve, reject) => {
    exec.start({ hijack: true, stdin: false }, (err, stream) => {
      if (err) return reject(err)
      if (!stream) return reject(new Error('No stream'))

      const stdout = { write: (chunk: Buffer) => { onData(chunk.toString()); return true } }
      const stderr = { write: (chunk: Buffer) => { onData(chunk.toString()); return true } }
      docker.modem.demuxStream(stream, stdout as never, stderr as never)

      stream.on('end', () => {
        exec.inspect().then(info => resolve(info.ExitCode ?? 0)).catch(reject)
      })
      stream.on('error', reject)
    })
  })
}

/**
 * Stop and remove a container.
 */
export async function destroyContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId)
  try {
    await container.stop({ t: 5 })
  } catch {
    // Already stopped
  }
  await container.remove({ force: true })
}

/**
 * Stop a container without removing it (for idle auto-stop).
 * The container can be restarted later with startContainer().
 */
export async function stopContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId)
  try {
    await container.stop({ t: 5 })
  } catch {
    // Already stopped
  }
}

/**
 * Start a previously stopped container.
 * Returns the container status after starting.
 */
export async function startContainer(containerId: string): Promise<string> {
  const container = docker.getContainer(containerId)
  try {
    await container.start()

    // Configure system git configuration system-wide on startup
    try {
      await execInContainer(containerId, ['git', 'config', '--system', '--add', 'safe.directory', '*'], () => {}, 'root')
      await execInContainer(containerId, ['git', 'config', '--system', 'core.fileMode', 'false'], () => {}, 'root')
    } catch (gitErr) {
      console.error('Failed to configure system git on start:', gitErr)
    }

    // Wait briefly for the container to be fully ready
    const info = await container.inspect()
    return info.State.Status
  } catch (err: any) {
    // Container might already be running
    if (err.statusCode === 304) {
      return 'running'
    }
    throw err
  }
}

/**
 * Ensure a project's container is running. If stopped (sleeping), restart it
 * and update the DB status back to 'ready'.
 *
 * Returns `true` if the container was sleeping and had to be woken up,
 * `false` if it was already running.
 */
export async function ensureContainerRunning(projectId: string): Promise<boolean> {
  const { supabaseAdmin } = await import('./supabase')

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, status')
    .eq('id', projectId)
    .single()

  if (!project?.container_id) return false

  const container = docker.getContainer(project.container_id)
  let info
  try {
    info = await container.inspect()
  } catch (err) {
    // Container doesn't exist on host anymore (e.g. Docker pruned it)
    console.log(`[Auto-Restart] Container ${project.container_id} not found on host. Recreating...`)
    const newInfo = await createContainer(projectId)
    await supabaseAdmin
      .from('projects')
      .update({ 
        container_id: newInfo.containerId, 
        status: 'ready',
        port: newInfo.port ? parseInt(newInfo.port, 10) : null
      })
      .eq('id', projectId)
    return true
  }

  // Check if SSH volume is bound to /home/coder/.ssh
  const binds = info.HostConfig?.Binds || []
  const hasSshBind = binds.some((b: string) => b.endsWith(':/home/coder/.ssh'))

  if (!hasSshBind) {
    console.log(`[Self-Healing] Container ${project.container_id} is missing SSH volume bind. Recreating...`)
    try {
      await destroyContainer(project.container_id)
    } catch (e) {}
    const newInfo = await createContainer(projectId)
    await supabaseAdmin
      .from('projects')
      .update({ 
        container_id: newInfo.containerId, 
        status: 'ready',
        port: newInfo.port ? parseInt(newInfo.port, 10) : null
      })
      .eq('id', projectId)
    console.log(`[Self-Healing] Successfully recreated container ${newInfo.containerId} with SSH volume bind.`)
    return true
  }

  if (info.State.Status === 'running') {
    return false
  }

  // Container is stopped/exited — restart it
  console.log(`[Auto-Restart] Waking container for project ${projectId}...`)
  await startContainer(project.container_id)

  // Re-inspect to get fresh port mappings (Docker assigns new random host ports on restart)
  let freshPort: number | null = null
  try {
    const freshInfo = await container.inspect()
    const hostPort = freshInfo.NetworkSettings?.Ports?.['3000/tcp']?.[0]?.HostPort
    if (hostPort) freshPort = parseInt(hostPort, 10)
  } catch {}

  // Update DB status and fresh port mapping
  await supabaseAdmin
    .from('projects')
    .update({ 
      status: 'ready',
      ...(freshPort ? { port: freshPort } : {})
    })
    .eq('id', projectId)

  console.log(`[Auto-Restart] Container for project ${projectId} is now running. Port: ${freshPort || 'unchanged'}`)
  return true
}

/**
 * Get container status.
 */
export async function getContainerStatus(containerId: string): Promise<string> {
  try {
    const container = docker.getContainer(containerId)
    const info = await container.inspect()
    return info.State.Status
  } catch {
    return 'not_found'
  }
}

export interface ContainerDetails {
  status: string
  ports: Record<string, number>
}

/**
 * Get container details including active port mappings.
 */
export async function getContainerDetails(containerId: string): Promise<ContainerDetails> {
  try {
    const container = docker.getContainer(containerId)
    const info = await container.inspect()
    
    const ports: Record<string, number> = {}
    const portSettings = info.NetworkSettings?.Ports
    if (portSettings) {
      for (const [containerPort, bindings] of Object.entries(portSettings)) {
        const hostPort = (bindings as any)?.[0]?.HostPort
        if (hostPort) {
          const cleanKey = containerPort.split('/')[0]
          ports[cleanKey] = parseInt(hostPort, 10)
        }
      }
    }

    return {
      status: info.State.Status,
      ports,
    }
  } catch {
    return {
      status: 'not_found',
      ports: {},
    }
  }
}

export function getWorkspacePath(projectId: string): string {
  // Place 'projects' one level above Next.js backend root so Turbopack does not scan it.
  return path.join(process.cwd(), '..', 'projects', projectId)
}

/**
 * Verifies if a container port is reachable directly on the bridge network.
 * If refused, checks if there is a LOOPBACK listener (real server on 127.0.0.1)
 * inside the container, and if so, spawns a TCP forwarder on the container's
 * bridge IP to make it externally reachable.
 *
 * IMPORTANT: The forwarder MUST listen on the specific containerIp (not 0.0.0.0).
 * If it listened on 0.0.0.0 it would also bind to 127.0.0.1, creating a
 * self-connection loop when forwarding to 127.0.0.1:port.
 */
export async function ensureLocalhostBridge(
  containerId: string,
  containerIp: string,
  port: number | string
): Promise<void> {
  const targetPort = parseInt(port.toString(), 10)
  
  // 1. Check if the port is already reachable on the container's bridge IP.
  //    (This covers: server binds to 0.0.0.0, OR a working bridge already exists.)
  //    Do NOT kill bridges first — check reachability of existing ones.
  const isReachable = await tcpProbe(containerIp, targetPort, 800)
  if (isReachable) {
    return // Reachable directly, no bridge needed!
  }

  // 2. Not reachable externally. Check if a REAL server is listening on
  //    LOOPBACK (127.0.0.1) inside the container. We specifically check for
  //    loopback listeners only (hex 0100007F) to avoid detecting our own
  //    bridge forwarder (which binds to the container bridge IP, not loopback).
  const hexPort = targetPort.toString(16).toUpperCase().padStart(4, '0')
  const checkLoopbackCmd = [
    // IPv4 loopback: 127.0.0.1 in little-endian hex = 0100007F
    `cat /proc/net/tcp 2>/dev/null | grep -i "0100007F:${hexPort}" | grep -E "\\s0A\\s"`,
    // IPv6 loopback: ::1 in little-endian hex
    `cat /proc/net/tcp6 2>/dev/null | grep -i "00000000000000000000000001000000:${hexPort}" | grep -E "\\s0A\\s"`,
  ].join(' || ')
  
  let listenerFound = false
  const exitCode = await execInContainer(
    containerId,
    ['sh', '-c', checkLoopbackCmd],
    (data) => { if (data.trim()) listenerFound = true }
  )

  if (exitCode !== 0 && !listenerFound) {
    // No loopback listener found. The dev server is not running.
    console.log(`[Localhost Bridge] No loopback listener on port ${targetPort} inside container. Server not running.`)
    return
  }

  // 3. A real server is listening on loopback but isn't reachable externally.
  //    Kill any stale forwarder processes on this port, then spawn a new one.
  const killStaleCmd = `ps -ef | grep "net.createServer" | grep "${targetPort}" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true`
  await execInContainer(containerId, ['sh', '-c', killStaleCmd], () => {})
  
  // Brief pause after killing stale processes
  await new Promise(r => setTimeout(r, 50))

  console.log(`[Localhost Bridge] Spawning TCP forwarder for container ${containerId} port ${targetPort} on IP ${containerIp}`)
  
  // CRITICAL: Listen on the specific containerIp (e.g., 172.17.0.2), NOT on 0.0.0.0.
  // If we listened on 0.0.0.0, the forwarder would also be on 127.0.0.1:port,
  // and its connect(port, "127.0.0.1") would connect back to ITSELF → infinite loop.
  const nodeScript = `
const net = require("net");
const server = net.createServer(c => {
  const s = net.connect(${targetPort}, "127.0.0.1");
  c.pipe(s).pipe(c);
  c.on("error", () => s.destroy());
  s.on("error", () => c.destroy());
});
server.listen(${targetPort}, "${containerIp}");
server.on("error", (err) => {
  process.exit(0);
});
`.trim().replace(/'/g, "'\\\\''")

  const startProxyCmd = `nohup node -e '${nodeScript}' > /dev/null 2>&1 &`
  
  await execInContainer(containerId, ['sh', '-c', startProxyCmd], () => {})
  
  // Verify the bridge is reachable with retries (up to 600ms total)
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (await tcpProbe(containerIp, targetPort, 200)) {
      console.log(`[Localhost Bridge] Bridge verified reachable on attempt ${attempt + 1}`)
      return
    }
  }
  console.warn(`[Localhost Bridge] Bridge spawned but not yet reachable after 600ms — proxy will attempt anyway`)
}

/**
 * Quick TCP connectivity probe. Returns true if a TCP connection
 * to host:port succeeds within timeoutMs.
 */
async function tcpProbe(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => { socket.destroy(); resolve(false) })
    socket.connect(port, host)
  })
}

export { docker }
