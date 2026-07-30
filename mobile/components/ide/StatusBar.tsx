import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'
import { GitBranch } from '@/components/HugeIconsShim'

interface StatusBarProps {
  branch?: string
  language?: string
  encoding?: string
  projectStatus?: string
}

function getLanguageFromPath(path: string | null): string {
  if (!path) return 'Plain Text'
  const ext = path.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'ts': case 'tsx': return 'TypeScript'
    case 'js': case 'jsx': return 'JavaScript'
    case 'json': return 'JSON'
    case 'html': return 'HTML'
    case 'css': return 'CSS'
    case 'md': return 'Markdown'
    case 'py': return 'Python'
    case 'go': return 'Go'
    case 'rs': return 'Rust'
    case 'yaml': case 'yml': return 'YAML'
    case 'sh': case 'bash': return 'Shell Script'
    default: return 'Plain Text'
  }
}

export default function StatusBar({ branch = 'main', encoding = 'UTF-8', projectStatus }: StatusBarProps) {
  const { colors, isDark } = useAppTheme()
  const { cursorLine, cursorCol, activeEditorTab } = useTabletLayoutStore()

  const language = getLanguageFromPath(activeEditorTab)
  const bgColor = isDark ? '#0D1117' : '#007ACC'
  const fgColor = isDark ? colors.textSecondary : '#FFFFFF'

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: colors.border }]}>
      {/* Left section */}
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.statusItem} activeOpacity={0.7}>
          <GitBranch size={12} color={fgColor} strokeWidth={1.8} />
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>{branch}</Text>
        </TouchableOpacity>

        {projectStatus && (
          <View style={styles.statusItem}>
            <View style={[styles.miniDot, { backgroundColor: projectStatus === 'ready' ? '#3FB950' : '#D2A8FF' }]} />
            <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
              {projectStatus}
            </Text>
          </View>
        )}
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
            Ln {cursorLine}, Col {cursorCol}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
            {encoding}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusText, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>
            {language}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: IDE_LAYOUT.statusBarHeight,
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
    gap: 4,
  },
  statusText: {
    fontSize: 11,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
