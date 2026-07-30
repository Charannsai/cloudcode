import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { IDE_LAYOUT } from '@/constants/tokens'
import { ChevronLeft, RefreshCw, Settings, Folder, Terminal, Sparkles } from '@/components/HugeIconsShim'

interface TitleBarProps {
  projectName: string
  projectStatus: string
  onBack: () => void
  onRefresh: () => void
  onSettings?: () => void
  onToggleSidebar?: () => void
  onToggleBottomPanel?: () => void
  onToggleRightPanel?: () => void
  sidebarVisible?: boolean
  bottomPanelVisible?: boolean
  rightPanelVisible?: boolean
}

export default function TitleBar({
  projectName,
  projectStatus,
  onBack,
  onRefresh,
  onSettings,
  onToggleSidebar,
  onToggleBottomPanel,
  onToggleRightPanel,
  sidebarVisible = true,
  bottomPanelVisible = true,
  rightPanelVisible = false,
}: TitleBarProps) {
  const { colors, isDark } = useAppTheme()

  const statusColor = projectStatus === 'ready' ? '#3FB950' : '#D2A8FF'

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderBottomColor: colors.border }]}>
      {/* Left: Back + Project Info */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
          <ChevronLeft size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.projectInfo}>
          <View style={styles.projectNameRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
              {projectName}
            </Text>
          </View>
        </View>
      </View>

      {/* Center: App branding */}
      <Text style={[styles.brandText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
        CloudCode
      </Text>

      {/* Right: Actions & Panel Toggles */}
      <View style={styles.rightSection}>
        {onToggleSidebar && (
          <TouchableOpacity
            onPress={onToggleSidebar}
            style={[styles.iconBtn, sidebarVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <Folder size={14} color={sidebarVisible ? colors.text : colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

        {onToggleBottomPanel && (
          <TouchableOpacity
            onPress={onToggleBottomPanel}
            style={[styles.iconBtn, bottomPanelVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <Terminal size={14} color={bottomPanelVisible ? colors.text : colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

        {onToggleRightPanel && (
          <TouchableOpacity
            onPress={onToggleRightPanel}
            style={[styles.iconBtn, rightPanelVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={rightPanelVisible ? (isDark ? '#A78BFA' : '#7C3AED') : colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}>
          <RefreshCw size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>

        {onSettings && (
          <TouchableOpacity onPress={onSettings} style={styles.iconBtn} activeOpacity={0.7}>
            <Settings size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: IDE_LAYOUT.titleBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectInfo: {
    flex: 1,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  projectName: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  brandText: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
