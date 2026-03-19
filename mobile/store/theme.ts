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
    background: '#1a1a1a',
    card: '#242424',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#ffffff15',
    primary: '#7c6bff',
    accent: '#00d4ff',
    error: '#ef4444',
    errorBackground: '#ef444420',
    success: '#22c55e',
    inputBackground: '#121212',
    tabBar: '#1a1a1a',
    tabBarActive: '#7c6bff',
    tabBarInactive: '#666666',
  },
  light: {
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#6c757d',
    border: '#00000010',
    primary: '#7c6bff',
    accent: '#007bff',
    error: '#dc3545',
    errorBackground: '#dc354510',
    success: '#28a745',
    inputBackground: '#f1f3f5',
    tabBar: '#ffffff',
    tabBarActive: '#7c6bff',
    tabBarInactive: '#adb5bd',
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
