import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, verifyToken, errorResponse } from '@/lib/auth'
import { recordActivity } from '@/lib/activityTracker'
import { ensureContainerRunning } from '@/lib/docker'
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
    .select('id, user_github_id, port, container_id, status')
    .eq('id', projectId)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return withCookies(errorResponse('Project not found', 404), projectId, token)
  if (!project.container_id) return withCookies(errorResponse('Container not running', 503), projectId, token)

  // Track activity to prevent idle auto-stop
  recordActivity(projectId)

  // Auto-restart sleeping containers
  const wasAsleep = await ensureContainerRunning(projectId)

  const queryPort = req.nextUrl.searchParams.get('port')
  const cookiePort = req.cookies.get('preview_port')?.value
  const port = queryPort || cookiePort || project.port || 3000
  
  const searchParams = new URLSearchParams(req.nextUrl.search)
  searchParams.delete('token')
  searchParams.delete('port')
  const search = searchParams.toString() ? '?' + searchParams.toString() : ''
  
  const subPath = '/' + (finalPathSegments.join('/') || '')

  // If the container was just woken up, return a 503 so the WebView
  // triggers renderError → the native "Retry Connection" screen handles it.
  // The user taps Retry after a few seconds once the dev server boots.
  if (wasAsleep) {
    return withCookies(new Response('Container is waking up', { status: 503 }), projectId, token, port.toString())
  }

  try {
    const targetUrl = await resolveTarget(project.container_id, port, subPath + search)

    const response = await fetch(targetUrl, {
      headers: {
        'Host': `localhost:${port}`,
        'Accept': req.headers.get('accept') || '*/*',
        'User-Agent': req.headers.get('user-agent') || 'CloudCodeProxy/1.0',
        'Accept-Encoding': 'identity', // Strongly request uncompressed
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(120_000), // 120s for heavy first-compilations (Framer Motion, GSAP, etc.)
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

    // HTML Content Rewriting: Inject <base> tag so the browser resolves ALL
    // relative URLs (CSS url(), JS import(), img src, fetch, etc.) through the
    // proxy path automatically. This replaces the old naïve replaceAll approach
    // which corrupted inline JS in heavy bundles (Framer Motion, GSAP, etc.).
    const body = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || ''
    let finalBody: BodyInit = body

    if (contentType.includes('text/html')) {
        try {
            const decoder = new TextDecoder()
            let htmlText = decoder.decode(body)

            // Inject <base> tag if not already present
            if (!htmlText.includes('<base')) {
                htmlText = htmlText.replace(
                    /<head([^>]*)>/i,
                    `<head$1><base href="/api/preview/${projectId}/">`
                )
            }

            finalBody = new TextEncoder().encode(htmlText)
        } catch (e) {
            console.error('HTML Proxy rewrite failed:', e)
        }
    }

    // Also rewrite CSS url() references for stylesheets served separately
    if (contentType.includes('text/css')) {
        try {
            const decoder = new TextDecoder()
            let cssText = decoder.decode(body)
            const cssReplacement = `/api/preview/${projectId}/`
            cssText = cssText.replaceAll('url(/', `url(${cssReplacement}`)
            cssText = cssText.replaceAll("url('/", `url('${cssReplacement}`)
            cssText = cssText.replaceAll('url("/', `url("${cssReplacement}`)
            finalBody = new TextEncoder().encode(cssText)
        } catch (e) {
            console.error('CSS Proxy rewrite failed:', e)
        }
    }

    return withCookies(new Response(finalBody, { status: response.status, headers: resHeaders }), projectId, token, port.toString())

  } catch (err) {
    console.error(`Preview proxy error [${subPath}]:`, err)
    // Return a plain 502 — the mobile WebView renderError will show the native "Retry Connection" screen
    return withCookies(new Response('', { status: 502 }), projectId, token)
  }
}
