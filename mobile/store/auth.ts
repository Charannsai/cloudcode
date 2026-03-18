import { create } from 'zustand'
import { CloudCodeUser, getToken, saveToken, deleteToken, decodeToken } from '@/lib/auth'

interface AuthState {
  user: CloudCodeUser | null
  token: string | null
  loading: boolean
  setToken: (token: string) => void
  loadStoredToken: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  /** Call on app startup to restore session from SecureStore */
  loadStoredToken: async () => {
    const token = await getToken()
    if (token) {
      const user = decodeToken(token)
      if (user) {
        set({ user, token, loading: false })
        return
      }
      // Token expired — clear it
      await deleteToken()
    }
    set({ user: null, token: null, loading: false })
  },

  /** Called after GitHub OAuth callback with a new token */
  setToken: (token: string) => {
    const user = decodeToken(token)
    if (user) {
      saveToken(token).catch(console.error)
      set({ user, token })
    }
  },

  signOut: async () => {
    await deleteToken()
    set({ user: null, token: null })
  },
}))
