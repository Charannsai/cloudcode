import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, StyleSheet as StyleSheetRN
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Sparkles, ArrowUp, User, Volume2, VolumeX, Copy, Mic } from 'lucide-react-native'
import { useAIStore, ChatMessage } from '@/store/ai'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'
import * as Speech from 'expo-speech'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'

interface Props {
  projectId: string
}

export default function AITab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const {
    messages, isStreaming, currentStreamText,
    sendMessage, clearChat, activeProjectId, setActiveProject
  } = useAIStore()

  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  // Force active project context to this workspace on mount/change
  useEffect(() => {
    setActiveProject(projectId)
  }, [projectId])

  useEffect(() => {
    // Scroll to bottom on new messages
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, currentStreamText])

  useEffect(() => {
    // Set up voice listeners
    Voice.onSpeechStart = () => setIsListening(true)
    Voice.onSpeechEnd = () => setIsListening(false)
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0])
      }
    }
    Voice.onSpeechError = () => setIsListening(false)

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {})
      Speech.stop().catch(() => {})
    }
  }, [])

  const toggleListening = async () => {
    if (isListening) {
      await Voice.stop().catch(() => {})
    } else {
      setInputText('')
      await Voice.start('en-US').catch(() => {})
    }
  }

  const handleSpeak = async (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      await Speech.stop().catch(() => {})
      setSpeakingMessageId(null)
    } else {
      await Speech.stop().catch(() => {})
      setSpeakingMessageId(messageId)
      const plainText = text
        .replace(/```[\s\S]*?```/g, '[code block]')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#\-+]/g, '')
        .trim()

      Speech.speak(plainText, {
        language: 'en',
        onDone: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
        onStopped: () => setSpeakingMessageId(null),
      })
    }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    setInputText('')
    await sendMessage(text, projectId)
  }

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 13.5, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    heading1: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 6, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 8, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11.5, padding: 3, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11.5, padding: 10, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 2, marginBottom: 2 },
    list_item: { marginTop: 1, marginBottom: 1 },
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 190 : 0}
      style={styles.container}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !isStreaming && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}>
              <Sparkles size={24} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.2} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Workspace AI Assistant
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Ask questions or explain code in the context of this workspace.
            </Text>
          </View>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <View key={msg.id} style={[styles.bubbleRow, isUser ? styles.userRow : styles.modelRow]}>
              {!isUser && (
                <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}>
                  <Sparkles size={12} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.5} />
                </View>
              )}
              <View style={[
                styles.bubble,
                isUser 
                  ? { backgroundColor: isDark ? '#21262D' : '#F0F2F5', borderBottomRightRadius: 2 } 
                  : { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 2 }
              ]}>
                {isUser ? (
                  <Text style={{ color: isDark ? '#FFFFFF' : '#1F2328', fontSize: 13.5, fontFamily: 'Inter_400Regular' }}>
                    {msg.text}
                  </Text>
                ) : (
                  <View>
                    <Markdown style={mdStyles}>{msg.text}</Markdown>
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => Clipboard.setStringAsync(msg.text)}>
                        <Copy size={11} color={colors.textSecondary} />
                        <Text style={[styles.actionText, { color: colors.textSecondary }]}>Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleSpeak(msg.id, msg.text)}>
                        {speakingMessageId === msg.id ? (
                          <VolumeX size={11} color={colors.primary} />
                        ) : (
                          <Volume2 size={11} color={colors.textSecondary} />
                        )}
                        <Text style={[styles.actionText, { color: speakingMessageId === msg.id ? colors.primary : colors.textSecondary }]}>
                          {speakingMessageId === msg.id ? 'Stop' : 'Speak'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              {isUser && (
                <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}>
                  <User size={12} color={colors.textSecondary} />
                </View>
              )}
            </View>
          )
        })}

        {isStreaming && (
          <View style={[styles.bubbleRow, styles.modelRow]}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}>
              <Sparkles size={12} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.5} />
            </View>
            <View style={[styles.bubble, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 2 }]}>
              <Text style={{ color: colors.text, fontSize: 13.5, fontFamily: 'Inter_400Regular' }}>
                {currentStreamText || 'Thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input row */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <View style={[styles.inputBox, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isStreaming ? 'AI is thinking...' : 'Ask AI about workspace...'}
            placeholderTextColor={colors.textSecondary + '60'}
            multiline
            style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
            editable={!isStreaming}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.inputBtn, isListening && { backgroundColor: '#F85149' }]}
            onPress={toggleListening}
            disabled={isStreaming}
            activeOpacity={0.7}
          >
            {isListening ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Mic size={13} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.inputBtn,
              {
                backgroundColor: inputText.trim()
                  ? (isDark ? '#F3F4F6' : '#0E1116')
                  : (isDark ? '#1C2128' : '#F6F8FA')
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming}
            activeOpacity={0.7}
          >
            <ArrowUp size={14} color={inputText.trim() ? (isDark ? '#0E1116' : '#FFFFFF') : colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, marginBottom: 6 },
  emptySubtitle: { fontSize: 12, opacity: 0.6, textAlign: 'center', lineHeight: 18 },
  bubbleRow: { flexDirection: 'row', marginVertical: 6, gap: 8, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  modelRow: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  avatarCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bubble: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 1 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  inputContainer: { padding: 12, borderTopWidth: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  input: { flex: 1, fontSize: 13, maxHeight: 100, paddingVertical: 6, paddingHorizontal: 4 },
  inputBtn: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }
})
