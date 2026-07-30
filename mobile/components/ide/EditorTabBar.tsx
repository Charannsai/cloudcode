import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { X, FileCode, FileText, File, Hash, Settings } from '@/components/HugeIconsShim'

const FILE_ICON_COLORS: Record<string, string> = {
  ts: '#3178C6', tsx: '#3178C6',
  js: '#F0DB4F', jsx: '#F0DB4F',
  json: '#8BC34A', md: '#58A6FF',
  css: '#563D7C', html: '#E34F26',
  yml: '#CB171E', yaml: '#CB171E',
  env: '#ECD53F', py: '#3572A5',
  go: '#00ADD8', rs: '#CE422B',
}

function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICON_COLORS[ext] || '#8E939E'
}

function getFileIcon(name: string): typeof FileCode {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': return FileCode
    case 'md': case 'txt': return FileText
    case 'css': return Hash
    case 'env': return Settings
    default: return File
  }
}

export default function EditorTabBar() {
  const { colors, isDark } = useAppTheme()
  const { openEditorTabs, activeEditorTab, dirtyFiles, setActiveFile, closeFile } = useTabletLayoutStore()

  if (openEditorTabs.length === 0) return null

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
      borderBottomColor: colors.border,
    }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {openEditorTabs.map((tab) => {
          const isActive = tab.path === activeEditorTab
          const isDirty = dirtyFiles.has(tab.path)
          const IconComponent = getFileIcon(tab.name)
          const iconColor = getFileColor(tab.name)

          return (
            <TouchableOpacity
              key={tab.path}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#1A1D24' : '#FFFFFF')
                    : 'transparent',
                  borderBottomColor: isActive ? colors.text : 'transparent',
                },
              ]}
              onPress={() => setActiveFile(tab.path)}
              activeOpacity={0.7}
            >
              <IconComponent size={13} color={iconColor} strokeWidth={1.8} />
              <Text
                style={[
                  styles.tabName,
                  {
                    color: isActive ? colors.text : colors.textSecondary,
                    fontFamily: isActive ? 'Inter_500Medium' : 'Inter_400Regular',
                    fontStyle: isDirty ? 'italic' : 'normal',
                  },
                ]}
                numberOfLines={1}
              >
                {tab.name}
              </Text>

              {/* Dirty indicator dot or close button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation()
                  closeFile(tab.path)
                }}
                style={styles.closeBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {isDirty ? (
                  <View style={[styles.dirtyDot, { backgroundColor: colors.text }]} />
                ) : (
                  <X size={11} color={isActive ? colors.textSecondary : 'transparent'} strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: IDE_LAYOUT.editorTabBarHeight,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
    borderBottomWidth: 2,
    minWidth: 100,
    maxWidth: 200,
  },
  tabName: {
    fontSize: 12,
    flex: 1,
  },
  closeBtn: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirtyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
})
