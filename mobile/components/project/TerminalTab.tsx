import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter } from 'expo-router'
import { useAIStore } from '@/store/ai'
import { useTerminalStore } from '@/store/terminal'
import { api } from '@/lib/api'
import { Terminal as TerminalIcon, StopCircle, Trash2, ArrowUp, ArrowDown, Sparkles, Plus, X } from '@/components/HugeIconsShim'

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

// Separate TerminalSession component to keep the connection alive!
interface TerminalSessionProps {
  projectId: string
  terminalId: string
  visible: boolean
  registerSendInput: (terminalId: string, sendInput: (text: string) => void) => void
  registerClear: (terminalId: string, clear: () => void) => void
  registerDiagnose: (terminalId: string, diagnoseFn: () => void) => void
  onDiagnose: (recentOutput: string) => void
}

function TerminalSession({
  projectId,
  terminalId,
  visible,
  registerSendInput,
  registerClear,
  registerDiagnose,
  onDiagnose,
}: TerminalSessionProps) {
  const { colors, isDark } = useAppTheme()
  const scrollRef = useRef<ScrollView>(null)

  // Read output from the persistent store
  const output = useTerminalStore((s) => s.projects[projectId]?.outputs[terminalId] || '')
  const { appendOutput, clearOutput, setOutput: setStoreOutput } = useTerminalStore()

  // When reconnecting to a tmux session that already has stored output,
  // tmux resends its current screen buffer (prompt/workspace name).
  // We suppress that redraw by anchoring a grace window to when the
  // FIRST data chunk arrives (not mount time), ensuring it covers the
  // actual tmux redraw regardless of WS connection latency.
  const isMountedWithOutput = useRef(output.length > 0)
  const firstDataTimestamp = useRef(0)

  // Use the useTerminal hook for this specific terminalId
  const { connected, error, sendInput } = useTerminal({
    projectId,
    terminalId,
    onOutput: useCallback((data: string, shouldClear: boolean) => {
      // If we mounted with existing stored output, suppress tmux redraw
      if (isMountedWithOutput.current) {
        // Record when the first data chunk arrives
        if (firstDataTimestamp.current === 0) {
          firstDataTimestamp.current = Date.now()
        }
        // Discard all data within 1.5s of the first chunk (tmux redraw window)
        if (Date.now() - firstDataTimestamp.current < 1500) {
          return
        }
        // Grace period over — resume normal output
        isMountedWithOutput.current = false
        firstDataTimestamp.current = 0
      }

      if (shouldClear) {
        setStoreOutput(projectId, terminalId, data)
      } else {
        appendOutput(projectId, terminalId, data)
      }
    }, [projectId, terminalId, appendOutput, setStoreOutput])
  })

  // Register methods with parent
  useEffect(() => {
    registerSendInput(terminalId, sendInput)
  }, [terminalId, sendInput, registerSendInput])

  useEffect(() => {
    registerClear(terminalId, () => clearOutput(projectId, terminalId))
  }, [terminalId, projectId, registerClear, clearOutput])

  // Automatically scroll to end on output change
  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollToEnd({ animated: false })
    }
  }, [output, visible])

  const lines = useMemo(() => output.split('\n'), [output])

  // Register diagnose trigger
  useEffect(() => {
    registerDiagnose(terminalId, () => {
      const recentOutput = lines.slice(-25).join('\n').trim()
      onDiagnose(recentOutput)
    })
  }, [terminalId, lines, onDiagnose, registerDiagnose])

  // Show stored output immediately (even before WS connects) when reconnecting
  const hasStoredOutput = output.length > 0

  return (
    <View style={{ flex: 1, display: visible ? 'flex' : 'none' }}>
      <ScrollView
        ref={scrollRef}
        style={styles.outputArea}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {!connected && !hasStoredOutput && (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.textSecondary} size="small" />
            <Text style={[styles.connectingText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>Connecting...</Text>
          </View>
        )}
        {hasStoredOutput ? (
          <View style={{ paddingBottom: 16 }}>
            {lines.map((line, i) => (
              <Text key={i} style={[styles.output, { color: isDark ? '#E6EDF3' : '#1F2328', fontFamily: 'JetBrainsMono_400Regular' }]} selectable>
                {line}
                {connected && i === lines.length - 1 && <Text style={{ color: '#3FB950' }}>█</Text>}
              </Text>
            ))}
            {!connected && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, opacity: 0.5 }}>
                <ActivityIndicator color={colors.textSecondary} size="small" />
                <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 }}>Reconnecting...</Text>
              </View>
            )}
          </View>
        ) : connected ? (
          <Text style={[styles.placeholderText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
            Ready.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  )
}

export default function TerminalTab({ projectId }: Props) {
  const router = useRouter()
  const { setPendingPrompt, setActiveProject } = useAIStore()

  // Read terminal state from the persistent store
  const terminalStore = useTerminalStore()
  const projectState = terminalStore.getProjectState(projectId)
  const terminals = projectState.terminals
  const activeTerminalId = projectState.activeTerminalId
  const history = projectState.commandHistory

  const sendInputRefs = useRef<Record<string, (text: string) => void>>({})
  const clearRefs = useRef<Record<string, () => void>>({})
  const diagnoseRefs = useRef<Record<string, () => void>>({})

  const registerSendInput = useCallback((terminalId: string, sendInputFn: (text: string) => void) => {
    sendInputRefs.current[terminalId] = sendInputFn
  }, [])

  const registerClear = useCallback((terminalId: string, clearFn: () => void) => {
    clearRefs.current[terminalId] = clearFn
  }, [])

  const registerDiagnose = useCallback((terminalId: string, diagnoseFn: () => void) => {
    diagnoseRefs.current[terminalId] = diagnoseFn
  }, [])

  const { colors, isDark } = useAppTheme()
  const [inputText, setInputText] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)

  const submit = useCallback(() => {
    if (!inputText.trim() && inputText !== '') return
    const sendInput = sendInputRefs.current[activeTerminalId]
    if (sendInput) {
      sendInput(inputText + '\n')
    }

    terminalStore.addToHistory(projectId, inputText)
    setHistoryIndex(-1)
    setIsRunning(true)
    setInputText('')
  }, [inputText, activeTerminalId, projectId, terminalStore])

  const runQuick = useCallback((cmd: string) => {
    const sendInput = sendInputRefs.current[activeTerminalId]
    if (sendInput) {
      sendInput(cmd + '\n')
    }
    setIsRunning(true)
  }, [activeTerminalId])

  const handleClear = useCallback(() => {
    runQuick('clear')
    const clearFn = clearRefs.current[activeTerminalId]
    if (clearFn) {
      clearFn()
    }
    setIsRunning(false)
  }, [runQuick, activeTerminalId])

  const addNewTerminal = () => {
    const newId = `term-${Date.now()}`
    terminalStore.addTerminal(projectId, newId)
  }

  const closeTerminal = (termId: string) => {
    if (terminals.length <= 1) return

    terminalStore.removeTerminal(projectId, termId)

    delete sendInputRefs.current[termId]
    delete clearRefs.current[termId]
    delete diagnoseRefs.current[termId]

    // Kill the container's tmux session asynchronously in the background
    api.terminal.kill(projectId, termId).catch(err => {
      console.warn('Failed to kill terminal session inside container:', err)
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

  const handleDiagnose = useCallback((recentOutput: string) => {
    if (!recentOutput) return
    const prompt = `I am encountering an issue in my terminal command. Here is the recent output:\n\n\`\`\`\n${recentOutput}\n\`\`\`\n\nPlease analyze the logs, diagnose the error, and explain how to resolve it. If necessary, read and edit the code files using your tools.`
    setActiveProject(projectId)
    setPendingPrompt(prompt)
    router.push('/(tabs)/ai')
  }, [projectId, setPendingPrompt, setActiveProject, router])

  const triggerDiagnose = () => {
    const diagnoseFn = diagnoseRefs.current[activeTerminalId]
    if (diagnoseFn) {
      diagnoseFn()
    }
  }

  const triggerStop = () => {
    const sendInput = sendInputRefs.current[activeTerminalId]
    if (sendInput) {
      sendInput('\x03')
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#030303' : '#FFFFFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 160}
    >
      {/* Shell Tabs */}
      <View style={[styles.shellBar, { backgroundColor: isDark ? '#0B0C10' : '#FAFAFA', borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shellTabs}>
          {terminals.map((termId, idx) => {
            const isActive = termId === activeTerminalId
            return (
              <TouchableOpacity
                key={termId}
                onPress={() => terminalStore.setActiveTerminal(projectId, termId)}
                style={[
                  styles.shellTab,
                  {
                    backgroundColor: isActive ? (isDark ? '#030303' : '#FFFFFF') : 'transparent',
                    borderColor: isActive ? colors.border : 'transparent',
                  }
                ]}
                activeOpacity={0.7}
              >
                <TerminalIcon size={10} color={isActive ? colors.text : colors.textSecondary} strokeWidth={1.8} />
                <Text style={[
                  styles.shellTabText,
                  {
                    color: isActive ? colors.text : colors.textSecondary,
                    fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular'
                  }
                ]}>
                  {termId === 'main' ? 'Shell 1' : `Shell ${idx + 1}`}
                </Text>
                {terminals.length > 1 && (
                  <TouchableOpacity
                    onPress={() => closeTerminal(termId)}
                    style={styles.closeTabBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={9} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity
            onPress={addNewTerminal}
            style={[styles.addTabBtn, { backgroundColor: isDark ? '#161821' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <Plus size={12} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </ScrollView>

        {/* Actions */}
        <View style={styles.shellActions}>
          <TouchableOpacity
            onPress={triggerDiagnose}
            style={[styles.shellAction, { backgroundColor: isDark ? '#161821' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <Sparkles size={12} color={'#D2A8FF'} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={triggerStop}
            style={[styles.shellAction, { backgroundColor: isDark ? '#161821' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <StopCircle size={12} color={'#F85149'} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.shellAction, { backgroundColor: isDark ? '#161821' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <Trash2 size={12} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Terminal sessions */}
      <View style={{ flex: 1 }}>
        {terminals.map(termId => (
          <TerminalSession
            key={termId}
            projectId={projectId}
            terminalId={termId}
            visible={termId === activeTerminalId}
            registerSendInput={registerSendInput}
            registerClear={registerClear}
            registerDiagnose={registerDiagnose}
            onDiagnose={handleDiagnose}
          />
        ))}
      </View>

      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#0B0C10' : '#FAFAFA', borderTopColor: colors.border }]}>
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
              style={[styles.quickCmd, { backgroundColor: isDark ? '#030303' : '#FFFFFF', borderColor: colors.border }]}
              onPress={() => runQuick(cmd)}
              activeOpacity={0.7}
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
            placeholder="$"
            placeholderTextColor={colors.textSecondary + '50'}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            blurOnSubmit={false}
          />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {history.length > 0 && (
              <View style={{ flexDirection: 'column', gap: 2 }}>
                <TouchableOpacity onPress={goHistoryUp} style={[styles.historyBtn, { backgroundColor: isDark ? '#030303' : '#EAEEF2' }]}>
                  <ArrowUp size={10} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goHistoryDown} style={[styles.historyBtn, { backgroundColor: isDark ? '#030303' : '#EAEEF2' }]}>
                  <ArrowDown size={10} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? colors.text : (isDark ? '#161821' : '#EAEEF2') }
              ]}
              onPress={submit}
              disabled={!inputText.trim()}
            >
              <ArrowUp size={16} color={inputText.trim() ? colors.background : colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shellBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    borderBottomWidth: 1,
  },
  shellTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  shellTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  shellTabText: { fontSize: 11 },
  closeTabBtn: { paddingHorizontal: 2, marginLeft: 2 },
  addTabBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellActions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  shellAction: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputArea: { flex: 1 },
  outputContent: { padding: 12, paddingBottom: 30 },
  centerLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  connectingText: { fontSize: 11, opacity: 0.5 },
  output: {
    fontSize: 11,
    lineHeight: 16,
  },
  placeholderText: { fontSize: 11, opacity: 0.3 },
  inputContainer: {
    borderTopWidth: 1,
  },
  quickScroll: {
    paddingVertical: 6,
  },
  quickContent: {
    paddingHorizontal: 10,
    gap: 4,
  },
  quickCmd: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quickCmdText: { fontSize: 9 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  historyBtn: {
    padding: 2,
    borderRadius: 3,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
