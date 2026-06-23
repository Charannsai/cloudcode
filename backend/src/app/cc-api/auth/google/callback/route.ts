import { NextRequest } from 'next/server'
import { signToken, CloudCodeUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  error?: string
  error_description?: string
}

interface GoogleUserInfo {
  sub: string       // Google unique user ID
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
}

/**
 * GET /api/auth/google/callback
 * 
 * Google redirects here after user authorizes our app.
 * Exchanges the code for an access token, fetches user info,
 * upserts user in Supabase (unified with GitHub identity via email),
 * signs our own JWT, and deep-links back to mobile.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const mobileRedirectOverride = searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Google denied access
  if (error) {
    const errorBase = mobileRedirectOverride || 'cloudcode://auth/error'
    return Response.redirect(`${errorBase}?message=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return htmlErrorPage('No authorization code received from Google.')
  }

  try {
    // ── Step 1: Exchange code for Google access token ──────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/cc-api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData: GoogleTokenResponse = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      return htmlErrorPage(`Google token exchange failed: ${tokenData.error_description || tokenData.error}`)
    }

    // ── Step 2: Fetch Google user profile ─────────────────────────────────
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser: GoogleUserInfo = await userRes.json()

    if (!googleUser.sub || !googleUser.email) {
      return htmlErrorPage('Failed to retrieve user information from Google.')
    }

    // ── Step 3: Unified Identity Resolution ───────────────────────────────
    // Check if a user already exists with this email (e.g., from GitHub login)
    // If so, link the Google identity to the existing user.
    // Otherwise, create a new user with the Google ID as primary.
    let userId = `google_${googleUser.sub}`
    let userLogin = googleUser.email.split('@')[0]

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('github_id, login')
      .eq('email', googleUser.email)
      .single()

    if (existingUser) {
      // User already exists (via GitHub) — use their existing GitHub ID as the unified identity
      userId = existingUser.github_id
      userLogin = existingUser.login
      
      // Update their record with Google info if they don't have an avatar yet
      await supabaseAdmin
        .from('users')
        .update({
          google_id: googleUser.sub,
          updated_at: new Date().toISOString(),
        })
        .eq('github_id', existingUser.github_id)
    } else {
      // Brand new Google user — create a new record
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            github_id: userId, // Use google_<id> as the github_id for now
            google_id: googleUser.sub,
            login: userLogin,
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'github_id' }
        )

      if (upsertError) {
        console.error('Supabase upsert error (Google):', upsertError)
      }
    }

    // ── Step 4: Issue our own JWT ──────────────────────────────────────────
    const cloudcodeUser: CloudCodeUser = {
      id: userId,
      login: userLogin,
      email: googleUser.email,
      name: googleUser.name,
      avatar_url: googleUser.picture,
    }

    const appToken = signToken(cloudcodeUser)

    // ── Step 5: Redirect to mobile deep link ──────────────────────────────
    const deepLinkBase = mobileRedirectOverride || 'cloudcode://auth'
    const deepLink = `${deepLinkBase}${deepLinkBase.includes('?') ? '&' : '?'}token=${encodeURIComponent(appToken)}`

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
    .tag { display: inline-block; background: #4285f420; color: #4285f4;
           border: 1px solid #4285f440; border-radius: 8px; padding: 6px 14px;
           font-size: 13px; font-weight: 600; margin-top: 20px; }
    .user { color: #22c55e; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Welcome, <span class="user">${googleUser.name || googleUser.email}</span>!</h1>
    <p>You're signed in with Google. Returning you to CloudCode now...</p>
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
    console.error('Google OAuth error:', err)
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
