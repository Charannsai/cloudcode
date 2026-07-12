import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createProjectInternal } from '@/lib/projects'
import { docker } from '@/lib/docker'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(60).regex(/^[a-zA-Z0-9_\- ]+$/),
  type: z.enum(['node', 'react', 'empty', 'flask', 'fastapi', 'rust', 'gin', 'nextjs']),
})

import { getTierConfig } from '@/lib/tiers'

// GET /api/projects — list user's projects
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_github_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message, 500)

  try {
    const runningContainersList = await docker.listContainers({ all: true })
    const runningIdsMap = new Map(
      runningContainersList.map(c => [c.Id, c.State])
    )

    const projectsWithLiveStatus = data.map((project: any) => {
      let liveStatus = project.status
      if (project.container_id) {
        const dockerState = runningIdsMap.get(project.container_id)
        if (dockerState === 'running') {
          liveStatus = 'running'
        } else {
          liveStatus = 'stopped'
          if (project.status === 'running' || project.status === 'ready') {
            Promise.resolve(
              supabaseAdmin
                .from('projects')
                .update({ status: 'stopped' })
                .eq('id', project.id)
            ).then(() => console.log(`[Project list Sync] Synced project ${project.id} status to stopped`))
            .catch(console.error)
          }
        }
      } else if (project.status === 'running' || project.status === 'ready') {
        liveStatus = 'stopped'
        Promise.resolve(
          supabaseAdmin
            .from('projects')
            .update({ status: 'stopped' })
            .eq('id', project.id)
        ).then(() => console.log(`[Project list Sync] Synced project ${project.id} with null container to stopped`))
        .catch(console.error)
      }
      return {
        ...project,
        status: liveStatus,
      }
    })

    return successResponse(projectsWithLiveStatus)
  } catch (dockerErr) {
    console.warn('[GET /api/projects] Failed to query Docker daemon. Falling back to DB status.', dockerErr)
    return successResponse(data)
  }
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.message)

  const { name, type } = parsed.data

  try {
    // Fetch user's current tier
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('github_id', user.id)
      .single()

    const tierName = dbUser?.tier || 'free'
    const tier = getTierConfig(tierName)

    // Enforce workspace limit
    if (tier.container.maxWorkspaces > 0) {
      const { count, error: countErr } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_github_id', user.id)

      if (countErr) {
        return errorResponse(countErr.message, 500)
      }

      if (count !== null && count >= tier.container.maxWorkspaces) {
        return errorResponse('LIMIT_EXCEEDED: You have reached the maximum number of workspaces allowed for your plan. Please upgrade to create more.', 403)
      }
    }

    const project = await createProjectInternal(user.id, name, type)
    return successResponse(project, 201)
  } catch (dbError: any) {
    return errorResponse(dbError.message, 500)
  }
}
