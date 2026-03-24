import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform, ScrollView, Modal, Keyboard,
  KeyboardAvoidingView
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ArrowLeft, Save, Check, ChevronDown, ChevronRight, X, File, Folder, FileCode, Code, Hash, FileJson, FileText, Settings } from 'lucide-react-native'
import { FileNode } from '@/types'
import { WebView } from 'react-native-webview'

function getLanguage(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch(ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'md': return 'markdown';
    case 'py': return 'python';
    default: return 'plaintext';
  }
}

const MONACO_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
    #container { width: 100%; height: 100%; }
    * { -webkit-tap-highlight-color: transparent; }
    /* Hide Monaco's own textarea since we use native RN TextInput for keyboard */
    .monaco-editor .inputarea { opacity: 0 !important; height: 1px !important; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
</head>
<body>
  <div id="container"></div>
  <script>
    window.MonacoEnvironment = {
      getWorkerUrl: function() {
        return "data:text/javascript;charset=utf-8," + encodeURIComponent(
          "self.MonacoEnvironment = { baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/' };" +
          "importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/worker/workerMain.js');"
        );
      }
    };

    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true, noSyntaxValidation: true,
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true, noSyntaxValidation: true,
      });

      window.editor = monaco.editor.create(document.getElementById('container'), {
        value: '',
        language: 'plaintext',
        theme: 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        wordWrap: 'off',
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        padding: { top: 16 },
        readOnly: true,
        contextmenu: false,
        scrollbar: { vertical: 'auto', horizontal: 'auto' }
      });

      // Disable native browser context menu on long press
      document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);

      // When user taps on a line in Monaco, send the tap position back to RN
      window.editor.onDidChangeCursorPosition(function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CURSOR_CHANGE',
          line: e.position.lineNumber,
          column: e.position.column
        }));
      });

      // Differentiate TAP vs SCROLL: only open keyboard on genuine taps
      var touchState = { startX: 0, startY: 0, startTime: 0, moved: false };
      
      document.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        touchState.startX = t.clientX;
        touchState.startY = t.clientY;
        touchState.startTime = Date.now();
        touchState.moved = false;
      }, true);
      
      document.addEventListener('touchmove', function(e) {
        var t = e.touches[0];
        var dx = Math.abs(t.clientX - touchState.startX);
        var dy = Math.abs(t.clientY - touchState.startY);
        // If finger moved more than 10px, it's a scroll not a tap
        if (dx > 10 || dy > 10) touchState.moved = true;
      }, true);
      
      document.addEventListener('touchend', function() {
        var duration = Date.now() - touchState.startTime;
        // Only trigger keyboard if: short tap (<300ms) AND finger didn't move
        if (!touchState.moved && duration < 300) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_KEYBOARD' }));
        }
      }, true);

      window.editor.onDidChangeModelContent(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CONTENT_CHANGE',
          content: window.editor.getValue()
        }));
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EDITOR_READY' }));
    });
  </script>
