import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { destroyContainer, getWorkspacePath } from '@/lib/docker'
import { removeProject } from '@/lib/activityTracker'
import fs from 'fs/promises'

// DELETE /cc-api/user — Delete user account and all associated resources
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  try {
    // 1. Fetch all projects belonging to this user
    const { data: projects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, container_id')
      .eq('user_github_id', user.id)

    if (fetchError) {
      console.error('[User Delete] Failed to fetch projects:', fetchError)
      return errorResponse('Failed to retrieve user projects', 500)
    }

    // 2. Clean up resources for each project
    if (projects && projects.length > 0) {
      for (const project of projects) {
        // Destroy Docker container if it exists
        if (project.container_id) {
          await destroyContainer(project.container_id).catch((err) => {
            console.error(`[User Delete] Failed to destroy container ${project.container_id} for project ${project.id}:`, err)
          })
        }

        // Remove from activity tracker
        removeProject(project.id)

        // Delete local workspace files
        const workspacePath = getWorkspacePath(project.id)
        await fs.rm(workspacePath, { recursive: true, force: true }).catch((err) => {
          console.error(`[User Delete] Failed to delete workspace files at ${workspacePath} for project ${project.id}:`, err)
        })
      }
    }

    // 3. Delete the user from the database
    // Foreign key constraints with ON DELETE CASCADE will automatically clean up the projects and sessions tables.
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('github_id', user.id)

    if (deleteError) {
      console.error('[User Delete] Failed to delete user record:', deleteError)
      return errorResponse('Failed to delete user account record', 500)
    }

    return successResponse({ deleted: true })
  } catch (err) {
    console.error('[User Delete] Unexpected error:', err)
    return errorResponse((err as Error).message, 500)
  }
}
