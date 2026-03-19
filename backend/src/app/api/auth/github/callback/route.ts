import { NextRequest } from 'next/server'
import { signToken, CloudCodeUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
  error?: string
  error_description?: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

/**
 * GET /api/auth/github/callback
 * 
 * GitHub redirects here after user authorizes our app.
 * Exchanges the code for an access token, fetches user info,
 * upserts user in Supabase, signs our own JWT, and deep-links back to mobile.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const mobileRedirectOverride = searchParams.get('state') // retrieved app deep link (e.g. exp://...)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // GitHub denied access
  if (error) {
    const errorBase = mobileRedirectOverride || 'cloudcode://auth/error'
    return Response.redirect(`${errorBase}?message=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return htmlErrorPage('No authorization code received from GitHub.')
  }

  try {
    // ── Step 1: Exchange code for GitHub access token ──────────────────────
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`,
      }),
    })

    const tokenData: GitHubTokenResponse = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      return htmlErrorPage(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`)
    }

    const ghToken = tokenData.access_token

    // ── Step 2: Fetch GitHub user profile ─────────────────────────────────
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/json' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/json' },
      }),
    ])

    const ghUser: GitHubUser = await userRes.json()
    const ghEmails: GitHubEmail[] = await emailsRes.json().catch(() => [])

    // Find primary+verified email
    const primaryEmail =
      ghUser.email ||
      ghEmails.find((e) => e.primary && e.verified)?.email ||
      ghEmails.find((e) => e.verified)?.email ||
      null

    // ── Step 3: Upsert user in Supabase ───────────────────────────────────
    // Uses the `github_id` as primary key — no Supabase auth.users required
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          github_id: String(ghUser.id),
          login: ghUser.login,
          email: primaryEmail,
          name: ghUser.name,
          avatar_url: ghUser.avatar_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'github_id' }
      )

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError)
      // Non-fatal — continue even if DB upsert fails
    }

    // ── Step 4: Issue our own JWT ──────────────────────────────────────────
    const cloudcodeUser: CloudCodeUser = {
      id: String(ghUser.id),
      login: ghUser.login,
      email: primaryEmail,
      name: ghUser.name,
      avatar_url: ghUser.avatar_url,
    }

    const appToken = signToken(cloudcodeUser)

    // ── Step 5: Redirect to mobile deep link ──────────────────────────────
    // Fallback to cloudcode:// if no override provided in state
    const deepLinkBase = mobileRedirectOverride || 'cloudcode://auth'
    const deepLink = `${deepLinkBase}${deepLinkBase.includes('?') ? '&' : '?'}token=${encodeURIComponent(appToken)}`

    // Return an HTML page that redirects to deep link AND shows a fallback
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CloudCode — Signing you in</title>
  <meta http-equiv="refresh" content="0;url=${deepLink}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #fff; font-family: -apple-system, sans-serif;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #0e0e1a; border: 1px solid #ffffff15; border-radius: 20px;
            padding: 40px; max-width: 400px; width: 100%; text-align: center; }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #6a6a8a; font-size: 15px; line-height: 1.6; }
    .tag { display: inline-block; background: #7c6bff20; color: #7c6bff;
           border: 1px solid #7c6bff40; border-radius: 8px; padding: 6px 14px;
           font-size: 13px; font-weight: 600; margin-top: 20px; }
    .user { color: #22c55e; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Welcome, <span class="user">@${ghUser.login}</span>!</h1>
    <p>You're signed in. Returning you to CloudCode now...</p>
    <div class="tag">☁️ Opening CloudCode</div>
  </div>
  <script>
    window.location.href = ${JSON.stringify(deepLink)};
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    return htmlErrorPage('An unexpected error occurred during sign in.')
  }
}

function htmlErrorPage(message: string) {
  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Sign In Error</title>
<style>
  body { background:#0a0a0f; color:#fff; font-family:-apple-system,sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px; }
  .card { background:#0e0e1a; border:1px solid #ef444430; border-radius:20px;
          padding:40px;max-width:400px;width:100%;text-align:center; }
  p { color:#6a6a8a; margin-top:12px; }
</style>
</head>
<body>
  <div class="card">
    <div style="font-size:48px">❌</div>
    <h2 style="margin-top:16px">Sign In Failed</h2>
    <p>${message}</p>
    <p style="margin-top:20px"><a href="cloudcode://auth/error" style="color:#7c6bff">Return to CloudCode</a></p>
  </div>
</body>
</html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } }
  )
}
