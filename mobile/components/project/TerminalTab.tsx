import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native'
import { useTerminal } from '@/hooks/useTerminal'

interface Props {
  projectId: string
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const QUICK_COMMANDS = [
  'npm install',
  'npm run dev',
  'npm start',
  'ls -la',
  'git status',
  'git pull',
  'node index.js',
  'clear',
]

export default function TerminalTab({ projectId }: Props) {
  const { output, connected, error, sendInput, clear } = useTerminal({ projectId })
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  // Auto-scroll to bottom when output changes
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={[styles.connDot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
        <Text style={styles.connText}>{connected ? 'Connected' : error ? 'Error' : 'Connecting...'}</Text>
        <View style={styles.statusActions}>
          <TouchableOpacity onPress={clear} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Terminal output */}
      <ScrollView
        ref={scrollRef}
        style={styles.outputArea}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!connected && !error && (
          <Text style={styles.connectingText}>Connecting to terminal...</Text>
        )}
        {output ? (
          <Text style={styles.output} selectable>
            {output}
          </Text>
        ) : connected ? (
          <Text style={styles.placeholderText}>
            Terminal ready. Type a command or use quick commands below.
          </Text>
        ) : null}
        <Text style={styles.cursor}>{connected ? '█' : ''}</Text>
      </ScrollView>

      {/* Quick commands */}
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
            style={styles.quickCmd}
            onPress={() => runQuick(cmd)}
          >
            <Text style={styles.quickCmdText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input row */}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={submit}
          placeholder="enter command..."
          placeholderTextColor="#2a2a4a"
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={submit}>
          <Text style={styles.sendBtnText}>↵</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0c0c18',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    gap: 8,
  },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { color: '#4a4a6a', fontSize: 12, flex: 1 },
  statusActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnText: { color: '#6a6a8a', fontSize: 12 },
  errorBanner: {
    backgroundColor: '#ef444420',
    padding: 10,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  errorText: { color: '#ef4444', fontSize: 12 },
  outputArea: { flex: 1 },
  outputContent: { padding: 14, paddingBottom: 8 },
  connectingText: { color: '#3a3a5a', fontSize: 13, fontFamily: 'monospace' },
  output: {
    color: '#c8d3e0',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  placeholderText: { color: '#2a2a4a', fontSize: 13, fontFamily: 'monospace' },
  cursor: {
    color: '#7c6bff',
    fontSize: 14,
    marginTop: 2,
  },
  quickScroll: {
    maxHeight: 48,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  quickContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  quickCmd: {
    backgroundColor: '#151525',
    borderWidth: 1,
    borderColor: '#ffffff10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickCmdText: {
    color: '#7c9aff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e0e1a',
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  prompt: {
    color: '#22c55e',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 6,
  },
  sendBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#7c6bff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
})
