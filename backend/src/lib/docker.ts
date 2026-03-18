import Docker from 'dockerode'
import path from 'path'

// Connect to Docker daemon (works locally AND on VPS)
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

const IMAGE = process.env.DOCKER_IMAGE || 'node:20-alpine'
const WORKSPACE_ROOT = process.env.CONTAINER_WORKSPACE || '/workspace'

export interface ContainerInfo {
  containerId: string
  status: string
}

/**
 * Create and start a Docker container for a project.
 * Mounts a host directory to /workspace inside the container.
 */
export async function createContainer(projectId: string): Promise<ContainerInfo> {
  const hostPath = getHostPath(projectId)

  const container = await docker.createContainer({
    Image: IMAGE,
    name: `cloudcode-${projectId}`,
    Cmd: ['tail', '-f', '/dev/null'], // Keep alive
    WorkingDir: WORKSPACE_ROOT,
    Tty: true,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    HostConfig: {
      Binds: [`${hostPath}:${WORKSPACE_ROOT}`],
      NetworkMode: 'bridge',
      RestartPolicy: { Name: 'unless-stopped' },
    },
    ExposedPorts: {
      '3000/tcp': {},
      '8080/tcp': {},
    },
  })

  await container.start()
  const info = await container.inspect()

  return {
    containerId: info.Id,
    status: info.State.Status,
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
