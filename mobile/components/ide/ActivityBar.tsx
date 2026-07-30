import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore, SidebarPanel } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { SvgIcon } from '@/components/SvgIcon'
import { Folder, Search, GitBranch, Settings } from '@/components/HugeIconsShim'
import Svg, { Path } from 'react-native-svg'

// Extensions icon (puzzle piece)
function ExtensionsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 16V8a2 2 0 00-2-2h-3a2 2 0 01-2-2V3a1 1 0 00-2 0v1a2 2 0 01-2 2H6a2 2 0 00-2 2v3a2 2 0 002 2h1a1 1 0 010 2H6a2 2 0 00-2 2v3a2 2 0 002 2h12a2 2 0 002-2v-1a2 2 0 00-2-2h-1a1 1 0 010-2h1a2 2 0 002-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface ActivityBarItemProps {
  panel: SidebarPanel
  icon: React.ReactNode
  isActive: boolean
  onPress: () => void
  colors: any
  isDark: boolean
}

function ActivityBarItem({ panel, icon, isActive, onPress, colors, isDark }: ActivityBarItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.activityItem,
        isActive && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left accent indicator */}
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: colors.text }]} />
      )}
      {icon}
    </TouchableOpacity>
  )
}

export default function ActivityBar() {
  const { colors, isDark } = useAppTheme()
  const { activeSidebarPanel, sidebarVisible, setSidebarPanel } = useTabletLayoutStore()

  const PANELS: { id: SidebarPanel; icon: React.ReactNode }[] = [
    {
      id: 'explorer',
      icon: <Folder size={22} color={activeSidebarPanel === 'explorer' && sidebarVisible ? colors.text : colors.textSecondary} strokeWidth={1.6} />,
    },
    {
      id: 'search',
      icon: <Search size={22} color={activeSidebarPanel === 'search' && sidebarVisible ? colors.text : colors.textSecondary} strokeWidth={1.6} />,
    },
    {
      id: 'git',
      icon: <GitBranch size={22} color={activeSidebarPanel === 'git' && sidebarVisible ? colors.text : colors.textSecondary} strokeWidth={1.6} />,
    },
    {
      id: 'extensions',
      icon: <ExtensionsIcon size={22} color={activeSidebarPanel === 'extensions' && sidebarVisible ? colors.text : colors.textSecondary} />,
    },
  ]

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0D1117' : '#F0F2F5',
      borderRightColor: colors.border,
    }]}>
      {/* Top icons */}
      <View style={styles.topIcons}>
        {PANELS.map((panel) => (
          <ActivityBarItem
            key={panel.id}
            panel={panel.id}
            icon={panel.icon}
            isActive={activeSidebarPanel === panel.id && sidebarVisible}
            onPress={() => setSidebarPanel(panel.id)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>

      {/* Bottom icons */}
      <View style={styles.bottomIcons}>
        <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
          <Settings size={20} color={colors.textSecondary} strokeWidth={1.6} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: IDE_LAYOUT.activityBarWidth,
    borderRightWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topIcons: {
    width: '100%',
    alignItems: 'center',
  },
  bottomIcons: {
    width: '100%',
    alignItems: 'center',
  },
  activityItem: {
    width: IDE_LAYOUT.activityBarWidth,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
  },
})
