import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter } from 'expo-router'
import { useAIStore } from '@/store/ai'
import { Terminal as TerminalIcon, StopCircle, Trash2, ChevronRight, ArrowUp, ArrowDown, Sparkles } from 'lucide-react-native'

interface Props {
  projectId: string
}

const QUICK_COMMANDS = [
  'npm install',
  'npm run dev',
  'pkill -f node',
  'ls -la',
  'git status',
  'node index.js',
  'clear',
]

export default function TerminalTab({ projectId }: Props) {
  const router = useRouter()
  const { setPendingPrompt, setActiveProject } = useAIStore()
  const [terminals, setTerminals] = useState<string[]>(['main'])
  const [activeTerminalId, setActiveTerminalId] = useState('main')
  const [terminalOutputs, setTerminalOutputs] = useState<Record<string, string>>({
    main: ''
  })

  const { output, connected, error, sendInput, clear } = useTerminal({
    projectId,
    terminalId: activeTerminalId
  })

  const { colors, isDark } = useAppTheme()
  const [inputText, setInputText] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  // Sync hook output to cached active terminal's log mapping
  useEffect(() => {
    if (output) {
      setTerminalOutputs(prev => ({
        ...prev,
        [activeTerminalId]: output
      }))
    }
  }, [output, activeTerminalId])

  const activeOutput = terminalOutputs[activeTerminalId] || ''
  const lines = useMemo(() => activeOutput.split('\n'), [activeOutput])

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [activeOutput])

  const submit = useCallback(() => {
    if (!inputText.trim() && inputText !== '') return
    sendInput(inputText + '\n')

    setHistory(prev => [...prev, inputText.trim()])
    setHistoryIndex(-1)
    setIsRunning(true)
    setInputText('')
  }, [inputText, sendInput])

  const runQuick = useCallback((cmd: string) => {
    sendInput(cmd + '\n')
    setIsRunning(true)
  }, [sendInput])

  const handleClear = useCallback(() => {
    runQuick('clear')
    clear()
    setTerminalOutputs(prev => ({
      ...prev,
      [activeTerminalId]: ''
    }))
    setIsRunning(false)
  }, [runQuick, clear, activeTerminalId])

  const addNewTerminal = () => {
    const newId = `term-${Date.now()}`
    setTerminals(prev => [...prev, newId])
    setActiveTerminalId(newId)
  }

  const closeTerminal = (termId: string) => {
    if (terminals.length <= 1) return
    const index = terminals.indexOf(termId)
    const newTerminals = terminals.filter(t => t !== termId)
    setTerminals(newTerminals)
    
    if (activeTerminalId === termId) {
      const newActiveIndex = Math.max(0, index - 1)
      setActiveTerminalId(newTerminals[newActiveIndex])
    }

    setTerminalOutputs(prev => {
      const copy = { ...prev }
      delete copy[termId]
      return copy
    })
  }

  const goHistoryUp = () => {
    if (history.length > 0) {
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(newIndex)
      setInputText(history[newIndex])
    }
  }

  const goHistoryDown = () => {
    if (historyIndex !== -1) {
      const newIndex = historyIndex + 1
      if (newIndex >= history.length) {
        setHistoryIndex(-1)
        setInputText('')
      } else {
        setHistoryIndex(newIndex)
        setInputText(history[newIndex])
      }
    }
  }

  const handleDiagnose = useCallback(() => {
    const recentOutput = lines.slice(-25).join('\n').trim()
    if (!recentOutput) return

    const prompt = `I am encountering an issue in my terminal command. Here is the recent output:\n\n\`\`\`\n${recentOutput}\n\`\`\`\n\nPlease analyze the logs, diagnose the error, and explain how to resolve it. If necessary, read and edit the code files using your tools.`

    setActiveProject(projectId)
    setPendingPrompt(prompt)
    router.push('/(tabs)/ai')
  }, [lines, projectId, setPendingPrompt, setActiveProject, router])

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 160}
    >
      {/* Tabs Scrollbar */}
      <View style={[styles.tabsScrollContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {terminals.map((termId, idx) => {
            const isActive = termId === activeTerminalId
            return (
              <TouchableOpacity
                key={termId}
                onPress={() => setActiveTerminalId(termId)}
                style={[
                  styles.tabItem,
                  isActive
                    ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: colors.border }
                    : { borderColor: 'transparent' }
                ]}
                activeOpacity={0.7}
              >
                <TerminalIcon size={11} color={isActive ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.text : colors.textSecondary,
                    fontFamily: isActive ? 'Inter_700Bold' : 'Inter_500Medium'
                  }
                ]}>
                  {termId === 'main' ? 'Shell 1' : `Shell ${idx + 1}`}
                </Text>
                {terminals.length > 1 && (
                  <TouchableOpacity
                    onPress={() => closeTerminal(termId)}
                    style={styles.closeTabBtn}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontFamily: 'Inter_700Bold' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity
            onPress={addNewTerminal}
            style={[styles.addTabBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <TerminalIcon size={14} color={connected ? '#10b981' : colors.textSecondary} strokeWidth={2.5} />
          <Text style={[styles.statusText, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {connected 
              ? `${activeTerminalId === 'main' ? 'SHELL 1' : `SHELL ${terminals.indexOf(activeTerminalId) + 1}`} - CONNECTED` 
              : 'TUNNELING...'}
          </Text>
        </View>
        <View style={styles.statusActions}>
          <TouchableOpacity
            onPress={handleDiagnose}
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => sendInput('\x03')}
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            <StopCircle size={14} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Terminal output */}
      <ScrollView
        ref={scrollRef}
        style={styles.outputArea}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {!connected && !activeOutput && (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.textSecondary} size="small" />
            <Text style={[styles.connectingText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>Initializing secure tunnel...</Text>
          </View>
        )}
        {activeOutput ? (
          <View style={{ paddingBottom: 16 }}>
            {lines.map((line, i) => (
              <Text key={i} style={[styles.output, { color: '#fafafa', fontFamily: 'JetBrainsMono_400Regular' }]} selectable>
                {line}
                {connected && i === lines.length - 1 && <Text style={{ color: colors.primary }}>█</Text>}
              </Text>
            ))}
          </View>
        ) : connected ? (
          <Text style={[styles.placeholderText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
            Shell environment active.
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quickContent}
          keyboardShouldPersistTaps="always"
        >
          {QUICK_COMMANDS.map((cmd) => (
            <TouchableOpacity
              key={cmd}
              style={[styles.quickCmd, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => runQuick(cmd)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickCmdText, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={submit}
            placeholder={isRunning ? "Running process..." : "Type a command..."}
            placeholderTextColor={colors.textSecondary + '60'}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            blurOnSubmit={false}
            onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {history.length > 0 && (
              <View style={{ flexDirection: 'column', gap: 4 }}>
                <TouchableOpacity onPress={goHistoryUp} style={{ padding: 2, backgroundColor: colors.background, borderRadius: 4 }}>
                  <ArrowUp size={12} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goHistoryDown} style={{ padding: 2, backgroundColor: colors.background, borderRadius: 4 }}>
                  <ArrowDown size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? colors.primary : colors.background }
              ]}
              onPress={submit}
              disabled={!inputText.trim()}
            >
              <ArrowUp size={18} color={inputText.trim() ? colors.background : colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsScrollContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 11,
  },
  closeTabBtn: {
    paddingHorizontal: 3,
    marginLeft: 3,
  },
  addTabBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputArea: { flex: 1 },
  outputContent: { padding: 16, paddingBottom: 40 },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  connectingText: { fontSize: 13, opacity: 0.6 },
  output: {
    fontSize: 13,
    lineHeight: 20,
  },
  placeholderText: { fontSize: 13, opacity: 0.4 },
  inputContainer: {
    borderTopWidth: 1,
  },
  quickScroll: {
    paddingVertical: 10,
  },
  quickContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickCmd: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quickCmdText: { fontSize: 11 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

