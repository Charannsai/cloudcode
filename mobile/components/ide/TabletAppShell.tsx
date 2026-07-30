import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { SvgIcon } from '@/components/SvgIcon'
import { ProjectIcon, detectProjectTech, getTechColors } from '@/components/ProjectIcon'
import AITab from '@/components/project/AITab'
import {
  Folder, Search, Sparkles, Settings, Plus, ChevronRight, RefreshCw,
  Cpu, Database, Wifi, X, User, LogOut, CreditCard, GitBranch
} from '@/components/HugeIconsShim'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'

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
  return (
    <View style={[sbStyles.container, { backgroundColor: isDark ? '#0F1218' : '#F6F8FA', borderRightColor: colors.border }]}>
      <View style={[sbStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[sbStyles.headerTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          WORKSPACES
        </Text>
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
          const tech = detectProjectTech(project)
          const techColors = getTechColors(tech)
          const statusColor = project.status === 'ready' ? '#3FB950' : project.status === 'stopped' ? '#8B949E' : '#D2A8FF'

          return (
            <TouchableOpacity
              key={project.id}
              style={[sbStyles.projectItem]}
              onPress={() => onProjectPress(project)}
              activeOpacity={0.7}
            >
              <ProjectIcon tech={tech} size={16} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[sbStyles.projectName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={[sbStyles.projectMeta, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
                  {project.language || 'Empty'}
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
  projects, systemHealth, onProjectPress, onNewProject, isDark, colors, user
}: {
  projects: Project[]
  systemHealth: any
  onProjectPress: (p: Project) => void
  onNewProject: () => void
  isDark: boolean
  colors: any
  user: any
}) {
  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return 'Good morning'
    if (hours < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const recentProjects = projects.slice(0, 5)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={mainStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={mainStyles.welcomeContainer}>
        {/* Welcome Header */}
        <View style={mainStyles.welcomeHeader}>
          <Text style={[mainStyles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {getGreeting()} 👋
          </Text>
          <Text style={[mainStyles.userName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {user?.name || user?.login || 'Developer'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={mainStyles.section}>
          <Text style={[mainStyles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Start
          </Text>
          <View style={mainStyles.actionsRow}>
            <TouchableOpacity
              style={[mainStyles.actionCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: colors.border }]}
              onPress={onNewProject}
              activeOpacity={0.7}
            >
              <Plus size={20} color={isDark ? '#58A6FF' : '#0969DA'} strokeWidth={1.8} />
              <Text style={[mainStyles.actionLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                New Workspace
              </Text>
              <Text style={[mainStyles.actionDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Create a new cloud workspace
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Workspaces */}
        {recentProjects.length > 0 && (
          <View style={mainStyles.section}>
            <Text style={[mainStyles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              Recent Workspaces
            </Text>
            {recentProjects.map((project) => {
              const tech = detectProjectTech(project)
              const statusColor = project.status === 'ready' ? '#3FB950' : project.status === 'stopped' ? '#8B949E' : '#D2A8FF'
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[mainStyles.recentItem, { borderColor: colors.border }]}
                  onPress={() => onProjectPress(project)}
                  activeOpacity={0.7}
                >
                  <ProjectIcon tech={tech} size={18} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[mainStyles.recentName, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{project.name}</Text>
                    <Text style={[mainStyles.recentMeta, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                      {project.language || 'Empty'} • {project.container_status || project.status}
                    </Text>
                  </View>
                  <View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor }]} />
                  <ChevronRight size={14} color={colors.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* System Health */}
        {systemHealth && (
          <View style={mainStyles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[mainStyles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                System Health
              </Text>
              <Text style={[{ fontSize: 11, color: '#3FB950', fontFamily: 'Inter_500Medium' }]}>
                ● Operational
              </Text>
            </View>
            <View style={[mainStyles.healthCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: colors.border }]}>
              <View style={mainStyles.healthRow}>
                <Text style={[mainStyles.healthLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  <Cpu size={12} color={colors.textSecondary} strokeWidth={1.5} /> Server CPU
                </Text>
                <Text style={[mainStyles.healthValue, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}>
                  {systemHealth.cpu_usage || '—'}%
                </Text>
              </View>
              <View style={mainStyles.healthRow}>
                <Text style={[mainStyles.healthLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  <Database size={12} color={colors.textSecondary} strokeWidth={1.5} /> Memory
                </Text>
                <Text style={[mainStyles.healthValue, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}>
                  {systemHealth.memory_usage || '—'}%
                </Text>
              </View>
              <View style={mainStyles.healthRow}>
                <Text style={[mainStyles.healthLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  <Wifi size={12} color={colors.textSecondary} strokeWidth={1.5} /> Ping
                </Text>
                <Text style={[mainStyles.healthValue, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}>
                  {systemHealth.latency || '—'}ms
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={mainStyles.section}>
          <Text style={[mainStyles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Tips
          </Text>
          <Text style={[mainStyles.tip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • Use the Explorer sidebar to browse and open workspaces
          </Text>
          <Text style={[mainStyles.tip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • Toggle the AI panel from the activity bar for coding help
          </Text>
          <Text style={[mainStyles.tip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • Each workspace has its own terminal, editor, and preview
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const mainStyles = StyleSheet.create({
  scrollContent: { paddingVertical: 40 },
  welcomeContainer: { maxWidth: 640, alignSelf: 'center', width: '100%', paddingHorizontal: 40, gap: 32 },
  welcomeHeader: { gap: 4 },
  greeting: { fontSize: 14 },
  userName: { fontSize: 26, letterSpacing: -0.5 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { padding: 16, borderRadius: 10, borderWidth: 1, gap: 6, minWidth: 200 },
  actionLabel: { fontSize: 14, marginTop: 4 },
  actionDesc: { fontSize: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 6, borderBottomWidth: 1 },
  recentName: { fontSize: 14 },
  recentMeta: { fontSize: 11, marginTop: 2 },
  healthCard: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthLabel: { fontSize: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthValue: { fontSize: 13 },
  tip: { fontSize: 13, lineHeight: 20 },
})

// ─── AI Right Panel ─────────────────────────────────────────
function AIRightPanel({
  visible, onClose, isDark, colors
}: {
  visible: boolean; onClose: () => void; isDark: boolean; colors: any
}) {
  if (!visible) return null
  return (
    <View style={[rpStyles.container, { backgroundColor: isDark ? '#0F1218' : '#FFFFFF', borderLeftColor: colors.border }]}>
      <View style={[rpStyles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color={isDark ? '#A78BFA' : '#7C3AED'} strokeWidth={2} />
          <Text style={[rpStyles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            AI Assistant
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={rpStyles.closeBtn} activeOpacity={0.7}>
          <X size={14} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <AITab projectId="" />
      </View>
    </View>
  )
}

const rpStyles = StyleSheet.create({
  container: { width: 320, borderLeftWidth: 1 },
  header: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 12 },
  closeBtn: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
})

// ─── Title Bar ──────────────────────────────────────────────
function IDETitleBar({ user, isDark, colors, onSettingsPress }: {
  user: any; isDark: boolean; colors: any; onSettingsPress: () => void
}) {
  return (
    <View style={[tbStyles.container, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderBottomColor: colors.border }]}>
      <Text style={[tbStyles.brand, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        CloudCode
      </Text>
      <View style={{ flex: 1 }} />
      {user?.avatar_url && (
        <Image
          source={{ uri: user.avatar_url }}
          style={tbStyles.avatar}
        />
      )}
    </View>
  )
}

const tbStyles = StyleSheet.create({
  container: { height: 38, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, gap: 10 },
  brand: { fontSize: 14, letterSpacing: -0.3 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
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
      const data = await api.system.health()
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

  const handleNewProject = () => {
    router.push('/new-project')
  }

  const handleSettings = () => {
    router.push('/(tabs)/settings')
  }

  return (
    <View style={[shellStyles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Title Bar */}
      <IDETitleBar user={user} isDark={isDark} colors={colors} onSettingsPress={handleSettings} />

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
            onNewProject={handleNewProject}
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
            onNewProject={handleNewProject}
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
    </View>
  )
}

const shellStyles = StyleSheet.create({
  container: { flex: 1 },
  mainRow: { flex: 1, flexDirection: 'row' },
})
