import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ArrowLeft, Save, Check, ChevronDown, ChevronRight, X, File, Folder, FileCode, Code, Hash, FileJson, FileText, Settings } from 'lucide-react-native'
import { FileNode } from '@/types'

function FileRow({ node, depth, currentPath, onFilePress }: {
  node: FileNode
  depth: number
  currentPath: string
  onFilePress: (path: string) => void
}) {
  const { colors } = useAppTheme()
  // Automatically expand folders that contain the currently active file
  const isAncestorOfActive = currentPath.startsWith(node.path + '/')
  const [expanded, setExpanded] = useState(depth < 1 || isAncestorOfActive)
  
  const isDir = node.type === 'directory'
  const isActive = !isDir && currentPath === node.path

  const iconInfo = useMemo(() => {
    if (isDir) return { icon: Folder, color: '#60a5fa' };
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
          { paddingLeft: 16 + depth * 16 },
          isActive && { backgroundColor: colors.primary + '15' }
        ]}
        onPress={() => {
          if (isDir) setExpanded((e) => !e)
          else onFilePress(node.path)
        }}
        activeOpacity={0.6}
      >
        <View style={styles.chevronContainer}>
          {isDir ? (
            expanded ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />
          ) : null}
        </View>
        <IconComponent 
          size={16} 
          color={iconInfo.color} 
        />
        <Text style={[
          styles.fileRowName, 
          { color: isActive ? colors.primary : colors.text },
          isActive && { fontFamily: 'Inter_600SemiBold' }
        ]} numberOfLines={1}>
          {node.name}
        </Text>
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>

      {isDir && expanded && node.children?.map((child) => (
        <FileRow key={child.path} node={child} depth={depth + 1} currentPath={currentPath} onFilePress={onFilePress} />
      ))}
    </View>
  )
}

export default function EditorScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPath, setCurrentPath] = useState<string>(path as string)
  
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [fetchingFiles, setFetchingFiles] = useState(false)

  const hasChanges = content !== originalContent

  useEffect(() => {
    if (id && currentPath) fetchFile(currentPath)
  }, [id, currentPath])

  useEffect(() => {
    if (showFilePicker && fileTree.length === 0) {
      fetchAllFiles()
    }
  }, [showFilePicker])

  async function fetchFile(filePath: string) {
    setLoading(true)
    try {
      const data = await api.files.read(id as string, filePath)
      setContent(data.content)
      setOriginalContent(data.content)
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllFiles() {
    setFetchingFiles(true)
    try {
      const tree = await api.files.list(id as string)
      setFileTree(tree)
    } catch (err) {
      Alert.alert('Error', 'Failed to load files list')
    } finally {
      setFetchingFiles(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.files.write(id as string, currentPath, content)
      setOriginalContent(content)
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fileName = currentPath?.split('/').pop() || 'File'
  const lineCount = content.split('\n').length || 1
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1)

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.titleContainer}
          onPress={() => setShowFilePicker(true)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.fileName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
              {fileName}
            </Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </View>
          <Text style={[styles.pathText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
            {currentPath}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveBtn, 
            { backgroundColor: hasChanges ? colors.primary : colors.card }
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={hasChanges ? colors.background : colors.textSecondary} size="small" />
          ) : (
            hasChanges ? (
              <Save size={18} color={colors.background} />
            ) : (
              <Check size={18} color={colors.textSecondary} />
            )
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Opening file...</Text>
        </View>
      ) : (
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          <ScrollView horizontal style={styles.horizontalScroll}>
            <View style={[styles.editorContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.lineNumbers, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
                {lines.map(n => (
                  <Text key={n} style={[styles.lineNumberText, { color: colors.textSecondary }]}>{n}</Text>
                ))}
              </View>
              <TextInput
                style={[
                  styles.editor, 
                  { 
                    color: colors.text, 
                    fontFamily: 'JetBrainsMono_400Regular' 
                  }
                ]}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                scrollEnabled={false}
                selectionColor={colors.accent}
              />
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* File Picker Modal */}
      <Modal visible={showFilePicker} animationType="slide" transparent={true} onRequestClose={() => setShowFilePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Switch File</Text>
              <TouchableOpacity onPress={() => setShowFilePicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {fetchingFiles ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : (
              <ScrollView>
                <View style={{ paddingTop: 8 }}>
                  {fileTree.map(node => (
                    <FileRow 
                      key={node.path}
                      node={node}
                      depth={0}
                      currentPath={currentPath}
                      onFilePress={(p) => {
                        setCurrentPath(p)
                        setShowFilePicker(false)
                      }}
                    />
                  ))}
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
    paddingVertical: 4,
  },
  fileName: { 
    fontSize: 15,
  },
  pathText: { 
    fontSize: 10,
    opacity: 0.6,
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13 },
  editorScroll: { flex: 1 },
  horizontalScroll: { flex: 1 },
  editorContainer: { flex: 1, flexDirection: 'row', minWidth: '100%' },
  lineNumbers: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    borderRightWidth: 1,
  },
  lineNumberText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.5,
  },
  editor: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    padding: 20,
    minHeight: '100%',
    letterSpacing: -0.2,
    minWidth: 800,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  
  // FileRow styles
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
  fileRowName: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono_400Regular',
    flex: 1,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
})
