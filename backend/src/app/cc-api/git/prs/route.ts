import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse, successResponse } from '@/lib/auth'
import { execInContainer } from '@/lib/docker'

// Helper to parse owner and repo from git remote URL
function parseGitRemote(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/)
  if (!match) return null
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  }
}

// GET /cc-api/git/prs?projectId=...
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return errorResponse('projectId is required', 400)

  try {
    // 1. Get project container info
    const { data: project, error: projErr } = await supabaseAdmin
      .from('projects')
      .select('container_id')
      .eq('id', projectId)
      .single()

    if (projErr || !project?.container_id) {
      return errorResponse('Project not found or container not provisioned', 404)
    }

    // 2. Fetch user's GitHub token (if any)
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('github_token')
      .eq('github_id', user.id)
      .single()

    const githubToken = dbUser?.github_token

    // 3. Get remote URL from git inside the container
    let remoteUrl = ''
    const exitCode = await execInContainer(
      project.container_id,
      ['git', '-c', 'safe.directory=/workspace', 'remote', 'get-url', 'origin'],
      (data) => {
        remoteUrl += data
      }
    )

    if (exitCode !== 0 || !remoteUrl.trim()) {
      return errorResponse('Failed to retrieve git remote URL from container', 500)
    }

    const parsedRemote = parseGitRemote(remoteUrl.trim())
    if (!parsedRemote) {
      return errorResponse('Could not parse GitHub owner/repo from remote URL: ' + remoteUrl, 400)
    }

    const { owner, repo } = parsedRemote

    // 4. Fetch PRs from GitHub REST API
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=30`, {
      headers,
    })

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      return errorResponse(`GitHub API error: ${ghRes.status} - ${errText}`, ghRes.status)
    }

    const prs = await ghRes.json()
    return successResponse(prs)
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}

// POST /cc-api/git/prs/create
// Body: { projectId, title, body, head, base }
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Missing request body', 400)

  const { projectId, title, body: prBody, head, base = 'main' } = body
  if (!projectId || !title || !head) {
    return errorResponse('projectId, title, and head are required fields', 400)
  }

  try {
    // 1. Fetch user's GitHub token (required for creating a PR)
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('github_token')
      .eq('github_id', user.id)
      .single()

    const githubToken = dbUser?.github_token
    if (!githubToken) {
      return errorResponse('GitHub authentication required. Please sign in with GitHub.', 401)
    }

    // 2. Get project container info
    const { data: project, error: projErr } = await supabaseAdmin
      .from('projects')
      .select('container_id')
      .eq('id', projectId)
      .single()

    if (projErr || !project?.container_id) {
      return errorResponse('Project not found or container not provisioned', 404)
    }

    // 3. Get remote URL from git inside the container
    let remoteUrl = ''
    const exitCode = await execInContainer(
      project.container_id,
      ['git', '-c', 'safe.directory=/workspace', 'remote', 'get-url', 'origin'],
      (data) => {
        remoteUrl += data
      }
    )

    if (exitCode !== 0 || !remoteUrl.trim()) {
      return errorResponse('Failed to retrieve git remote URL from container', 500)
    }

    const parsedRemote = parseGitRemote(remoteUrl.trim())
    if (!parsedRemote) {
      return errorResponse('Could not parse GitHub owner/repo from remote URL', 400)
    }

    const { owner, repo } = parsedRemote

    // 4. Create PR via GitHub REST API
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        body: prBody,
        head,
        base,
      }),
    })

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      return errorResponse(`GitHub API error: ${ghRes.status} - ${errText}`, ghRes.status)
    }

    const createdPr = await ghRes.json()
    return successResponse(createdPr, 201)
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}
