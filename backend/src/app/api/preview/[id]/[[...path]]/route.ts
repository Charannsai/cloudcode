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

export async function GET(req: NextRequest, { params }: Params) {
  // 1. Auth: Accept from header, query token, or preview_token cookie
  let user = getUserFromRequest(req)
  if (!user) {
    const tokenParam = req.nextUrl.searchParams.get('token')
    if (tokenParam) user = verifyToken(tokenParam)
  }
  if (!user) return errorResponse('Unauthorized', 401)

  const { id, path: pathSegments } = await params
  
  // 2. Resolve Project ID: Check if URL 'id' is a valid UUID or a filename
  let projectId = id
  let finalPathSegments = pathSegments || []

  if (!UUID_REGEX.test(id)) {
    // This looks like a filename (e.g. /api/preview/style.css)
    // Fallback to the last visited project for this session
    const cookieProjId = req.cookies.get('preview_project_id')?.value
    if (!cookieProjId) return errorResponse('Missing project context', 400)
    
    projectId = cookieProjId
    finalPathSegments = [id, ...finalPathSegments]
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, user_github_id, port, container_id')
    .eq('id', projectId)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 503)

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

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    const resHeaders = new Headers()
    resHeaders.set('Content-Type', contentType)
    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Cache-Control', 'no-cache')

    // Rewrite Location header for redirects
    const location = response.headers.get('location')
    if (location) {
      // If it's a relative redirect (e.g. /dashboard)
      if (location.startsWith('/')) {
        resHeaders.set('Location', `/api/preview/${projectId}${location}`)
      } else {
        resHeaders.set('Location', location)
      }
    }

    const res = new Response(body, {
      status: response.status,
      headers: resHeaders,
    })

    // 3. Set Session Cookies
    const tokenParam = req.nextUrl.searchParams.get('token')
    const cookieOptions = '; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600'
    
    // Refresh auth cookie if token provided
    if (tokenParam && user) {
      res.headers.append('Set-Cookie', `preview_token=${tokenParam}${cookieOptions}`)
    }
    
    // Always persist projectId if we confirmed it's valid
    if (UUID_REGEX.test(projectId)) {
      res.headers.append('Set-Cookie', `preview_project_id=${projectId}${cookieOptions}`)
    }

    return res
  } catch (err) {
    console.error(`Preview proxy error [${subPath}]:`, err)

    if (subPath === '/' || subPath === '') {
      return new Response(`
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
        </body>
        </html>
      `, {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    return new Response('', { status: 502 })
  }
}

