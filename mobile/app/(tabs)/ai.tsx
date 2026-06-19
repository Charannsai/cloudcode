import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share, Alert
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal, Loader,
  CheckCircle2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon,
  Mic, Volume2, VolumeX, FolderGit2
} from 'lucide-react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useProjectsStore } from '@/store/projects'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'
import * as Speech from 'expo-speech'
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
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

  const isRunning = tool.status === 'running'
  const pulse = useSharedValue(0)
  const rotation = useSharedValue(0)

  useEffect(() => {
    if (isRunning) {
      pulse.value = withRepeat(withSequence(withTiming(0.3, { duration: 800 }), withTiming(0, { duration: 800 })), -1, true)
      rotation.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false)
    } else {
      pulse.value = withTiming(0, { duration: 300 })
      rotation.value = 0
    }
  }, [isRunning])

  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }))

  return (
    <View style={[styles.toolCard, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4', overflow: 'hidden' }]}>
      {isRunning && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }, glowStyle]} />
      )}
      <View style={styles.toolHeader}>
        {isRunning ? (
          <Animated.View style={spinStyle}>
            <Loader size={11} color={isDark ? '#8B929A' : '#656D76'} />
          </Animated.View>
        ) : tool.status === 'done' ? (
          <CheckCircle2 size={11} color={'#3FB950'} />
        ) : (
          <AlertCircle size={11} color={'#F85149'} />
        )}
        <Icon size={11} color={isDark ? '#6E7681' : '#656D76'} strokeWidth={1.5} />
        <Text style={[styles.toolLabel, { color: isDark ? '#6E7681' : '#656D76' }]}>
          {label}
        </Text>
        <Text style={[styles.toolTarget, { color: isDark ? '#8B929A' : '#0E1116' }]} numberOfLines={1}>
          {target}
        </Text>
      </View>
    </View>
  )
}

