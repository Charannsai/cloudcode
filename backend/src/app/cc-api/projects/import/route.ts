import { NextRequest } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { createContainer, getWorkspacePath, execInContainer, installRuntimeInContainerAsync } from '@/lib/docker'
import path from 'path'
import { spawnSync } from 'child_process'
import fs from 'fs'

const ImportSchema = z.object({
  name: z.string().min(1).max(60),
  githubUrl: z.string().url(),
  runtimes: z.array(z.string()).optional(),
})

import { getTierConfig } from '@/lib/tiers'

// POST /api/projects/import
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const parsed = ImportSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.message)

  const { name, githubUrl, runtimes } = parsed.data

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

  cloneAndProvision(projectId, githubUrl, user.id, runtimes).catch(console.error)

  return successResponse(project, 201)
}

async function cloneAndProvision(projectId: string, githubUrl: string, userGithubId: string, runtimes?: string[]) {
  const workspacePath = getWorkspacePath(projectId)
  try {
    // 1. Fetch user's GitHub token (if any)
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('github_token')
      .eq('github_id', userGithubId)
      .single()

    const githubToken = dbUser?.github_token || undefined

    // 2. Create workspace directory on host
    fs.mkdirSync(workspacePath, { recursive: true })
    spawnSync('chmod', ['-R', '777', workspacePath], { stdio: 'ignore' })

    // 3. Provision the container first (with empty workspace mounted)
    const { containerId, port } = await createContainer(projectId)

    // 4. Determine clone URL (OAuth HTTPS or SSH fallback)
    let cloneUrl = githubUrl
    if (githubToken) {
      const cleanUrl = githubUrl.replace(/^https?:\/\//, '')
      cloneUrl = `https://${githubToken}@${cleanUrl}`
    } else {
      // Fallback: Translate to SSH if no token is available
      const match = githubUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/)
      if (match) {
        const owner = match[1]
        const repo = match[2]
        cloneUrl = `git@github.com:${owner}/${repo}.git`
      }
    }

    // 5. Clone the repository inside the container
    let cloneOutput = ''
    const exitCode = await execInContainer(
      containerId,
      ['git', 'clone', '--depth=1', cloneUrl, '/workspace'],
      (data) => {
        cloneOutput += data
      },
      'coder' // Run as 'coder' so it uses the SSH volume mounted at /home/coder/.ssh
    )

    if (exitCode !== 0) {
      throw new Error(`git clone failed inside container (exit code ${exitCode}): ${cloneOutput}`)
    }

    // 6. Mark project as ready
    await supabaseAdmin
      .from('projects')
      .update({ 
        status: 'ready', 
        container_id: containerId,
        port: port ? parseInt(port, 10) : null
      })
      .eq('id', projectId)

    // 7. Install pre-selected runtimes in background
    if (runtimes && runtimes.length > 0) {
      for (const runtime of runtimes) {
        installRuntimeInContainerAsync(containerId, runtime).catch((err) => {
          console.error(`[Background Runtime Install Failed during Import] ${runtime}:`, err)
        })
      }
    }
  } catch (err) {
    console.error('Import failed:', err)
    await supabaseAdmin
      .from('projects')
      .update({ status: 'error' })
      .eq('id', projectId)
  }
}
