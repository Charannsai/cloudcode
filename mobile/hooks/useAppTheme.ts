import { useThemeStore } from '@/store/theme'

export function useAppTheme() {
  const { theme, colors, toggleTheme, setTheme } = useThemeStore()
  return { theme, colors, toggleTheme, setTheme, isDark: theme === 'dark' }
}
