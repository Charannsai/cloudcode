import { NextRequest } from 'next/server'

/**
 * GET /api/auth/google
 * Redirects the user to Google OAuth authorization page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const appRedirectUri = searchParams.get('redirect_uri') // e.g., 'exp://...'

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/cc-api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: appRedirectUri || '', // Store the mobile app's deep link in the state
  })

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return Response.redirect(googleUrl)
}
