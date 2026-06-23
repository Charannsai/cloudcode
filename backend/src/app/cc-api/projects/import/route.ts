import { NextRequest } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createContainer, getWorkspacePath } from '@/lib/docker'
import path from 'path'
import { spawnSync } from 'child_process'
import fs from 'fs'

const ImportSchema = z.object({
  name: z.string().min(1).max(60),
  githubUrl: z.string().url(),
})

import { getTierConfig } from '@/lib/tiers'

// POST /api/projects/import
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = ImportSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.message)

  const { name, githubUrl } = parsed.data

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
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }

  const projectId = uuidv4()

  const { data: project, error: dbError } = await supabaseAdmin
    .from('projects')
    .insert({
      id: projectId,
      user_github_id: user.id,
      name,
      type: 'node',
      status: 'creating',
      github_url: githubUrl,
    })
    .select()
    .single()

  if (dbError) return errorResponse(dbError.message, 500)

  cloneAndProvision(projectId, githubUrl).catch(console.error)

  return successResponse(project, 201)
}

async function cloneAndProvision(projectId: string, githubUrl: string) {
  const workspacePath = getWorkspacePath(projectId)
  try {
    fs.mkdirSync(workspacePath, { recursive: true })
    // SECURITY: Use spawnSync with array args to prevent shell injection via githubUrl
    const cloneResult = spawnSync('git', ['clone', '--depth=1', githubUrl, workspacePath], {
      timeout: 60000,
      stdio: 'pipe',
    })
    if (cloneResult.status !== 0) {
      throw new Error(`git clone failed: ${cloneResult.stderr?.toString() || 'unknown error'}`)
    }
    
    // Grant full permissions recursively so the Docker "coder" user can read/write the cloned code!
    // SECURITY: Use spawnSync with array args to prevent shell injection via workspacePath
    spawnSync('chmod', ['-R', '777', workspacePath], { stdio: 'ignore' })

    const { containerId, port } = await createContainer(projectId)
    await supabaseAdmin
      .from('projects')
      .update({ 
        status: 'ready', 
        container_id: containerId,
        port: port ? parseInt(port, 10) : null
      })
      .eq('id', projectId)
  } catch (err) {
    console.error('Import failed:', err)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'error' })
      .eq('id', projectId)
  }
}
