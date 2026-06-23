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
        } else if (dockerState === 'exited' || dockerState === 'paused') {
          liveStatus = 'stopped'
        }
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
    const project = await createProjectInternal(user.id, name, type)
    return successResponse(project, 201)
  } catch (dbError: any) {
    return errorResponse(dbError.message, 500)
  }
}
