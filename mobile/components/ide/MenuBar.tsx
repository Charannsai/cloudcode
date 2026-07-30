import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { IDE_LAYOUT } from '@/constants/tokens'
import { BlurView } from 'expo-blur'
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import {
  Save, X, Folder, ArrowLeft, Play, Columns, ChevronLeft, ChevronRight,
  Terminal, GitBranch, Globe, Info, Settings
} from '@/components/HugeIconsShim'

interface MenuBarProps {
  onSave: () => void
  onCloseFile: () => void
  onOpenFilePicker: () => void
  onExitEditor: () => void
  onRunFile: () => void
  onToggleSplit?: () => void
  onGoToTerminal: () => void
  onGoToGit: () => void
  onGoToPreview: () => void
  onToggleSidebar: () => void
  onToggleBottomPanel: () => void
  onToggleRightPanel: () => void
}

// Animated menu item with press feedback
function MenuItem({ name, activeMenu, onPress, colors, isDark }: {
  name: string; activeMenu: string | null; onPress: () => void; colors: any; isDark: boolean
}) {
  const isActive = activeMenu === name

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuItem, isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
        <Text style={[styles.menuText, {
          color: isActive ? colors.text : colors.textSecondary,
          fontFamily: 'Inter_500Medium'
        }]}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// Animated dropdown card
function DropdownCard({
  visible, items, onClose, colors, isDark, left, top
}: {
  visible: boolean
  items: { label: string; onPress: () => void; divider?: boolean; danger?: boolean; icon?: any; shortcut?: string }[]
  onClose: () => void
  colors: any
  isDark: boolean
  left: number
  top: number
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(-4)

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 80 })
      translateY.value = withTiming(0, { duration: 80, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      opacity.value = withTiming(0, { duration: 60 })
      translateY.value = withTiming(-4, { duration: 60 })
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Reanimated.View style={[styles.dropdown, animatedStyle, {
      top, left,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      backgroundColor: isDark ? 'rgba(22, 27, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    }]}>
      <View style={styles.dropdownInner}>
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <View key={i}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { item.onPress(); onClose() }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {Icon && <Icon size={14} color={item.danger ? '#F85149' : colors.textSecondary} strokeWidth={1.8} />}
                  <Text style={[styles.dropdownText, {
                    color: item.danger ? '#F85149' : colors.text,
                    fontFamily: 'Inter_400Regular'
                  }]}>{item.label}</Text>
                </View>
                {item.shortcut && (
                  <Text style={[styles.shortcutText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                    {item.shortcut}
                  </Text>
                )}
              </TouchableOpacity>
              {item.divider && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />}
            </View>
          )
        })}
      </View>
    </Reanimated.View>
  )
}

export default function MenuBar(props: MenuBarProps) {
  const { colors, isDark } = useAppTheme()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const MENUS = ['File', 'Edit', 'View', 'Go', 'Terminal', 'Help']

  const getMenuItems = (menu: string | null) => {
    if (!menu) return []
    switch (menu) {
      case 'File':
        return [
          { label: 'Save', icon: Save, onPress: props.onSave, shortcut: '⌘S' },
          { label: 'Open File...', icon: Folder, onPress: props.onOpenFilePicker, shortcut: '⌘O', divider: true },
          { label: 'Close File', icon: X, onPress: props.onCloseFile, shortcut: '⌘W', divider: true },
          { label: 'Exit to Projects', icon: ArrowLeft, onPress: props.onExitEditor, danger: true },
        ]
      case 'Edit':
        return [
          { label: 'Split Editor', icon: Columns, onPress: props.onToggleSplit || (() => {}) },
        ]
      case 'View':
        return [
          { label: 'Toggle Sidebar', icon: Folder, onPress: props.onToggleSidebar, shortcut: '⌘B' },
          { label: 'Toggle Panel', icon: Terminal, onPress: props.onToggleBottomPanel, shortcut: '⌘J' },
          { label: 'Toggle AI Panel', icon: ChevronRight, onPress: props.onToggleRightPanel, shortcut: '⌘I' },
        ]
      case 'Go':
        return [
          { label: 'Terminal', icon: Terminal, onPress: props.onGoToTerminal },
          { label: 'Source Control', icon: GitBranch, onPress: props.onGoToGit },
          { label: 'Preview', icon: Globe, onPress: props.onGoToPreview },
        ]
      case 'Terminal':
        return [
          { label: 'New Terminal', icon: Terminal, onPress: props.onGoToTerminal },
          { label: 'Run Current File', icon: Play, onPress: props.onRunFile },
        ]
      case 'Help':
        return [
          { label: 'About CloudCode', icon: Info, onPress: () => {} },
          { label: 'Shortcuts', icon: Settings, onPress: () => {} },
        ]
      default:
        return []
    }
  }

  const getDropdownLeft = (menu: string | null) => {
    const idx = MENUS.indexOf(menu || '')
    return 8 + idx * 70
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderBottomColor: colors.border }]}>
        {MENUS.map((menu) => (
          <MenuItem
            key={menu}
            name={menu}
            activeMenu={activeMenu}
            onPress={() => setActiveMenu(activeMenu === menu ? null : menu)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>

      {/* Dropdown overlay */}
      <Modal visible={activeMenu !== null} transparent animationType="none" onRequestClose={() => setActiveMenu(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveMenu(null)}>
          <DropdownCard
            visible={activeMenu !== null}
            items={getMenuItems(activeMenu)}
            onClose={() => setActiveMenu(null)}
            colors={colors}
            isDark={isDark}
            left={getDropdownLeft(activeMenu)}
            top={IDE_LAYOUT.titleBarHeight + IDE_LAYOUT.menuBarHeight + 44}
          />
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    height: IDE_LAYOUT.menuBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 2,
  },
  menuItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  menuText: {
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownInner: {
    padding: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 13,
  },
  shortcutText: {
    fontSize: 11,
    opacity: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 8,
  },
})
