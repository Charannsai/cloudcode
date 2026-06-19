import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { execInContainer, ensureContainerRunning } from '@/lib/docker'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  // Verify ownership
  const { data: projectCheck } = await supabaseAdmin
    .from('projects')
    .select('user_github_id')
    .eq('id', id)
    .single()

  if (!projectCheck || projectCheck.user_github_id !== user.id) return errorResponse('Project container not found', 404)

  let name = ''
  let email = ''

  try {
    await ensureContainerRunning(id)

    // Fetch updated container_id
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('container_id')
      .eq('id', id)
      .single()

    if (project?.container_id) {
      await execInContainer(project.container_id, ['git', '-c', 'safe.directory=/workspace', 'config', 'user.name'], (data) => { name += data })
      await execInContainer(project.container_id, ['git', '-c', 'safe.directory=/workspace', 'config', 'user.email'], (data) => { email += data })
    }
  } catch {}

  return successResponse({ 
    name: name.trim() || null, 
    email: email.trim() || null 
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  // Verify ownership
  const { data: projectCheck } = await supabaseAdmin
    .from('projects')
    .select('user_github_id')
    .eq('id', id)
    .single()

  if (!projectCheck || projectCheck.user_github_id !== user.id) return errorResponse('Project container not found', 404)

  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email) {
    return errorResponse('Missing name or email')
  }

  try {
    await ensureContainerRunning(id)

    // Fetch updated container_id
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('container_id')
      .eq('id', id)
      .single()

    if (!project || !project.container_id) return errorResponse('Container not found after wake', 404)

    await execInContainer(project.container_id, ['git', '-c', 'safe.directory=/workspace', '--git-dir=/workspace/.git', 'config', 'user.name', body.name], () => {})
    await execInContainer(project.container_id, ['git', '-c', 'safe.directory=/workspace', '--git-dir=/workspace/.git', 'config', 'user.email', body.email], () => {})
    return successResponse({ saved: true })
  } catch (err) {
    return errorResponse(`Failed to save git config: ${(err as Error).message}`, 500)
  }
}
