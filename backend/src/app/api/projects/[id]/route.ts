import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { destroyContainer, getContainerStatus } from '@/lib/docker'
import fs from 'fs/promises'
import path from 'path'

type Params = { params: Promise<{ id: string }> }

// GET /api/projects/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (error || !data) return errorResponse('Project not found', 404)

  if (data.container_id) {
    const containerStatus = await getContainerStatus(data.container_id)
    return successResponse({ ...data, container_status: containerStatus })
  }

  return successResponse(data)
}

// DELETE /api/projects/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (error || !data) return errorResponse('Project not found', 404)

  if (data.container_id) {
    await destroyContainer(data.container_id).catch(console.error)
  }

  const workspacePath = path.join(process.cwd(), 'projects', id)
  await fs.rm(workspacePath, { recursive: true, force: true }).catch(console.error)

  await supabaseAdmin.from('projects').delete().eq('id', id)

  return successResponse({ deleted: true })
}
