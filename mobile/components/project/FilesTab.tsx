import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Platform,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Plus,
  File, Search, MoreVertical, RefreshCw, FilePlus, FolderPlus, Trash2,
} from 'lucide-react-native'
import { ConfirmModal } from '@/components/ConfirmModal'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'

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

interface CreateDialogProps {
  visible: boolean
  parentPath: string
  type: 'file' | 'directory'
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

function CreateDialog({
  visible,
  parentPath,
  type,
  onClose,
  onCreate,
}: CreateDialogProps) {
  const { colors, isDark } = useAppTheme()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.98)
  const translateY = useSharedValue(8)
  const [renderModal, setRenderModal] = useState(visible)

  useEffect(() => {
    if (visible) {
      setName('')
      setRenderModal(true)
      opacity.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      scale.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      translateY.value = withTiming(0, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      opacity.value = withTiming(0, { duration: 60, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      })
      scale.value = withTiming(0.98, { duration: 60, easing: Easing.linear })
      translateY.value = withTiming(4, { duration: 60, easing: Easing.linear })
    }
  }, [visible])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }))

  if (!renderModal) return null

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsLoading(true)
    try {
      await onCreate(trimmed)
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = type === 'file' ? FilePlus : FolderPlus

  return (
    <Modal transparent visible={renderModal} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.promptOverlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 15 : 10}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.promptContent,
            {
              backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
              borderColor: colors.border,
            },
            modalStyle,
          ]}
        >
          <View style={styles.promptHeader}>
            <View style={styles.headerRow}>
              <Icon size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {type === 'file' ? 'New File' : 'New Folder'}
              </Text>
            </View>
            <View style={styles.promptForm}>
              <Text style={[styles.promptLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Parent: {parentPath ? `/${parentPath}` : 'Root (/)'}
              </Text>
              
              <TextInput
                style={[
                  styles.promptInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    fontFamily: 'Inter_400Regular'
                  }
                ]}
                placeholder={type === 'file' ? "filename.txt" : "folder_name"}
                placeholderTextColor={colors.textSecondary + '60'}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.cancelBtn,
                { 
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleCreate}
              activeOpacity={0.8}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.btnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

interface OptionsDialogProps {
  visible: boolean
  selectedItem: FileItem | null
  onClose: () => void
  onNewFile: () => void
  onNewFolder: () => void
  onDelete: () => void
}

function OptionsDialog({
  visible,
  selectedItem,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
}: OptionsDialogProps) {
  const { colors, isDark } = useAppTheme()
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.98)
  const translateY = useSharedValue(8)
  const [renderModal, setRenderModal] = useState(visible)

  useEffect(() => {
    if (visible) {
      setRenderModal(true)
      opacity.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      scale.value = withTiming(1, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      translateY.value = withTiming(0, { duration: 75, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      opacity.value = withTiming(0, { duration: 60, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      })
      scale.value = withTiming(0.98, { duration: 60, easing: Easing.linear })
      translateY.value = withTiming(4, { duration: 60, easing: Easing.linear })
    }
  }, [visible])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }))

  if (!renderModal || !selectedItem) return null

  const isDir = selectedItem.type === 'directory'
  const Icon = isDir ? Folder : File

  return (
    <Modal transparent visible={renderModal} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.promptOverlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 15 : 10}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.promptContent,
            {
              backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
              borderColor: colors.border,
            },
            modalStyle,
          ]}
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Icon size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {isDir ? 'Folder Options' : 'File Options'}
              </Text>
            </View>
            <View style={styles.promptForm}>
              <Text style={[styles.promptLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Target: {selectedItem.name}
              </Text>
              
              <View style={{ gap: 8, marginTop: 8, width: '100%' }}>
                {isDir && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.cancelBtn,
                        { 
                          borderColor: colors.border,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          flexDirection: 'row',
                          gap: 8,
                          justifyContent: 'flex-start',
                          paddingHorizontal: 12,
                          height: 38,
                          width: '100%',
                        }
                      ]}
                      onPress={onNewFile}
                      activeOpacity={0.8}
                    >
                      <FilePlus size={14} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.btnText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                        New File inside
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.cancelBtn,
                        { 
                          borderColor: colors.border,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          flexDirection: 'row',
                          gap: 8,
                          justifyContent: 'flex-start',
                          paddingHorizontal: 12,
                          height: 38,
                          width: '100%',
                        }
                      ]}
                      onPress={onNewFolder}
                      activeOpacity={0.8}
                    >
                      <FolderPlus size={14} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.btnText, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
                        New Folder inside
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.btn,
                    { 
                      backgroundColor: '#F85149',
                      flexDirection: 'row',
                      gap: 8,
                      justifyContent: 'flex-start',
                      paddingHorizontal: 12,
                      height: 38,
                      width: '100%',
                    }
                  ]}
                  onPress={onDelete}
                  activeOpacity={0.8}
                >
                  <Trash2 size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={[styles.btnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border + '30', paddingTop: 12, marginTop: 4 }]}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.cancelBtn,
                { 
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

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

      <CreateDialog
        visible={createModal.visible}
        parentPath={createModal.parentPath}
        type={createModal.type}
        onClose={() => setCreateModal(prev => ({ ...prev, visible: false }))}
        onCreate={async (name) => {
          const targetPath = createModal.parentPath ? `${createModal.parentPath}/${name}` : name
          try {
            await api.files.create(projectId, targetPath, createModal.type)
            fetchFiles()
            setCreateModal(prev => ({ ...prev, visible: false }))
          } catch (err: any) {
            Alert.alert('Error', err.message)
          }
        }}
      />

      <OptionsDialog
        visible={showOptionsModal}
        selectedItem={selectedItem}
        onClose={() => setShowOptionsModal(false)}
        onNewFile={() => {
          setShowOptionsModal(false)
          setCreateModal({ visible: true, parentPath: selectedItem!.path, type: 'file', name: '' })
        }}
        onNewFolder={() => {
          setShowOptionsModal(false)
          setCreateModal({ visible: true, parentPath: selectedItem!.path, type: 'directory', name: '' })
        }}
        onDelete={() => {
          setShowOptionsModal(false)
          setFileToDelete(selectedItem)
        }}
      />

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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  promptContent: {
    width: '100%',
    maxWidth: 310,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  promptHeader: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  content: {
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  promptForm: {
    gap: 6,
    width: '100%',
  },
  promptLabel: {
    fontSize: 11.5,
    opacity: 0.6,
    marginBottom: 4,
  },
  promptInput: {
    width: '100%',
    height: 38,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    width: '100%',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    // bg set dynamically
  },
  btnText: {
    fontSize: 12,
  },
  optionsContent: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  optionsTitle: {
    fontSize: 13,
    flex: 1,
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
    fontSize: 12.5,
  },
})
