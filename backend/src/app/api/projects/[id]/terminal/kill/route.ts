import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { execInContainer } from '@/lib/docker'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id } = await params
  const body = await req.json().catch(() => null)
  const terminalId = body?.terminalId

  if (!terminalId) return errorResponse('Missing terminalId', 400)

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .single()

  if (!project || project.user_github_id !== user.id) return errorResponse('Not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 400)

  try {
    const cleanTerminalId = terminalId.replace(/[^a-zA-Z0-9_\-]/g, '')
    // Run tmux kill-session inside the docker container
    await execInContainer(
      project.container_id,
      ['tmux', 'kill-session', '-t', `cloudcode-${cleanTerminalId}`],
      () => {}
    )
    return successResponse({ killed: true, terminalId })
  } catch (err) {
    // If tmux was not installed or session did not exist, just return success since it's already dead
    return successResponse({ killed: true, terminalId, note: (err as Error).message })
  }
}
