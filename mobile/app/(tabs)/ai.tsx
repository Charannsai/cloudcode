import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal,
  CheckCircle2, Loader2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon
} from 'lucide-react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useProjectsStore } from '@/store/projects'
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'

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

  const opacity = useSharedValue(1)

  useEffect(() => {
    if (tool.status === 'running') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        true
      )
    } else {
      opacity.value = withTiming(1, { duration: 300 })
    }
  }, [tool.status])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[styles.toolCard, animStyle, { backgroundColor: isDark ? '#111' : '#fcfcfc', borderColor: isDark ? '#222' : '#eaeaea' }]}>
      <View style={styles.toolHeader}>
        {tool.status === 'running' ? (
          <ActivityIndicator size={10} color={isDark ? '#fff' : '#000'} />
        ) : tool.status === 'done' ? (
          <CheckCircle2 size={12} color={isDark ? '#fff' : '#000'} />
        ) : (
          <AlertCircle size={12} color={isDark ? '#fff' : '#000'} />
        )}
        <Icon size={12} color={isDark ? '#a1a1aa' : '#52525b'} />
        <Text style={[styles.toolLabel, { color: isDark ? '#a1a1aa' : '#52525b' }]}>
          {label}
        </Text>
        <Text style={[styles.toolTarget, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
          {target}
        </Text>
      </View>
    </Animated.View>
  )
}

