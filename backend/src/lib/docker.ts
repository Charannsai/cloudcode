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
    Cmd: ['tail', '-f', '/dev/null'], // Keep alive
    WorkingDir: WORKSPACE_ROOT,
    Env: ['HOST=0.0.0.0', 'HOSTNAME=0.0.0.0'], // Force Next.js & Vite to listen on all interfaces
    Tty: true,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    ExposedPorts: {
      '3000/tcp': {},
    },
    HostConfig: {
      Binds: [`${hostPath}:${WORKSPACE_ROOT}`],
      Memory: 2048 * 1024 * 1024, // Increased to 2GB because Next.js Turbopack crashes 512MB
      CpuShares: 512,
      PortBindings: {
        '3000/tcp': [{ HostPort: '' }], // Map to a random host port
      },
      NetworkMode: 'bridge',
      RestartPolicy: { Name: 'unless-stopped' },
    },
  })

  await container.start()
  const info = await container.inspect()

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
  onData: (data: string) => void
): Promise<number> {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
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

function getHostPath(projectId: string): string {
  // On VPS this should be an absolute path like /data/projects/<id>
  return path.join(process.cwd(), 'projects', projectId)
}

export { docker }
