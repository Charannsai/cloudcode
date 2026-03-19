import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url
  
  // 1. Never intercept internal API or Dashboard routes
  if (pathname.startsWith('/api') || pathname.startsWith('/projects') || pathname === '/') {
    return NextResponse.next()
  }

  // 2. Identify requests that should be proxied to a container
  // This includes any request that isn't for our main app,
  // typically assets (/logo.png, /_next/static, etc.)
  const lastProjectId = req.cookies.get('preview_project_id')?.value
  
  if (lastProjectId) {
    // Check if the referer is telling us this is from a preview page
    const referer = req.headers.get('referer') || ''
    const isFromPreview = referer.includes('/api/preview/') || pathname.startsWith('/_next/') || pathname.includes('.')
    
    if (isFromPreview) {
      url.pathname = `/api/preview/${lastProjectId}${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Capture everything except root, dashboard, and public/api assets
    '/((?!api|projects|favicon.ico|$).*)',
  ],
}
