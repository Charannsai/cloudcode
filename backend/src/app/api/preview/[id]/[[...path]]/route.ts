import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, verifyToken, errorResponse } from '@/lib/auth'
import Docker from 'dockerode'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

type Params = { params: Promise<{ id: string; path?: string[] }> }

/**
 * Resolve the target URL inside the container.
 * Tries container's internal IP via Docker networking.
 */
async function resolveTarget(containerId: string, port: number | string, subPath: string): Promise<string> {
  const container = docker.getContainer(containerId)
  const info = await container.inspect()

  // Get container IP from the bridge network
  const networks = (info.NetworkSettings as any).Networks
  const firstNetwork = networks ? Object.values(networks)[0] as any : null
  const containerIp = firstNetwork?.IPAddress
  
  if (!containerIp) {
    throw new Error('Container IP not found. Is it running?')
  }
  
  return `http://${containerIp}:${port}${subPath}`
}

/**
 * GET /api/preview/[id]/[[...path]]
 *
 * Catch-all proxy: forwards ANY request (HTML, CSS, JS, images, fonts, etc.)
 * into the running Docker container.
 *
 * Auth is accepted via:
 *   - Authorization: Bearer <token> header (initial page load)
 *   - ?token=<jwt> query param (sub-resource loads like CSS/JS/images)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function withCookies(res: Response, projectId: string, token: string | null) {
  const cookieOptions = '; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600'
  if (token) {
    res.headers.append('Set-Cookie', `preview_token=${token}${cookieOptions}`)
  }
  if (UUID_REGEX.test(projectId)) {
    res.headers.append('Set-Cookie', `preview_project_id=${projectId}${cookieOptions}`)
  }
  return res
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id, path: pathSegments } = await params
  
  // 1. Resolve Project ID & Auth
  let token = req.nextUrl.searchParams.get('token')
  let user = getUserFromRequest(req)
  if (!user && token) user = verifyToken(token)

  if (!user) return withCookies(errorResponse('Unauthorized', 401), '', token)

  let projectId = id
  let finalPathSegments = pathSegments || []

  if (!UUID_REGEX.test(id)) {
    const cookieProjId = req.cookies.get('preview_project_id')?.value
    if (!cookieProjId) return withCookies(errorResponse('Missing project context', 400), '', token)
    projectId = cookieProjId
    finalPathSegments = [id, ...finalPathSegments]
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, user_github_id, port, container_id')
    .eq('id', projectId)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return withCookies(errorResponse('Project not found', 404), projectId, token)
  if (!project.container_id) return withCookies(errorResponse('Container not running', 503), projectId, token)

  const port = req.nextUrl.searchParams.get('port') || project.port || 3000
  const subPath = '/' + (finalPathSegments.join('/') || '')

  try {
    const targetUrl = await resolveTarget(project.container_id, port, subPath)

    const response = await fetch(targetUrl, {
      headers: {
        'Accept': req.headers.get('accept') || '*/*',
        'User-Agent': req.headers.get('user-agent') || 'CloudCodeProxy/1.0',
      },
      redirect: 'manual', // Intercept redirects
      signal: AbortSignal.timeout(8000),
    })

    const body = await response.arrayBuffer()
    const resHeaders = new Headers(response.headers)
    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Cache-Control', 'no-cache')

    // Rewrite Location header for redirects
    const location = response.headers.get('location')
    if (location?.startsWith('/')) {
      resHeaders.set('Location', `/api/preview/${projectId}${location}`)
    }

    return withCookies(new Response(body, { status: response.status, headers: resHeaders }), projectId, token)

  } catch (err) {
    console.error(`Preview proxy error [${subPath}]:`, err)

    if (subPath === '/' || subPath === '') {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview not available</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family:-apple-system,sans-serif;background:#0a0a0f;color:#c8d3e0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px">
          <h1>🔌</h1>
          <h2 style="color:#fff">Server not responding on port ${port}</h2>
          <p style="color:#5a5a7a">Ensure <code style="color:#22c55e">npm run dev</code> is running in Terminal.</p>
          <p style="font-size:12px;opacity:0.5;margin-top:20px">${err instanceof Error ? err.message : 'Connection Refused'}</p>
        </body>
        </html>
      `
      return withCookies(new Response(errorHtml, { status: 502, headers: { 'Content-Type': 'text/html' } }), projectId, token)
    }

    return withCookies(new Response('', { status: 502 }), projectId, token)
  }
}