</body>
</html>
`;

function FileRow({ node, depth, currentPath, onFilePress }: {
  node: FileNode; depth: number; currentPath: string; onFilePress: (path: string) => void;
}) {
  const { colors } = useAppTheme()
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
  const { colors } = useAppTheme()
  const webViewRef = useRef<WebView>(null)
  const nativeInputRef = useRef<TextInput>(null)

  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPath, setCurrentPath] = useState<string>(path as string)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [fetchingFiles, setFetchingFiles] = useState(false)
  const [editorReady, setEditorReady] = useState(false)

  // We always keep a single sentinel character in the hidden input.
  // If text grows beyond 1 char -> user typed something. If it becomes empty -> backspace.
  const SENTINEL = '|'
  const [nativeBuffer, setNativeBuffer] = useState(SENTINEL)

  const hasChanges = content !== originalContent

  // Scroll Monaco to cursor when keyboard opens & blur input when keyboard hides
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Tell Monaco to scroll to cursor after keyboard opens
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(`
            if (window.editor) { window.editor.revealPositionInCenter(window.editor.getPosition()); }
            true;
          `)
        }, 150)
      }
    )
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        nativeInputRef.current?.blur()
      }
    )
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  useEffect(() => { if (id && currentPath) fetchFile(currentPath) }, [id, currentPath])
  useEffect(() => { if (showFilePicker && fileTree.length === 0) fetchAllFiles() }, [showFilePicker])

  useEffect(() => {
    if (editorReady && webViewRef.current && content !== undefined && !loading) {
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.editor.setValue(${JSON.stringify(content)});
          monaco.editor.setModelLanguage(window.editor.getModel(), '${getLanguage(currentPath)}');
          window.editor.updateOptions({ readOnly: false });
        } true;
      `);
    }
  }, [editorReady])

  async function fetchFile(filePath: string) {
    setLoading(true)
    try {
      const data = await api.files.read(id as string, filePath)
      setContent(data.content)
      setOriginalContent(data.content)
      if (editorReady && webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.editor) {
            window.editor.setValue(${JSON.stringify(data.content)});
            monaco.editor.setModelLanguage(window.editor.getModel(), '${getLanguage(filePath)}');
            window.editor.updateOptions({ readOnly: false });
          } true;
        `);
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
      router.back()
    } finally {
      setLoading(false)
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
      await api.files.write(id as string, currentPath, content)
      setOriginalContent(content)
    } catch (err) { Alert.alert('Save failed', (err as Error).message) }
    finally { setSaving(false) }
  }

  // When user taps on the WebView, we instantly open the native keyboard
  const openKeyboard = useCallback(() => {
    // Blur first to reset Android's internal focus state, then re-focus
    nativeInputRef.current?.blur()
    setTimeout(() => {
      nativeInputRef.current?.focus()
    }, 50)
  }, [])

  // When the native TextInput receives keystrokes, forward them into Monaco
  const handleNativeInput = useCallback((text: string) => {
    if (!webViewRef.current) return

    if (text.length > SENTINEL.length) {
      // Character(s) added
      const newChars = text.replace(SENTINEL, '')
      const escaped = JSON.stringify(newChars)
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.editor.trigger('keyboard', 'type', { text: ${escaped} });
        } true;
      `)
    } else if (text.length < SENTINEL.length) {
      // Backspace pressed
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.editor.trigger('keyboard', 'deleteLeft');
        } true;
      `)
    }
    // Always reset to sentinel so next keystroke works cleanly
    setNativeBuffer(SENTINEL)
  }, [])

  // Handle Enter key
  const handleSubmitEditing = useCallback(() => {
    if (!webViewRef.current) return
    webViewRef.current.injectJavaScript(`
      if (window.editor) {
        window.editor.trigger('keyboard', 'type', { text: '\n' });
      } true;
    `)
    setNativeBuffer(SENTINEL)
  }, [])

  const fileName = currentPath?.split('/').pop() || 'File'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.titleContainer} onPress={() => setShowFilePicker(true)} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.fileName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>{fileName}</Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </View>
          <Text style={[styles.pathText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>{currentPath}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: hasChanges ? colors.primary : colors.card }]}
          onPress={handleSave} disabled={!hasChanges || saving} activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={hasChanges ? colors.background : colors.textSecondary} size="small" />
          ) : hasChanges ? (
            <Save size={18} color={colors.background} />
          ) : (
            <Check size={18} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: MONACO_HTML, baseUrl: 'https://cdnjs.cloudflare.com' }}
            originWhitelist={['*']}
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data)
                if (msg.type === 'EDITOR_READY') {
                  setEditorReady(true)
                } else if (msg.type === 'CONTENT_CHANGE') {
                  setContent(msg.content)
                } else if (msg.type === 'REQUEST_KEYBOARD') {
                  openKeyboard()
                }
              } catch (e) { console.warn("Monaco event parse error", e) }
            }}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            androidLayerType="hardware"
          />

          {/* Hidden native TextInput that GUARANTEES keyboard popup on Android */}
          <TextInput
            ref={nativeInputRef}
            style={styles.hiddenInput}
            value={nativeBuffer}
            onChangeText={handleNativeInput}
            onSubmitEditing={handleSubmitEditing}
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            multiline={false}
          />

          {(loading || !editorReady) && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator color={colors.text} size="small" />
              <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                {loading ? "Opening file..." : "Booting IDE Engine..."}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* File Picker Modal */}
      <Modal visible={showFilePicker} animationType="slide" transparent onRequestClose={() => setShowFilePicker(false)}>
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
                      onFilePress={(p) => { setCurrentPath(p); setShowFilePicker(false) }}
                    />
                  ))}
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1, gap: 2, paddingVertical: 4 },
  fileName: { fontSize: 15 },
  pathText: { fontSize: 10, opacity: 0.6 },
  saveBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 },
  loadingText: { fontSize: 13 },
  webViewContainer: { flex: 1, position: 'relative' },
  hiddenInput: {
    position: 'absolute',
    top: -100,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 16, gap: 8 },
  chevronContainer: { width: 16, alignItems: 'center', justifyContent: 'center' },
  fileRowName: { fontSize: 14, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, marginLeft: 8 },
})
