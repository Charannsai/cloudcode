import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'

// We use a simple 3-tab layout (Files / Terminal / Preview) without native tab bar
const TABS = ['Files', 'Terminal', 'Preview'] as const
type Tab = typeof TABS[number]

// Lazy-load tab screens
import FilesTab from '@/components/project/FilesTab'
import TerminalTab from '@/components/project/TerminalTab'
import PreviewTab from '@/components/project/PreviewTab'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7c6bff" size="large" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    )
  }

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: project.status === 'ready' ? '#22c55e' : '#f59e0b' },
              ]}
            />
            <Text style={styles.statusText}>{project.container_status || project.status}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchProject} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Files' ? '📂' : tab === 'Terminal' ? '⚡' : '🌐'} {tab}
            </Text>
          </TouchableOpacity>
        ))}
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
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#5a5a7a', fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 17, fontWeight: '600' },
  backBtn: {
    backgroundColor: '#1e1e30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  backBtnText: { color: '#7c6bff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
    gap: 12,
  },
  headerBackBtn: {
    width: 36, height: 36,
    backgroundColor: '#1e1e30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackText: { color: '#8a8a9a', fontSize: 20, fontWeight: '700' },
  headerInfo: { flex: 1 },
  projectName: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#5a5a7a', fontSize: 12, textTransform: 'capitalize' },
  refreshBtn: {
    width: 36, height: 36,
    backgroundColor: '#1e1e30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { color: '#7c6bff', fontSize: 18, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7c6bff',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4a4a6a' },
  tabTextActive: { color: '#7c6bff' },
  content: { flex: 1 },
})
