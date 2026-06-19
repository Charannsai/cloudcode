import { useEffect, useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ScrollView,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useProjectsStore } from '@/store/projects'
import { useAIStore } from '@/store/ai'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import { Project } from '@/types'
import {
  Plus,
  Trash2,
  Terminal,
  Activity,
  Cpu,
  Globe,
  GitBranch,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import Animated, { FadeInDown } from 'react-native-reanimated'

const STATUS_COLOR: Record<string, string> = {
  ready: '#3FB950',
  provisioning: '#D2A8FF',
  error: '#F85149',
}

const TYPE_ICON: Record<string, any> = {
  node: Terminal,
  react: Globe,
  empty: Cpu,
}

export default function ProjectsScreen() {
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const { projects, loading, fetchProjects, removeProject } = useProjectsStore()

  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    let t: any
    if (loading) {
      t = setTimeout(() => {
        setShowSkeleton(true)
      }, 150)
    } else {
      setShowSkeleton(false)
    }
    return () => clearTimeout(t)
  }, [loading])

  const showSkeletonState = showSkeleton && projects.length === 0

  const ProjectSkeleton = () => (
    <View style={[styles.card, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, opacity: 0.6 }]}>
      <View style={styles.cardMain}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#1C2128' : '#F3F4F6', width: 36, height: 36, borderRadius: 10 }]} />
        <View style={styles.cardInfo}>
          <View style={{ backgroundColor: isDark ? '#1C2128' : '#E5E7EB', height: 14, width: '60%', borderRadius: 4 }} />
          <View style={[styles.cardMeta, { marginTop: 8 }]}>
            <View style={{ backgroundColor: isDark ? '#1C2128' : '#E5E7EB', height: 10, width: '30%', borderRadius: 4 }} />
          </View>
        </View>
        <ChevronRight size={16} color={colors.border} strokeWidth={1.5} />
      </View>
    </View>
  )

  useEffect(() => {
    fetchProjects(false)
  }, [fetchProjects])

  // Keep workspaces list updated on screen focus and poll silently every 10s
  useFocusEffect(
    useCallback(() => {
      fetchProjects(true)

      const interval = setInterval(() => {
        fetchProjects(true)
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }, [fetchProjects])
  )

  const handleDelete = useCallback((id: string, name: string) => {
    setProjectToDelete({ id, name })
  }, [])

  const confirmDelete = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    try {
      await api.projects.delete(projectToDelete.id)
      removeProject(projectToDelete.id)
      setProjectToDelete(null)
    } catch (err) {
      Alert.alert('Failed', (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderProject = ({ item: p, index }: { item: Project; index: number }) => {
    const Icon = TYPE_ICON[p.type] || Terminal
    const statusColor = STATUS_COLOR[p.status] || colors.textSecondary

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}
          onPress={() => router.push(`/project/${p.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardMain}>
            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
              <Icon size={16} color={colors.text} strokeWidth={1.8} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{p.name}</Text>
              <View style={styles.cardMeta}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.cardStatus, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                  {p.status}
                </Text>
                <Text style={[styles.cardType, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  · {p.type === 'node' ? 'Node.js' : p.type === 'react' ? 'React' : 'Blank'}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                onPress={() => handleDelete(p.id, p.name)} 
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={14} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
              <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const emptyState = (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C2128' : '#F3F4F6', borderColor: colors.border }]}>
        <Activity size={28} color={colors.textSecondary} strokeWidth={1.2} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>No Workspaces</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        Create your first workspace to start building.
      </Text>
      <TouchableOpacity 
        style={[styles.emptyBtn, { backgroundColor: colors.text }]}
        onPress={() => router.push('/new-project')}
        activeOpacity={0.8}
      >
        <Plus size={16} color={colors.background} strokeWidth={2.5} />
        <Text style={[styles.emptyBtnText, { color: colors.background, fontFamily: 'Inter_600SemiBold' }]}>New Workspace</Text>
      </TouchableOpacity>
    </View>
  )

  const QuickActionsWidget = () => {
    const handleAskAIToBuild = () => {
      useAIStore.setState({ pendingPrompt: "Help me design and build a new workspace application..." })
      router.push('/(tabs)/ai')
    }

    const handleOpenWorkspace = () => {
      if (projects.length > 0) {
        router.push(`/project/${projects[0].id}`)
      } else {
        Alert.alert("No Workspaces", "Please create a workspace first.")
      }
    }

    const activeColor = isDark ? '#D2A8FF' : '#8250DF'

    return (
      <View style={{ marginTop: 24, paddingBottom: 60 }}>
        {/* Section Header */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick Actions
          </Text>
        </View>

        {/* CTA 1: Create New Workspace */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/new-project')}
          style={[styles.card, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, padding: 12 }]}
        >
          <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isDark ? '#1C2128' : '#F6F8FA', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={14} color={activeColor} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.text }}>Create New Workspace</Text>
            <Text style={{ fontSize: 10.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 }}>Initialize a blank container or clone from repository template.</Text>
          </View>
          <ChevronRight size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* CTA 2: Open Latest Workspace */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenWorkspace}
          style={[styles.card, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, padding: 12 }]}
        >
          <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isDark ? '#1C2128' : '#F6F8FA', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={14} color={activeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.text }}>Open Active Workspace</Text>
            <Text style={{ fontSize: 10.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 }}>Connect to your latest workspace terminal, file tree, and preview.</Text>
          </View>
          <ChevronRight size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* CTA 3: Ask AI to Build */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAskAIToBuild}
          style={[styles.card, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, padding: 12 }]}
        >
          <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: isDark ? '#1C2128' : '#F6F8FA', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color={activeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.text }}>Ask AI to Build</Text>
            <Text style={{ fontSize: 10.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 }}>Instruct the AI Assistant to provision and build a workspace application.</Text>
          </View>
          <ChevronRight size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Workspaces</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {projects.length} active {projects.length === 1 ? 'workspace' : 'workspaces'}
          </Text>
        </View>
      </View>

      {showSkeletonState ? (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <ProjectSkeleton />
          <ProjectSkeleton />
          <ProjectSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={loading ? null : emptyState}
          ListFooterComponent={projects.length > 0 ? <QuickActionsWidget /> : null}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchProjects} tintColor={colors.text} />
          }
        />
      )}

      <ConfirmModal
        visible={!!projectToDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${projectToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, letterSpacing: -0.6 },
  subtitle: { fontSize: 12, marginTop: 2, opacity: 0.6 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, letterSpacing: -0.1 },
  cardMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 2 
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  cardStatus: { fontSize: 10.5, textTransform: 'capitalize' },
  cardType: { fontSize: 10.5 },
  cardActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  deleteBtn: { padding: 4 },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, marginBottom: 4 },
  emptySub: { fontSize: 13, opacity: 0.6, textAlign: 'center', maxWidth: 220, marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyBtnText: { fontSize: 13 },
})
