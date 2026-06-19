import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { destroyContainer, getContainerDetails, ensureContainerRunning, getWorkspacePath } from '@/lib/docker'
import { recordActivity, removeProject } from '@/lib/activityTracker'
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

  // Track activity — viewing a project counts as active usage
  recordActivity(id)

  // Auto-restart sleeping containers when user views the project
  if (data.container_id) {
    await ensureContainerRunning(id)
    
    // Fetch updated container_id and status from database in case it was recreated during ensureContainerRunning
    const { data: updatedData } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    const finalData = updatedData || data
    if (finalData.container_id) {
      const details = await getContainerDetails(finalData.container_id)
      return successResponse({ 
        ...finalData, 
        container_status: details.status,
        ports: details.ports,
        port: details.ports['3000'] || finalData.port || null
      })
    }
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

  // Clean up activity tracker
  removeProject(id)

  const workspacePath = getWorkspacePath(id)
  await fs.rm(workspacePath, { recursive: true, force: true }).catch(console.error)

  await supabaseAdmin.from('projects').delete().eq('id', id)

  return successResponse({ deleted: true })
}
