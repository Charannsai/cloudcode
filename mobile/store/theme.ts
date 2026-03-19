import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeType = 'light' | 'dark'

export interface ThemeColors {
  background: string
  card: string
  text: string
  textSecondary: string
  border: string
  primary: string
  accent: string
  error: string
  errorBackground: string
  success: string
  inputBackground: string
  tabBar: string
  tabBarActive: string
  tabBarInactive: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  dark: {
    background: '#0a0a0a',
    card: '#161616',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#ffffff0a',
    primary: '#ffffff',
    accent: '#38bdf8',
    error: '#ef4444',
    errorBackground: '#ef444420',
    success: '#22c55e',
    inputBackground: '#0a0a0a',
    tabBar: '#0a0a0a',
    tabBarActive: '#ffffff',
    tabBarInactive: '#666666',
  },
  light: {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    border: '#0000000a',
    primary: '#1a1a1a',
    accent: '#3b82f6',
    error: '#dc3545',
    errorBackground: '#dc354510',
    success: '#10b981',
    inputBackground: '#f9fafb',
    tabBar: '#ffffff',
    tabBarActive: '#1a1a1a',
    tabBarInactive: '#9ca3af',
  },
}

interface ThemeState {
  theme: ThemeType
  colors: ThemeColors
  setTheme: (theme: ThemeType) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      colors: themes.dark,
      setTheme: (theme) => set({ theme, colors: themes[theme] }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: nextTheme, colors: themes[nextTheme] })
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
