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

function withCookies(res: Response, projectId: string, token: string | null, port?: string | null) {
  const cookieOptions = '; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600'
  if (token) {
    res.headers.append('Set-Cookie', `preview_token=${token}${cookieOptions}`)
  }
  if (UUID_REGEX.test(projectId)) {
    res.headers.append('Set-Cookie', `preview_project_id=${projectId}${cookieOptions}`)
  }
  if (port) {
    res.headers.append('Set-Cookie', `preview_port=${port}${cookieOptions}`)
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

  const queryPort = req.nextUrl.searchParams.get('port')
  const cookiePort = req.cookies.get('preview_port')?.value
  const port = queryPort || cookiePort || project.port || 3000
  
  const searchParams = new URLSearchParams(req.nextUrl.search)
  searchParams.delete('token')
  searchParams.delete('port')
  const search = searchParams.toString() ? '?' + searchParams.toString() : ''
  
  const subPath = '/' + (finalPathSegments.join('/') || '')

  try {
    const targetUrl = await resolveTarget(project.container_id, port, subPath + search)

    const response = await fetch(targetUrl, {
      headers: {
        'Accept': req.headers.get('accept') || '*/*',
        'User-Agent': req.headers.get('user-agent') || 'CloudCodeProxy/1.0',
        'Accept-Encoding': 'identity', // Strongly request uncompressed
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(60000), // Increased from 10s to 60s for slow first-compilations (Next/Vite)
    })

    // Handle 304 Not Modified & other bodyless responses
    if (response.status === 304 || response.status === 204 || !response.body) {
      const resHeaders = new Headers(response.headers)
      resHeaders.delete('content-encoding')
      resHeaders.delete('content-length')
      resHeaders.delete('transfer-encoding')
      
      return withCookies(new Response(null, { status: response.status, headers: resHeaders }), projectId, token, port.toString())
    }

    const resHeaders = new Headers(response.headers)
    
    // !! ESSENTIAL: Strip hop-by-hop and encoding headers
    resHeaders.delete('content-encoding')
    resHeaders.delete('content-length')
    // ... other deletes ...
    resHeaders.delete('transfer-encoding')
    resHeaders.delete('connection')
    resHeaders.delete('keep-alive')
    resHeaders.delete('proxy-authenticate')
    resHeaders.delete('proxy-authorization')
    resHeaders.delete('te')
    resHeaders.delete('trailers')
    resHeaders.delete('upgrade')

    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    resHeaders.set('X-Proxy-Target', targetUrl)

    // Rewrite Location header for redirects
    const location = response.headers.get('location')
    if (location?.startsWith('/')) {
      resHeaders.set('Location', `/api/preview/${projectId}${location}`)
    }

    // HTML Content Rewriting: Fix absolute paths for assets (/logo.png -> /api/preview/id/logo.png)
    const body = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || ''
    let finalBody: BodyInit = body

    if (contentType.includes('text/html')) {
        try {
            const decoder = new TextDecoder()
            let htmlText = decoder.decode(body)
            // Naive but effective replacement for common attributes
            const replacement = `/api/preview/${projectId}/`
            htmlText = htmlText.replaceAll('src="/', `src="${replacement}`)
            htmlText = htmlText.replaceAll('srcset="/', `srcset="${replacement}`)
            htmlText = htmlText.replaceAll('href="/', `href="${replacement}`)
            htmlText = htmlText.replaceAll('action="/', `action="${replacement}`)
            htmlText = htmlText.replaceAll('poster="/', `poster="${replacement}`)
            htmlText = htmlText.replaceAll('data-src="/', `data-src="${replacement}`)
            finalBody = new TextEncoder().encode(htmlText)
        } catch (e) {
            console.error('HTML Proxy rewrite failed:', e)
        }
    }

    return withCookies(new Response(finalBody, { status: response.status, headers: resHeaders }), projectId, token, port.toString())

  } catch (err) {
    console.error(`Preview proxy error [${subPath}]:`, err)

    if (subPath === '/' || subPath === '') {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview not available</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0f; color: #c8d3e0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
            .card { background: #12121e; border: 1px solid #2a2a3c; padding: 40px; borderRadius: 24px; maxWidth: 400px; width: 100%; }
            h1 { font-size: 48px; margin: 0 0 16px 0; }
            h2 { color: #fff; margin: 0 0 12px 0; font-size: 20px; }
            p { color: #8a8a9a; line-height: 1.5; margin: 0 0 24px 0; font-size: 14px; }
            code { background: #1d1d2b; padding: 4px 8px; border-radius: 6px; color: #3b82f6; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🔌</h1>
            <h2>Server Not Found</h2>
            <p>We couldn't reach 127.0.0.1:<b>${port}</b> inside your project container. Make sure your dev server is running.</p>
            <p style="font-size:12px;opacity:0.6">${err instanceof Error ? err.message : 'Connection Refused'}</p>
          </div>
        </body>
        </html>
      `
      return withCookies(new Response(errorHtml, { status: 502, headers: { 'Content-Type': 'text/html' } }), projectId, token)
    }

    return withCookies(new Response('', { status: 502 }), projectId, token)
  }
}
