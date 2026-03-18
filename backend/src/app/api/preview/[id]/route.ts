import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/preview/[id]?port=3000
 * Proxy the running container's port to the mobile WebView.
 * 
 * NOTE: This requires the container's port to be mapped to the host.
 * On VPS, ports are mapped via Docker's HostConfig.PortBindings.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = getUserFromRequest(req)
  if (!user) return errorResponse('Unauthorized', 401)
  const { id } = await params

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, user_github_id, port, container_id')
    .eq('id', id)
    .eq('user_github_id', user.id)
    .single()

  if (!project) return errorResponse('Project not found', 404)
  if (!project.container_id) return errorResponse('Container not running', 503)

  const port = req.nextUrl.searchParams.get('port') || project.port || 3000
  const path = req.nextUrl.searchParams.get('path') || '/'
  
  // On VPS: proxy to 127.0.0.1:<mapped-port>
  const targetUrl = `http://127.0.0.1:${port}${path}`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || '127.0.0.1',
        'X-Forwarded-Host': req.headers.get('host') || 'localhost',
      },
    })

    const contentType = response.headers.get('content-type') || 'text/html'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Preview not available</title></head>
      <body style="font-family:monospace;background:#0a0a0f;color:#c8d3e0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <h1 style="font-size:48px">🔌</h1>
        <h2>Server not running</h2>
        <p style="color:#5a5a7a">Go to Terminal and run: <code style="color:#22c55e">npm run dev</code></p>
      </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
