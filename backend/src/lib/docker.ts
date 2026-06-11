import Docker from 'dockerode'
import path from 'path'
import fs from 'fs'

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
export async function createContainer(projectId: string): Promise<ContainerInfo> {
  const hostPath = getHostPath(projectId)
  ensureProjectDir(hostPath)

  const container = await docker.createContainer({
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
      Binds: [`${hostPath}:${WORKSPACE_ROOT}`],
      Memory: 1024 * 1024 * 1024, // 1GB memory cap (prevents starving the VPS host RAM)
      CpuShares: 512,
      PortBindings: {
        '3000/tcp': [{ HostPort: '' }],
        '5000/tcp': [{ HostPort: '' }],
        '5173/tcp': [{ HostPort: '' }],
        '8000/tcp': [{ HostPort: '' }],
        '8080/tcp': [{ HostPort: '' }],
      },
      NetworkMode: 'bridge',
      RestartPolicy: { Name: 'no' },  // Managed by idle auto-stop — don't auto-restart
    },
  })

  await container.start()
  const info = await container.inspect()

  // Configure git directory access & automatic init
  try {
    // 1. Bypass dubious ownership checks inside the container system-wide
    await execInContainer(info.Id, ['git', 'config', '--system', '--add', 'safe.directory', '*'], () => {}, 'root')

    // 2. Disable system-wide core.fileMode validation inside container
    await execInContainer(info.Id, ['git', 'config', '--system', 'core.fileMode', 'false'], () => {}, 'root')

    // 3. Inject global SSH command so terminal users can run git push natively
    await execInContainer(info.Id, ['git', 'config', '--system', 'core.sshCommand', 'ssh -i /workspace/.cloudcode/ssh/id_ed25519 -o UserKnownHostsFile=/workspace/.cloudcode/ssh/known_hosts -o StrictHostKeyChecking=no'], () => {}, 'root')

    // 4. Automatically git init if the repository doesn't have a .git folder (preserves cloned history if imported)
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
  user?: string
): Promise<number> {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    ...(user ? { User: user } : {})
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
      await execInContainer(containerId, ['git', 'config', '--system', 'core.sshCommand', 'ssh -i /workspace/.cloudcode/ssh/id_ed25519 -o UserKnownHostsFile=/workspace/.cloudcode/ssh/known_hosts -o StrictHostKeyChecking=no'], () => {}, 'root')
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

  const status = await getContainerStatus(project.container_id)

  if (status === 'running') return false

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

function getHostPath(projectId: string): string {
  // On VPS this should be an absolute path like /data/projects/<id>
  return path.join(process.cwd(), 'projects', projectId)
}

export { docker }
