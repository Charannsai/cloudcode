import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'

/**
 * IDE-style top title bar for the main app shell on tablets.
 * Shows "CloudCode" branding. Safe area is handled by the parent shell.
 */
interface AppTitleBarProps {
  activeTabTitle?: string
}

export default function AppTitleBar({ activeTabTitle }: AppTitleBarProps) {
  const { colors, isDark } = useAppTheme()

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
      borderBottomColor: colors.border,
    }]}>
      <Text style={[styles.brand, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        CloudCode
      </Text>
      {activeTabTitle && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Text style={[styles.tabTitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {activeTabTitle}
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  brand: {
    fontSize: 14,
    letterSpacing: -0.3,
  },
  separator: {
    width: 1,
    height: 16,
  },
  tabTitle: {
    fontSize: 13,
  },
})
