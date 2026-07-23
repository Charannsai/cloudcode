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
    background: '#030303',
    card: '#0B0C10',
    text: '#F3F4F6',
    textSecondary: '#8E939E',
    border: '#1A1C23',
    primary: '#FFFFFF',
    accent: '#8E939E',
    error: '#F85149',
    errorBackground: '#3D1117',
    success: '#3FB950',
    inputBackground: '#0B0C10',
    tabBar: '#030303',
    tabBarActive: '#FFFFFF',
    tabBarInactive: '#8E939E',
    highlight: '#161821',
    surfaceElevated: '#161821',
    textTertiary: '#6E7681',
  },
  light: {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0F1115',
    textSecondary: '#6B7280',
    border: '#E4E7EB',
    primary: '#0F1115',
    accent: '#0F1115',
    error: '#CF222E',
    errorBackground: '#FFEBE9',
    success: '#1A7F37',
    inputBackground: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarActive: '#0F1115',
    tabBarInactive: '#6B7280',
    highlight: '#0F111508',
    surfaceElevated: '#FFFFFF',
    textTertiary: '#8E939E',
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
