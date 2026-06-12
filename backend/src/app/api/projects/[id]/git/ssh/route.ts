import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { execInContainer, ensureContainerRunning } from '@/lib/docker'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params
  await ensureContainerRunning(id)

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project || !project.container_id) return errorResponse('Project container not found', 404)

  let pubKey = ''
  let hasKey = false
  let history = []

  try {
    // Fix permissions on startup/query just in case
    await execInContainer(project.container_id, ['mkdir', '-p', '/home/coder/.ssh'], () => {}, 'root')
    await execInContainer(project.container_id, ['chown', '-R', 'coder:coder', '/home/coder/.ssh'], () => {}, 'root')
    await execInContainer(project.container_id, ['chmod', '700', '/home/coder/.ssh'], () => {}, 'root')

    const exitCode = await execInContainer(project.container_id, ['test', '-f', '/home/coder/.ssh/id_ed25519'], () => {})
    if (exitCode === 0) {
      hasKey = true
      await execInContainer(project.container_id, ['cat', '/home/coder/.ssh/id_ed25519.pub'], (data) => {
        pubKey += data
      })
      // Load history
      let historyData = ''
      const histExit = await execInContainer(project.container_id, ['cat', '/home/coder/.ssh/key_history.json'], (data) => { historyData += data })
      if (histExit === 0 && historyData) {
        try { history = JSON.parse(historyData) } catch (e) {}
      }
    }
  } catch (err) {
    hasKey = false
  }

  return successResponse({ hasKey, publicKey: hasKey ? pubKey.trim() : null, history })
}

async function execOrThrow(
  containerId: string,
  command: string[],
  user?: string
): Promise<string> {
  let output = ''
  const exitCode = await execInContainer(
    containerId,
    command,
    (data) => {
      output += data
    },
    user
  )
  if (exitCode !== 0) {
    throw new Error(`Command "${command.join(' ')}" failed with exit code ${exitCode}. Output: ${output.trim()}`)
  }
  return output
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params
  await ensureContainerRunning(id)

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project || !project.container_id) return errorResponse('Project container not found', 404)

  try {
    // 1. Create directory as root and ensure correct ownership/permissions on .ssh folder
    await execOrThrow(project.container_id, ['mkdir', '-p', '/home/coder/.ssh'], 'root')
    await execOrThrow(project.container_id, ['chown', '-R', 'coder:coder', '/home/coder/.ssh'], 'root')
    await execOrThrow(project.container_id, ['chmod', '700', '/home/coder/.ssh'], 'root')

    // 2. Force remove existing keys to avoid overwrite prompts
    await execOrThrow(project.container_id, ['rm', '-f', '/home/coder/.ssh/id_ed25519', '/home/coder/.ssh/id_ed25519.pub'])

    // 3. Generate key pair as coder (default container user)
    await execOrThrow(
      project.container_id,
      ['ssh-keygen', '-t', 'ed25519', '-N', '', '-f', '/home/coder/.ssh/id_ed25519', '-q']
    )

    // 4. Ensure key file permissions are secure
    await execOrThrow(project.container_id, ['chmod', '600', '/home/coder/.ssh/id_ed25519'], 'root')
    await execOrThrow(project.container_id, ['chown', 'coder:coder', '/home/coder/.ssh/id_ed25519', '/home/coder/.ssh/id_ed25519.pub'], 'root')

    // 5. Read public key
    const pubKey = await execOrThrow(project.container_id, ['cat', '/home/coder/.ssh/id_ed25519.pub'])

    // 6. Update history
    let history: any[] = []
    let historyData = ''
    try {
      const exitCode = await execInContainer(project.container_id, ['cat', '/home/coder/.ssh/key_history.json'], (data) => { historyData += data })
      if (exitCode === 0 && historyData) {
        history = JSON.parse(historyData)
      }
    } catch (e) {
      // Ignore reading history errors
    }
    history.unshift({ timestamp: new Date().toISOString(), publicKey: pubKey.trim() })
    
    // Save history using a shell command properly writing JSON string
    const escapedJson = JSON.stringify(history).replace(/'/g, "'\\''")
    await execOrThrow(project.container_id, ['sh', '-c', `echo '${escapedJson}' > /home/coder/.ssh/key_history.json`])

    // Cache github keys to prevent interactive host verification dialog prompts
    await execOrThrow(project.container_id, ['sh', '-c', 'ssh-keyscan github.com >> /home/coder/.ssh/known_hosts 2>/dev/null'])

    return successResponse({ hasKey: true, publicKey: pubKey.trim(), history })
  } catch (err) {
    console.error('SSH generation error:', err)
    return errorResponse(`Failed to generate SSH key: ${(err as Error).message}`, 500)
  }
}
