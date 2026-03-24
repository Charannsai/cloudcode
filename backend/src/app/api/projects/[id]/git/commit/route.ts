import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { gitCommit } from '@/lib/git'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id } = await params
  const body = await req.json()
  const { message } = body as { message: string }

  if (!message?.trim()) return errorResponse('Commit message is required')

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .single()

  if (!project || project.user_github_id !== user.id) return errorResponse('Not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 400)

  try {
    const output = await gitCommit(project.container_id, message)
    return successResponse({ output })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
