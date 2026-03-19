import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ChevronLeft, RefreshCw, Folder, Terminal, Globe } from 'lucide-react-native'

// Lazy-load tab screens
import FilesTab from '@/components/project/FilesTab'
import TerminalTab from '@/components/project/TerminalTab'
import PreviewTab from '@/components/project/PreviewTab'

const TABS = [
  { id: 'Terminal', icon: Terminal },
  { id: 'Files', icon: Folder },
  { id: 'Preview', icon: Globe },
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
        <ActivityIndicator color={colors.text} size="small" />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Resuming environment...</Text>
      </View>
    )
  }

  if (!project) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_700Bold' }]}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Text style={[styles.backBtnText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Go Back</Text>
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
          style={[styles.headerBtn, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: project.status === 'ready' ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {project.container_status || project.status}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={fetchProject} 
          style={[styles.headerBtn, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color={project.status === 'ready' ? colors.success : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Bar - Like the image */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab, 
                  isActive && { backgroundColor: isDark ? colors.background : '#f3f4f6' }
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Icon 
                  size={16} 
                  color={isActive ? colors.text : colors.textSecondary} 
                  strokeWidth={2.5}
                />
                <Text style={[
                  styles.tabText, 
                  { color: isActive ? colors.text : colors.textSecondary, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold' }
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
          <FilesTab projectId={project.id} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Terminal' ? 'flex' : 'none' }}>
          <TerminalTab projectId={project.id} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Preview' ? 'flex' : 'none' }}>
          <PreviewTab projectId={project.id} port={project.port || 3000} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 16 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  backBtnText: { fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  projectName: { 
    fontSize: 20, 
    letterSpacing: -0.8,
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 2,
    opacity: 0.8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { 
    fontSize: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: { fontSize: 13 },
  content: { flex: 1 },
})

