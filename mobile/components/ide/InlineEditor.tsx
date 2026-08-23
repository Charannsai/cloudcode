import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { api } from '@/lib/api'
import { Sparkles, Folder, Terminal, Code } from '@/components/HugeIconsShim'
import { TouchableOpacity } from 'react-native'
import { GlobalHotkeyBridge } from './GlobalHotkeyBridge'
import { DesktopMousePointer } from './DesktopMousePointer'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.cerprise.in'

function getLanguageMode(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'js': case 'jsx': return 'javascript'
    case 'ts': case 'tsx': return 'text/typescript'
    case 'json': return 'application/json'
    case 'html': return 'htmlmixed'
    case 'css': return 'css'
    case 'md': return 'markdown'
    case 'py': return 'python'
    case 'go': return 'go'
    case 'rs': return 'rust'
    case 'c': return 'text/x-csrc'
    case 'cpp': case 'cc': return 'text/x-c++src'
    case 'sh': case 'bash': return 'shell'
    case 'yaml': case 'yml': return 'yaml'
    default: return 'plaintext'
  }
}

function getCodeMirrorHtml(isDark: boolean, colors: any) {
  const bg = colors.background
  const border = colors.border
  const text = colors.text
  const primary = colors.primary
  const textSecondary = colors.textSecondary

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
  <style>
    body, html {
      margin: 0; padding: 0; height: 100%; width: 100%;
      overflow: hidden; background: ${bg};
      cursor: text !important;
    }
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      box-sizing: border-box;
    }
    .cm-s-custom.CodeMirror {
      background: ${bg} !important;
      color: ${text} !important;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      height: 100%;
      cursor: text !important;
    }
    .cm-s-custom .CodeMirror-gutters {
      background: ${isDark ? '#0D1117' : '#FAFAFA'} !important;
      border-right: 1px solid ${border} !important;
      width: 48px;
      cursor: default !important;
    }
    .cm-s-custom .CodeMirror-linenumber {
      color: ${textSecondary} !important;
      opacity: 0.5;
      padding-right: 10px;
      cursor: default !important;
    }
    .cm-s-custom .CodeMirror-cursor {
      border-left: 2.5px solid ${primary} !important;
      box-shadow: 0 0 8px ${primary}88;
    }
    .cm-s-custom div.CodeMirror-selected {
      background: ${primary}25 !important;
    }
    .cm-s-custom .CodeMirror-focused div.CodeMirror-selected {
      background: ${primary}33 !important;
    }
    .cm-s-custom .CodeMirror-activeline-background {
      background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'} !important;
    }
    /* Syntax Highlighting */
    .cm-s-custom .cm-keyword { color: ${isDark ? '#FF7B72' : '#D73A49'} !important; font-weight: bold; }
    .cm-s-custom .cm-atom { color: ${isDark ? '#79C0FF' : '#005CC5'} !important; }
    .cm-s-custom .cm-number { color: ${isDark ? '#79C0FF' : '#005CC5'} !important; }
    .cm-s-custom .cm-def { color: ${isDark ? '#D2A8FF' : '#6F42C1'} !important; font-weight: bold; }
    .cm-s-custom .cm-variable { color: ${text} !important; }
    .cm-s-custom .cm-variable-2 { color: ${isDark ? '#C9D1D9' : '#24292E'} !important; }
    .cm-s-custom .cm-variable-3 { color: ${isDark ? '#FFA657' : '#E36209'} !important; }
    .cm-s-custom .cm-property { color: ${isDark ? '#79C0FF' : '#005CC5'} !important; }
    .cm-s-custom .cm-operator { color: ${isDark ? '#FF7B72' : '#D73A49'} !important; }
    .cm-s-custom .cm-comment { color: ${isDark ? '#8B949E' : '#6A737D'} !important; font-style: italic; }
    .cm-s-custom .cm-string { color: ${isDark ? '#A5D6FF' : '#032F62'} !important; }
    .cm-s-custom .cm-string-2 { color: ${isDark ? '#79C0FF' : '#005CC5'} !important; }
    .cm-s-custom .cm-meta { color: ${isDark ? '#8B949E' : '#6A737D'} !important; }
    .cm-s-custom .cm-qualifier { color: ${isDark ? '#FFA657' : '#E36209'} !important; }
    .cm-s-custom .cm-builtin { color: ${isDark ? '#D2A8FF' : '#6F42C1'} !important; }
    .cm-s-custom .cm-bracket { color: ${isDark ? '#C9D1D9' : '#24292E'} !important; }
    .cm-s-custom .cm-tag { color: ${isDark ? '#7EE787' : '#22863A'} !important; }
    .cm-s-custom .cm-attribute { color: ${isDark ? '#D2A8FF' : '#6F42C1'} !important; }
    .cm-s-custom .cm-header { color: ${isDark ? '#79C0FF' : '#005CC5'} !important; font-weight: bold; }
    .cm-s-custom .cm-link { color: ${isDark ? '#A5D6FF' : '#032F62'} !important; text-decoration: underline; }
    .cm-s-custom .cm-error { color: #F85149 !important; border-bottom: 1px dotted #F85149; }
    .CodeMirror-vscrollbar, .CodeMirror-hscrollbar { opacity: 0.5; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/python/python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/xml/xml.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/css/css.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/htmlmixed/htmlmixed.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/markdown/markdown.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/clike/clike.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/go/go.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/rust/rust.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/shell/shell.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/yaml/yaml.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/closebrackets.min.js"></script>
</head>
<body>
  <textarea id="editor"></textarea>
  <script>
    var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      lineNumbers: true,
      theme: 'custom',
      lineWrapping: false,
      autoCloseBrackets: true,
      viewportMargin: Infinity,
      tabSize: 2,
      indentWithTabs: false,
      styleActiveLine: true
    });
    editor.on('change', function(cm) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONTENT_CHANGE',
        content: cm.getValue()
      }));
    });
    editor.on('cursorActivity', function(cm) {
      var cursor = cm.getCursor();
      var selection = cm.getSelection();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CURSOR_CHANGE',
        line: cursor.line + 1,
        col: cursor.ch + 1,
        selection: selection
      }));
    });

    // Hardware Keyboard Listener (Ctrl+~, Ctrl+B, Ctrl+S, Ctrl+W, Ctrl+Shift+F)
    function handleKeyShortcut(e) {
      var isCtrlOrCmd = e.ctrlKey || e.metaKey;
      var key = e.key ? e.key.toLowerCase() : '';
      var code = e.code || '';

      if (isCtrlOrCmd && (key === '\`' || key === '~' || code === 'Backquote' || e.keyCode === 192)) {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHORTCUT_TOGGLE_TERMINAL' }));
      } else if (isCtrlOrCmd && !e.shiftKey && key === 'b') {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHORTCUT_TOGGLE_SIDEBAR' }));
      } else if (isCtrlOrCmd && !e.shiftKey && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHORTCUT_SAVE' }));
      } else if (isCtrlOrCmd && !e.shiftKey && key === 'w') {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHORTCUT_CLOSE_TAB' }));
      } else if (isCtrlOrCmd && e.shiftKey && key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHORTCUT_SEARCH' }));
      }
    }
    window.addEventListener('keydown', handleKeyShortcut, true);
    document.addEventListener('keydown', handleKeyShortcut, true);

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EDITOR_READY' }));
  </script>
