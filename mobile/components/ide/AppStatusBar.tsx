import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useAuthStore } from '@/store/auth'

/**
 * IDE-style status bar for the main app shell on tablets.
 * Shows connected status, user info, and version.
 */
export default function AppStatusBar() {
  const { colors, isDark } = useAppTheme()
  const user = useAuthStore((s) => s.user)

  const bgColor = isDark ? '#0D1117' : '#007ACC'
  const fgColor = isDark ? colors.textSecondary : '#FFFFFF'

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: colors.border }]}>
      <View style={styles.leftSection}>
        <View style={styles.statusItem}>
          <View style={[styles.dot, { backgroundColor: '#3FB950' }]} />
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
            Connected
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {user && (
          <View style={styles.statusItem}>
            <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
              {user.name || user.login || 'User'}
            </Text>
          </View>
        )}
        <View style={styles.statusItem}>
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular', opacity: 0.7 }]}>
            CloudCode v1.0
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 11,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
