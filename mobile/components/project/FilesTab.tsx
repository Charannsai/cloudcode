import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Plus,
  File, Search, MoreVertical, RefreshCw, FilePlus, FolderPlus, Trash2,
} from 'lucide-react-native'
import { ConfirmModal } from '@/components/ConfirmModal'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileItem[]
}

interface Props {
  projectId: string
  isActive: boolean
}

const FILE_ICON_COLORS: Record<string, string> = {
  ts: '#3178C6',
  tsx: '#3178C6',
  js: '#F0DB4F',
  jsx: '#F0DB4F',
  json: '#8BC34A',
  md: '#58A6FF',
  css: '#563D7C',
  html: '#E34F26',
  yml: '#CB171E',
  yaml: '#CB171E',
  env: '#ECD53F',
  py: '#3572A5',
  go: '#00ADD8',
  rs: '#CE422B',
  rb: '#CC342D',
}

function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICON_COLORS[ext] || '#8B929A'
}

const FileTreeItem = memo(function FileTreeItem({
  item, depth, projectId, onRefresh, colors, isDark, router, onOptionsRequest
}: {
  item: FileItem; depth: number; projectId: string;
  onRefresh: () => void; colors: any; isDark: boolean; router: any; onOptionsRequest: (item: FileItem) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const isDir = item.type === 'directory'
  const iconColor = isDir ? (isDark ? '#E6EDF3' : '#656D76') : getFileColor(item.name)

  const handlePress = () => {
    if (isDir) {
      setExpanded(!expanded)
    } else {
      router.push({
        pathname: `/project/${projectId}/editor`,
        params: { path: item.path, name: item.name }
      })
    }
  }

  const handleLongPress = () => {
    onOptionsRequest(item)
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.treeItem, { paddingLeft: 12 + depth * 16 }]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.6}
      >
        {isDir && (
          expanded
            ? <ChevronDown size={12} color={colors.textSecondary} strokeWidth={1.8} />
            : <ChevronRight size={12} color={colors.textSecondary} strokeWidth={1.8} />
        )}
        {isDir ? (
          expanded
            ? <FolderOpen size={14} color={iconColor} strokeWidth={1.5} />
            : <Folder size={14} color={iconColor} strokeWidth={1.5} />
        ) : (
          <View style={styles.fileIconWrapper}>
            <FileText size={14} color={iconColor} strokeWidth={1.5} />
          </View>
        )}
        <Text
          style={[
            styles.fileName,
            {
              color: isDir ? colors.text : colors.textSecondary,
              fontFamily: isDir ? 'Inter_500Medium' : 'JetBrainsMono_400Regular',
            }
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
      {isDir && expanded && item.children?.map((child) => (
        <FileTreeItem
          key={child.path}
          item={child}
          depth={depth + 1}
          projectId={projectId}
          onRefresh={onRefresh}
          colors={colors}
          isDark={isDark}
          router={router}
          onOptionsRequest={onOptionsRequest}
        />
      ))}
    </View>
  )
})

export default function FilesTab({ projectId, isActive }: Props) {
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Options Menu and Custom Modal creation states
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [createModal, setCreateModal] = useState<{
    visible: boolean
    parentPath: string
    type: 'file' | 'directory'
    name: string
  }>({
    visible: false,
    parentPath: '',
    type: 'file',
    name: '',
  })

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.files.list(projectId)
      setFiles(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    setIsDeleting(true)
    try {
      await api.files.delete(projectId, fileToDelete.path)
      fetchFiles()
      setFileToDelete(null)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (isActive) fetchFiles()
  }, [isActive, fetchFiles])

  useFocusEffect(
    useCallback(() => {
      if (isActive) fetchFiles()
    }, [isActive, fetchFiles])
  )

  const filterTree = useCallback((items: FileItem[], query: string): FileItem[] => {
    if (!query.trim()) return items
    const lower = query.toLowerCase()
    return items.reduce<FileItem[]>((acc, item) => {
      if (item.name.toLowerCase().includes(lower)) {
        acc.push(item)
      } else if (item.type === 'directory' && item.children) {
        const filtered = filterTree(item.children, query)
        if (filtered.length > 0) {
          acc.push({ ...item, children: filtered })
        }
      }
      return acc
    }, [])
  }, [])

  const filtered = useMemo(() => filterTree(files, searchQuery), [files, searchQuery, filterTree])

  const handleOptionsRequest = (item: FileItem) => {
    setSelectedItem(item)
    setShowOptionsModal(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={[styles.toolBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <Search size={13} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={fetchFiles}
          style={[styles.toolBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <RefreshCw size={13} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCreateModal({
              visible: true,
              parentPath: '',
              type: 'file',
              name: '',
            })
          }}
          style={[styles.toolBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <FilePlus size={13} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCreateModal({
              visible: true,
              parentPath: '',
              type: 'directory',
              name: '',
            })
          }}
          style={[styles.toolBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <FolderPlus size={13} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
          <Search size={13} color={colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files..."
            placeholderTextColor={colors.textSecondary + '50'}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.textSecondary} size="small" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.treeContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {searchQuery ? 'No matching files' : 'No files yet'}
            </Text>
          ) : (
            filtered.map((f) => (
              <FileTreeItem
                key={f.path}
                item={f}
                depth={0}
                projectId={projectId}
                onRefresh={fetchFiles}
                colors={colors}
                isDark={isDark}
                router={router}
                onOptionsRequest={handleOptionsRequest}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Creation Dialog Modal */}
      <Modal
        visible={createModal.visible}
        transparent
        animationType="none"
        onRequestClose={() => setCreateModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.promptOverlay}>
          <View style={[styles.promptContent, { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: colors.border }]}>
            <Text style={[styles.promptTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {createModal.type === 'file' ? 'New File' : 'New Folder'}
            </Text>
            
            <View style={styles.promptForm}>
              <Text style={[styles.promptLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Parent Directory: {createModal.parentPath ? `/${createModal.parentPath}` : 'Root (/)'}
              </Text>
              
              <TextInput
                style={[styles.promptInput, { color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                placeholder={createModal.type === 'file' ? "filename.txt" : "folder_name"}
                placeholderTextColor={colors.textSecondary + '60'}
                value={createModal.name}
                onChangeText={(text) => setCreateModal(prev => ({ ...prev, name: text }))}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={[styles.promptActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.promptBtn}
                onPress={() => setCreateModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.promptBtn}
                onPress={async () => {
                  const name = createModal.name.trim()
                  if (!name) return
                  
                  const targetPath = createModal.parentPath 
                    ? `${createModal.parentPath}/${name}` 
                    : name
                  
                  try {
                    await api.files.create(projectId, targetPath, createModal.type)
                    fetchFiles()
                    setCreateModal(prev => ({ ...prev, visible: false }))
                  } catch (err: any) {
                    Alert.alert('Error', err.message)
                  }
                }}
              >
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Dropdown Menu Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.promptOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowOptionsModal(false)} />
          <View style={[styles.optionsContent, { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: colors.border }]}>
            <Text style={[styles.optionsTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
              {selectedItem?.name}
            </Text>
            
            <View style={styles.optionsList}>
              {selectedItem?.type === 'directory' && (
                <>
                  <TouchableOpacity
                    style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => {
                      setShowOptionsModal(false)
                      setCreateModal({
                        visible: true,
                        parentPath: selectedItem.path,
                        type: 'file',
                        name: '',
                      })
                    }}
                  >
                    <FilePlus size={16} color={colors.text} style={{ marginRight: 10 }} />
                    <Text style={[styles.optionText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>New File inside</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => {
                      setShowOptionsModal(false)
                      setCreateModal({
                        visible: true,
                        parentPath: selectedItem.path,
                        type: 'directory',
                        name: '',
                      })
                    }}
                  >
                    <FolderPlus size={16} color={colors.text} style={{ marginRight: 10 }} />
                    <Text style={[styles.optionText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>New Folder inside</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsModal(false)
                  setFileToDelete(selectedItem)
                }}
              >
                <Trash2 size={16} color="#F85149" style={{ marginRight: 10 }} />
                <Text style={[styles.optionText, { color: '#F85149', fontFamily: 'Inter_600SemiBold' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!fileToDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteFile}
        onCancel={() => setFileToDelete(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  toolBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  treeContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingRight: 14,
    gap: 6,
  },
  fileIconWrapper: {
    marginLeft: 12 + 4,
  },
  fileName: { 
    fontSize: 13,
    flex: 1,
  },
  emptyText: { 
    textAlign: 'center', 
    paddingTop: 40, 
    fontSize: 13, 
    opacity: 0.5 
  },
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  promptContent: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  promptTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  promptForm: {
    gap: 8,
  },
  promptLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  promptInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  promptActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  promptBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: 1,
    height: '100%',
  },
  optionsContent: {
    width: '100%',
    maxWidth: 260,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionsTitle: {
    fontSize: 14,
    padding: 14,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    opacity: 0.8,
  },
  optionsList: {
    width: '100%',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 13,
  },
})
