import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { FileNode } from '@/types'

interface Props {
  projectId: string
}

function FileRow({ node, depth, onFilePress }: {
  node: FileNode
  depth: number
  onFilePress: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)

  return (
    <View>
      <TouchableOpacity
        style={[styles.fileRow, { paddingLeft: 16 + depth * 16 }]}
        onPress={() => {
          if (node.type === 'directory') setExpanded((e) => !e)
          else onFilePress(node.path)
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.fileIcon}>
          {node.type === 'directory' ? (expanded ? '📂' : '📁') : getFileIcon(node.name)}
        </Text>
        <Text style={[styles.fileName, node.type === 'directory' && styles.dirName]}>
          {node.name}
        </Text>
        {node.size != null && (
          <Text style={styles.fileSize}>{formatSize(node.size)}</Text>
        )}
      </TouchableOpacity>

      {node.type === 'directory' && expanded && node.children?.map((child) => (
        <FileRow key={child.path} node={child} depth={depth + 1} onFilePress={onFilePress} />
      ))}
    </View>
  )
}

export default function FilesTab({ projectId }: Props) {
  const router = useRouter()
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
        <ActivityIndicator color="#7c6bff" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={fetchFiles} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>File Explorer</Text>
        <TouchableOpacity onPress={fetchFiles} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {files.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No files yet</Text>
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

function getFileIcon(name: string): string {
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟡'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return '🔷'
  if (name.endsWith('.json')) return '📋'
  if (name.endsWith('.md')) return '📝'
  if (name.endsWith('.css')) return '🎨'
  if (name.endsWith('.html')) return '🌐'
  if (name.endsWith('.env')) return '🔒'
  if (name === 'package.json') return '📦'
  return '📄'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  toolbarTitle: { color: '#5a5a7a', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  refreshBtn: {
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshText: { color: '#7c6bff', fontSize: 12, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingText: { color: '#4a4a6a', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14 },
  emptyText: { color: '#3a3a5a', fontSize: 14 },
  retryBtn: {
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: { color: '#7c6bff', fontWeight: '600' },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff05',
    gap: 10,
  },
  fileIcon: { fontSize: 16 },
  fileName: { flex: 1, color: '#b0b0c0', fontSize: 14 },
  dirName: { color: '#d0d0e0', fontWeight: '600' },
  fileSize: { color: '#3a3a5a', fontSize: 11 },
})
