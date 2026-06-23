import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url
  
  // 1. Never intercept CloudCode platform routes (cc-api), preview proxy, or Next.js internals
  if (pathname.startsWith('/cc-api') || pathname.startsWith('/api/preview') || pathname === '/') {
    return NextResponse.next()
  }

  // 2. Identify requests that should be proxied to a container.
  // With namespace isolation, ANY request (including /api/..., /static/..., etc.)
  // that has a preview context should be forwarded to the container.
  let projectId = req.cookies.get('preview_project_id')?.value
  
  if (!projectId) {
    const referer = req.headers.get('referer') || ''
    const match = referer.match(/\/api\/preview\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
    if (match) {
      projectId = match[1]
    }
  }
  
  if (projectId) {
    const referer = req.headers.get('referer') || ''
    const isFromPreview = referer.includes('/api/preview/') || pathname.startsWith('/_next/') || pathname.includes('.')
    
    if (isFromPreview) {
      url.pathname = `/api/preview/${projectId}${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Capture everything except cc-api, preview proxy, and public assets
    '/((?!cc-api|api/preview|favicon.ico|$).*)',
  ],
}
