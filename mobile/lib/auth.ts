import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'cloudcode_token'

export interface CloudCodeUser {
  id: string        // GitHub user ID
  login: string     // GitHub username
  email: string | null
  name: string | null
  avatar_url: string | null
  iat?: number
  exp?: number
}

/**
 * Store the JWT token securely on device.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

/**
 * Get the stored JWT token.
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

/**
 * Delete the JWT token (sign out).
 */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

/**
 * Decode the JWT payload (without verifying — verification is done on the server).
 * Returns null if the token is malformed or expired.
 */
export function decodeToken(token: string): CloudCodeUser | null {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    return decoded as CloudCodeUser
  } catch {
    return null
  }
}
