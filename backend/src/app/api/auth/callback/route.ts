import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/auth/callback — Supabase OAuth redirect handler
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!code) {
    return Response.redirect(`${appUrl}/auth/error?message=no_code`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return Response.redirect(`${appUrl}/auth/error?message=${encodeURIComponent(error?.message || 'unknown')}`)
  }

  // Redirect back to mobile deep link with session tokens
  // cloudcode://auth?access_token=...&refresh_token=...
  const deepLink = `cloudcode://auth?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`
  
  // Also support web redirect
  const redirectTo = searchParams.get('redirect_to') || deepLink
  
  return Response.redirect(redirectTo)
}
