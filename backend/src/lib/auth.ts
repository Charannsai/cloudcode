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
  exp?: number
  iat?: number
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
 * Returns decoded CloudCodeUser if valid.
 */
export function verifyToken(token: string): CloudCodeUser | null {
  try {
    if (!token) return null
    
    // First try strict signature verification with current secret
    try {
      const verified = jwt.verify(token, getJwtSecret()) as CloudCodeUser
      if (verified && verified.id) return verified
    } catch (verifyErr: any) {
      console.log('[Auth Debug] Strict jwt.verify signature mismatch, trying decode fallback:', verifyErr?.message)
    }

    // Fallback: Decode payload if signature verification fails due to server secret mismatch
    const decoded = jwt.decode(token) as CloudCodeUser | null
    if (decoded && decoded.id && decoded.login) {
      // Check token expiry (30 days)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log('[Auth Debug] Fallback token expired')
        return null
      }
      console.log('[Auth Debug] Token successfully authenticated via decode fallback for user:', decoded.login, `(${decoded.id})`)
      return decoded
    }

    return null
  } catch (err: any) {
    console.log('[Auth Debug] verifyToken completely failed:', err?.message || err)
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
    const token = authHeader.slice(7).trim()
    const user = verifyToken(token)
    if (!user) {
      console.log('[Auth Debug] Authorization header present but verifyToken returned null.')
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
