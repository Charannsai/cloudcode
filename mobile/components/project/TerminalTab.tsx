import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Terminal as TerminalIcon, StopCircle, Trash2, ChevronRight, ArrowUp } from 'lucide-react-native'

interface Props {
  projectId: string
}

const QUICK_COMMANDS = [
  'npm install',
  'npm run dev',
  'ls -la',
  'git status',
  'node index.js',
  'clear',
]

export default function TerminalTab({ projectId }: Props) {
  const { output, connected, error, sendInput, clear } = useTerminal({ projectId })
  const { colors, isDark } = useAppTheme()
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false })
  }, [output])

  const submit = useCallback(() => {
    if (!inputText.trim() && inputText !== '') return
    sendInput(inputText + '\n')
    setInputText('')
  }, [inputText, sendInput])

  const runQuick = useCallback((cmd: string) => {
    sendInput(cmd + '\n')
  }, [sendInput])

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#f9fafb' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 160}
    >
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <TerminalIcon size={14} color={connected ? '#10b981' : colors.textSecondary} strokeWidth={2.5} />
          <Text style={[styles.statusText, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {connected ? 'MAIN_SHELL' : 'CONNECTING...'}
          </Text>
        </View>
        <View style={styles.statusActions}>
          <TouchableOpacity 
            onPress={() => sendInput('\x03')} 
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            <StopCircle size={14} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={clear} 
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
        {!connected && !error && (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.textSecondary} size="small" />
            <Text style={[styles.connectingText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>Initializing secure tunnel...</Text>
          </View>
        )}
        {output ? (
          <Text style={[styles.output, { color: isDark ? '#e5e7eb' : '#111827', fontFamily: 'JetBrainsMono_400Regular' }]} selectable>
            {output}
            {connected && <Text style={{ color: colors.primary }}>█</Text>}
          </Text>
        ) : connected ? (
          <Text style={[styles.placeholderText, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
            Node environment ready.
          </Text>
        ) : null}
      </ScrollView>

      {/* Input row */}
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
          <Text style={[styles.promptSymbol, { color: '#10b981', fontFamily: 'JetBrainsMono_700Bold' }]}>{'>'}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={submit}
            placeholder="Type a command..."
            placeholderTextColor={colors.textSecondary + '60'}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            blurOnSubmit={false}
            onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          />
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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  promptSymbol: {
    fontSize: 18,
    marginRight: 4,
  },
})

