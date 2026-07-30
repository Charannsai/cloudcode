import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, TextInput, ActivityIndicator, Alert, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useAuthStore } from '@/store/auth'
import { useAIStore } from '@/store/ai'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { SvgIcon } from '@/components/SvgIcon'
import { ProjectIcon } from '@/components/ProjectIcon'
import { AITab } from '@/components/project/AITab'
import {
  Folder, Search, Sparkles, Settings, Plus, ChevronRight, RefreshCw,
  Cpu, Database, Wifi, X, User, LogOut, CreditCard, GitBranch, History as HistoryIcon
} from '@/components/HugeIconsShim'
import Svg, { Path, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg'

type SidebarPanel = 'explorer' | 'search' | 'ai' | null

/**
 * Full IDE shell for the main app on tablet.
 * Replaces the entire tabs-based navigation with a single IDE view.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │  TitleBar — "CloudCode" + user avatar              38px │
 * ├───┬──────────┬───────────────────────────┬───────────────┤
 * │ A │ Sidebar  │  Main Content Area        │  AI Panel     │
 * │ c │ 260px    │  (Welcome / Dashboard)    │  (toggleable) │
 * │ t │ Projects │                           │  320px        │
 * │   │ list     │                           │               │
 * │ B │          │                           │               │
 * │ a │          │                           │               │
 * │ r │          │                           │               │
 * │ 48│          │                           │               │
 * ├───┴──────────┴───────────────────────────┴───────────────┤
 * │  StatusBar — Connected • User • Version            24px │
 * └──────────────────────────────────────────────────────────┘
 */

// ─── Activity Bar ───────────────────────────────────────────
function IDEActivityBar({
  activePanel, onPanelChange, aiVisible, onToggleAI, onSettings, isDark, colors
}: {
  activePanel: SidebarPanel
  onPanelChange: (panel: SidebarPanel) => void
  aiVisible: boolean
  onToggleAI: () => void
  onSettings: () => void
  isDark: boolean
  colors: any
}) {
  const items: { id: SidebarPanel; icon: typeof Folder; label: string }[] = [
    { id: 'explorer', icon: Folder, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
  ]

  return (
    <View style={[abStyles.container, {
      backgroundColor: isDark ? '#0D1117' : '#F0F2F5',
      borderRightColor: colors.border,
    }]}>
      <View style={abStyles.topIcons}>
        {items.map(item => {
          const isActive = activePanel === item.id
          const Icon = item.icon
          return (
            <TouchableOpacity
              key={item.id}
              style={[abStyles.item, isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
              onPress={() => onPanelChange(activePanel === item.id ? null : item.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={[abStyles.indicator, { backgroundColor: colors.text }]} />}
              <Icon size={22} color={isActive ? colors.text : colors.textSecondary} strokeWidth={isActive ? 2 : 1.5} />
            </TouchableOpacity>
          )
        })}

        {/* AI toggle */}
        <TouchableOpacity
          style={[abStyles.item, aiVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={onToggleAI}
          activeOpacity={0.7}
        >
          {aiVisible && <View style={[abStyles.indicator, { backgroundColor: isDark ? '#A78BFA' : '#7C3AED' }]} />}
          <Sparkles size={22} color={aiVisible ? (isDark ? '#A78BFA' : '#7C3AED') : colors.textSecondary} strokeWidth={aiVisible ? 2 : 1.5} />
        </TouchableOpacity>
      </View>

      <View style={abStyles.bottomIcons}>
        <TouchableOpacity style={abStyles.item} onPress={onSettings} activeOpacity={0.7}>
          <Settings size={20} color={colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const abStyles = StyleSheet.create({
  container: { width: 48, borderRightWidth: 1, justifyContent: 'space-between', paddingVertical: 4 },
  topIcons: { width: '100%', alignItems: 'center' },
  bottomIcons: { width: '100%', alignItems: 'center' },
  item: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  indicator: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, borderRadius: 1 },
})

// ─── Sidebar: Project Explorer ──────────────────────────────
function ExplorerSidebar({
  projects, loading, onProjectPress, onNewProject, onRefresh, isDark, colors
}: {
  projects: Project[]
  loading: boolean
  onProjectPress: (p: Project) => void
  onNewProject: () => void
  onRefresh: () => void
  isDark: boolean
  colors: any
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <View style={[sbStyles.container, { backgroundColor: isDark ? '#0F1218' : '#F6F8FA', borderRightColor: colors.border }]}>
      {/* Explorer Header with Workspace Dropdown */}
      <View style={[sbStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onPress={() => setDropdownOpen(!dropdownOpen)}
          activeOpacity={0.7}
        >
          <Text style={[sbStyles.headerTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            WORKSPACES
          </Text>
          <ChevronRight
            size={12}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: dropdownOpen ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={onRefresh} style={sbStyles.headerBtn} activeOpacity={0.7}>
            <RefreshCw size={13} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNewProject} style={sbStyles.headerBtn} activeOpacity={0.7}>
            <Plus size={15} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {projects.map((project) => {
          const statusColor = project.status === 'ready' ? '#3FB950' : project.status === 'stopped' ? '#8B949E' : '#D2A8FF'

          return (
            <TouchableOpacity
              key={project.id}
              style={[sbStyles.projectItem]}
              onPress={() => onProjectPress(project)}
              activeOpacity={0.7}
            >
              <Folder size={14} color={isDark ? '#58A6FF' : '#0969DA'} strokeWidth={1.5} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[sbStyles.projectName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  {project.name}
                </Text>
              </View>
              <View style={[sbStyles.statusDot, { backgroundColor: statusColor }]} />
            </TouchableOpacity>
          )
        })}

        {/* New workspace button */}
        <TouchableOpacity
          style={[sbStyles.projectItem, { opacity: 0.7 }]}
          onPress={onNewProject}
          activeOpacity={0.7}
        >
          <Plus size={14} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[sbStyles.projectName, { color: colors.textSecondary, fontFamily: 'Inter_400Regular', marginLeft: 8 }]}>
            New workspace...
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

// Search sidebar (placeholder)
function SearchSidebar({ isDark, colors }: { isDark: boolean; colors: any }) {
  return (
    <View style={[sbStyles.container, { backgroundColor: isDark ? '#0F1218' : '#F6F8FA', borderRightColor: colors.border }]}>
      <View style={[sbStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[sbStyles.headerTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          SEARCH
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={[{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' }]}>
          Search across all workspaces
        </Text>
      </View>
    </View>
  )
}

const sbStyles = StyleSheet.create({
  container: { width: 260, borderRightWidth: 1 },
  header: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 11, letterSpacing: 0.8 },
  headerBtn: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  projectItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 0 },
  projectName: { fontSize: 13 },
  projectMeta: { fontSize: 10, marginTop: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
})

// ─── Main Content: Welcome/Dashboard ────────────────────────
function WelcomeContent({
  projects, systemHealth, onProjectPress, onOpenFolder, onCloneRepo, isDark, colors, user
}: {
  projects: Project[]
  systemHealth: any
  onProjectPress: (p: Project) => void
  onOpenFolder: () => void
  onCloneRepo: () => void
  isDark: boolean
  colors: any
  user: any
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={mainStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={mainStyles.welcomeContainer}>
        {/* Antigravity Logo & Title */}
        <View style={mainStyles.logoSection}>
          <Svg width={48} height={48} viewBox="0 0 100 100" fill="none">
            <Path
              d="M50 15C32 15 20 35 20 60C20 75 35 85 50 85C65 85 80 75 80 60C80 35 68 15 50 15ZM50 38C56 38 62 48 62 60C62 68 56 72 50 72C44 72 38 68 38 60C38 48 44 38 50 38Z"
              fill={isDark ? '#FFFFFF' : '#000000'}
            />
          </Svg>
          <Text style={[mainStyles.ideTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            CloudCode IDE
          </Text>
        </View>

        {/* Primary Action Buttons */}
        <View style={mainStyles.primaryButtonsRow}>
          <TouchableOpacity
            style={[mainStyles.openFolderBtn, { backgroundColor: isDark ? '#FFFFFF' : '#0F1218' }]}
            onPress={onOpenFolder}
            activeOpacity={0.8}
          >
            <Folder size={16} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={1.8} />
            <Text style={[mainStyles.openFolderText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Open Folder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[mainStyles.cloneRepoBtn, { backgroundColor: isDark ? '#2D2D30' : '#E5E7EB', borderColor: colors.border }]}
            onPress={onCloneRepo}
            activeOpacity={0.8}
          >
            <GitBranch size={16} color={colors.text} strokeWidth={1.8} />
            <Text style={[mainStyles.cloneRepoText, { color: colors.text }]}>Clone Repository</Text>
          </TouchableOpacity>
        </View>

        {/* Workspaces Section (matching Image 2) */}
        <View style={mainStyles.section}>
          <Text style={[mainStyles.sectionHeader, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Workspaces
          </Text>
          <View style={{ gap: 8 }}>
            {projects.slice(0, 4).map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[mainStyles.workspaceCard, { backgroundColor: isDark ? '#1E1E1E' : '#F3F4F6', borderColor: colors.border }]}
                onPress={() => onProjectPress(project)}
                activeOpacity={0.7}
              >
                <Text style={[mainStyles.wsName, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                  {project.name}
                </Text>
                <Text style={[mainStyles.wsPath, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
                  {`/workspaces/${project.name}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Google Extensions Section (matching Image 2) */}
        <View style={mainStyles.section}>
          <Text style={[mainStyles.sectionHeader, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Google Extensions
          </Text>
          <View style={[mainStyles.extensionCard, { backgroundColor: isDark ? '#1E1E1E' : '#F3F4F6', borderColor: colors.border }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[mainStyles.extTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                Google Data Cloud
              </Text>
              <Text style={[mainStyles.extDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Google Data Cloud for your intelligent IDE.
              </Text>
            </View>
            <TouchableOpacity style={[mainStyles.downloadBtn, { backgroundColor: isDark ? '#2D2D30' : '#E5E7EB' }]} activeOpacity={0.7}>
              <Text style={[mainStyles.downloadText, { color: colors.text }]}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const mainStyles = StyleSheet.create({
  scrollContent: { paddingVertical: 40 },
  welcomeContainer: { maxWidth: 520, alignSelf: 'center', width: '100%', paddingHorizontal: 24, gap: 28 },
  logoSection: { alignItems: 'center', gap: 12, marginBottom: 8 },
  ideTitle: { fontSize: 22, letterSpacing: -0.5 },
  primaryButtonsRow: { gap: 10 },
  openFolderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 6 },
  openFolderText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  cloneRepoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 6, borderWidth: 1 },
  cloneRepoText: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  section: { gap: 10 },
  sectionHeader: { fontSize: 13 },
  workspaceCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, borderWidth: 1, gap: 2 },
  wsName: { fontSize: 13.5 },
  wsPath: { fontSize: 11, opacity: 0.7 },
  extensionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 6, borderWidth: 1, gap: 12 },
  extTitle: { fontSize: 13.5 },
  extDesc: { fontSize: 12 },
  downloadBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  downloadText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
})

// ─── AI Right Panel ─────────────────────────────────────────
function AIRightPanel({
  visible, onClose, isDark, colors
}: {
  visible: boolean; onClose: () => void; isDark: boolean; colors: any
}) {
  const { startNewChat, savedConversations, loadConversation } = useAIStore()
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  if (!visible) return null
  return (
    <View style={[rpStyles.container, { backgroundColor: isDark ? '#0F1218' : '#FFFFFF', borderLeftColor: colors.border }]}>
      <View style={[rpStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[rpStyles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          Agent
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <TouchableOpacity onPress={startNewChat} style={rpStyles.closeBtn} activeOpacity={0.7}>
            <Plus size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHistoryModalOpen(true)} style={rpStyles.closeBtn} activeOpacity={0.7}>
            <HistoryIcon size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={rpStyles.closeBtn} activeOpacity={0.7}>
            <X size={14} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <AITab projectId="" hideHeader={true} />
      </View>

      {/* History Conversations Modal */}
      {historyModalOpen && (
        <Modal transparent visible={historyModalOpen} animationType="fade" onRequestClose={() => setHistoryModalOpen(false)}>
          <TouchableOpacity style={rpStyles.modalOverlay} activeOpacity={1} onPress={() => setHistoryModalOpen(false)}>
            <View style={[rpStyles.historyCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text, marginBottom: 8 }}>
                Past Conversations
              </Text>
              {savedConversations.slice(0, 8).map((thread) => (
                <TouchableOpacity
                  key={thread.id}
                  onPress={async () => {
                    await loadConversation(thread.id)
                    setHistoryModalOpen(false)
                  }}
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                    {thread.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  )
}

const rpStyles = StyleSheet.create({
  container: { width: 320, borderLeftWidth: 1 },
  header: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 12 },
  closeBtn: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  historyCard: { width: 260, maxHeight: 320, borderRadius: 12, borderWidth: 1, padding: 14, elevation: 8 },
})

import SettingsScreen from '@/app/(tabs)/settings'
import { Modal } from 'react-native'

function SidebarLeftIcon({ size = 15, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <Line x1="7" y1="2.5" x2="7" y2="15.5" stroke={color} strokeWidth="1.4" />
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

// ─── Desktop IDE Top Menus ────────────────────────────────
function IDETopMenus({
  onOpenFolder, onCloneRepo, onNewBlankFolder, onSettingsPress, onToggleSidebar, onToggleRightPanel, colors, isDark
}: {
  onOpenFolder: () => void
  onCloneRepo: () => void
  onNewBlankFolder: () => void
  onSettingsPress: () => void
  onToggleSidebar: () => void
  onToggleRightPanel: () => void
  colors: any
  isDark: boolean
}) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const MENUS = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help']

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 12 }}>
      {MENUS.map((menu) => (
        <TouchableOpacity
          key={menu}
          onPress={() => handleMenuClick(menu)}
          style={[
            tbStyles.menuBtn,
            activeMenu === menu && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
          ]}
          activeOpacity={0.7}
        >
          <Text style={[tbStyles.menuText, { color: activeMenu === menu ? colors.text : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {menu}
          </Text>
        </TouchableOpacity>
      ))}

      {/* File Dropdown Menu */}
      {activeMenu === 'File' && (
        <Modal transparent visible={true} animationType="none" onRequestClose={() => setActiveMenu(null)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveMenu(null)}>
            <View style={[tbStyles.menuDropdownCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border, left: 130, top: 36 }]}>
              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onOpenFolder() }}
              >
                <Folder size={14} color={colors.text} strokeWidth={1.8} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>Open Folder...</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onNewBlankFolder() }}
              >
                <Plus size={14} color={colors.text} strokeWidth={1.8} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>New Blank Folder...</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onCloneRepo() }}
              >
                <GitBranch size={14} color={colors.text} strokeWidth={1.8} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>Clone Git Repository...</Text>
              </TouchableOpacity>

              <View style={[tbStyles.dropdownDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onSettingsPress() }}
              >
                <Settings size={14} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>Preferences & Settings</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* View Dropdown Menu */}
      {activeMenu === 'View' && (
        <Modal transparent visible={true} animationType="none" onRequestClose={() => setActiveMenu(null)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActiveMenu(null)}>
            <View style={[tbStyles.menuDropdownCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border, left: 240, top: 36 }]}>
              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onToggleSidebar() }}
              >
                <SidebarLeftIcon color={colors.text} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>Toggle Explorer Sidebar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tbStyles.dropdownRow}
                onPress={() => { setActiveMenu(null); onToggleRightPanel() }}
              >
                <SidebarRightIcon color={colors.text} />
                <Text style={[tbStyles.dropdownLabel, { color: colors.text }]}>Toggle Agent AI Panel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  )
}

// ─── Open Folder Modal (Import Local OR Choose Templates) ───
function OpenFolderModal({
  visible, onClose, onCreated, isDark, colors
}: {
  visible: boolean; onClose: () => void; onCreated: (project: Project) => void; isDark: boolean; colors: any
}) {
  const [tab, setTab] = useState<'local' | 'templates'>('local')
  const [name, setName] = useState('')
  const [selectedLocalFolder, setSelectedLocalFolder] = useState<string | null>(null)
  const [type, setType] = useState<any>('node')
  const [loading, setLoading] = useState(false)

  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F1218'
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF'

  useEffect(() => {
    if (visible) {
      setName('')
      setSelectedLocalFolder(null)
    }
  }, [visible])

  const handleLaunchFileExplorer = async () => {
    try {
      // 1. Web/Desktop browser: Native HTML directory picker
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input')
        input.type = 'file'
        input.setAttribute('webkitdirectory', '')
        input.setAttribute('directory', '')
        input.onchange = (e: any) => {
          const files = e.target.files
          if (files && files.length > 0) {
            const firstFile = files[0]
            const relativePath = firstFile.webkitRelativePath || firstFile.name
            const folderName = relativePath.split('/')[0] || 'local-folder'
            setSelectedLocalFolder(folderName)
            setName(folderName)
          }
        }
        input.click()
        return
      }

      // 2. StorageAccessFramework for Android/Native directory selection
      const saf = (FileSystem as any).StorageAccessFramework
      if (saf?.requestDirectoryPermissionsAsync) {
        const permissions = await saf.requestDirectoryPermissionsAsync()
        if (permissions.granted && permissions.directoryUri) {
          const rawUri = permissions.directoryUri
          const decoded = decodeURIComponent(rawUri)
          const segments = decoded.split(/[:/]/).filter(Boolean)
          const folderName = segments[segments.length - 1] || 'local-folder'
          setSelectedLocalFolder(folderName)
          setName(folderName)
          return
        }
      }

      // 3. DocumentPicker with folder UTI types for iOS/iPadOS folder selection
      const result = await DocumentPicker.getDocumentAsync({
        type: ['public.folder', 'com.apple.finder.directory', '*/*'],
        copyToCacheDirectory: false,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        const cleanName = asset.name.replace(/\.[^/.]+$/, '')
        setSelectedLocalFolder(cleanName)
        setName(cleanName)
      }
    } catch (err: any) {
      Alert.alert('Folder Picker', 'Could not open folder picker: ' + (err?.message || String(err)))
    }
  }

  const handleCreate = async () => {
    const finalName = name.trim() || selectedLocalFolder || 'local-workspace'
    setLoading(true)
    try {
      const project = await api.projects.create(finalName, tab === 'local' ? 'empty' : type)
      onCreated(project)
    } catch (err: any) {
      Alert.alert('Error Opening Folder', err.message || 'Failed to open local directory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[modalStyles.card, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border, width: 440 }]}>
          <Text style={[modalStyles.title, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            Open Folder
          </Text>

          {/* 2 Options Switcher Bar */}
          <View style={[modalStyles.tabSwitcher, { backgroundColor: isDark ? '#0F1218' : '#F3F4F6', borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setTab('local')}
              style={[
                modalStyles.tabOption,
                tab === 'local' && { backgroundColor: isDark ? '#262933' : '#FFFFFF' }
              ]}
            >
              <Folder size={14} color={tab === 'local' ? colors.text : colors.textSecondary} strokeWidth={1.8} />
              <Text style={[modalStyles.tabOptionText, { color: tab === 'local' ? colors.text : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Import from Local
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('templates')}
              style={[
                modalStyles.tabOption,
                tab === 'templates' && { backgroundColor: isDark ? '#262933' : '#FFFFFF' }
              ]}
            >
              <Cpu size={14} color={tab === 'templates' ? colors.text : colors.textSecondary} strokeWidth={1.8} />
              <Text style={[modalStyles.tabOptionText, { color: tab === 'templates' ? colors.text : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Choose Templates
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'local' ? (
            <View style={{ gap: 12 }}>
              <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Select Local Folder</Text>
              
              <TouchableOpacity
                onPress={handleLaunchFileExplorer}
                style={[
                  modalStyles.pickerBox,
                  {
                    backgroundColor: isDark ? '#0F1218' : '#F6F8FA',
                    borderColor: selectedLocalFolder ? (isDark ? '#FFFFFF' : '#000000') : colors.border,
                    borderWidth: selectedLocalFolder ? 1.5 : 1,
                    paddingVertical: 14
                  }
                ]}
                activeOpacity={0.7}
              >
                <Folder size={20} color={selectedLocalFolder ? (isDark ? '#FFFFFF' : '#000000') : colors.textSecondary} strokeWidth={1.8} />
                <Text style={{ color: selectedLocalFolder ? colors.text : colors.textSecondary, flex: 1, fontSize: 13, fontFamily: selectedLocalFolder ? 'Inter_600SemiBold' : 'Inter_400Regular' }} numberOfLines={1}>
                  {selectedLocalFolder ? `Folder: ${selectedLocalFolder}` : 'Tap to select folder from device...'}
                </Text>
                <View style={{ backgroundColor: primaryBtnBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, color: primaryBtnText, fontFamily: 'Inter_600SemiBold' }}>
                    {selectedLocalFolder ? 'Change Folder' : 'Select Folder'}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={[modalStyles.label, { color: colors.textSecondary, marginTop: 4 }]}>Workspace Name</Text>
              <TextInput
                style={[modalStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F1218' : '#F6F8FA' }]}
                placeholder="Workspace name"
                placeholderTextColor={colors.textSecondary + '70'}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Workspace Name</Text>
              <TextInput
                style={[modalStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F1218' : '#F6F8FA' }]}
                placeholder="e.g. my-template-app"
                placeholderTextColor={colors.textSecondary + '70'}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
              />

              <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Select Template</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['node', 'react', 'nextjs', 'python', 'flask', 'fastapi', 'rust', 'gin'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      modalStyles.chip,
                      {
                        backgroundColor: type === t ? primaryBtnBg : (isDark ? '#0F1218' : '#F6F8FA'),
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <Text style={[modalStyles.chipText, { color: type === t ? primaryBtnText : colors.text }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onClose} style={[modalStyles.btn, { borderColor: colors.border, borderWidth: 1 }]} disabled={loading}>
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              style={[modalStyles.btn, { backgroundColor: primaryBtnBg }]}
              disabled={loading || (tab === 'local' && !name.trim() && !selectedLocalFolder)}
            >
              {loading ? (
                <ActivityIndicator size="small" color={primaryBtnText} />
              ) : (
                <Text style={{ color: primaryBtnText, fontFamily: 'Inter_600SemiBold' }}>
                  {tab === 'local' ? 'Open Folder' : 'Create from Template'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ─── Clone Repository Modal ──────────────────────────────
function CloneRepoModal({
  visible, onClose, onCloned, isDark, colors
}: {
  visible: boolean; onClose: () => void; onCloned: (project: Project) => void; isDark: boolean; colors: any
}) {
  const [name, setName] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F1218'
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF'

  const handleClone = async () => {
    if (!githubUrl.trim()) return
    const inferredName = name.trim() || githubUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo'
    setLoading(true)
    try {
      const project = await api.projects.import(inferredName, githubUrl.trim())
      onCloned(project)
    } catch (err: any) {
      Alert.alert('Error Cloning Repo', err.message || 'Failed to clone repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[modalStyles.card, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
          <Text style={[modalStyles.title, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            Clone Git Repository
          </Text>

          <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Repository URL</Text>
          <TextInput
            style={[modalStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F1218' : '#F6F8FA' }]}
            placeholder="https://github.com/user/repository"
            placeholderTextColor={colors.textSecondary + '70'}
            value={githubUrl}
            onChangeText={setGithubUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Workspace Name (Optional)</Text>
          <TextInput
            style={[modalStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0F1218' : '#F6F8FA' }]}
            placeholder="Auto-detected from URL if empty"
            placeholderTextColor={colors.textSecondary + '70'}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onClose} style={[modalStyles.btn, { borderColor: colors.border, borderWidth: 1 }]} disabled={loading}>
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClone} style={[modalStyles.btn, { backgroundColor: primaryBtnBg }]} disabled={loading || !githubUrl.trim()}>
              {loading ? <ActivityIndicator size="small" color={primaryBtnText} /> : <Text style={{ color: primaryBtnText, fontFamily: 'Inter_600SemiBold' }}>Clone Repository</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { width: 440, borderRadius: 14, borderWidth: 1, padding: 20, gap: 12 },
  title: { fontSize: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  tabSwitcher: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 3, gap: 2 },
  tabOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 6 },
  tabOptionText: { fontSize: 12 },
  pickerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12 },
  input: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: 'Inter_400Regular' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { height: 38, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
})

// ─── Title Bar ──────────────────────────────────────────────
function IDETitleBar({
  user,
  isDark,
  colors,
  onOpenFolder,
  onCloneRepo,
  onNewBlankFolder,
  onSettingsPress,
  onToggleSidebar,
  onToggleRightPanel,
  sidebarVisible = true,
  rightPanelVisible = false,
}: {
  user: any
  isDark: boolean
  colors: any
  onOpenFolder: () => void
  onCloneRepo: () => void
  onNewBlankFolder: () => void
  onSettingsPress: () => void
  onToggleSidebar: () => void
  onToggleRightPanel: () => void
  sidebarVisible: boolean
  rightPanelVisible: boolean
}) {
  return (
    <View style={[tbStyles.container, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderBottomColor: colors.border }]}>
      <Text style={[tbStyles.brand, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        CloudCode IDE
      </Text>

      {/* Desktop IDE Top Menus */}
      <IDETopMenus
        onOpenFolder={onOpenFolder}
        onCloneRepo={onCloneRepo}
        onNewBlankFolder={onNewBlankFolder}
        onSettingsPress={onSettingsPress}
        onToggleSidebar={onToggleSidebar}
        onToggleRightPanel={onToggleRightPanel}
        colors={colors}
        isDark={isDark}
      />

      <View style={{ flex: 1 }} />
      <View style={tbStyles.rightActions}>
        <TouchableOpacity
          onPress={onToggleSidebar}
          style={[tbStyles.iconBtn, sidebarVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
          activeOpacity={0.7}
        >
          <SidebarLeftIcon color={sidebarVisible ? colors.text : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleRightPanel}
          style={[tbStyles.iconBtn, rightPanelVisible && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
          activeOpacity={0.7}
        >
          <SidebarRightIcon color={rightPanelVisible ? colors.text : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={tbStyles.iconBtn} activeOpacity={0.7}>
          <Search size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSettingsPress} style={tbStyles.iconBtn} activeOpacity={0.7}>
          <Settings size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>

        {user?.avatar_url && (
          <Image source={{ uri: user.avatar_url }} style={tbStyles.avatar} />
        )}
      </View>
    </View>
  )
}

const tbStyles = StyleSheet.create({
  container: { height: 38, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, gap: 4 },
  brand: { fontSize: 13.5, letterSpacing: -0.3 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginLeft: 4 },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  menuBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  menuText: { fontSize: 12 },
  menuDropdownCard: { position: 'absolute', width: 210, borderRadius: 10, borderWidth: 1, paddingVertical: 4, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  dropdownLabel: { fontSize: 12.5, fontFamily: 'Inter_400Regular' },
  dropdownDivider: { height: 1, marginVertical: 4 },
})

// ─── Status Bar ─────────────────────────────────────────────
function IDEStatusBar({ user, isDark, colors }: { user: any; isDark: boolean; colors: any }) {
  const bgColor = isDark ? '#0D1117' : '#007ACC'
  const fgColor = isDark ? colors.textSecondary : '#FFFFFF'
  return (
    <View style={[stStyles.container, { backgroundColor: bgColor, borderTopColor: colors.border }]}>
      <View style={stStyles.section}>
        <View style={[stStyles.dot, { backgroundColor: '#3FB950' }]} />
        <Text style={[stStyles.text, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>Connected</Text>
      </View>
      <View style={stStyles.section}>
        {user && <Text style={[stStyles.text, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular' }]}>{user.name || user.login}</Text>}
        <Text style={[stStyles.text, { color: fgColor, fontFamily: 'JetBrainsMono_400Regular', opacity: 0.7 }]}>CloudCode v1.0</Text>
      </View>
    </View>
  )
}

const stStyles = StyleSheet.create({
  container: { height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderTopWidth: 1 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11 },
})

// ─── MAIN: TabletAppShell ───────────────────────────────────
export default function TabletAppShell() {
  const { colors, isDark } = useAppTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [activePanel, setActivePanel] = useState<SidebarPanel>('explorer')
  const [aiVisible, setAiVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [openFolderVisible, setOpenFolderVisible] = useState(false)
  const [cloneRepoVisible, setCloneRepoVisible] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [systemHealth, setSystemHealth] = useState<any>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.projects.list()
      setProjects(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.system.diagnostics()
      setSystemHealth(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchHealth()
    const interval = setInterval(() => {
      fetchProjects()
      fetchHealth()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleProjectPress = (project: Project) => {
    router.push(`/project/${project.id}`)
  }

  const handleWorkspaceOpened = (project: Project) => {
    setOpenFolderVisible(false)
    setCloneRepoVisible(false)
    fetchProjects()
    router.push(`/project/${project.id}`)
  }

  const handleSettings = () => {
    setSettingsVisible(true)
  }

  return (
    <View style={[shellStyles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Title Bar */}
      <IDETitleBar
        user={user}
        isDark={isDark}
        colors={colors}
        onOpenFolder={() => setOpenFolderVisible(true)}
        onCloneRepo={() => setCloneRepoVisible(true)}
        onNewBlankFolder={() => setOpenFolderVisible(true)}
        onSettingsPress={handleSettings}
        onToggleSidebar={() => setActivePanel(activePanel ? null : 'explorer')}
        onToggleRightPanel={() => setAiVisible(!aiVisible)}
        sidebarVisible={activePanel !== null}
        rightPanelVisible={aiVisible}
      />

      {/* Main Area */}
      <View style={shellStyles.mainRow}>
        {/* Activity Bar */}
        <IDEActivityBar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          aiVisible={aiVisible}
          onToggleAI={() => setAiVisible(!aiVisible)}
          onSettings={handleSettings}
          isDark={isDark}
          colors={colors}
        />

        {/* Sidebar */}
        {activePanel === 'explorer' && (
          <ExplorerSidebar
            projects={projects}
            loading={loading}
            onProjectPress={handleProjectPress}
            onNewProject={() => setOpenFolderVisible(true)}
            onRefresh={fetchProjects}
            isDark={isDark}
            colors={colors}
          />
        )}
        {activePanel === 'search' && (
          <SearchSidebar isDark={isDark} colors={colors} />
        )}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          <WelcomeContent
            projects={projects}
            systemHealth={systemHealth}
            onProjectPress={handleProjectPress}
            onOpenFolder={() => setOpenFolderVisible(true)}
            onCloneRepo={() => setCloneRepoVisible(true)}
            isDark={isDark}
            colors={colors}
            user={user}
          />
        </View>

        {/* AI Right Panel */}
        <AIRightPanel visible={aiVisible} onClose={() => setAiVisible(false)} isDark={isDark} colors={colors} />
      </View>

      {/* Status Bar */}
      <IDEStatusBar user={user} isDark={isDark} colors={colors} />

      {/* Open Folder Modal */}
      <OpenFolderModal
        visible={openFolderVisible}
        onClose={() => setOpenFolderVisible(false)}
        onCreated={handleWorkspaceOpened}
        isDark={isDark}
        colors={colors}
      />

      {/* Clone Repo Modal */}
      <CloneRepoModal
        visible={cloneRepoVisible}
        onClose={() => setCloneRepoVisible(false)}
        onCloned={handleWorkspaceOpened}
        isDark={isDark}
        colors={colors}
      />

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: isDark ? '#0D1117' : '#F6F8FA'
          }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text }}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} style={{ padding: 4 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <SettingsScreen />
        </View>
      </Modal>
    </View>
  )
}

const shellStyles = StyleSheet.create({
  container: { flex: 1 },
  mainRow: { flex: 1, flexDirection: 'row' },
})
