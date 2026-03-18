import { NextRequest } from 'next/server'

/**
 * GET /api/auth/github
 * Redirects the user to GitHub OAuth authorization page.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/github/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    allow_signup: 'true',
  })

  const githubUrl = `https://github.com/login/oauth/authorize?${params.toString()}`

  return Response.redirect(githubUrl)
}
