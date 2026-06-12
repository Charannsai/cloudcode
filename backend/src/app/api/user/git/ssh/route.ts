import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { execInContainer, ensureContainerRunning } from '@/lib/docker'

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  // Find any active project with a container for the user
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, container_id')
    .eq('user_github_id', user.id)
    .not('container_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!project || !project.container_id) {
    return successResponse({ hasKey: false, publicKey: null, history: [] })
  }

  try {
    await ensureContainerRunning(project.id)
  } catch (err) {
    return errorResponse(`Failed to start project container: ${(err as Error).message}`, 500)
  }

  let pubKey = ''
  let hasKey = false
  let history = []

  try {
    // Fix permissions on startup/query just in case
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

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  // Find any active project with a container for the user
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, container_id')
    .eq('user_github_id', user.id)
    .not('container_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!project || !project.container_id) {
    return errorResponse('Please create at least one project first before generating SSH keys.', 400)
  }

  try {
    await ensureContainerRunning(project.id)
  } catch (err) {
    return errorResponse(`Failed to start project container: ${(err as Error).message}`, 500)
  }

  try {
    await execInContainer(project.container_id, ['mkdir', '-p', '/home/coder/.ssh'], () => {})
    
    // Ensure coder owns the volume before generating
    await execInContainer(project.container_id, ['chown', '-R', 'coder:coder', '/home/coder/.ssh'], () => {}, 'root')
    await execInContainer(project.container_id, ['chmod', '700', '/home/coder/.ssh'], () => {}, 'root')

    // Force remove existing keys to avoid overwrite prompts
    await execInContainer(project.container_id, ['rm', '-f', '/home/coder/.ssh/id_ed25519', '/home/coder/.ssh/id_ed25519.pub'], () => {})

    await execInContainer(
      project.container_id,
      ['ssh-keygen', '-t', 'ed25519', '-N', '', '-f', '/home/coder/.ssh/id_ed25519', '-q'],
      () => {}
    )

    let pubKey = ''
    await execInContainer(project.container_id, ['cat', '/home/coder/.ssh/id_ed25519.pub'], (data) => {
      pubKey += data
    })

    // Update history
    let history: any[] = []
    let historyData = ''
    const histExit = await execInContainer(project.container_id, ['cat', '/home/coder/.ssh/key_history.json'], (data) => { historyData += data })
    if (histExit === 0 && historyData) {
      try { history = JSON.parse(historyData) } catch (e) {}
    }
    history.unshift({ timestamp: new Date().toISOString(), publicKey: pubKey.trim() })
    
    // Save history using a shell command properly writing JSON string
    const escapedJson = JSON.stringify(history).replace(/'/g, "'\\''")
    await execInContainer(project.container_id, ['sh', '-c', `echo '${escapedJson}' > /home/coder/.ssh/key_history.json`], () => {})

    // Cache github keys to prevent interactive host verification dialog prompts
    await execInContainer(project.container_id, ['sh', '-c', 'ssh-keyscan github.com >> /home/coder/.ssh/known_hosts 2>/dev/null'], () => {})

    return successResponse({ hasKey: true, publicKey: pubKey.trim(), history })
  } catch (err) {
    return errorResponse(`Failed to generate SSH key: ${(err as Error).message}`, 500)
  }
}
