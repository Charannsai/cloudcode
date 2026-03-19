import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { FileNode } from '@/types'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  projectId: string
}

function FileRow({ node, depth, onFilePress }: {
  node: FileNode
  depth: number
  onFilePress: (path: string) => void
}) {
  const { colors } = useAppTheme()
  const [expanded, setExpanded] = useState(depth < 2)
  const isDir = node.type === 'directory'

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.fileRow, 
          { paddingLeft: 16 + depth * 18 }
        ]}
        onPress={() => {
          if (isDir) setExpanded((e) => !e)
          else onFilePress(node.path)
        }}
        activeOpacity={0.6}
      >
        <Ionicons 
          name={isDir ? (expanded ? 'folder-open' : 'folder') : getIconInfo(node.name).icon} 
          size={18} 
          color={isDir ? '#d1a8ff' : getIconInfo(node.name).color} 
        />
        <Text style={[
          styles.fileName, 
          { color: isDir ? colors.text : colors.textSecondary + 'ee' },
          isDir && styles.dirName
        ]} numberOfLines={1}>
          {node.name}
        </Text>
        {isDir && (
          <Ionicons 
            name={expanded ? "chevron-down" : "chevron-forward"} 
            size={12} 
            color={colors.textSecondary + '40'} 
          />
        )}
        {!isDir && node.size != null && (
          <Text style={[styles.fileSize, { color: colors.textSecondary + '30' }]}>{formatSize(node.size)}</Text>
        )}
      </TouchableOpacity>

      {isDir && expanded && node.children?.map((child) => (
        <FileRow key={child.path} node={child} depth={depth + 1} onFilePress={onFilePress} />
      ))}
    </View>
  )
}

function getIconInfo(name: string): { icon: any, color: string } {
  const ext = name.split('.').pop()?.toLowerCase();
  switch(ext) {
    case 'js': case 'jsx': return { icon: 'logo-javascript', color: '#f7df1e' };
    case 'ts': case 'tsx': return { icon: 'document-text', color: '#3178c6' };
    case 'html': return { icon: 'logo-html5', color: '#e34f26' };
    case 'css': return { icon: 'logo-css3', color: '#1572b6' };
    case 'json': return { icon: 'settings', color: '#cbcb41' };
    case 'md': return { icon: 'document-text-outline', color: '#00add8' };
    case 'env': return { icon: 'key', color: '#ffcc00' };
    default: return { icon: 'document-outline', color: '#888' };
  }
}

export default function FilesTab({ projectId }: Props) {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [files, setFiles] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [projectId])

  async function fetchFiles() {
    setLoading(true)
    setError(null)
    try {
      const tree = await api.files.list(projectId)
      setFiles(tree)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Indexing files...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity onPress={fetchFiles} style={[styles.retryBtn, { backgroundColor: colors.card }]}>
          <Text style={[styles.retryText, { color: colors.primary }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.toolbarTitle, { color: colors.textSecondary }]}>FILE EXPLORER</Text>
        <TouchableOpacity onPress={fetchFiles} style={[styles.refreshBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="refresh" size={14} color={colors.primary} />
          <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {files.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Project is empty</Text>
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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  refreshText: { fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: { fontWeight: '700' },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  fileName: { flex: 1, fontSize: 15, fontWeight: '500' },
  dirName: { fontWeight: '700' },
  fileSize: { fontSize: 10, fontWeight: '600' },
})

