import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { X, Sparkles } from '@/components/HugeIconsShim'
import AITab from '@/components/project/AITab'

interface RightPanelProps {
  projectId: string
  visible: boolean
}

export default function RightPanel({ projectId, visible }: RightPanelProps) {
  const { colors, isDark } = useAppTheme()
  const { toggleRightPanel } = useTabletLayoutStore()

  if (!visible) return null

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F1218' : '#FFFFFF',
      borderLeftColor: colors.border,
    }]}>
      {/* Panel Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Sparkles size={14} color={isDark ? '#A78BFA' : '#7C3AED'} strokeWidth={2} />
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            AI Assistant
          </Text>
        </View>
        <TouchableOpacity onPress={toggleRightPanel} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* AI Chat Content - Reuse existing AITab */}
      <View style={styles.content}>
        <AITab projectId={projectId} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: IDE_LAYOUT.rightPanelWidth,
    borderLeftWidth: 1,
  },
  header: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
})
