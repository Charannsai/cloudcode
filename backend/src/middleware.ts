import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  
  // 1. Check if we're hitting a potential "lost" asset at the root
  // (e.g. /logo.png, /_next/static/...)
  const isApi = url.pathname.startsWith('/api')
  const isInternal = url.pathname.startsWith('/_next') || url.pathname.includes('.')
  
  if (!isApi && isInternal) {
    const lastProjectId = req.cookies.get('preview_project_id')?.value
    if (lastProjectId) {
      // Rewrite root assets to the last known project proxy
      url.pathname = `/api/preview/${lastProjectId}${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

// Only match root-level assets and Next.js internal paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|projects).*)',
  ],
}
