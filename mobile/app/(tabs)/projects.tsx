import { useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProjectsStore } from '@/store/projects'
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

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Workspace', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.projects.delete(id)
            removeProject(id)
          } catch (err) {
            Alert.alert('Failed', (err as Error).message)
          }
        }
      },
    ])
  }, [removeProject])

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Workspaces</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {projects.length} active {projects.length === 1 ? 'workspace' : 'workspaces'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.text }]}
          onPress={() => router.push('/new-project')}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.background} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? null : emptyState}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchProjects} tintColor={colors.text} />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, marginTop: 2, opacity: 0.6 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 24, paddingBottom: 140 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, letterSpacing: -0.2 },
  cardMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginTop: 3 
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  cardStatus: { fontSize: 11, textTransform: 'capitalize' },
  cardType: { fontSize: 11 },
  cardActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  deleteBtn: { padding: 4 },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, marginBottom: 6 },
  emptySub: { fontSize: 14, opacity: 0.6, textAlign: 'center', maxWidth: 240, marginBottom: 24 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14 },
})