function MessageBubble({ message, isDark, colors }: {
  message: ChatMessage; isDark: boolean; colors: any
}) {
  const isUser = message.role === 'user'

  const mdStyles = {
    body: { color: isDark ? '#f4f4f5' : '#27272a', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
    heading1: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, marginBottom: 8, color: isDark ? '#fff' : '#000' },
    heading2: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 12, marginBottom: 6, color: isDark ? '#fff' : '#000' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#fff' : '#000', fontSize: 13, padding: 4, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#eee' : '#111', fontSize: 13, padding: 12, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#eaeaea' },
    paragraph: { marginTop: 4, marginBottom: 4 },
    list_item: { marginTop: 2, marginBottom: 2 },
    link: { color: isDark ? '#60a5fa' : '#3b82f6', textDecorationLine: 'underline' } as const,
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.messageBubbleWrapper, isUser ? styles.userWrapper : styles.modelWrapper]}
    >
      {!isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#111' : '#f5f5f5', borderColor: isDark ? '#222' : '#eaeaea', borderWidth: 1 }]}>
          <Bot size={16} color={isDark ? '#ccc' : '#444'} />
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: isDark ? '#222' : '#000', shadowColor: '#000' }]
          : [styles.modelBubble, { backgroundColor: isDark ? '#111' : '#fff', borderColor: isDark ? '#222' : '#eaeaea' }]
      ]}>
        {/* Tool calls */}
        {message.toolCalls?.map((tc, i) => (
          <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
        ))}

        {isUser ? (
          <Text style={[
            styles.messageText,
            { color: '#ffffff' }
          ]}>
            {message.text}
          </Text>
        ) : (
          <View>
            <Markdown style={mdStyles}>
              {message.text}
            </Markdown>

            {/* AI Action Row */}
            {message.text ? (
              <View style={[styles.actionRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#2a2a2a' : '#ebebeb' }]} 
                  onPress={() => Clipboard.setStringAsync(message.text)}
                  activeOpacity={0.7}
                >
                  <Copy size={12} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.actionText, { color: isDark ? '#888' : '#666' }]}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#2a2a2a' : '#ebebeb' }]} 
                  onPress={() => Share.share({ message: message.text })}
                  activeOpacity={0.7}
                >
                  <ShareIcon size={12} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.actionText, { color: isDark ? '#888' : '#666' }]}>Share</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#222' : '#f5f5f5', borderColor: isDark ? '#333' : '#eaeaea', borderWidth: 1 }]}>
          <User size={16} color={isDark ? '#ccc' : '#444'} />
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

  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  // Hide the global tab bar completely when on this screen
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      return () => setTabBarVisible(true)
    }, [])
  )

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

  const mdStyles = {
    body: { color: isDark ? '#f4f4f5' : '#27272a', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
    heading1: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, marginBottom: 8, color: isDark ? '#fff' : '#000' },
    heading2: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 12, marginBottom: 6, color: isDark ? '#fff' : '#000' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#fff' : '#000', fontSize: 13, padding: 4, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#eee' : '#111', fontSize: 13, padding: 12, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#eaeaea' },
    paragraph: { marginTop: 4, marginBottom: 4 },
    list_item: { marginTop: 2, marginBottom: 2 },
    link: { color: isDark ? '#60a5fa' : '#3b82f6', textDecorationLine: 'underline' } as const,
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#111' : '#eaeaea' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/projects')}
            style={[styles.backBtn, { backgroundColor: isDark ? '#111' : '#f5f5f5', borderWidth: 1, borderColor: isDark ? '#222' : '#eaeaea' }]}
          >
            <ArrowLeft size={18} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
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
                    ? (isDark ? '#fff' : '#000')
                    : (isDark ? '#111' : '#fff'),
                  borderColor: selectedProjectId === p.id
                    ? (isDark ? '#fff' : '#000')
                    : (isDark ? '#222' : '#eaeaea'),
                }
              ]}
              onPress={() => setSelectedProjectId(p.id)}
            >
              <Text style={[
                styles.projectChipText,
                {
                  color: selectedProjectId === p.id ? (isDark ? '#000' : '#fff') : (isDark ? '#aaa' : '#555'),
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
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#111' : '#fafafa', borderColor: isDark ? '#222' : '#eaeaea' }]}>
              <Sparkles size={32} color={isDark ? '#ccc' : '#444'} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Hi {username}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ask me to read, edit, or create code{'\n'}in your project. I can also run commands.
            </Text>

            {/* Quick prompts */}
            <View style={styles.quickPrompts}>
              {[
                { label: 'Show me the project structure', icon: FolderTree },
                { label: 'Find and fix any bugs', icon: Bug },
                { label: 'Add a new feature', icon: Sparkles },
                { label: 'Install dependencies', icon: Package },
              ].map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickPrompt, { backgroundColor: isDark ? '#111' : '#fff', borderColor: isDark ? '#222' : '#eaeaea' }]}
                  onPress={() => setInputText(prompt.label)}
                >
                  <prompt.icon size={16} color={isDark ? '#ccc' : '#444'} />
                  <Text style={[styles.quickPromptText, { color: isDark ? '#ccc' : '#333' }]}>{prompt.label}</Text>
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
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#111' : '#f5f5f5', borderColor: isDark ? '#222' : '#eaeaea', borderWidth: 1 }]}>
              <Bot size={16} color={isDark ? '#ccc' : '#444'} />
            </View>
            <View style={[styles.bubble, styles.modelBubble, { backgroundColor: isDark ? '#111' : '#fff', borderColor: isDark ? '#222' : '#eaeaea' }]}>
              {currentToolCalls.map((tc, i) => (
                <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
              ))}
              {currentStreamText ? (
                <Markdown style={mdStyles}>
                  {(() => {
                    const str = currentStreamText
                    const match = str.match(/```/g)
                    // If odd backticks exist, forcibly inject a closer so streaming fences visually build out perfectly over markdown-it constraints
                    if (match && match.length % 2 !== 0) return str + '\n```\n ▊'
                    return str + ' ▊'
                  })()}
                </Markdown>
              ) : currentToolCalls.length === 0 ? (
                <View style={styles.typingIndicator}>
                  <Animated.View style={[styles.typingDot, { backgroundColor: isDark ? '#fff' : '#000' }]} />
                  <Text style={[styles.typingText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>Thinking...</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.background, 
        borderTopColor: isDark ? '#1a1a1a' : '#eaeaea',
        bottom: 0,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16
      }]}>
        <View style={[styles.inputBox, { backgroundColor: isDark ? '#111' : '#fff', borderColor: isDark ? '#222' : '#eaeaea', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isStreaming ? 'AI is working...' : 'Ask AI to code anything...'}
            placeholderTextColor={isDark ? '#555' : '#999'}
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
                  ? (isDark ? '#fff' : '#000')
                  : (isDark ? '#111' : '#f5f5f5')
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming}
          >
            <ArrowUp
              size={18}
              color={inputText.trim() && !isStreaming ? (isDark ? '#000' : '#fff') : (isDark ? '#555' : '#ccc')}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  clearBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  projectBar: { flexGrow: 0, flexShrink: 0 },
  projectBarContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  projectChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 24, borderWidth: 1, marginRight: 8,
  },
  projectChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 180 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 12, letterSpacing: -0.8 },
  emptySubtitle: {
    fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center',
    lineHeight: 24, opacity: 0.7, marginBottom: 36,
  },
  quickPrompts: { width: '100%', gap: 10 },
  quickPrompt: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  quickPromptText: { fontSize: 14, fontFamily: 'Inter_500Medium', letterSpacing: -0.2 },
  messageBubbleWrapper: {
    flexDirection: 'row', marginBottom: 20, gap: 10,
    alignItems: 'flex-end',
  },
  userWrapper: { justifyContent: 'flex-end' },
  modelWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.74, borderRadius: 20, padding: 16,
  },
  userBubble: { 
    borderBottomRightRadius: 6,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  modelBubble: { borderBottomLeftRadius: 6, borderWidth: 1 },
  messageText: {
    fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24, letterSpacing: -0.2,
  },
  toolCard: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    borderWidth: 1,
  },
  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  toolLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  toolTarget: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
  },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  typingText: { fontSize: 14, fontFamily: 'Inter_500Medium', fontStyle: 'italic' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    borderTopWidth: 1, paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1,
  },
  actionText: {
    fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 24, borderWidth: 1, paddingHorizontal: 16,
    paddingVertical: 10, gap: 10,
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
    maxHeight: 120, paddingVertical: 6, lineHeight: 22,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
})
