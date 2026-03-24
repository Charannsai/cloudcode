import { useEffect, useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { FileNode } from '@/types'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  FileText, 
  Code, 
  Hash, 
  Settings, 
  FileJson, 
  FileCode,
  Search
} from 'lucide-react-native'

interface Props {
  projectId: string
  isActive: boolean
}

function FileRow({ node, depth, onFilePress }: {
  node: FileNode
  depth: number
  onFilePress: (path: string) => void
}) {
  const { colors } = useAppTheme()
  const [expanded, setExpanded] = useState(depth < 1)
  const isDir = node.type === 'directory'
  
  const iconInfo = useMemo(() => {
    if (isDir) {
      return { 
        icon: expanded ? Folder : Folder, 
        color: '#60a5fa',
        size: 18 
      }
    }
    const ext = node.name.split('.').pop()?.toLowerCase()
    switch(ext) {
      case 'js': case 'jsx': return { icon: FileCode, color: '#eab308' };
      case 'ts': case 'tsx': return { icon: FileCode, color: '#3b82f6' };
      case 'html': return { icon: Code, color: '#f97316' };
      case 'css': return { icon: Hash, color: '#3b82f6' };
      case 'json': return { icon: FileJson, color: '#a855f7' };
      case 'md': return { icon: FileText, color: '#94a3b8' };
      case 'env': return { icon: Settings, color: '#facc15' };
      default: return { icon: File, color: colors.textSecondary };
    }
  }, [node.name, isDir, expanded, colors.textSecondary])

  const IconComponent = iconInfo.icon

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.fileRow, 
          { paddingLeft: 12 + depth * 16 }
        ]}
        onPress={() => {
          if (isDir) setExpanded((e) => !e)
          else onFilePress(node.path)
        }}
        activeOpacity={0.4}
      >
        <View style={styles.chevronContainer}>
          {isDir ? (
            expanded ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />
          ) : null}
        </View>
        <IconComponent 
          size={18} 
          color={iconInfo.color} 
          strokeWidth={2}
        />
        <Text style={[
          styles.fileName, 
          { color: colors.text, fontFamily: 'Inter_500Medium' },
          isDir && styles.dirName
        ]} numberOfLines={1}>
          {node.name}
        </Text>
        {!isDir && node.size != null && (
          <Text style={[styles.fileSize, { color: colors.textSecondary + '60' }]}>{formatSize(node.size)}</Text>
        )}
      </TouchableOpacity>

      {isDir && expanded && node.children?.map((child) => (
        <FileRow key={child.path} node={child} depth={depth + 1} onFilePress={onFilePress} />
      ))}
    </View>
  )
}

export default function FilesTab({ projectId, isActive }: Props) {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [files, setFiles] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isActive) {
      fetchFiles(files.length > 0)
    }
  }, [projectId, isActive])

  async function fetchFiles(isBackground = false) {
    if (!isBackground) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const tree = await api.files.list(projectId)
      setFiles(tree)
    } catch (err) {
      if (!isBackground) setError((err as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading && files.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} size="small" />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Indexing environment...</Text>
      </View>
    )
  }

  if (error && files.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity onPress={() => fetchFiles(false)} style={[styles.retryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.retryText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.toolbarLeft}>
          <Text style={[styles.toolbarTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>EXPLORER</Text>
          <Text style={[styles.projectBadge, { color: colors.textSecondary, backgroundColor: colors.background, borderColor: colors.border }]}>SRC</Text>
        </View>
        <TouchableOpacity onPress={() => fetchFiles(true)} activeOpacity={0.7} style={styles.refreshBtn}>
          {refreshing ? (
            <ActivityIndicator size={14} color={colors.textSecondary} />
          ) : (
            <RefreshCw size={14} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {files.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Empty Workspace</Text>
          </View>
        ) : (
          files.map((node) => (
            <FileRow
              key={node.path}
              node={node}
              depth={0}
              onFilePress={(path) =>
                router.push({ pathname: '/project/[id]/editor', params: { id: projectId, path } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarTitle: { 
    fontSize: 10, 
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  projectBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  refreshBtn: {
    padding: 4,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13, opacity: 0.8 },
  errorText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 13, opacity: 0.6 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: { fontSize: 13 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
    gap: 8,
  },
  chevronContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { flex: 1, fontSize: 14 },
  dirName: { opacity: 0.9 },
  fileSize: { fontSize: 10, fontFamily: 'JetBrainsMono_400Regular' },
})

