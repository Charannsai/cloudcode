import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromRequest, errorResponse } from '@/lib/auth'
import Docker from 'dockerode'

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
})

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/preview/[id]?port=3000
 * Proxy the running container's port to the mobile WebView.
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
  
  try {
    // 🔍 Get the container's internal IP address
    const container = docker.getContainer(project.container_id)
    const info = await container.inspect()
    // Dockerode types can be tricky, using any to get the IP
    const networks = (info.NetworkSettings as any).Networks
    const containerIp = (networks && Object.values(networks)[0] ? (Object.values(networks)[0] as any).IPAddress : null) || (info.NetworkSettings as any).IPAddress || '127.0.0.1'

    // Proxy to the internal CONTAINER IP
    const targetUrl = `http://${containerIp}:${port}${path}`

    const response = await fetch(targetUrl, {
      headers: {
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || '127.0.0.1',
        'X-Forwarded-Host': req.headers.get('host') || 'localhost',
      },
      // Short timeout to fail fast if port is wrong
      signal: AbortSignal.timeout(5000)
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
  } catch (err) {
    console.error('Proxy error:', err)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Preview not available</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, sans-serif; background:#0a0a0f; color:#c8d3e0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; text-align:center; padding: 20px;">
        <h1 style="font-size:48px; margin-bottom: 0;">🔌</h1>
        <h2 style="color: #fff;">Server not responding on port ${port}</h2>
        <p style="color:#5a5a7a; margin-top: 10px;">Check your Terminal specifically for port mapping.<br/>Try running <code style="color:#22c55e">npm run dev</code> or <code style="color:#22c55e">npx serve . -p ${port}</code></p>
        <div style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 12px; color: #4a4a6a;">
          Target IP: auto-detecting...
        </div>
      </body>
      </html>
    `, {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

