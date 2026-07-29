import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this'
}

export interface CloudCodeUser {
  id: string          // GitHub user ID (as string)
  login: string       // GitHub username
  email: string | null
  name: string | null
  avatar_url: string | null
}

/**
 * Sign a CloudCode JWT for a GitHub user.
 * Token is valid for 30 days.
 */
export function signToken(user: CloudCodeUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '30d' })
}

/**
 * Verify and decode a CloudCode JWT.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): CloudCodeUser | null {
  try {
    if (!token) return null
    return jwt.verify(token, getJwtSecret()) as CloudCodeUser
  } catch (err: any) {
    console.log('[Auth Debug] verifyToken failed:', err?.message || err)
    return null
  }
}

/**
 * Extract the authenticated user from the Authorization: Bearer <token> header.
 * Returns null if missing or invalid.
 */
export function getUserFromRequest(req: NextRequest): CloudCodeUser | null {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const user = verifyToken(authHeader.slice(7))
    if (!user) {
      console.log('[Auth Debug] Authorization header present but token verification returned null.')
    }
    return user
  }

  // Fallback to 'preview_token' cookie (convenient for WebView proxy)
  const cookie = req.cookies.get('preview_token')
  if (cookie?.value) {
    return verifyToken(cookie.value)
  }

  return null
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}
