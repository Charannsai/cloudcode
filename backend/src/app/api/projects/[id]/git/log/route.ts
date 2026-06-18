import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { gitLog } from '@/lib/git'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id } = await params
  const countStr = req.nextUrl.searchParams.get('count')
  const count = countStr ? parseInt(countStr, 10) : 20

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id, user_github_id')
    .eq('id', id)
    .single()

  if (!project || project.user_github_id !== user.id) return errorResponse('Not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 400)

  try {
    const log = await gitLog(project.container_id, count)
    return successResponse({ log })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
