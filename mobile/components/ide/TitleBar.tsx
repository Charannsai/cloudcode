import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { IDE_LAYOUT } from '@/constants/tokens'
import Svg, { Rect, Line } from 'react-native-svg'
import { Search, Settings, RefreshCw, ChevronLeft } from '@/components/HugeIconsShim'

function SidebarLeftIcon({ size = 15, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <Line x1="7" y1="2.5" x2="7" y2="15.5" stroke={color} strokeWidth="1.4" />
    </Svg>
  )
}

function BottomPanelIcon({ size = 15, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <Line x1="2.5" y1="11" x2="15.5" y2="11" stroke={color} strokeWidth="1.4" />
    </Svg>
  )
}

function SidebarRightIcon({ size = 15, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <Line x1="11" y1="2.5" x2="11" y2="15.5" stroke={color} strokeWidth="1.4" />
    </Svg>
  )
}

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

      {/* Right: Panel Toggles & Actions */}
      <View style={styles.rightSection}>
        {onToggleSidebar && (
          <TouchableOpacity
            onPress={onToggleSidebar}
            style={[styles.iconBtn, sidebarVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <SidebarLeftIcon color={sidebarVisible ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
        )}

        {onToggleBottomPanel && (
          <TouchableOpacity
            onPress={onToggleBottomPanel}
            style={[styles.iconBtn, bottomPanelVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <BottomPanelIcon color={bottomPanelVisible ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
        )}

        {onToggleRightPanel && (
          <TouchableOpacity
            onPress={onToggleRightPanel}
            style={[styles.iconBtn, rightPanelVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            activeOpacity={0.7}
          >
            <SidebarRightIcon color={rightPanelVisible ? colors.text : colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}>
          <Search size={14} color={colors.textSecondary} strokeWidth={1.8} />
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
