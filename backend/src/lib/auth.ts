import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

/**
 * Extracts the Supabase user from the Authorization header.
 * Returns null if the token is invalid or missing.
 */
export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null

  return data.user
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}
