import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Plus,
  File, Search, MoreVertical, RefreshCw, FilePlus, FolderPlus, Trash2,
} from 'lucide-react-native'

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
  item, depth, projectId, onRefresh, colors, isDark, router
}: {
  item: FileItem; depth: number; projectId: string;
  onRefresh: () => void; colors: any; isDark: boolean; router: any
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

  const handleDelete = () => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.files.delete(projectId, item.path)
            onRefresh()
          } catch (err) {
            Alert.alert('Error', (err as Error).message)
          }
        }
      }
    ])
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.treeItem, { paddingLeft: 12 + depth * 16 }]}
        onPress={handlePress}
        onLongPress={handleDelete}
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

  useEffect(() => {
    if (isActive) fetchFiles()
  }, [isActive, fetchFiles])

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

  const createFile = () => {
    if (Alert.prompt) {
      Alert.prompt('New File', 'Enter file name', (name: string) => {
        if (name) {
          api.files.create(projectId, name, 'file')
            .then(fetchFiles)
            .catch(err => Alert.alert('Error', err.message))
        }
      })
    } else {
      Alert.alert('Not Supported', 'Prompt dialogs are only supported on iOS. Please use the terminal to create new files on Android.')
    }
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
          onPress={createFile}
          style={[styles.toolBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <FilePlus size={13} color={colors.textSecondary} strokeWidth={1.8} />
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
              />
            ))
          )}
        </ScrollView>
      )}
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
    borderRadius: 7,
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
})
