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
        redirect_uri: `${appUrl}/cc-api/auth/github/callback`,
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
          github_token: ghToken,
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudCode — Signed In</title>
  <meta http-equiv="refresh" content="2;url=${deepLink}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #030303;
      color: #F3F4F6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }

    /* Ambient glow — matches landing page */
    .glow {
      position: absolute;
      top: -15%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0, 0, 0, 0) 70%);
      pointer-events: none;
      z-index: 0;
      animation: pulse-glow 6s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
      50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
    }

    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(24px); filter: blur(4px); }
      100% { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .card {
      position: relative;
      z-index: 1;
      background: #0B0C10;
      border: 1px solid #1A1C23;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .logo {
      height: 22px;
      margin-bottom: 32px;
      opacity: 0.85;
    }

    .avatar-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%);
      background-size: 200% 200%;
      animation: shimmer 3s linear infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .avatar-ring img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid #0B0C10;
      object-fit: cover;
    }

    .check-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 24px;
      height: 24px;
      background: #22c55e;
      border-radius: 50%;
      border: 3px solid #0B0C10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .check-badge svg {
      width: 12px;
      height: 12px;
      color: #fff;
    }

    .avatar-container {
      position: relative;
      display: inline-block;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 6px;
      color: #F3F4F6;
    }

    .username {
      color: #818cf8;
      font-weight: 700;
    }

    .subtitle {
      color: #8E939E;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .divider {
      height: 1px;
      background: #1A1C23;
      margin: 0 -8px 24px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 12px;
      font-weight: 600;
      color: #a5b4fc;
      letter-spacing: 0.02em;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(165, 180, 252, 0.2);
      border-top-color: #a5b4fc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .footer-text {
      margin-top: 24px;
      font-size: 11px;
      color: #4B5060;
    }

    .footer-text a {
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
    }

    .footer-text a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="card">
    <img src="/cloudcodelogo.png" alt="CloudCode" class="logo" />

    <div class="avatar-container">
      <div class="avatar-ring">
        <img src="${ghUser.avatar_url}" alt="@${ghUser.login}" />
      </div>
      <div class="check-badge">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>

    <h1>Welcome, <span class="username">@${ghUser.login}</span></h1>
    <p class="subtitle">Authentication successful. Redirecting you back to CloudCode&hellip;</p>

    <div class="divider"></div>

    <div class="status">
      <div class="spinner"></div>
      Opening CloudCode
    </div>

    <p class="footer-text">
      Not redirected? <a href="${deepLink}">Tap here to continue</a>
    </p>
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudCode — Sign In Error</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #030303;
      color: #F3F4F6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }

    .glow {
      position: absolute;
      top: -15%;
      left: 50%;
      transform: translateX(-50%);
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(24px); filter: blur(4px); }
      100% { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    .card {
      position: relative;
      z-index: 1;
      background: #0B0C10;
      border: 1px solid #1A1C23;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .logo {
      height: 22px;
      margin-bottom: 32px;
      opacity: 0.85;
    }

    .error-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .error-icon svg {
      width: 24px;
      height: 24px;
      color: #f87171;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
      color: #F3F4F6;
    }

    .message {
      color: #8E939E;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .divider {
      height: 1px;
      background: #1A1C23;
      margin: 0 -8px 24px;
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #F3F4F6;
      color: #030303;
      border: none;
      border-radius: 10px;
      padding: 12px 28px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .retry-btn:hover {
      background: #fff;
      transform: translateY(-1px);
    }

    .retry-btn:active {
      transform: scale(0.98);
    }

    .footer-text {
      margin-top: 20px;
      font-size: 11px;
      color: #4B5060;
    }

    .footer-text a {
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
    }

    .footer-text a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="card">
    <img src="/cloudcodelogo.png" alt="CloudCode" class="logo" />

    <div class="error-icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>

    <h1>Sign In Failed</h1>
    <p class="message">${message}</p>

    <div class="divider"></div>

    <a href="cloudcode://auth/error" class="retry-btn">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      Return to CloudCode
    </a>

    <p class="footer-text">
      Need help? Contact <a href="mailto:support@cloudcode.app">support@cloudcode.app</a>
    </p>
  </div>
</body>
</html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } }
  )
}
