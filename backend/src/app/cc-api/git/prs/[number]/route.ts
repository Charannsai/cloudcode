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

// GET /cc-api/git/prs/[number]?projectId=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { number } = await params
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
      return errorResponse('Could not parse GitHub owner/repo from remote URL', 400)
    }

    const { owner, repo } = parsedRemote

    // 4. Fetch PR info, comments, and files in parallel from GitHub API
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`
    }

    const [prRes, issueCommentsRes, reviewCommentsRes, filesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/comments`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`, { headers }),
    ])

    if (!prRes.ok) {
      const errText = await prRes.text()
      return errorResponse(`GitHub API error: ${prRes.status} - ${errText}`, prRes.status)
    }

    const prData = await prRes.json()
    const issueComments = await issueCommentsRes.json().catch(() => [])
    const reviewComments = await reviewCommentsRes.json().catch(() => [])
    const files = await filesRes.json().catch(() => [])

    // Combine issue comments (conversation) and review comments (inline code comments)
    // and sort them chronologically
    const conversation = [
      ...issueComments.map((c: any) => ({ ...c, type: 'issue_comment' })),
      ...reviewComments.map((c: any) => ({ ...c, type: 'review_comment' })),
    ].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return successResponse({
      pr: prData,
      conversation,
      files,
    })
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}

// POST /cc-api/git/prs/[number]/review?projectId=...
// Body: { event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT', body: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { number } = await params
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return errorResponse('projectId is required', 400)

  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Missing request body', 400)

  const { event, body: reviewBody } = body
  if (!event) return errorResponse('event (APPROVE, REQUEST_CHANGES, COMMENT) is required', 400)

  try {
    // 1. Fetch user's GitHub token
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

    // 4. Submit review on GitHub
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        body: reviewBody,
      }),
    })

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      return errorResponse(`GitHub API error: ${ghRes.status} - ${errText}`, ghRes.status)
    }

    const reviewResult = await ghRes.json()
    return successResponse(reviewResult)
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}

// PUT /cc-api/git/prs/[number]/merge?projectId=...
// Body: { commit_title, commit_message, merge_method }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { number } = await params
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return errorResponse('projectId is required', 400)

  const body = await req.json().catch(() => null)
  const { commit_title, commit_message, merge_method = 'merge' } = body || {}

  try {
    // 1. Fetch user's GitHub token
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

    // 4. Merge PR on GitHub
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/merge`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        commit_title,
        commit_message,
        merge_method,
      }),
    })

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      return errorResponse(`GitHub API error: ${ghRes.status} - ${errText}`, ghRes.status)
    }

    const mergeResult = await ghRes.json()
    return successResponse(mergeResult)
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}
