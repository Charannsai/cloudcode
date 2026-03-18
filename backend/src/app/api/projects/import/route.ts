import { NextRequest } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createContainer } from '@/lib/docker'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

const ImportSchema = z.object({
  name: z.string().min(1).max(60),
  githubUrl: z.string().url().includes('github.com'),
})

// POST /api/projects/import — clone a GitHub repo
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = ImportSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.message)

  const { name, githubUrl } = parsed.data
  const projectId = uuidv4()

  // Create project record
  const { data: project, error: dbError } = await supabaseAdmin
    .from('projects')
    .insert({
      id: projectId,
      user_id: user.id,
      name,
      type: 'node', // Will be detected from package.json later
      status: 'creating',
      github_url: githubUrl,
    })
    .select()
    .single()

  if (dbError) return errorResponse(dbError.message, 500)

  // Clone repo + provision container in background
  cloneAndProvision(projectId, githubUrl).catch(console.error)

  return successResponse(project, 201)
}

async function cloneAndProvision(projectId: string, githubUrl: string) {
  const workspacePath = path.join(process.cwd(), 'projects', projectId)
  
  try {
    // Clone the repo
    fs.mkdirSync(workspacePath, { recursive: true })
    execSync(`git clone --depth=1 "${githubUrl}" "${workspacePath}"`, {
      timeout: 60000,
      stdio: 'pipe',
    })

    // Provision container
    const { containerId } = await createContainer(projectId)
    
    await supabaseAdmin
      .from('projects')
      .update({ status: 'ready', container_id: containerId })
      .eq('id', projectId)
  } catch (err) {
    console.error('Import failed:', err)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'error' })
      .eq('id', projectId)
  }
}
