import { useEffect, useCallback, useMemo } from 'react'
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
import { 
  Plus, 
  Github, 
  Trash2, 
  FolderOpen, 
  Download, 
  Box, 
  Code2, 
  Terminal,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react-native'

const STATUS_COLOR: Record<string, string> = {
  ready: '#10b981',
  running: '#3b82f6',
  creating: '#f59e0b',
  stopped: '#71717a',
  error: '#ef4444',
}

function ProjectCard({ project, onPress, onDelete, colors }: {
  project: Project
  onPress: () => void
  onDelete: () => void
  colors: any
}) {
  const Icon = useMemo(() => {
    switch(project.type) {
      case 'react': return Code2;
      case 'node': return Terminal;
      default: return Box;
    }
  }, [project.type]);

  const statusColor = STATUS_COLOR[project.status] || '#71717a';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          <Icon size={20} color={colors.text} strokeWidth={2.5} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={[styles.cardType, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {project.type.toUpperCase()} • {project.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.moreBtn}
          activeOpacity={0.6}
        >
          <Trash2 size={16} color={colors.textSecondary} opacity={0.5} />
        </TouchableOpacity>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
          {project.github_url ? (
            <View style={styles.githubRow}>
              <Github size={12} color={colors.textSecondary} />
              <Text style={[styles.githubUrl, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_500Medium' }]} numberOfLines={1}>
                {project.github_url.split('/').pop()}
              </Text>
            </View>
          ) : (
            <Text style={[styles.githubUrl, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_500Medium' }]}>Local Workspace</Text>
          )}
        </View>
        <ChevronRight size={14} color={colors.textSecondary} opacity={0.3} />
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
      'Archive Workspace',
      `Delete "${project.name}" and prune its container?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text, fontFamily: 'Inter_900Black' }]}>Workspaces</Text>
          <View style={styles.nodeCount}>
            <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: 'Inter_700Bold' }]}>
              {projects.length} ACTIVE NODE{projects.length !== 1 ? 'S' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/import')}
            activeOpacity={0.7}
          >
            <Download size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.text }]}
            onPress={() => router.push('/new-project')}
            activeOpacity={0.9}
          >
            <Plus size={24} color={colors.card} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorBackground, borderColor: colors.error + '20' }]}>
          <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter_600SemiBold' }]}>Sync Error: {error}</Text>
        </View>
      )}

      {loading && projects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Syncing cloud nodes...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FolderOpen size={40} color={colors.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>No Workspaces</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Your ephemeral containers and cloud environments will appear here.
          </Text>
          <TouchableOpacity 
            style={[styles.emptyBtn, { backgroundColor: colors.text }]} 
            onPress={() => router.push('/new-project')}
            activeOpacity={0.9}
          >
            <Text style={[styles.emptyBtnText, { color: colors.card, fontFamily: 'Inter_700Bold' }]}>Create Workspace</Text>
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
              tintColor={colors.text}
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
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 24,
  },
  greeting: { 
    fontSize: 28, 
    letterSpacing: -1.5,
  },
  nodeCount: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#10b98115',
    alignSelf: 'flex-start',
  },
  sub: { 
    fontSize: 9, 
    letterSpacing: 1,
    color: '#10b981',
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  newBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
  },
  emptyTitle: { fontSize: 22, marginBottom: 8, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyBtn: {
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  emptyBtnText: { fontSize: 16 },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 12 },
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 18 
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 18, letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  cardType: { fontSize: 9, letterSpacing: 1, opacity: 0.8 },
  moreBtn: {
    padding: 10,
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 18,
    borderTopWidth: 1.5,
  },
  footerLeft: { flex: 1 },
  githubRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  githubUrl: { fontSize: 12, opacity: 0.6 },
})

