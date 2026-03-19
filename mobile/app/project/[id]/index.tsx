import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'

// Lazy-load tab screens
import FilesTab from '@/components/project/FilesTab'
import TerminalTab from '@/components/project/TerminalTab'
import PreviewTab from '@/components/project/PreviewTab'

const TABS = [
  { id: 'Files', icon: 'folder-outline', activeIcon: 'folder' },
  { id: 'Terminal', icon: 'terminal-outline', activeIcon: 'terminal' },
  { id: 'Preview', icon: 'globe-outline', activeIcon: 'globe' },
] as const

type Tab = typeof TABS[number]['id']

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Terminal')

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
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Waking up container...</Text>
      </View>
    )
  }

  if (!project) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>{project.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: project.status === 'ready' ? '#22c55e' : '#f59e0b' },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{project.container_status || project.status}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchProject} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={isActive ? tab.activeIcon : tab.icon} 
                size={20} 
                color={isActive ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textSecondary }, isActive && styles.tabTextActive]}>
                {tab.id}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {activeTab === 'Files' && <FilesTab projectId={project.id} />}
        {activeTab === 'Terminal' && <TerminalTab projectId={project.id} />}
        {activeTab === 'Preview' && <PreviewTab projectId={project.id} port={project.port || 3000} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 18, fontWeight: '800' },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  backBtnText: { fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  headerBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerInfo: { flex: 1 },
  projectName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
  content: { flex: 1 },
})

