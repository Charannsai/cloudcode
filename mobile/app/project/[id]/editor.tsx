import { useState, useEffect, useMemo, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform, ScrollView, Modal,
  KeyboardAvoidingView
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAIStore } from '@/store/ai'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ArrowLeft, Save, Check, ChevronDown, ChevronRight, X, File, Folder, FileCode, Code, Hash, FileJson, FileText, Settings, Columns, Sparkles } from 'lucide-react-native'
import { FileNode } from '@/types'
import { getToken } from '@/lib/auth'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000'

function FileRow({ node, depth, currentPath, onFilePress }: {
  node: FileNode; depth: number; currentPath: string; onFilePress: (path: string) => void;
}) {
  const { colors, isDark } = useAppTheme()
  const isAncestorOfActive = currentPath.startsWith(node.path + '/')
  const [expanded, setExpanded] = useState(depth < 1 || isAncestorOfActive)
  const isDir = node.type === 'directory'
  const isActive = !isDir && currentPath === node.path

  const iconInfo = useMemo(() => {
    if (isDir) return { icon: Folder, color: isDark ? '#E6EDF3' : '#656D76' };
    const ext = node.name.split('.').pop()?.toLowerCase()
    switch(ext) {
      case 'js': case 'jsx': return { icon: FileCode, color: '#F0DB4F' };
      case 'ts': case 'tsx': return { icon: FileCode, color: '#3178C6' };
      case 'html': return { icon: Code, color: '#E34F26' };
      case 'css': return { icon: Hash, color: '#563D7C' };
      case 'json': return { icon: FileJson, color: '#8BC34A' };
      case 'md': return { icon: FileText, color: '#58A6FF' };
      case 'env': return { icon: Settings, color: '#ECD53F' };
      default: return { icon: File, color: colors.textSecondary };
    }
  }, [node.name, isDir, colors.textSecondary])
  const IconComponent = iconInfo.icon

  return (
    <View>
      <TouchableOpacity
        style={[styles.fileRow, { paddingLeft: 16 + depth * 16 }, isActive && { backgroundColor: colors.primary + '15' }]}
        onPress={() => { if (isDir) setExpanded(e => !e); else onFilePress(node.path); }}
        activeOpacity={0.6}
      >
        <View style={styles.chevronContainer}>
          {isDir ? (expanded ? <ChevronDown size={14} color={colors.textSecondary} /> : <ChevronRight size={14} color={colors.textSecondary} />) : null}
        </View>
        <IconComponent size={16} color={iconInfo.color} />
        <Text style={[styles.fileRowName, { color: isActive ? colors.primary : colors.text }, isActive && { fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
          {node.name}
        </Text>
        {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
      {isDir && expanded && node.children?.map(child => (
        <FileRow key={child.path} node={child} depth={depth + 1} currentPath={currentPath} onFilePress={onFilePress} />
      ))}
    </View>
  )
}

export default function EditorScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>()
  const router = useRouter()
  const { colors, isDark } = useAppTheme()
  const inputRef1 = useRef<TextInput>(null)
  const inputRef2 = useRef<TextInput>(null)

  const { setActiveProject, setPendingPrompt } = useAIStore()

  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPath, setCurrentPath] = useState<string>(path as string)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [fetchingFiles, setFetchingFiles] = useState(false)

  // Multi-File Tab System state
  const [openTabs, setOpenTabs] = useState<{ path: string; name: string }[]>(
    path ? [{ path: path as string, name: (path as string).split('/').pop() || '' }] : []
  )

  // Split View state
  const [splitMode, setSplitMode] = useState(false)
  const [focusedPane, setFocusedPane] = useState<1 | 2>(1)
  const [currentPath2, setCurrentPath2] = useState<string | null>(null)
  const [content2, setContent2] = useState('')
  const [originalContent2, setOriginalContent2] = useState('')
  const [loading2, setLoading2] = useState(false)

  // Menubar state
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const MENUS = [
    { name: 'File' },
    { name: 'Run' },
    { name: 'Edit' },
    { name: 'Go' },
    { name: 'Help' },
  ]

  const getDropdownLeft = (menu: string | null) => {
    switch (menu) {
      case 'File': return 16
      case 'Run': return 66
      case 'Edit': return 116
      case 'Go': return 166
      case 'Help': return 210
      default: return 16
    }
  }

  const handleRunCurrentFile = async () => {
    const panePath = focusedPane === 1 ? currentPath : currentPath2
    if (!panePath) return

    const ext = panePath.split('.').pop()?.toLowerCase() || ''
    
    // Determine command based on file extension
    let cmd = ''
    switch (ext) {
      case 'js':
      case 'jsx':
        cmd = `node "${panePath}"`
        break
      case 'ts':
      case 'tsx':
        cmd = `npx ts-node "${panePath}"`
        break
      case 'py':
        cmd = `python3 "${panePath}"`
        break
      case 'go':
        cmd = `go run "${panePath}"`
        break
      case 'rs':
        cmd = `rustc "${panePath}" -o app_bin && ./app_bin`
        break
      case 'c':
        cmd = `gcc "${panePath}" -o app_bin && ./app_bin`
        break
      case 'cpp':
      case 'cc':
        cmd = `g++ "${panePath}" -o app_bin && ./app_bin`
        break
      default:
        Alert.alert('Unsupported file type', `Cannot execute .${ext} files directly. Please use Python, JS, TS, Go, Rust, or C/C++ files.`)
        return
    }

    // Save changes first if file is modified
    const currentHasChanges = focusedPane === 1 ? (content !== originalContent) : (content2 !== originalContent2)
    if (currentHasChanges) {
      try {
        setSaving(true)
        if (focusedPane === 1) {
          await api.files.write(id as string, currentPath, content)
          setOriginalContent(content)
        } else if (currentPath2) {
          await api.files.write(id as string, currentPath2, content2)
          setOriginalContent2(content2)
        }
      } catch (err) {
        Alert.alert('Save failed', (err as Error).message)
        setSaving(false)
        return
      } finally {
        setSaving(false)
      }
    }

    Alert.alert(
      'Run File',
      `Execute command:\n${cmd}\nin Terminal (Shell 1)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run',
          onPress: async () => {
            try {
              const token = await getToken()
              if (!token) {
                Alert.alert('Authentication required', 'Please log in again.')
                return
              }
              const wsUrl = `${WS_URL}/cc-api/terminal/${id}?token=${encodeURIComponent(token)}&terminalId=main`
              const ws = new WebSocket(wsUrl)
              ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'input', data: cmd + '\n' }))
                setTimeout(() => {
                  ws.close()
                  router.replace({
                    pathname: `/project/[id]`,
                    params: { id: id as string, tab: 'Terminal' }
                  })
                }, 250)
              }
            } catch (err) {
              Alert.alert('Error starting execution', (err as Error).message)
            }
          }
        }
      ]
    )
  }

  const getMenuItems = (menu: string | null): any[] => {
    if (!menu) return []
    const panePath = focusedPane === 1 ? currentPath : currentPath2
    
    switch (menu) {
      case 'File':
        return [
          { label: 'Save', onPress: handleSave },
          { label: 'Close File', onPress: () => closeTab(panePath || '') },
          { label: 'Switch File', onPress: () => setShowFilePicker(true), divider: true },
          { label: 'Exit Editor', onPress: () => router.back(), danger: true },
        ]
      case 'Run':
        return [
          { label: 'Run Current File', onPress: handleRunCurrentFile },
        ]
      case 'Edit':
        return [
          { label: 'Toggle Split View', onPress: toggleSplitMode },
          { label: 'Focus Left/Top Pane', onPress: () => setFocusedPane(1) },
          { label: 'Focus Right/Bottom Pane', onPress: () => setFocusedPane(2) },
        ]
      case 'Go':
        return [
          {
            label: 'Go to Terminal',
            onPress: () => router.replace({ pathname: `/project/[id]`, params: { id: id as string, tab: 'Terminal' } })
          },
          {
            label: 'Go to Files',
            onPress: () => router.replace({ pathname: `/project/[id]`, params: { id: id as string, tab: 'Files' } })
          },
          {
            label: 'Go to Git',
            onPress: () => router.replace({ pathname: `/project/[id]`, params: { id: id as string, tab: 'Git' } })
          },
          {
            label: 'Go to Preview',
            onPress: () => router.replace({ pathname: `/project/[id]`, params: { id: id as string, tab: 'Preview' } })
          },
        ]
      case 'Help':
        return [
          {
            label: 'About CloudCode',
            onPress: () => {
              Alert.alert('About CloudCode', 'A premium, multi-tenant cloud workspace and IDE.')
            }
          },
          {
            label: 'Keyboard & Gesture Shortcuts',
            onPress: () => {
              Alert.alert(
                'Shortcuts & Tips',
                '• Long press directories to create nested files/folders.\n• Use the Columns button in the header to toggle Split Pane.\n• Tap a tab close button to auto-save and close it.'
              )
            }
          },
        ]
      default:
        return []
    }
  }

  const toggleSplitMode = () => {
    if (!splitMode) {
      const otherTab = openTabs.find(t => t.path !== currentPath)
      const path2 = otherTab ? otherTab.path : currentPath
      setCurrentPath2(path2)
      setSplitMode(true)
      setFocusedPane(2)
    } else {
      setSplitMode(false)
      setCurrentPath2(null)
      setFocusedPane(1)
    }
  }

  const switchTab = async (targetPath: string) => {
    const pane = focusedPane
    if (pane === 1) {
      if (targetPath === currentPath) return;
      if (hasChanges) {
        try {
          await api.files.write(id as string, currentPath, content)
          setOriginalContent(content)
        } catch (err) {
          Alert.alert('Save failed', (err as Error).message)
          return
        }
      }
      setLoading(true)
      setCurrentPath(targetPath)
    } else {
      if (targetPath === currentPath2) return;
      const hasChanges2 = content2 !== originalContent2
      if (hasChanges2 && currentPath2) {
        try {
          await api.files.write(id as string, currentPath2, content2)
          setOriginalContent2(content2)
        } catch (err) {
          Alert.alert('Save failed', (err as Error).message)
          return
        }
      }
      setLoading2(true)
      setCurrentPath2(targetPath)
    }
  }

  const openFile = async (p: string) => {
    const filename = p.split('/').pop() || 'File'
    setOpenTabs(prev => {
      if (prev.some(t => t.path === p)) return prev
      return [...prev, { path: p, name: filename }]
    })
    await switchTab(p)
  }

  const closeTab = async (p: string) => {
    if (openTabs.length <= 1) {
      Alert.alert('Cannot Close', 'You must keep at least one file open.')
      return
    }

    if (p === currentPath && hasChanges) {
      try {
        await api.files.write(id as string, currentPath, content)
      } catch (err) {
        Alert.alert('Save failed', (err as Error).message)
        return
      }
    } else if (p === currentPath2 && currentPath2) {
      const hasChanges2 = content2 !== originalContent2
      if (hasChanges2) {
        try {
          await api.files.write(id as string, currentPath2, content2)
        } catch (err) {
          Alert.alert('Save failed', (err as Error).message)
          return
        }
      }
    }

    const index = openTabs.findIndex(t => t.path === p)
    const newTabs = openTabs.filter(t => t.path !== p)
    setOpenTabs(newTabs)

    if (p === currentPath) {
      const nextActiveIndex = Math.max(0, index - 1)
      setCurrentPath(newTabs[nextActiveIndex].path)
    } else if (p === currentPath2) {
      const nextActiveIndex = Math.max(0, index - 1)
      setCurrentPath2(newTabs[nextActiveIndex].path)
    }
  }

  const hasChanges = content !== originalContent

  useEffect(() => { if (id && currentPath) fetchFile(currentPath, 1) }, [id, currentPath])
  useEffect(() => { if (id && currentPath2) fetchFile(currentPath2, 2) }, [id, currentPath2])
  useEffect(() => { if (showFilePicker && fileTree.length === 0) fetchAllFiles() }, [showFilePicker])

  async function fetchFile(filePath: string, pane: 1 | 2) {
    if (pane === 1) {
      setLoading(true)
      try {
        const data = await api.files.read(id as string, filePath)
        setContent(data.content)
        setOriginalContent(data.content)
      } catch (err) {
        Alert.alert('Error', (err as Error).message)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading2(true)
      try {
        const data = await api.files.read(id as string, filePath)
        setContent2(data.content)
        setOriginalContent2(data.content)
      } catch (err) {
        Alert.alert('Error', (err as Error).message)
      } finally {
        setLoading2(false)
      }
    }
  }

  async function fetchAllFiles() {
    setFetchingFiles(true)
    try { setFileTree(await api.files.list(id as string)) }
    catch (err) { Alert.alert('Error', 'Failed to load files list') }
    finally { setFetchingFiles(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (focusedPane === 1) {
        await api.files.write(id as string, currentPath, content)
        setOriginalContent(content)
      } else if (currentPath2) {
        await api.files.write(id as string, currentPath2, content2)
        setOriginalContent2(content2)
      }
    } catch (err) { Alert.alert('Save failed', (err as Error).message) }
    finally {setSaving(false) }
  }

  const activePath = focusedPane === 1 ? currentPath : (currentPath2 || currentPath)
  const fileName = activePath?.split('/').pop() || 'File'
  const activeHasChanges = focusedPane === 1 ? (content !== originalContent) : (content2 !== originalContent2)

  const lines = useMemo(() => {
    const count = content ? content.split('\n').length : 1
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [content])

  const lines2 = useMemo(() => {
    const count = content2 ? content2.split('\n').length : 1
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [content2])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.titleContainer} onPress={() => setShowFilePicker(true)} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.fileName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>{fileName}</Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </View>
          <Text style={[styles.pathText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>{activePath}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleSplitMode}
          style={[styles.saveBtn, { marginRight: 8, backgroundColor: splitMode ? colors.primary + '20' : (isDark ? '#1C2128' : '#F6F8FA') }]}
          activeOpacity={0.7}
        >
          <Columns size={16} color={splitMode ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: activeHasChanges ? colors.text : (isDark ? '#1C2128' : '#F6F8FA') }]}
          onPress={handleSave} disabled={!activeHasChanges || saving} activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : activeHasChanges ? (
            <Save size={18} color={colors.background} />
          ) : (
            <Check size={18} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Menubar Row */}
      <View style={[styles.menuBarRow, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF', borderBottomColor: colors.border }]}>
        {MENUS.map((menu) => (
          <TouchableOpacity
            key={menu.name}
            style={styles.menuBarItem}
            onPress={() => setActiveMenu(menu.name)}
            activeOpacity={0.6}
          >
            <Text style={[styles.menuBarText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {menu.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontally scrollable Editor Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {openTabs.map((tab) => {
            const isActive = tab.path === activePath
            return (
              <TouchableOpacity
                key={tab.path}
                onPress={() => switchTab(tab.path)}
                style={[
                  styles.tabItem,
                  { 
                    backgroundColor: isActive ? (isDark ? '#0E1116' : '#FFFFFF') : 'transparent',
                    borderColor: isActive ? colors.border : 'transparent',
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  { 
                    color: isActive ? colors.text : colors.textSecondary,
                    fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular'
                  }
                ]}>
                  {tab.name}
                </Text>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation()
                    closeTab(tab.path)
                  }}
                  style={styles.closeTabBtn}
                >
                  <X size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.editorMainContainer}>
          <View style={styles.editorsContainer}>
            <View style={splitMode ? styles.splitLayout : styles.singleLayout}>
              {/* Pane 1 (Primary) */}
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => {
                  setFocusedPane(1)
                  inputRef1.current?.focus()
                }}
                style={[
                  styles.paneContainer, 
                  splitMode && styles.splitPane, 
                  splitMode && focusedPane === 1 && { borderColor: colors.primary, borderWidth: 1.5 }
                ]}
              >
                {splitMode && (
                  <View style={[styles.paneHeader, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderBottomColor: colors.border }]}>
                    <Text style={[styles.paneTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                      {currentPath.split('/').pop()} {content !== originalContent && '*'}
                    </Text>
                  </View>
                )}
                
                <ScrollView 
                  style={styles.editorScrollView} 
                  contentContainerStyle={styles.editorScrollContent}
                  keyboardShouldPersistTaps="always"
                >
                  <View style={styles.editorRow}>
                    {/* Gutter */}
                    <View style={[styles.gutter, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', borderRightColor: colors.border }]}>
                      {lines.map((lineNum) => (
                        <Text
                          key={lineNum}
                          style={[
                            styles.gutterText,
                            {
                              color: colors.textSecondary,
                              fontFamily: 'JetBrainsMono_400Regular',
                              fontSize: 13,
                              lineHeight: 20,
                              includeFontPadding: false,
                            }
                          ]}
                        >
                          {lineNum}
                        </Text>
                      ))}
                    </View>
                    
                    {/* TextInput in horizontal scroll */}
                    <ScrollView 
                      horizontal 
                      style={styles.horizontalScroll}
                      contentContainerStyle={styles.horizontalScrollContent}
                      keyboardShouldPersistTaps="always"
                    >
                      <TextInput
                        ref={inputRef1}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        style={[
                          styles.editorInput,
                          {
                            color: colors.text,
                            fontFamily: 'JetBrainsMono_400Regular',
                            fontSize: 13,
                            lineHeight: 20,
                            includeFontPadding: false,
                          }
                        ]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        scrollEnabled={false}
                        onSelectionChange={(e) => {
                          const { start, end } = e.nativeEvent.selection
                          if (start !== end && content) {
                            setSelectedText(content.substring(start, end))
                          } else {
                            setSelectedText('')
                          }
                        }}
                      />
                    </ScrollView>
                  </View>
                </ScrollView>

                {loading && (
                  <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background }]}>
                    <ActivityIndicator color={colors.text} size="small" />
                    <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                      Opening file...
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Pane 2 (Secondary) */}
              {splitMode && currentPath2 && (
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => {
                    setFocusedPane(2)
                    inputRef2.current?.focus()
                  }}
                  style={[
                    styles.paneContainer, 
                    styles.splitPane, 
                    focusedPane === 2 && { borderColor: colors.primary, borderWidth: 1.5 },
                    { borderTopWidth: 1, borderTopColor: colors.border }
                  ]}
                >
                  <View style={[styles.paneHeader, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderBottomColor: colors.border }]}>
                    <Text style={[styles.paneTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                      {currentPath2.split('/').pop()} {content2 !== originalContent2 && '*'}
                    </Text>
                  </View>

                  <ScrollView 
                    style={styles.editorScrollView} 
                    contentContainerStyle={styles.editorScrollContent}
                    keyboardShouldPersistTaps="always"
                  >
                    <View style={styles.editorRow}>
                      {/* Gutter */}
                      <View style={[styles.gutter, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', borderRightColor: colors.border }]}>
                        {lines2.map((lineNum) => (
                          <Text
                            key={lineNum}
                            style={[
                              styles.gutterText,
                              {
                                color: colors.textSecondary,
                                fontFamily: 'JetBrainsMono_400Regular',
                                fontSize: 13,
                                lineHeight: 20,
                                includeFontPadding: false,
                              }
                            ]}
                          >
                            {lineNum}
                          </Text>
                        ))}
                      </View>

                      {/* TextInput in horizontal scroll */}
                      <ScrollView 
                        horizontal 
                        style={styles.horizontalScroll}
                        contentContainerStyle={styles.horizontalScrollContent}
                        keyboardShouldPersistTaps="always"
                      >
                        <TextInput
                          ref={inputRef2}
                          multiline
                          value={content2}
                          onChangeText={setContent2}
                          style={[
                            styles.editorInput,
                            {
                              color: colors.text,
                              fontFamily: 'JetBrainsMono_400Regular',
                              fontSize: 13,
                              lineHeight: 20,
                              includeFontPadding: false,
                            }
                          ]}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          scrollEnabled={false}
                          onSelectionChange={(e) => {
                            const { start, end } = e.nativeEvent.selection
                            if (start !== end && content2) {
                              setSelectedText(content2.substring(start, end))
                            } else {
                              setSelectedText('')
                            }
                          }}
                        />
                      </ScrollView>
                    </View>
                  </ScrollView>

                  {loading2 && (
                    <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background }]}>
                      <ActivityIndicator color={colors.text} size="small" />
                      <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                        Opening file...
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* File Picker Modal */}
      <Modal visible={showFilePicker} animationType="none" transparent onRequestClose={() => setShowFilePicker(false)}>
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
                    <FileRow key={node.path} node={node} depth={0} currentPath={currentPath}
                      onFilePress={(p) => { openFile(p); setShowFilePicker(false) }}
                    />
                  ))}
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={activeMenu !== null}
        transparent
        animationType="none"
        onRequestClose={() => setActiveMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setActiveMenu(null)}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: isDark ? '#1E232E' : '#FFFFFF',
                borderColor: colors.border,
                left: getDropdownLeft(activeMenu),
              }
            ]}
          >
            {getMenuItems(activeMenu).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  item.divider && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => {
                  setActiveMenu(null)
                  item.onPress()
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: item.danger ? '#F85149' : colors.text, fontFamily: 'Inter_500Medium' }
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Ask AI Button for Selection */}
      {selectedText.trim().length > 0 && (
        <View style={styles.floatingAskAIContainer}>
          <TouchableOpacity
            style={[styles.floatingAskAIBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveProject(id as string)
              setPendingPrompt(`I am looking at this code in my project:\n\n\`\`\`\n${selectedText}\n\`\`\`\n\nCan you explain what it does or help me improve it?`)
              setSelectedText('') // reset highlight
              router.push('/(tabs)/ai')
            }}
          >
            <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={[styles.floatingAskAIText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
              Ask AI
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedText('')}
              style={styles.floatingAskAIClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1, gap: 2, paddingVertical: 4 },
  fileName: { fontSize: 15 },
  pathText: { fontSize: 10, opacity: 0.6 },
  saveBtn: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 },
  loadingText: { fontSize: 13 },
  paneContainer: { flex: 1, position: 'relative' },
  editorScrollView: { flex: 1 },
  editorScrollContent: { flexGrow: 1 },
  editorRow: { flexDirection: 'row', flex: 1 },
  gutter: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    borderRightWidth: 1,
    minWidth: 36,
  },
  gutterText: { textAlign: 'right' },
  horizontalScroll: { flex: 1 },
  horizontalScrollContent: { flexGrow: 1 },
  editorInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    textAlignVertical: 'top',
    minWidth: 2000,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingTop: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 16, gap: 8 },
  chevronContainer: { width: 16, alignItems: 'center', justifyContent: 'center' },
  fileRowName: { fontSize: 14, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, marginLeft: 8 },
  tabBar: {
    borderBottomWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tabBarScroll: {
    alignItems: 'center',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
  },
  closeTabBtn: {
    padding: 2,
    borderRadius: 4,
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  singleLayout: {
    flex: 1,
  },
  splitPane: {
    flex: 1,
  },
  paneHeader: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  paneTitle: {
    fontSize: 11,
    opacity: 0.8,
  },
  menuBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 20,
    zIndex: 5,
  },
  menuBarItem: {
    paddingVertical: 2,
  },
  menuBarText: {
    fontSize: 13,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 130, // Fits nicely under the menubar (header ~ 104px + menubar ~ 35px)
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 13,
  },
  floatingAskAIContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 100,
  },
  floatingAskAIBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingAskAIText: {
    fontSize: 13,
  },
  floatingAskAIClose: {
    padding: 2,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  editorMainContainer: {
    flex: 1,
  },
  editorsContainer: {
    flex: 1,
    height: '100%',
  },
})
