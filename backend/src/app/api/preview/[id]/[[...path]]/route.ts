import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse } from '@/lib/auth'
import Docker from 'dockerode'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

type Params = { params: Promise<{ id: string; path?: string[] }> }

/**
 * Resolve the target URL inside the container.
 * Tries host-mapped port first, then falls back to container IP.
 */
async function resolveTarget(containerId: string, port: number | string, subPath: string): Promise<string> {
  const container = docker.getContainer(containerId)
  const info = await container.inspect()

  // Try host-mapped port first
  const containerPort = `${port}/tcp`
  const portMappings = (info.NetworkSettings as any).Ports?.[containerPort]
  const hostPort = portMappings?.[0]?.HostPort

  if (hostPort) {
    return `http://127.0.0.1:${hostPort}${subPath}`
  }

  // Fallback to container's internal IP
  const networks = (info.NetworkSettings as any).Networks
  const firstNetwork = networks ? Object.values(networks)[0] as any : null
  const containerIp = firstNetwork?.IPAddress || '127.0.0.1'
  return `http://${containerIp}:${port}${subPath}`
}

/**
 * GET /api/preview/[id]/[...path]
 *
 * Catch-all proxy: forwards ANY request (HTML, CSS, JS, images, fonts, etc.)
 * into the running Docker container. This makes the preview work exactly
 * like opening localhost on a PC — all relative paths resolve correctly.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { id, path: pathSegments } = await params

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, user_github_id, port, container_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 503)

  const port = req.nextUrl.searchParams.get('port') || project.port || 3000

  // Build the sub-path from the catch-all segments
  const subPath = '/' + (pathSegments?.join('/') || '')

  // Preserve query string (e.g. ?v=123 for cache busting)
  const queryString = req.nextUrl.search || ''

  try {
    const targetUrl = await resolveTarget(project.container_id, port, subPath + queryString)

    const response = await fetch(targetUrl, {
      headers: {
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || '127.0.0.1',
        'X-Forwarded-Host': req.headers.get('host') || 'localhost',
        'Accept': req.headers.get('accept') || '*/*',
      },
      signal: AbortSignal.timeout(8000),
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error(`Preview proxy error [${subPath}]:`, err)

    // Only show the fancy error page for the root HTML request
    if (subPath === '/' || subPath === '') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview not available</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family:-apple-system,sans-serif;background:#0a0a0f;color:#c8d3e0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px">
          <h1 style="font-size:48px;margin-bottom:0">🔌</h1>
          <h2 style="color:#fff">Server not responding on port ${port}</h2>
          <p style="color:#5a5a7a">Run <code style="color:#22c55e">npm run dev</code> or <code style="color:#22c55e">npx serve .</code> in Terminal first.</p>
        </body>
        </html>
      `, {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // For asset requests (CSS/JS/images), return a proper 502
    return new Response('', { status: 502 })
  }
}
