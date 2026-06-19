import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Terminal as TerminalIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native'
import { useFocusEffect } from 'expo-router'

const QUICK_COMMANDS = [
  'docker ps',
  'docker stats --no-stream',
  'df -h',
  'free -m',
  'git --version',
  'node -v',
  'clear',
]

export default function GlobalTerminalScreen() {
  const { colors, isDark } = useAppTheme()
  const [output, setOutput] = useState('')
  const [inputText, setInputText] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<ScrollView>(null)

  // Attach useTerminal with projectId = 'global'
  const { connected, error, sendInput } = useTerminal({
    projectId: 'global',
    onOutput: useCallback((data: string, shouldClear: boolean) => {
      setOutput(prev => shouldClear ? data : prev + data)
    }, [])
  })

  // Automatically scroll to end when output changes
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [output])

  const submit = useCallback(() => {
    if (!inputText.trim() && inputText !== '') return
    sendInput(inputText + '\n')
    setHistory(prev => [...prev, inputText.trim()])
    setHistoryIndex(-1)
    setInputText('')
  }, [inputText, sendInput])

  const runQuick = useCallback((cmd: string) => {
    sendInput(cmd + '\n')
  }, [sendInput])

  const handleClear = useCallback(() => {
    runQuick('clear')
    setOutput('')
  }, [runQuick])

  const handleHistoryUp = () => {
    if (history.length === 0) return
    const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
    setHistoryIndex(nextIdx)
    setInputText(history[nextIdx])
  }

  const handleHistoryDown = () => {
    if (historyIndex === -1) return
    if (historyIndex === history.length - 1) {
      setHistoryIndex(-1)
      setInputText('')
    } else {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setInputText(history[nextIdx])
    }
  }

  const lines = useMemo(() => output.split('\n'), [output])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TerminalIcon size={18} color={colors.text} />
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Host Terminal</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Trash2 size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.outputArea}
          contentContainerStyle={styles.outputContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: '#F85149', fontFamily: 'JetBrainsMono_400Regular' }]}>
                {error}
              </Text>
            </View>
          )}

          {!connected && !output && (
            <View style={styles.centerLoading}>
              <ActivityIndicator color={colors.textSecondary} size="small" />
              <Text style={[styles.connectingText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                Connecting to Host Shell...
              </Text>
            </View>
          )}

          {output ? (
            <View style={{ paddingBottom: 16 }}>
              {lines.map((line, i) => (
                <Text key={i} style={[styles.outputText, { color: isDark ? '#E6EDF3' : '#1F2328', fontFamily: 'JetBrainsMono_400Regular' }]} selectable>
                  {line}
                  {connected && i === lines.length - 1 && <Text style={{ color: '#3FB950' }}>█</Text>}
                </Text>
              ))}
            </View>
          ) : connected ? (
            <Text style={[styles.placeholderText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
              Ready. admin@cloudcode-host:~$
            </Text>
          ) : null}
        </ScrollView>

        {/* Quick commands bar */}
        <View style={[styles.quickBar, { borderTopColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
            {QUICK_COMMANDS.map((cmd) => (
              <TouchableOpacity
                key={cmd}
                style={[styles.quickCmd, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}
                onPress={() => runQuick(cmd)}
              >
                <Text style={[styles.quickCmdText, { color: colors.textSecondary }]}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: isDark ? '#0E1116' : '#FFFFFF' }]}>
          <View style={styles.historyControls}>
            <TouchableOpacity style={[styles.historyBtn, { borderColor: colors.border }]} onPress={handleHistoryUp}>
              <ArrowUp size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.historyBtn, { borderColor: colors.border }]} onPress={handleHistoryDown}>
              <ArrowDown size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type host command..."
            placeholderTextColor={colors.textSecondary + '70'}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onSubmitEditing={submit}
            blurOnSubmit={false}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
  },
  clearBtn: {
    padding: 6,
  },
  outputArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  outputContent: {
    flexGrow: 1,
  },
  outputText: {
    fontSize: 12,
    lineHeight: 18,
  },
  placeholderText: {
    fontSize: 12,
    opacity: 0.6,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectingText: {
    fontSize: 11,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 81, 73, 0.08)',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
  },
  quickBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  quickCmd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickCmdText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  historyControls: {
    flexDirection: 'row',
    gap: 4,
  },
  historyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'JetBrainsMono_400Regular',
  },
})
