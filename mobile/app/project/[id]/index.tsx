import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, LayoutChangeEvent,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ChevronLeft, RefreshCw, Folder, Terminal, Globe, GitBranch, Sparkles, GitPullRequest } from 'lucide-react-native'
import Animated, { useAnimatedStyle, withSpring, withTiming, Easing, useSharedValue } from 'react-native-reanimated'

// Lazy-load tab screens
import FilesTab from '@/components/project/FilesTab'
import TerminalTab from '@/components/project/TerminalTab'
import PreviewTab from '@/components/project/PreviewTab'
import GitTab from '@/components/project/GitTab'
import AITab from '@/components/project/AITab'
import PRsTab from '@/components/project/PRsTab'
import VoiceOverlay from '@/components/VoiceOverlay'

const TABS = [
  { id: 'Terminal', icon: Terminal },
  { id: 'Files', icon: Folder },
  { id: 'Git', icon: GitBranch },
  { id: 'Preview', icon: Globe },
  { id: 'AI', icon: Sparkles },
] as const

type Tab = typeof TABS[number]['id']

const SPRING = { damping: 24, stiffness: 200, mass: 0.8 }

export default function ProjectScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: Tab }>()
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Terminal')

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    }
  }, [tab])

  // Animated indicator
  const indicatorX = useSharedValue(0)
  const indicatorW = useSharedValue(0)
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({})

  useEffect(() => {
    const layout = tabLayouts[activeTab]
    if (layout) {
      indicatorX.value = withTiming(layout.x, { duration: 120, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      indicatorW.value = withTiming(layout.width, { duration: 120, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    }
  }, [activeTab, tabLayouts])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }))

  const handleTabLayout = (tabId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setTabLayouts(prev => {
      if (prev[tabId]?.x === x && prev[tabId]?.width === width) return prev
      return { ...prev, [tabId]: { x, width } }
    })
  }

  useEffect(() => {
    if (id) fetchProject()
  }, [id])

  async function fetchProject() {
    try {
      const p = await api.projects.get(id as string)
      setProject(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textSecondary} size="small" />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Loading workspace...</Text>
      </View>
    )
  }

  if (!project) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_600SemiBold' }]}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnFallback, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}>
          <Text style={[styles.backBtnFallbackText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.headerBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: project.status === 'ready' ? '#3FB950' : '#D2A8FF' },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
              {project.container_status || project.status}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={fetchProject} 
          style={[styles.headerBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={project.status === 'ready' ? '#3FB950' : colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border }]}>
          <Animated.View style={[styles.tabIndicator, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF' }, indicatorStyle]} />
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => setActiveTab(tab.id)}
                onLayout={(e) => handleTabLayout(tab.id, e)}
                activeOpacity={0.7}
              >
                <Icon 
                  size={14} 
                  color={isActive ? colors.text : colors.textSecondary} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <Text style={[
                  styles.tabText, 
                  { 
                    color: isActive ? colors.text : colors.textSecondary, 
                    fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular' 
                  }
                ]}>
                  {tab.id}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        <View style={{ flex: 1, display: activeTab === 'Files' ? 'flex' : 'none' }}>
          <FilesTab projectId={project.id} isActive={activeTab === 'Files'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Terminal' ? 'flex' : 'none' }}>
          <TerminalTab projectId={project.id} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Git' ? 'flex' : 'none' }}>
          <GitTab projectId={project.id} isActive={activeTab === 'Git'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Preview' ? 'flex' : 'none' }}>
          <PreviewTab projectId={project.id} port={project.port || 3000} ports={project.ports} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'AI' ? 'flex' : 'none' }}>
          <AITab projectId={project.id} />
        </View>
      </View>
      
      {/* Voice-Controlled Autonomous Shake-to-Act */}
      <VoiceOverlay projectId={project.id} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 16 },
  backBtnFallback: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  backBtnFallbackText: { fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  projectName: { 
    fontSize: 18, 
    letterSpacing: -0.5,
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { 
    fontSize: 10, 
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    height: '100%',
    borderRadius: 6,
    zIndex: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 1,
  },
  tabText: { fontSize: 11 },
  content: { flex: 1 },
})
