import { useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProjectsStore } from '@/store/projects'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Project } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  ready: '#22c55e',
  running: '#3b82f6',
  creating: '#f59e0b',
  stopped: '#6b7280',
  error: '#ef4444',
}

function ProjectCard({ project, onPress, onDelete }: {
  project: Project
  onPress: () => void
  onDelete: () => void
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardIcon}>
            {project.type === 'react' ? '⚛️' : project.type === 'node' ? '🟢' : '📄'}
          </Text>
          <Text style={styles.cardName} numberOfLines={1}>{project.name}</Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[project.status] || '#6b7280' }]} />
          <Text style={styles.statusText}>{project.status}</Text>
        </View>
        <Text style={styles.typeTag}>{project.type}</Text>
      </View>

      {project.github_url && (
        <Text style={styles.githubUrl} numberOfLines={1}>🐙 {project.github_url}</Text>
      )}
    </TouchableOpacity>
  )
}

export default function ProjectsScreen() {
  const router = useRouter()
  const { projects, loading, error, fetchProjects, removeProject } = useProjectsStore()
  const { user } = useAuthStore()

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Your Projects</Text>
          <Text style={styles.sub}>{projects.length} project{projects.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => router.push('/import')}
          >
            <Text style={styles.importBtnText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/new-project')}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {loading && projects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#7c6bff" size="large" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptyText}>Create a new project or import from GitHub to get started.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/new-project')}>
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
              onPress={() => router.push(`/project/${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchProjects}
              tintColor="#7c6bff"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
  },
  greeting: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  sub: { fontSize: 13, color: '#5a5a7a', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  importBtn: {
    backgroundColor: '#1e1e30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  importBtnText: { color: '#9090b0', fontWeight: '600', fontSize: 14 },
  newBtn: {
    backgroundColor: '#7c6bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorBanner: {
    backgroundColor: '#ef444420',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  errorText: { color: '#ef4444', fontSize: 14 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#5a5a7a', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#5a5a7a', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#7c6bff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#0e0e1a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ffffff0d',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardIcon: { fontSize: 22 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#ffffff', flex: 1 },
  deleteIcon: { fontSize: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#8a8a9a', fontSize: 13, textTransform: 'capitalize' },
  typeTag: {
    backgroundColor: '#1e1e30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    color: '#7c6bff',
    fontSize: 12,
    fontWeight: '600',
  },
  githubUrl: { color: '#4a4a6a', fontSize: 12, marginTop: 8 },
})