function MessageBubble({ message, isDark, colors, onSpeakPress, speakingMessageId }: {
  message: ChatMessage; isDark: boolean; colors: any; onSpeakPress: (id: string, text: string) => void; speakingMessageId: string | null
}) {
  const isUser = message.role === 'user'

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    heading1: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 6, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 10, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 3, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 12, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 6, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 3, marginBottom: 3 },
    list_item: { marginTop: 1, marginBottom: 1 },
    link: { color: '#58A6FF', textDecorationLine: 'underline' } as const,
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify()}
      style={[styles.messageBubbleWrapper, isUser ? styles.userWrapper : styles.modelWrapper]}
    >
      {!isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4', borderWidth: 1 }]}>
          <Sparkles size={14} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.5} />
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: isDark ? '#1C2128' : '#0E1116' }]
          : [styles.modelBubble, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]
      ]}>
        {/* Tool calls */}
        {message.toolCalls?.map((tc, i) => (
          <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
        ))}

        {isUser ? (
          <Text style={[styles.messageText, { color: '#FFFFFF' }]}>
            {message.text}
          </Text>
        ) : (
          <View>
            <Markdown style={mdStyles}>
              {message.text}
            </Markdown>

            {/* AI Action Row */}
            {message.text ? (
              <View style={[styles.actionRow, { borderTopColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA' }]} 
                  onPress={() => Clipboard.setStringAsync(message.text)}
                  activeOpacity={0.7}
                >
                  <Copy size={11} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA' }]} 
                  onPress={() => Share.share({ message: message.text })}
                  activeOpacity={0.7}
                >
                  <ShareIcon size={11} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA' }]} 
                  onPress={() => onSpeakPress(message.id, message.text)}
                  activeOpacity={0.7}
                >
                  {speakingMessageId === message.id ? (
                    <VolumeX size={11} color={colors.primary} strokeWidth={1.5} />
                  ) : (
                    <Volume2 size={11} color={colors.textSecondary} strokeWidth={1.5} />
                  )}
                  <Text style={[styles.actionText, { color: speakingMessageId === message.id ? colors.primary : colors.textSecondary }]}>
                    {speakingMessageId === message.id ? 'Stop' : 'Speak'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {isUser && (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4', borderWidth: 1 }]}>
          <User size={14} color={colors.textSecondary} strokeWidth={1.5} />
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
    sendMessage, clearChat, pendingPrompt, setPendingPrompt,
    activeProjectId: selectedProjectId, setActiveProject: setSelectedProjectId
  } = useAIStore()

  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

  // Speech and Voice listeners initialization
  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true)
    Voice.onSpeechEnd = () => setIsListening(false)
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0])
      }
    }
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech recognition error:', e)
      setIsListening(false)
    }

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {})
      Speech.stop().catch(() => {})
    }
  }, [])

  const toggleListening = async () => {
    if (isListening) {
      try {
        await Voice.stop()
      } catch (err) {
        console.error(err)
      }
    } else {
      try {
        setInputText('')
        await Voice.start('en-US')
      } catch (err) {
        Alert.alert('Speech Error', 'Failed to start voice recognition.')
        console.error(err)
      }
    }
  }

  const handleSpeak = async (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      try {
        await Speech.stop()
      } catch (err) {}
      setSpeakingMessageId(null)
    } else {
      try {
        await Speech.stop()
      } catch (err) {}
      
      setSpeakingMessageId(messageId)
      
      // Strip markdown for a cleaner read-aloud voice output
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

  // Auto-run pending prompt (e.g., from terminal diagnostics)
  useEffect(() => {
    if (pendingPrompt && selectedProjectId && !isStreaming) {
      const prompt = pendingPrompt
      setPendingPrompt(null)
      sendMessage(prompt, selectedProjectId)
    }
  }, [pendingPrompt, selectedProjectId, isStreaming])

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

  // Bouncing dots for Thinking state
  const dot1 = useSharedValue(0)
  const dot2 = useSharedValue(0)
  const dot3 = useSharedValue(0)

  useEffect(() => {
    const isThinking = isStreaming && !currentStreamText && currentToolCalls.length === 0
    if (isThinking) {
      const animateDot = (dot: any, delay: number) => {
        setTimeout(() => {
          dot.value = withRepeat(withSequence(withTiming(-4, { duration: 350, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 350, easing: Easing.inOut(Easing.ease) })), -1, true)
        }, delay)
      }
      animateDot(dot1, 0)
      animateDot(dot2, 150)
      animateDot(dot3, 300)
    } else {
      dot1.value = 0; dot2.value = 0; dot3.value = 0;
    }
  }, [isStreaming, currentStreamText, currentToolCalls.length])

  const dotStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }))
  const dotStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }))
  const dotStyle3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }))

  // Auto-select global by default if no project is active
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectId('global')
    }
  }, [selectedProjectId])

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

  const username = user?.login || 'developer'
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    heading1: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 6, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 10, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 3, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 12, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 6, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 3, marginBottom: 3 },
    list_item: { marginTop: 1, marginBottom: 1 },
    link: { color: '#58A6FF', textDecorationLine: 'underline' } as const,
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#21262D' : '#D8DEE4' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/projects')}
            style={[styles.backBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}
          >
            <ArrowLeft size={16} color={colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>CloudCode AI</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {selectedProjectId === 'global' || !selectedProjectId ? 'Universal Assistant Mode' : `Workspace Context: ${selectedProject?.name || ''}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]}>
          <Trash2 size={14} color={colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Sleek Segmented Switcher */}
      <View style={[styles.switcherContainer, { borderBottomColor: isDark ? '#21262D' : '#D8DEE4', borderBottomWidth: 1 }]}>
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#161B22' : '#F0F2F5', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedProjectId('global')}
            style={[
              styles.segmentItem,
              (selectedProjectId === 'global' || !selectedProjectId) && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#21262D' : '#FFFFFF', borderColor: isDark ? '#30363D' : '#E1E4E8' }
              ]
            ]}
          >
            <Sparkles size={13} color={(selectedProjectId === 'global' || !selectedProjectId) ? colors.text : colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[
              styles.segmentText,
              { 
                color: (selectedProjectId === 'global' || !selectedProjectId) ? colors.text : colors.textSecondary,
                fontFamily: (selectedProjectId === 'global' || !selectedProjectId) ? 'Inter_600SemiBold' : 'Inter_400Regular'
              }
            ]}>
              Universal AI
            </Text>
          </TouchableOpacity>

          {projects.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (projects.length > 1) {
                  Alert.alert(
                    'Switch Project Context',
                    'Select a project container to connect this AI session:',
                    [
                      ...projects.map(p => ({
                        text: p.name,
                        onPress: () => setSelectedProjectId(p.id)
                      })),
                      { text: 'Cancel', style: 'cancel' as const }
                    ]
                  )
                } else if (projects.length === 1) {
                  setSelectedProjectId(projects[0].id)
                }
              }}
              style={[
                styles.segmentItem,
                selectedProjectId !== 'global' && selectedProjectId !== null && [
                  styles.segmentItemActive,
                  { backgroundColor: isDark ? '#21262D' : '#FFFFFF', borderColor: isDark ? '#30363D' : '#E1E4E8' }
                ]
              ]}
            >
              <FolderGit2 size={13} color={selectedProjectId !== 'global' && selectedProjectId !== null ? colors.text : colors.textSecondary} style={{ marginRight: 5 }} />
              <Text 
                numberOfLines={1} 
                style={[
                  styles.segmentText,
                  { 
                    color: selectedProjectId !== 'global' && selectedProjectId !== null ? colors.text : colors.textSecondary,
                    fontFamily: selectedProjectId !== 'global' && selectedProjectId !== null ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    maxWidth: 120
                  }
                ]}
              >
                {selectedProjectId !== 'global' && selectedProjectId !== null
                  ? (projects.find(p => p.id === selectedProjectId)?.name || 'Workspace')
                  : 'Workspace'}
              </Text>
              {projects.length > 1 && (
                <Text 
                  style={{ 
                    fontSize: 10, 
                    color: selectedProjectId !== 'global' && selectedProjectId !== null ? colors.text : colors.textSecondary, 
                    marginLeft: 4, 
                    opacity: 0.8 
                  }}
                >
                  ▾
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !isStreaming && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              <Sparkles size={28} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.2} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Hi {username}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Ask me to read, edit, or create code{'\n'}in your project. I can also run commands.
            </Text>

            {/* Quick prompts */}
            <View style={styles.quickPrompts}>
              {[
                { label: 'Show project structure', icon: FolderTree },
                { label: 'Find and fix bugs', icon: Bug },
                { label: 'Add a new feature', icon: Sparkles },
                { label: 'Install dependencies', icon: Package },
              ].map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickPrompt, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                  onPress={() => setInputText(prompt.label)}
                  activeOpacity={0.7}
                >
                  <prompt.icon size={14} color={isDark ? '#8B929A' : '#656D76'} strokeWidth={1.5} />
                  <Text style={[styles.quickPromptText, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_500Medium' }]}>{prompt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isDark={isDark} 
            colors={colors} 
            onSpeakPress={handleSpeak}
            speakingMessageId={speakingMessageId}
          />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.messageBubbleWrapper, styles.modelWrapper]}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4', borderWidth: 1 }]}>
              <Sparkles size={14} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.5} />
            </View>
            <View style={[styles.bubble, styles.modelBubble, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              {currentToolCalls.map((tc, i) => (
                <ToolCallCard key={i} tool={tc} isDark={isDark} colors={colors} />
              ))}
              {currentStreamText ? (
                <Markdown style={mdStyles}>
                  {(() => {
                    const str = currentStreamText
                    const match = str.match(/```/g)
                    if (match && match.length % 2 !== 0) return str + '\n```\n ▊'
                    return str + ' ▊'
                  })()}
                </Markdown>
              ) : currentToolCalls.length === 0 ? (
                <View style={styles.typingIndicator}>
                  <Animated.View style={[styles.typingDot, { backgroundColor: isDark ? '#6E7681' : '#656D76' }, dotStyle1]} />
                  <Animated.View style={[styles.typingDot, { backgroundColor: isDark ? '#6E7681' : '#656D76' }, dotStyle2]} />
                  <Animated.View style={[styles.typingDot, { backgroundColor: isDark ? '#6E7681' : '#656D76' }, dotStyle3]} />
                  <Text style={[styles.typingText, { color: isDark ? '#6E7681' : '#656D76', marginLeft: 6 }]}>Thinking</Text>
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
        borderTopColor: isDark ? '#21262D' : '#D8DEE4',
        paddingBottom: Platform.OS === 'ios' ? 24 : 16
      }]}>
        <View style={[styles.inputBox, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isStreaming ? 'AI is working...' : 'Ask anything...'}
            placeholderTextColor={isDark ? '#484F58' : '#8C959F'}
            multiline
            style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
            editable={!isStreaming}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          {/* Voice Input Button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                marginRight: 4,
                backgroundColor: isListening 
                  ? '#F85149' 
                  : (isDark ? '#1C2128' : '#F6F8FA')
              }
            ]}
            onPress={toggleListening}
            disabled={isStreaming}
            activeOpacity={0.7}
          >
            {isListening ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Mic size={14} color={isDark ? '#6E7681' : '#656D76'} strokeWidth={1.5} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !isStreaming
                  ? (isDark ? '#F3F4F6' : '#0E1116')
                  : (isDark ? '#1C2128' : '#F6F8FA')
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming}
          >
            <ArrowUp
              size={16}
              color={inputText.trim() && !isStreaming ? (isDark ? '#0E1116' : '#FFFFFF') : (isDark ? '#484F58' : '#8C959F')}
              strokeWidth={2.5}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, marginTop: 1, opacity: 0.7 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  switcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexShrink: 0,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  segmentItemActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },

  messagesContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 160 },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 24, marginBottom: 8, letterSpacing: -0.6 },
  emptySubtitle: {
    fontSize: 14, textAlign: 'center',
    lineHeight: 22, opacity: 0.6, marginBottom: 28,
  },
  quickPrompts: { width: '100%', gap: 8 },
  quickPrompt: {
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  quickPromptText: { fontSize: 13, letterSpacing: -0.2 },
  messageBubbleWrapper: {
    flexDirection: 'row', marginBottom: 16, gap: 8,
    alignItems: 'flex-end',
  },
  userWrapper: { justifyContent: 'flex-end' },
  modelWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.76, borderRadius: 16, padding: 14,
  },
  userBubble: { 
    borderBottomRightRadius: 4,
  },
  modelBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: {
    fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, letterSpacing: -0.2,
  },
  toolCard: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6,
    borderWidth: 1,
  },
  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  toolLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  toolTarget: { fontSize: 11, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4,
  },
  typingDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  typingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    borderTopWidth: 1, paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.3,
  },
  inputContainer: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: 8, gap: 8,
  },
  input: {
    flex: 1, fontSize: 14,
    maxHeight: 100, paddingVertical: 6, lineHeight: 20,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
})
