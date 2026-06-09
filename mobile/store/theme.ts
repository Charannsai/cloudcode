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
    background: '#1d1d1d',
    card: 'rgba(255, 255, 255, 0.05)',
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#ffffff',
    accent: '#e5e5e5',
    error: '#ef4444',
    errorBackground: 'rgba(239, 68, 68, 0.1)',
    success: '#10b981',
    inputBackground: 'rgba(255, 255, 255, 0.03)',
    tabBar: 'rgba(20, 20, 20, 0.9)',
    tabBarActive: '#ffffff',
    tabBarInactive: '#a3a3a3',
    highlight: 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    background: '#f5f5f5',
    card: 'rgba(29, 29, 29, 0.05)',
    text: '#1d1d1d',
    textSecondary: '#737373',
    border: 'rgba(29, 29, 29, 0.08)',
    primary: '#1d1d1d',
    accent: '#404040',
    error: '#ef4444',
    errorBackground: 'rgba(239, 68, 68, 0.1)',
    success: '#10b981',
    inputBackground: 'rgba(29, 29, 29, 0.03)',
    tabBar: 'rgba(245, 245, 245, 0.85)',
    tabBarActive: '#1d1d1d',
    tabBarInactive: '#737373',
    highlight: 'rgba(29, 29, 29, 0.08)',
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
