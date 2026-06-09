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
  highlight: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  dark: {
    background: '#09090b',
    card: '#1c1c1f',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    border: '#27272a',
    primary: '#ffffff',
    accent: '#cbd5e1',
    error: '#ef4444',
    errorBackground: '#450a0a',
    success: '#10b981',
    inputBackground: '#1c1c1f',
    tabBar: '#1c1c1f',
    tabBarActive: '#ffffff',
    tabBarInactive: '#a1a1aa',
    highlight: '#27272a',
  },
  light: {
    background: '#f4f4f5',
    card: '#ffffff',
    text: '#09090b',
    textSecondary: '#71717a',
    border: '#e4e4e7',
    primary: '#18181b',
    accent: '#18181b', // Dark highlight for light theme
    error: '#dc3545',
    errorBackground: '#fef2f2',
    success: '#10b981',
    inputBackground: '#ffffff',
    tabBar: '#ffffff',
    tabBarActive: '#09090b',
    tabBarInactive: '#71717a',
    highlight: '#18181b10', // Dark highlight for light theme
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
