import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  projectId: string
}

const QUICK_COMMANDS = [
  'npm install',
  'npm run dev',
  'ls -la',
  'git status',
  'git pull',
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
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f0f0f0' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.connDot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
        <Text style={[styles.connText, { color: colors.textSecondary }]}>
          {connected ? 'Cloud Shell Active' : error ? 'Disconnected' : 'Connecting...'}
        </Text>
        <TouchableOpacity onPress={clear} style={[styles.actionBtn, { backgroundColor: colors.background }]}>
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Terminal output */}
      <ScrollView
        ref={scrollRef}
        style={styles.outputArea}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!connected && !error && (
          <Text style={[styles.connectingText, { color: colors.textSecondary }]}>Initializing secure tunnel...</Text>
        )}
        {output ? (
          <Text style={[styles.output, { color: isDark ? '#e0e0e0' : '#1a1a1a' }]} selectable>
            {output}
          </Text>
        ) : connected ? (
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Terminal ready. Type a command or use shortcuts below.
          </Text>
        ) : null}
        <Text style={[styles.cursor, { color: colors.primary }]}>{connected ? '█' : ''}</Text>
      </ScrollView>

      {/* Quick commands */}
      <View style={{ backgroundColor: colors.card }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.quickScroll, { borderTopColor: colors.border }]}
          contentContainerStyle={styles.quickContent}
          keyboardShouldPersistTaps="always"
        >
          {QUICK_COMMANDS.map((cmd) => (
            <TouchableOpacity
              key={cmd}
              style={[styles.quickCmd, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => runQuick(cmd)}
            >
              <Text style={[styles.quickCmdText, { color: colors.primary }]}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input row */}
        <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.success} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={submit}
            placeholder="Run command..."
            placeholderTextColor={colors.textSecondary + '80'}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.textSecondary + '40' }]} 
            onPress={submit}
            disabled={!inputText.trim()}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  connDot: { width: 4, height: 4, borderRadius: 4 },
  connText: { fontSize: 13, fontWeight: '700', flex: 1 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  outputArea: { flex: 1 },
  outputContent: { padding: 16, paddingBottom: 24 },
  connectingText: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  output: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
  },
  placeholderText: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.6 },
  cursor: { fontSize: 14, marginTop: 4 },
  quickScroll: {
    maxHeight: 56,
    borderTopWidth: 1,
  },
  quickContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
  },
  quickCmd: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickCmdText: { fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

