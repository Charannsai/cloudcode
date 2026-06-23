import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, verifyToken, errorResponse } from '@/lib/auth'
import { recordActivity } from '@/lib/activityTracker'
import { ensureContainerRunning, ensureSidecarRunning } from '@/lib/docker'
import Docker from 'dockerode'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

type Params = { params: Promise<{ id: string; path?: string[] }> }

const SIDECAR_PORT = 9999

/**
 * Get the container's bridge network IP address.
 */
async function getContainerIp(containerId: string): Promise<string | null> {
  try {
    const container = docker.getContainer(containerId)
    const info = await container.inspect()
    const networks = (info.NetworkSettings as any).Networks
    const firstNetwork = networks ? Object.values(networks)[0] as any : null
    return firstNetwork?.IPAddress || null
  } catch {
    return null
  }
}



/**
 * Return a custom HTML error page that displays cleanly in browsers,
 * and posts a "proxy_error" message to the React Native WebView.
 */
function errorHtmlResponse(message: string, code: number) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Server Not Connected</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --background: #FFFFFF;
      --card-bg: #F6F8FA;
      --border: #D8DEE4;
      --text: #0E1116;
      --text-secondary: #656D76;
      --btn-bg: #0E1116;
      --btn-text: #FFFFFF;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #0E1116;
        --card-bg: #151922;
        --border: #21262D;
        --text: #F3F4F6;
        --text-secondary: #8B929A;
        --btn-bg: #F3F4F6;
        --btn-text: #0E1116;
      }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: var(--background);
      color: var(--text);
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      width: 100%;
      max-width: 340px;
      padding: 24px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background-color: var(--card-bg);
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    h1 {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: var(--text);
    }
    p {
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-secondary);
      margin: 0;
    }
    button {
      background-color: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      width: 100%;
      margin-top: 8px;
      box-sizing: border-box;
      transition: opacity 0.2s ease;
    }
    button:active {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Server Not Connected</h1>
    <p>${message}</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
  <script>
    // Post message to React Native WebView to show native overlay
    (function() {
      var attempts = 0;
      function tryPost() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'proxy_error', code: ${code} }));
        } else if (attempts < 40) {
          attempts++;
          setTimeout(tryPost, 50);
        }
      }
      tryPost();
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
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

  // Quick initial check for HTML accept header for unauthorized/missing context cases
  const isInitialHtml = req.headers.get('accept')?.includes('text/html')

  if (!user) {
    if (isInitialHtml) return withCookies(errorHtmlResponse('Unauthorized. Please log in again.', 401), '', token)
    return withCookies(errorResponse('Unauthorized', 401), '', token)
  }

  let projectId = id
  let finalPathSegments = pathSegments || []

  if (!UUID_REGEX.test(id)) {
    const cookieProjId = req.cookies.get('preview_project_id')?.value
    if (!cookieProjId) {
      if (isInitialHtml) return withCookies(errorHtmlResponse('Missing project context. Please reload from the dashboard.', 400), '', token)
      return withCookies(errorResponse('Missing project context', 400), '', token)
    }
    projectId = cookieProjId
    finalPathSegments = [id, ...finalPathSegments]
  }

  const subPath = '/' + (finalPathSegments.join('/') || '')
  const isHtml = subPath === '/' || subPath === '' || req.headers.get('accept')?.includes('text/html')

  // SECURITY: Prevent SSRF authority injection via double slashes or @ in path
  if (subPath.startsWith('//') || subPath.includes('@')) {
    if (isHtml) return withCookies(errorHtmlResponse('Invalid path parameters.', 400), projectId, token)
    return withCookies(errorResponse('Invalid path parameters', 400), projectId, token)
  }

  // Auto-restart sleeping containers (or containers missing sidecar binds)
  const wasAsleep = await ensureContainerRunning(projectId)

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, user_github_id, port, container_id, status')
    .eq('id', projectId)
    .eq('user_github_id', user.id)
    .single()

  if (!project) {
    if (isHtml) return withCookies(errorHtmlResponse('Project not found.', 404), projectId, token)
    return withCookies(errorResponse('Project not found', 404), projectId, token)
  }
  if (!project.container_id) {
    if (isHtml) return withCookies(errorHtmlResponse('Project container is not running. Start the project container and try again.', 503), projectId, token)
    return withCookies(errorResponse('Container not running', 503), projectId, token)
  }

  // Track activity to prevent idle auto-stop
  recordActivity(projectId)

  const queryPort = req.nextUrl.searchParams.get('port')
  const queryInternalPort = req.nextUrl.searchParams.get('iport') // Direct internal port (preferred)
  const cookiePort = req.cookies.get('preview_port')?.value
  
  // Resolve target internal port (port of the user's dev server inside the container, e.g., 3000, 5173)
  let targetPort = '3000'
  const potentialPort = queryInternalPort || queryPort || cookiePort
  if (potentialPort && potentialPort !== project.port?.toString()) {
    targetPort = potentialPort
  }
  
  const searchParams = new URLSearchParams(req.nextUrl.search)
  searchParams.delete('token')
  searchParams.delete('port')
  searchParams.delete('iport')
  const search = searchParams.toString() ? '?' + searchParams.toString() : ''
  
  // If the container was just woken up, return 503 / waking up page
  if (wasAsleep) {
    if (isHtml) {
      return withCookies(
        errorHtmlResponse('Your workspace container was asleep and is now waking up. Please wait a few seconds and try again.', 503),
        projectId,
        token,
        targetPort
      )
    }
    return withCookies(new Response('Container is waking up', { status: 503 }), projectId, token, targetPort)
  }

  // Retry logic: After container wake or bridge spawn, the server may need
  // a moment to start. We retry up to 4 times with a 1.5s delay to avoid false negatives.
  let lastError: any = null
  const maxAttempts = 4
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Ensure the sidecar proxy agent is running inside the container
      await ensureSidecarRunning(project.container_id)

      // Resolve the host port mapped to the sidecar port 9999
      const sidecarHostPort = project.port?.toString() || '9999'
      const containerIp = await getContainerIp(project.container_id)

      // Route traffic directly to the container's bridge IP to bypass host loopback mapping issues.
      // Falls back to 127.0.0.1 loopback mapped port if container IP is unavailable.
      const targetUrl = containerIp
        ? `http://${containerIp}:${SIDECAR_PORT}${subPath}${search}`
        : `http://127.0.0.1:${sidecarHostPort}${subPath}${search}`

      const headersToForward: Record<string, string> = {
        'Host': `localhost:${targetPort}`,
        'Accept': req.headers.get('accept') || '*/*',
        'User-Agent': req.headers.get('user-agent') || 'CloudCodeProxy/1.0',
        'Accept-Encoding': 'identity', // Strongly request uncompressed
      }

      if (req.headers.get('origin')) {
        headersToForward['Origin'] = `http://localhost:${targetPort}`
      }
      if (req.headers.get('referer')) {
        headersToForward['Referer'] = `http://localhost:${targetPort}${subPath}`
      }

      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        headersToForward['Cookie'] = cookieHeader
      }

      // Add the target port header for the sidecar to forward to
      headersToForward['X-Target-Port'] = targetPort

      const response = await fetch(targetUrl, {
        headers: headersToForward,
        redirect: 'manual',
        signal: AbortSignal.timeout(120_000), // 120s for heavy first-compilations (Framer Motion, GSAP, etc.)
      })

      // Handle 304 Not Modified & other bodyless responses
      if (response.status === 304 || response.status === 204 || !response.body) {
        const resHeaders = new Headers(response.headers)
        resHeaders.delete('content-encoding')
        resHeaders.delete('content-length')
        resHeaders.delete('transfer-encoding')
        
        return withCookies(new Response(null, { status: response.status, headers: resHeaders }), projectId, token, targetPort)
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

      return withCookies(new Response(finalBody, { status: response.status, headers: resHeaders }), projectId, token, targetPort)

    } catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        // Wait 1.5s and retry (server may be starting up after wake or bridge connecting)
        console.warn(`[Proxy] Attempt ${attempt + 1} failed for [${subPath}], retrying in 1.5s... (Error: ${err instanceof Error ? err.message : String(err)})`)
        await new Promise(r => setTimeout(r, 1500))
        continue
      }
    }
  }

  // Both attempts failed
  console.error(`Preview proxy error [${subPath}]:`, lastError)
  if (isHtml) {
    return withCookies(
      errorHtmlResponse("We couldn't reach your project server. Make sure your development server (e.g. npm run dev) is running in the Terminal tab.", 502),
      projectId,
      token
    )
  }
  return withCookies(new Response('', { status: 502 }), projectId, token)
}
