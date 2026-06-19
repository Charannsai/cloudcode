import { NextRequest } from 'next/server'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { gitBranches, gitCheckout } from '@/lib/git'
import { ensureContainerRunning } from '@/lib/docker'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id } = await params

  // Verify ownership
  const { data: projectCheck } = await supabaseAdmin
    .from('projects')
    .select('user_github_id')
    .eq('id', id)
    .single()

  if (!projectCheck || projectCheck.user_github_id !== user.id) return errorResponse('Not found', 404)

  // Ensure container is running (auto-wake if stopped)
  try {
    await ensureContainerRunning(id)
  } catch (err) {
    return errorResponse(`Failed to wake container: ${(err as Error).message}`, 500)
  }

  // Get updated container ID
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id')
    .eq('id', id)
    .single()

  if (!project || !project.container_id) return errorResponse('Container not running', 400)

  try {
    const result = await gitBranches(project.container_id)
    return successResponse(result)
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id } = await params
  const body = await req.json()
  const { branch, create } = body as { branch: string; create?: boolean }

  if (!branch?.trim()) return errorResponse('Branch name required')

  // Verify ownership
  const { data: projectCheck } = await supabaseAdmin
    .from('projects')
    .select('user_github_id')
    .eq('id', id)
    .single()

  if (!projectCheck || projectCheck.user_github_id !== user.id) return errorResponse('Not found', 404)

  // Ensure container is running (auto-wake if stopped)
  try {
    await ensureContainerRunning(id)
  } catch (err) {
    return errorResponse(`Failed to wake container: ${(err as Error).message}`, 500)
  }

  // Get updated container ID
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('container_id')
    .eq('id', id)
    .single()

  if (!project || !project.container_id) return errorResponse('Container not running', 400)

  try {
    const output = await gitCheckout(project.container_id, branch, create)
    return successResponse({ output })
  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
}
