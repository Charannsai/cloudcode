import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { execInContainer } from '@/lib/docker'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project || !project.container_id) return errorResponse('Project container not found', 404)

  let pubKey = ''
  let hasKey = false

  try {
    const exitCode = await execInContainer(project.container_id, ['test', '-f', '/workspace/.cloudcode/ssh/id_ed25519'], () => {})
    if (exitCode === 0) {
      hasKey = true
      await execInContainer(project.container_id, ['cat', '/workspace/.cloudcode/ssh/id_ed25519.pub'], (data) => {
        pubKey += data
      })
    }
  } catch (err) {
    hasKey = false
  }

  return successResponse({ hasKey, publicKey: hasKey ? pubKey.trim() : null })
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project || !project.container_id) return errorResponse('Project container not found', 404)

  try {
    await execInContainer(project.container_id, ['mkdir', '-p', '/workspace/.cloudcode/ssh'], () => {})
    await execInContainer(
      project.container_id,
      ['ssh-keygen', '-t', 'ed25519', '-N', '', '-f', '/workspace/.cloudcode/ssh/id_ed25519', '-q'],
      () => {}
    )
    
    // Ensure .cloudcode is ignored by git so the keys aren't committed!
    await execInContainer(project.container_id, ['sh', '-c', 'mkdir -p /workspace/.git/info && grep -qxF ".cloudcode" /workspace/.git/info/exclude || echo ".cloudcode" >> /workspace/.git/info/exclude'], () => {})

    let pubKey = ''
    await execInContainer(project.container_id, ['cat', '/workspace/.cloudcode/ssh/id_ed25519.pub'], (data) => {
      pubKey += data
    })

    // Cache github keys to prevent interactive host verification dialog prompts
    await execInContainer(project.container_id, ['sh', '-c', 'ssh-keyscan github.com >> /workspace/.cloudcode/ssh/known_hosts 2>/dev/null'], () => {})

    return successResponse({ hasKey: true, publicKey: pubKey.trim() })
  } catch (err) {
    return errorResponse(`Failed to generate SSH key: ${(err as Error).message}`, 500)
  }
}
