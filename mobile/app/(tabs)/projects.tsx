import { useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProjectsStore } from '@/store/projects'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { Ionicons } from '@expo/vector-icons'

const STATUS_COLOR: Record<string, string> = {
  ready: '#22c55e',
  running: '#3b82f6',
  creating: '#f59e0b',
  stopped: '#6b7280',
  error: '#ef4444',
}

function ProjectCard({ project, onPress, onDelete, colors }: {
  project: Project
  onPress: () => void
  onDelete: () => void
  colors: any
}) {
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            <Text style={styles.cardIcon}>
              {project.type === 'react' ? '⚛️' : project.type === 'node' ? '🟢' : '📄'}
            </Text>
          </View>
          <View style={styles.cardNameCol}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{project.name}</Text>
            <Text style={[styles.cardType, { color: colors.textSecondary }]}>{project.type.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[project.status] || '#6b7280') + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[project.status] || '#6b7280' }]} />
          <Text style={[styles.statusText, { color: STATUS_COLOR[project.status] || '#6b7280' }]}>{project.status}</Text>
        </View>
        {project.github_url && (
          <Text style={[styles.githubUrl, { color: colors.textSecondary }]} numberOfLines={1}>
            <Ionicons name="logo-github" size={12} /> {project.github_url.split('/').pop()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ProjectsScreen() {
  const router = useRouter()
  const { projects, loading, error, fetchProjects, removeProject } = useProjectsStore()
  const { user } = useAuthStore()
  const { colors } = useAppTheme()

  useEffect(() => {
    if (user) fetchProjects()
  }, [user, fetchProjects])

  const handleDelete = useCallback((project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.projects.delete(project.id)
              removeProject(project.id)
            } catch (err) {
              Alert.alert('Error', (err as Error).message)
            }
          },
        },
      ]
    )
  }, [removeProject])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Your Projects</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{projects.length} workspace{projects.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/import')}
          >
            <Ionicons name="cloud-download-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/new-project')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>⚠️ {error}</Text>
        </View>
      )}

      {loading && projects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Waking up containers...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.card }]}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Create a new project or import from GitHub to get started.</Text>
          <TouchableOpacity 
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]} 
            onPress={() => router.push('/new-project')}
          >
            <Text style={styles.emptyBtnText}>Create your first project</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              colors={colors}
              onPress={() => router.push(`/project/${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchProjects}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 20,
  },
  greeting: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sub: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  errorBanner: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 15, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32, opacity: 0.8 },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  list: { padding: 24, gap: 16 },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 24 },
  cardNameCol: { flex: 1, gap: 2 },
  cardName: { fontSize: 19, fontWeight: '800' },
  cardType: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  githubUrl: { fontSize: 13, fontWeight: '500', opacity: 0.6 },
})

