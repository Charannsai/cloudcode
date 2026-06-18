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
  surfaceElevated: string
  textTertiary: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  dark: {
    background: '#0E1116',
    card: '#151922',
    text: '#F3F4F6',
    textSecondary: '#8B929A',
    border: '#21262D',
    primary: '#F3F4F6',
    accent: '#8B929A',
    error: '#F85149',
    errorBackground: '#3D1117',
    success: '#3FB950',
    inputBackground: '#151922',
    tabBar: '#0E1116',
    tabBarActive: '#F3F4F6',
    tabBarInactive: '#6E7681',
    highlight: '#1C2128',
    surfaceElevated: '#1C2128',
    textTertiary: '#484F58',
  },
  light: {
    background: '#F6F8FA',
    card: '#FFFFFF',
    text: '#0E1116',
    textSecondary: '#656D76',
    border: '#D8DEE4',
    primary: '#0E1116',
    accent: '#0E1116',
    error: '#CF222E',
    errorBackground: '#FFEBE9',
    success: '#1A7F37',
    inputBackground: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarActive: '#0E1116',
    tabBarInactive: '#656D76',
    highlight: '#0E111610',
    surfaceElevated: '#FFFFFF',
    textTertiary: '#8C959F',
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
