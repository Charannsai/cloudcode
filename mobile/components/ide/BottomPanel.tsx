import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore, BottomPanelTab } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { Terminal, Globe, AlertCircle, X, Maximize2, Minimize2, ChevronDown } from '@/components/HugeIconsShim'
import TerminalTab from '@/components/project/TerminalTab'
import PreviewTab from '@/components/project/PreviewTab'

interface BottomPanelProps {
  projectId: string
  visible: boolean
  port?: number | null
  ports?: Record<string, number>
}

const PANEL_TABS: { id: BottomPanelTab; label: string; icon: typeof Terminal }[] = [
  { id: 'terminal', label: 'TERMINAL', icon: Terminal },
  { id: 'preview', label: 'PREVIEW', icon: Globe },
  { id: 'problems', label: 'PROBLEMS', icon: AlertCircle },
]

export default function BottomPanel({ projectId, visible, port, ports }: BottomPanelProps) {
  const { colors, isDark } = useAppTheme()
  const { activeBottomTab, setBottomTab, toggleBottomPanel } = useTabletLayoutStore()

  if (!visible) return null

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F1218' : '#FFFFFF',
      borderTopColor: colors.border,
    }]}>
      {/* Panel Header with tabs */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.tabsRow}>
          {PANEL_TABS.map((tab) => {
            const isActive = activeBottomTab === tab.id
            const Icon = tab.icon
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.panelTab, isActive && styles.panelTabActive]}
                onPress={() => setBottomTab(tab.id)}
                activeOpacity={0.7}
              >
                <Icon size={13} color={isActive ? colors.text : colors.textSecondary} strokeWidth={isActive ? 2 : 1.6} />
                <Text style={[styles.panelTabText, {
                  color: isActive ? colors.text : colors.textSecondary,
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {tab.label}
                </Text>
                {isActive && <View style={[styles.tabActiveBar, { backgroundColor: colors.text }]} />}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleBottomPanel} style={styles.actionBtn} activeOpacity={0.7}>
            <ChevronDown size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleBottomPanel} style={styles.actionBtn} activeOpacity={0.7}>
            <X size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel Content */}
      <View style={styles.content}>
        <View style={{ flex: 1, display: activeBottomTab === 'terminal' ? 'flex' : 'none' }}>
          <TerminalTab projectId={projectId} />
        </View>
        <View style={{ flex: 1, display: activeBottomTab === 'preview' ? 'flex' : 'none' }}>
          <PreviewTab projectId={projectId} port={port || 3000} ports={ports} />
        </View>
        {activeBottomTab === 'problems' && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              No problems detected
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: IDE_LAYOUT.bottomPanelHeight,
    borderTopWidth: 1,
  },
  header: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  panelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    position: 'relative',
  },
  panelTabActive: {},
  panelTabText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -1,
    left: 8,
    right: 8,
    height: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
})
