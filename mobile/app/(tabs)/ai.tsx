import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal,
  CheckCircle2, Loader2, AlertCircle, Wrench,
} from 'lucide-react-native'
import { useAuthStore } from '@/store/auth'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useProjectsStore } from '@/store/projects'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function ToolCallCard({ tool, isDark, colors }: { tool: ToolCallInfo; isDark: boolean; colors: any }) {
  const iconMap: Record<string, any> = {
    read_file: FileCode,
    edit_file: FileCode,
    create_file: FileCode,
    delete_file: FileCode,
    run_command: Terminal,
    list_files: FileCode,
  }
  const Icon = iconMap[tool.name] || Wrench
  const labelMap: Record<string, string> = {
    read_file: 'Reading',
    edit_file: 'Editing',
    create_file: 'Creating',
    delete_file: 'Deleting',
    run_command: 'Running',
    list_files: 'Listing',
  }

  const label = labelMap[tool.name] || tool.name
  const target = (tool.args?.path || tool.args?.command || '') as string

  return (
    <View style={[styles.toolCard, { backgroundColor: isDark ? '#0d1117' : '#f0f4f8', borderColor: isDark ? '#1c2432' : '#d0d7de' }]}>
      <View style={styles.toolHeader}>
        {tool.status === 'running' ? (
          <ActivityIndicator size={12} color="#f59e0b" />
        ) : tool.status === 'done' ? (
          <CheckCircle2 size={14} color="#10b981" />
        ) : (
          <AlertCircle size={14} color="#ef4444" />
        )}
        <Icon size={14} color={isDark ? '#8b949e' : '#656d76'} />
        <Text style={[styles.toolLabel, { color: isDark ? '#c9d1d9' : '#1f2328' }]}>
          {label}
        </Text>
        <Text style={[styles.toolTarget, { color: isDark ? '#58a6ff' : '#0969da' }]} numberOfLines={1}>
          {target}
        </Text>
      </View>
    </View>
  )
}

