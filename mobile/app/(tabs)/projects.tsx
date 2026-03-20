import { useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
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
  Globe
} from 'lucide-react-native'

const STATUS_COLOR: Record<string, string> = {
  ready: '#10b981',
  provisioning: '#6366f1',
  error: '#ef4444',
}

const TYPE_ICON: Record<string, any> = {
  node: Terminal,
  react: Globe,
  empty: Cpu,
}

import { useScrollVisibility } from '@/hooks/useScrollVisibility'

export default function ProjectsScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const { projects, loading, fetchProjects, removeProject } = useProjectsStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('De-provision', `Confirm termination of workspace: ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Terminate', 
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

  const renderProject = ({ item: p }: { item: Project }) => {
    const Icon = TYPE_ICON[p.type] || Terminal
    const statusColor = STATUS_COLOR[p.status] || colors.textSecondary

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/project/${p.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
              <Icon size={18} color={colors.text} strokeWidth={2} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{p.name}</Text>
              <Text style={[styles.cardId, { color: colors.textSecondary }]}>{p.id.slice(0, 8)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDelete(p.id, p.name)} style={styles.deleteBtn}>
            <Trash2 size={16} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.stat}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{p.status.toUpperCase()}</Text>
          </View>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {p.type === 'node' ? 'Engine Instance' : p.type === 'react' ? 'Application Project' : 'Blank Workspace'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const emptyState = (
    <View style={styles.empty}>
      <Activity size={40} color={colors.textSecondary} strokeWidth={1} />
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>No Active Projects</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Initialize a workspace to begin development.</Text>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Projects</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{projects.length} active workspaces</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.text }]}
          onPress={() => router.push('/new-project')}
        >
          <Plus size={20} color={colors.background} strokeWidth={2.5} />
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
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, opacity: 0.6 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 24, paddingBottom: 160 },
  listActions: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  actionBtnText: { fontSize: 13 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16 },
  cardId: { fontSize: 11, fontFamily: 'JetBrainsMono_400Regular', opacity: 0.5, marginTop: 1 },
  deleteBtn: { padding: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 10, letterSpacing: 0.5, fontFamily: 'JetBrainsMono_500Medium' },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 6, opacity: 0.6, width: 200, textAlign: 'center' },
})
