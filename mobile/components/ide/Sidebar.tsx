import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore, SidebarPanel } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { ChevronLeft, Search, X } from '@/components/HugeIconsShim'
import FilesTab from '@/components/project/FilesTab'
import GitTab from '@/components/project/GitTab'

interface SidebarProps {
  projectId: string
  visible: boolean
}

const PANEL_TITLES: Record<SidebarPanel, string> = {
  explorer: 'EXPLORER',
  search: 'SEARCH',
  git: 'SOURCE CONTROL',
  extensions: 'EXTENSIONS',
}

function SearchPanel({ projectId }: { projectId: string }) {
  const { colors, isDark } = useAppTheme()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <View style={styles.searchPanel}>
      <View style={[styles.searchBox, {
        backgroundColor: isDark ? '#1A1D24' : '#FFFFFF',
        borderColor: colors.border,
      }]}>
        <Search size={14} color={colors.textSecondary} strokeWidth={1.8} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search files..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {searchQuery.length === 0 && (
        <Text style={[styles.searchHint, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Type to search across files in the project
        </Text>
      )}
    </View>
  )
}

function ExtensionsPanel() {
  const { colors } = useAppTheme()
  return (
    <View style={styles.emptyPanel}>
      <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        Extensions panel coming soon
      </Text>
    </View>
  )
}

export default function Sidebar({ projectId, visible }: SidebarProps) {
  const { colors, isDark } = useAppTheme()
  const { activeSidebarPanel, toggleSidebar } = useTabletLayoutStore()

  if (!visible) return null

  const title = PANEL_TITLES[activeSidebarPanel]

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0F1218' : '#F6F8FA',
      borderRightColor: colors.border,
    }]}>
      {/* Panel Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          {title}
        </Text>
        <TouchableOpacity onPress={toggleSidebar} style={styles.collapseBtn} activeOpacity={0.7}>
          <ChevronLeft size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Panel Content */}
      <View style={styles.content}>
        {activeSidebarPanel === 'explorer' && (
          <FilesTab projectId={projectId} isActive={true} isTabletSidebar={true} />
        )}
        {activeSidebarPanel === 'search' && (
          <SearchPanel projectId={projectId} />
        )}
        {activeSidebarPanel === 'git' && (
          <GitTab projectId={projectId} isActive={true} />
        )}
        {activeSidebarPanel === 'extensions' && (
          <ExtensionsPanel />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: IDE_LAYOUT.sidebarWidth,
    borderRightWidth: 1,
  },
  header: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  collapseBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  // Search panel
  searchPanel: {
    padding: 12,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  searchHint: {
    fontSize: 12,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  // Empty state
  emptyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
})