function MessageBubble({ message, isDark, colors }: {
  message: ChatMessage; isDark: boolean; colors: any
}) {
  const isUser = message.role === 'user'

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.messageBubbleWrapper, isUser ? styles.userWrapper : styles.modelWrapper]}
    >
      {!isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1a1a2e' : '#eef2ff' }]}>
          <Sparkles size={16} color={isDark ? '#818cf8' : '#6366f1'} />
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: isDark ? '#1e40af' : '#3b82f6' }]
          : [styles.modelBubble, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: isDark ? '#1f2937' : '#e2e8f0' }]
      ]}>
        {/* Tool calls */}
        {message.toolCalls?.map((tc, i) => (
          <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
        ))}

        <Text style={[
          styles.messageText,
          { color: isUser ? '#ffffff' : (isDark ? '#e5e7eb' : '#1e293b') }
        ]}>
          {message.text}
        </Text>
      </View>

      {isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
          <User size={16} color={isDark ? '#60a5fa' : '#3b82f6'} />
        </View>
      )}
    </Animated.View>
  )
}

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    messages, isStreaming, currentStreamText, currentToolCalls,
    sendMessage, clearChat
  } = useAIStore()

  const [inputText, setInputText] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  // Fetch projects if not loaded
  useEffect(() => {
    if (projects.length === 0) fetchProjects()
  }, [])

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, currentStreamText])

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    if (!selectedProjectId) return

    const text = inputText.trim()
    setInputText('')
    await sendMessage(text, selectedProjectId)
  }

  const username = user?.login || 'guest'
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#111' : '#eee' }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiIcon, { backgroundColor: isDark ? '#1a1a2e' : '#eef2ff' }]}>
            <Sparkles size={20} color={isDark ? '#818cf8' : '#6366f1'} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>CloudCode AI</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {selectedProject ? selectedProject.name : 'Select a project'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Trash2 size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Project selector */}
      {projects.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectBar} contentContainerStyle={styles.projectBarContent}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.projectChip,
                {
                  backgroundColor: selectedProjectId === p.id
                    ? (isDark ? '#1e40af' : '#3b82f6')
                    : (isDark ? '#111' : '#f3f4f6'),
                  borderColor: selectedProjectId === p.id
                    ? (isDark ? '#2563eb' : '#60a5fa')
                    : (isDark ? '#222' : '#e5e7eb'),
                }
              ]}
              onPress={() => setSelectedProjectId(p.id)}
            >
              <Text style={[
                styles.projectChipText,
                {
                  color: selectedProjectId === p.id ? '#fff' : (isDark ? '#ccc' : '#555'),
                }
              ]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !isStreaming && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#111' : '#f0f4ff' }]}>
              <Sparkles size={40} color={isDark ? '#6366f1' : '#4f46e5'} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Hi {username} 👋
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ask me to read, edit, or create code{'\n'}in your project. I can also run commands.
            </Text>

            {/* Quick prompts */}
            <View style={styles.quickPrompts}>
              {[
                '📁 Show me the project structure',
                '🐛 Find and fix any bugs',
                '✨ Add a new feature',
                '📦 Install dependencies',
              ].map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickPrompt, { backgroundColor: isDark ? '#111' : '#f8f9fa', borderColor: isDark ? '#222' : '#e8e8e8' }]}
                  onPress={() => {
                    setInputText(prompt.replace(/^[^\s]+ /, ''))
                  }}
                >
                  <Text style={[styles.quickPromptText, { color: isDark ? '#ccc' : '#444' }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isDark={isDark} colors={colors} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.messageBubbleWrapper, styles.modelWrapper]}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1a1a2e' : '#eef2ff' }]}>
              <Sparkles size={16} color={isDark ? '#818cf8' : '#6366f1'} />
            </View>
            <View style={[styles.bubble, styles.modelBubble, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: isDark ? '#1f2937' : '#e2e8f0' }]}>
              {currentToolCalls.map((tc, i) => (
                <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
              ))}
              {currentStreamText ? (
                <Text style={[styles.messageText, { color: isDark ? '#e5e7eb' : '#1e293b' }]}>
                  {currentStreamText}
                  <Text style={{ color: colors.primary }}>▊</Text>
                </Text>
              ) : currentToolCalls.length === 0 ? (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text style={[styles.typingText, { color: colors.textSecondary }]}>Thinking...</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#0a0a0a' : '#fff', borderTopColor: isDark ? '#1a1a1a' : '#eee' }]}>
        <View style={[styles.inputBox, { backgroundColor: isDark ? '#111' : '#f3f4f6', borderColor: isDark ? '#222' : '#e0e0e0' }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isStreaming ? 'AI is working...' : 'Ask AI to code anything...'}
            placeholderTextColor={isDark ? '#444' : '#999'}
            multiline
            style={[styles.input, { color: colors.text }]}
            editable={!isStreaming}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !isStreaming
                  ? (isDark ? '#6366f1' : '#4f46e5')
                  : (isDark ? '#1a1a1a' : '#e5e7eb')
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming}
          >
            <ArrowUp
              size={20}
              color={inputText.trim() && !isStreaming ? '#fff' : (isDark ? '#555' : '#999')}
              strokeWidth={3}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 1 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  projectBar: { maxHeight: 48 },
  projectBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  projectChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  projectChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  messagesContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center',
    lineHeight: 22, opacity: 0.7, marginBottom: 30,
  },
  quickPrompts: { width: '100%', gap: 8 },
  quickPrompt: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  quickPromptText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  messageBubbleWrapper: {
    flexDirection: 'row', marginBottom: 16, gap: 8,
    alignItems: 'flex-start',
  },
  userWrapper: { justifyContent: 'flex-end' },
  modelWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.72, borderRadius: 18, padding: 14,
  },
  userBubble: { borderBottomRightRadius: 4 },
  modelBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: {
    fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21,
  },
  toolCard: {
    borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1,
  },
  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  toolLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  toolTarget: { fontSize: 11, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4,
  },
  typingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 16,
    paddingVertical: 8, gap: 8,
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
    maxHeight: 120, paddingVertical: 6,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
})