</body>
</html>
`
}

// VS Code-style Welcome Tab
function WelcomeTab({ projectId, colors, isDark, onOpenExplorer }: {
  projectId: string; colors: any; isDark: boolean; onOpenExplorer: () => void
}) {
  return (
    <View style={[styles.welcomeContainer, { backgroundColor: colors.background }]}>
      <View style={styles.welcomeContent}>
        {/* Logo / Title */}
        <View style={styles.welcomeHeader}>
          <Code size={48} color={isDark ? '#58A6FF' : '#0969DA'} strokeWidth={1.2} />
          <Text style={[styles.welcomeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Welcome
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            CloudCode Workspace
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeSectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Start
          </Text>
          <TouchableOpacity
            style={[styles.welcomeAction, { backgroundColor: isDark ? '#161B22' : '#F6F8FA' }]}
            onPress={onOpenExplorer}
            activeOpacity={0.7}
          >
            <Folder size={18} color={isDark ? '#58A6FF' : '#0969DA'} strokeWidth={1.6} />
            <Text style={[styles.welcomeActionText, { color: isDark ? '#58A6FF' : '#0969DA', fontFamily: 'Inter_500Medium' }]}>
              Open Explorer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.welcomeAction, { backgroundColor: isDark ? '#161B22' : '#F6F8FA' }]}
            activeOpacity={0.7}
          >
            <Terminal size={18} color={isDark ? '#58A6FF' : '#0969DA'} strokeWidth={1.6} />
            <Text style={[styles.welcomeActionText, { color: isDark ? '#58A6FF' : '#0969DA', fontFamily: 'Inter_500Medium' }]}>
              Open Terminal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeSectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Tips
          </Text>
          <Text style={[styles.welcomeTip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • Use the Explorer in the sidebar to browse and open files
          </Text>
          <Text style={[styles.welcomeTip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • The integrated terminal is always available in the bottom panel
          </Text>
          <Text style={[styles.welcomeTip, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            • Ask AI for help using the right panel
          </Text>
        </View>
      </View>
    </View>
  )
}

interface InlineEditorProps {
  projectId: string
  onOpenExplorer: () => void
}

export default function InlineEditor({ projectId, onOpenExplorer }: InlineEditorProps) {
  const { colors, isDark } = useAppTheme()
  const {
    activeEditorTab, openEditorTabs, markDirty, markClean, setCursorPosition,
    toggleSidebar, toggleBottomPanel, setBottomTab, setSidebarPanel, closeFile
  } = useTabletLayoutStore()

  const webViewRef = useRef<WebView>(null)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [currentLoadedPath, setCurrentLoadedPath] = useState<string | null>(null)

  const editorHtml = useMemo(() => getCodeMirrorHtml(isDark, colors), [isDark, colors])

  // Load file content when active tab changes
  useEffect(() => {
    if (!activeEditorTab || activeEditorTab === currentLoadedPath) return

    async function loadFile() {
      setLoading(true)
      try {
        const data = await api.files.read(projectId, activeEditorTab!)
        setContent(data.content)
        setOriginalContent(data.content)
        setCurrentLoadedPath(activeEditorTab)
        markClean(activeEditorTab!)
      } catch (err) {
        Alert.alert('Error', (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [activeEditorTab, projectId])

  // Sync content into WebView when file loads
  useEffect(() => {
    if (editorReady && webViewRef.current && !loading && activeEditorTab) {
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          if (window.editor.getValue() !== ${JSON.stringify(content)}) {
            window.editor.setValue(${JSON.stringify(content)});
            window.editor.clearHistory();
          }
          window.editor.setOption('mode', '${getLanguageMode(activeEditorTab)}');
        }
        true;
      `)
    }
  }, [editorReady, content, loading, activeEditorTab])

  // Handle save (called externally via the store or menu bar)
  const handleSave = async () => {
    if (!activeEditorTab || content === originalContent) return
    try {
      await api.files.write(projectId, activeEditorTab, content)
      setOriginalContent(content)
      markClean(activeEditorTab)
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message)
    }
  }

  // Expose save function on the component instance
  // We'll use a store-based approach instead
  useEffect(() => {
    // Store a reference for external save calls
    ;(InlineEditor as any)._currentSave = handleSave
  }, [activeEditorTab, content, originalContent])

  // No file open — show Welcome
  if (!activeEditorTab || openEditorTabs.length === 0) {
    return <WelcomeTab projectId={projectId} colors={colors} isDark={isDark} onOpenExplorer={onOpenExplorer} />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, { borderBottomColor: colors.border }]}>
        <Text style={[styles.breadcrumbText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
          {activeEditorTab}
        </Text>
      </View>

      {/* Editor WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: editorHtml }}
        style={{ flex: 1, backgroundColor: colors.background }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        keyboardDisplayRequiresUserAction={false}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data)
            if (msg.type === 'EDITOR_READY') {
              setEditorReady(true)
            } else if (msg.type === 'CONTENT_CHANGE') {
              setContent((prev) => {
                if (prev !== msg.content) {
                  // Mark dirty if changed from original
                  if (msg.content !== originalContent && activeEditorTab) {
                    markDirty(activeEditorTab)
                  } else if (activeEditorTab) {
                    markClean(activeEditorTab)
                  }
                  return msg.content
                }
                return prev
              })
            } else if (msg.type === 'CURSOR_CHANGE') {
              setCursorPosition(msg.line, msg.col)
            } else if (msg.type === 'SHORTCUT_TOGGLE_TERMINAL') {
              setBottomTab('terminal')
              toggleBottomPanel()
            } else if (msg.type === 'SHORTCUT_TOGGLE_SIDEBAR') {
              toggleSidebar()
            } else if (msg.type === 'SHORTCUT_SAVE') {
              handleSave()
            } else if (msg.type === 'SHORTCUT_CLOSE_TAB') {
              if (activeEditorTab) closeFile(activeEditorTab)
            } else if (msg.type === 'SHORTCUT_SEARCH') {
              setSidebarPanel('search')
            }
          } catch (e) {
            // Ignore invalid JSON
          }
        }}
      />

      {/* Global Hotkey Bridge & Desktop Mouse Pointer Overlay */}
      <GlobalHotkeyBridge onSave={handleSave} />
      <DesktopMousePointer />

      {/* Loading overlay */}
      {(loading || !editorReady) && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {loading ? 'Opening file...' : 'Booting IDE Engine...'}
          </Text>
        </View>
      )}
    </View>
  )
}

// Static save accessor for external callers
InlineEditor.save = async () => {
  if ((InlineEditor as any)._currentSave) {
    await (InlineEditor as any)._currentSave()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  breadcrumb: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  breadcrumbText: {
    fontSize: 11,
    opacity: 0.6,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  // Welcome tab styles
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    maxWidth: 480,
    gap: 32,
    padding: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginTop: 12,
  },
  welcomeSubtitle: {
    fontSize: 14,
  },
  welcomeSection: {
    gap: 8,
  },
  welcomeSectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  welcomeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  welcomeActionText: {
    fontSize: 14,
  },
  welcomeTip: {
    fontSize: 13,
    lineHeight: 20,
  },
})
