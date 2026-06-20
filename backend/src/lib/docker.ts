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

  // Update DB status back to ready
  await supabaseAdmin
    .from('projects')
    .update({ status: 'ready' })
    .eq('id', projectId)

  console.log(`[Auto-Restart] Container for project ${projectId} is now running.`)
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
 * If refused, checks if there is a loopback listener inside the container,
 * and if so, spawns a background Node.js TCP forwarder inside the container.
 */
export async function ensureLocalhostBridge(
  containerId: string,
  containerIp: string,
  port: number | string
): Promise<void> {
  const targetPort = parseInt(port.toString(), 10)
  
  // Kill any stale forwarder on this port inside the container first
  const killStaleCmd = `ps -ef | grep "net.createServer" | grep "${targetPort}" | grep -v grep | awk '{print \$2}' | xargs kill -9 2>/dev/null || true`
  await execInContainer(containerId, ['sh', '-c', killStaleCmd], () => {})

  // 1. Check if the port is reachable directly from the host
  const isReachable = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(1000)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(targetPort, containerIp)
  })

  if (isReachable) {
    return // Reachable directly, no bridge needed!
  }

  // 2. Not reachable. Check if a process is listening on this port inside the container.
  // We check for any listener on this port (e.g. 127.0.0.1:port or 0.0.0.0:port).
  // We first inspect /proc/net/tcp and /proc/net/tcp6 which is zero-dependency and works on all Linux.
  // If not found, we fall back to ss/netstat.
  const hexPort = targetPort.toString(16).toUpperCase().padStart(4, '0')
  const checkCmd = `cat /proc/net/tcp /proc/net/tcp6 2>/dev/null | grep -i -E ":${hexPort} .* 0A" || (ss -lnt || netstat -an) | grep -E ':${targetPort}\\b|\\.${targetPort}\\b'`
  
  let checkListenerOutput = ''
  const hasListener = await execInContainer(
    containerId,
    ['sh', '-c', checkCmd],
    (data) => { checkListenerOutput += data }
  )

  if (hasListener !== 0) {
    // No listener found on this port at all. The server is likely not running.
    return
  }

  // 3. Listener exists internally, but not externally reachable.
  // Spin up a background Node.js TCP forwarder inside the container.
  console.log(`[Localhost Bridge] Spawning TCP forwarder for container ${containerId} port ${targetPort} on IP ${containerIp}`)
  
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
`.trim().replace(/'/g, "'\\''")

  const startProxyCmd = `nohup node -e '${nodeScript}' > /dev/null 2>&1 &`
  
  await execInContainer(containerId, ['sh', '-c', startProxyCmd], () => {})
  
  // Wait briefly for the socket to bind (150ms)
  await new Promise((resolve) => setTimeout(resolve, 150))
}

export { docker }
