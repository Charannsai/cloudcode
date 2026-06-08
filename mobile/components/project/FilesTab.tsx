import { useEffect, useState, useMemo, useCallback } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, 
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert 
} from 'react-native'
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
  FilePlus,
  FolderPlus,
  MoreVertical
} from 'lucide-react-native'

interface Props {
  projectId: string
  isActive: boolean
}

function FileRow({ node, depth, onFilePress, onFileLongPress }: {
  node: FileNode
  depth: number
  onFilePress: (path: string) => void
  onFileLongPress: (node: FileNode) => void
}) {
  const { colors } = useAppTheme()
  const [expanded, setExpanded] = useState(depth < 1)
  const isDir = node.type === 'directory'
  
  const iconInfo = useMemo(() => {
    if (isDir) {
      return { 
        icon: Folder, 
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
  }, [node.name, isDir, colors.textSecondary])

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
        onLongPress={() => onFileLongPress(node)}
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
        <TouchableOpacity 
          onPress={() => onFileLongPress(node)}
          style={styles.optionsBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreVertical size={14} color={colors.textSecondary} opacity={0.5} />
        </TouchableOpacity>
      </TouchableOpacity>

      {isDir && expanded && node.children?.map((child) => (
        <FileRow 
          key={child.path} 
          node={child} 
          depth={depth + 1} 
          onFilePress={onFilePress} 
          onFileLongPress={onFileLongPress}
        />
      ))}
    </View>
  )
}

export default function FilesTab({ projectId, isActive }: Props) {
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const [files, setFiles] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom Modal States for File Ops
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState<'create_file' | 'create_dir' | 'rename'>('create_file')
  const [modalTargetNode, setModalTargetNode] = useState<FileNode | null>(null)
  const [modalInputValue, setModalInputValue] = useState('')

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

  const handleCreate = async () => {
    if (!modalInputValue.trim()) return
    const name = modalInputValue.trim()
    let relPath = name
    if (modalTargetNode && modalTargetNode.type === 'directory') {
      relPath = `${modalTargetNode.path}/${name}`
    }

    try {
      const type = modalMode === 'create_dir' ? 'directory' : 'file'
      await api.files.create(projectId, relPath, type)
      setModalVisible(false)
      fetchFiles(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }

  const handleRename = async () => {
    if (!modalInputValue.trim() || !modalTargetNode) return
    const newName = modalInputValue.trim()
    const parts = modalTargetNode.path.split('/')
    parts[parts.length - 1] = newName
    const newPath = parts.join('/')

    try {
      await api.files.rename(projectId, modalTargetNode.path, newPath)
      setModalVisible(false)
      fetchFiles(true)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }

  const handleDelete = async (node: FileNode) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to permanently delete "${node.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.files.delete(projectId, node.path)
              fetchFiles(true)
            } catch (err) {
              Alert.alert('Error', (err as Error).message)
            }
          }
        }
      ]
    )
  }

  const openOptions = (node: FileNode) => {
    const isDir = node.type === 'directory'
    const options = [
      { text: 'Rename', onPress: () => {
          setModalTargetNode(node)
          setModalMode('rename')
          setModalInputValue(node.name)
          setModalVisible(true)
      }},
      { text: 'Delete', style: 'destructive' as const, onPress: () => handleDelete(node) }
    ]

    if (isDir) {
      options.unshift(
        { text: 'New File inside...', onPress: () => {
            setModalTargetNode(node)
            setModalMode('create_file')
            setModalInputValue('')
            setModalVisible(true)
        }},
        { text: 'New Folder inside...', onPress: () => {
            setModalTargetNode(node)
            setModalMode('create_dir')
            setModalInputValue('')
            setModalVisible(true)
        }}
      )
    }

    Alert.alert(
      node.name,
      node.type === 'directory' ? 'Directory Options' : 'File Options',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' }
      ]
    )
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
          <Text style={[styles.projectBadge, { color: colors.textSecondary, backgroundColor: colors.background, borderColor: colors.border }]}>WORKSPACE</Text>
        </View>
        <View style={styles.toolbarRight}>
          <TouchableOpacity 
            onPress={() => {
              setModalTargetNode(null)
              setModalMode('create_file')
              setModalInputValue('')
              setModalVisible(true)
            }}
            activeOpacity={0.7}
            style={styles.toolbarIconBtn}
          >
            <FilePlus size={15} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setModalTargetNode(null)
              setModalMode('create_dir')
              setModalInputValue('')
              setModalVisible(true)
            }}
            activeOpacity={0.7}
            style={styles.toolbarIconBtn}
          >
            <FolderPlus size={15} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fetchFiles(true)} activeOpacity={0.7} style={styles.toolbarIconBtn}>
            {refreshing ? (
              <ActivityIndicator size={14} color={colors.textSecondary} />
            ) : (
              <RefreshCw size={14} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
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
              onFileLongPress={openOptions}
            />
          ))
        )}
      </ScrollView>

      {/* File Ops Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                {modalMode === 'create_file' && 'New File'}
                {modalMode === 'create_dir' && 'New Folder'}
                {modalMode === 'rename' && 'Rename Item'}
              </Text>
              
              {modalTargetNode && modalMode !== 'rename' && (
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  In: /{modalTargetNode.path}
                </Text>
              )}

              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, fontFamily: 'Inter_500Medium' }]}
                value={modalInputValue}
                onChangeText={setModalInputValue}
                placeholder={modalMode === 'create_dir' ? "folder-name" : "file-name.js"}
                placeholderTextColor={colors.textSecondary + '60'}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={modalMode === 'rename' ? handleRename : handleCreate}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6' }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={modalMode === 'rename' ? handleRename : handleCreate}
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.modalBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  toolbarIconBtn: {
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
  optionsBtn: {
    padding: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
  },
  modalContent: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: -8,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
  },
})
