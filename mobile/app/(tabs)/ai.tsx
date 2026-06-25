import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
  TouchableWithoutFeedback, Modal, Dimensions, Alert, Animated, Easing
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Bot, Terminal, Loader,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Cpu, History, X,
  Shield, Lock, Square, MoreVertical, Plus, Mic, ArrowLeft, Folder
} from 'lucide-react-native'
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import Voice from '@react-native-voice/voice'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'
import { api } from '@/lib/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Glowing Animated AI Core Orb Logo
function AICoreLogo() {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const rotateStr = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  })

  return (
    <View style={styles.orbContainer}>
      <Animated.View style={{ transform: [{ rotate: rotateStr }] }}>
        <Svg width="72" height="72" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#388BFD" stopOpacity="0.85" />
              <Stop offset="60%" stopColor="#892CDC" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#F43F5E" stopOpacity="0.85" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="45" stroke="url(#coreGrad)" strokeWidth="1.5" strokeDasharray="5 4" fill="none" opacity="0.35" />
          <Circle cx="50" cy="50" r="34" stroke="url(#coreGrad)" strokeWidth="1" fill="none" opacity="0.2" />
          <Circle cx="50" cy="50" r="18" fill="url(#coreGrad)" opacity="0.15" />
          <Path d="M50 36 L53 45 L62 48 L53 51 L50 60 L47 51 L38 48 L47 45 Z" fill="url(#coreGrad)" />
        </Svg>
      </Animated.View>
    </View>
  )
}

// Sequential Typing Indicator Component
function TypingIndicator({ colors }: { colors: any }) {
  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const a1 = animateDot(dot1, 0)
    const a2 = animateDot(dot2, 150)
    const a3 = animateDot(dot3, 300)

    a1.start()
    a2.start()
    a3.start()

    return () => {
      a1.stop()
      a2.stop()
      a3.stop()
    }
  }, [])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 }}>
      <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: dot1 }} />
      <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: dot2 }} />
      <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: dot3 }} />
    </View>
  )
}

// Minimalist Tool Call Badge Component
function ToolCallBadge({ tool, colors, isDark }: { tool: ToolCallInfo; colors: any; isDark: boolean }) {
  const name = tool.name
  const args = tool.args || {}
  const status = tool.status

  const path = (args.path as string) || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  let label = ''
  let ToolIcon = Sparkles

  if (name === 'run_command') {
    label = args.command ? `Run: ${args.command}` : 'Shell Command'
    ToolIcon = Terminal
  } else if (name === 'list_files') {
    label = 'List Files'
    ToolIcon = Folder
  } else if (name === 'create_project') {
    label = args.name ? `Create Project: ${args.name}` : 'Create Project'
    ToolIcon = Sparkles
  } else {
    const op = name.replace('_file', '').replace('view_file_content', 'read')
    const verb = op.charAt(0).toUpperCase() + op.slice(1)
    label = filename ? `${verb}: ${filename}` : `${verb} File`
    ToolIcon = Folder
  }

  let statusColor = colors.textSecondary
  let StatusComponent: React.ReactNode = null

  if (status === 'running' || status === 'pending') {
    statusColor = isDark ? '#58A6FF' : '#0969DA'
    StatusComponent = <ActivityIndicator size="small" color={statusColor} style={{ width: 12, height: 12 }} />
  } else if (status === 'done') {
    statusColor = isDark ? '#3FB950' : '#1A7F37'
    StatusComponent = <CheckCircle2 size={12} color={statusColor} />
  } else if (status === 'error') {
    statusColor = isDark ? '#FF7B72' : '#CF222E'
    StatusComponent = <AlertCircle size={12} color={statusColor} />
  }

  const handleApproveAction = async (action: 'approve' | 'reject') => {
    if (!args.approvalId) return
    try {
      await api.ai.approve(args.approvalId as string, action)
    } catch (e) {
      Alert.alert('Error', 'Failed to submit approval.')
    }
  }

  return (
    <View style={{ gap: 6, width: '100%', marginTop: 4 }}>
      <View style={[
        styles.toolCallBadge,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderWidth: 1,
        }
      ]}>
        <ToolIcon size={12} color={colors.textSecondary} />
        <Text style={[styles.toolCallText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        {StatusComponent}
      </View>

      {status === 'pending' && !!args.approvalId && (
        <View style={[
          styles.inlineApprovalCard,
          {
            backgroundColor: isDark ? '#1C1500' : '#FFFDF0',
            borderColor: isDark ? '#E2B714' : '#F1E05A',
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Shield size={14} color="#E2B714" />
            <Text style={[styles.inlineApprovalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Approval Required
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
            CloudCode wants to run a terminal command:
          </Text>
          <View style={[styles.inlineApprovalCommandBox, { backgroundColor: isDark ? '#0D1117' : '#E9ECEF' }]}>
            <Text style={[styles.inlineApprovalCommandText, { color: isDark ? '#FF7B72' : '#CF222E' }]}>
              $ {args.command as string}
            </Text>
          </View>
          <View style={styles.inlineApprovalActions}>
            <TouchableOpacity
              style={[styles.inlineApprovalBtn, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}
              onPress={() => handleApproveAction('reject')}
            >
              <Text style={[styles.inlineApprovalBtnText, { color: colors.text }]}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inlineApprovalBtn, { backgroundColor: '#3FB950' }]}
              onPress={() => handleApproveAction('approve')}
            >
              <Text style={styles.inlineApprovalBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    messages, isStreaming, currentStreamText, currentToolCalls, activeProjectId,
    sendMessage, clearChat, stopGeneration, initConversations, loadConversation, deleteConversation, startNewChat
  } = useAIStore()

  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  const [inputText, setInputText] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('global')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')

  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [friendlyError, setFriendlyError] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)

  const [isByokActive, setIsByokActive] = useState(false)
  const [userTier, setUserTier] = useState('free')

  // Voice recording state
  const [isListening, setIsListening] = useState(false)
  const voicePulse = useRef(new Animated.Value(1)).current

  // Text input focus state for border glow
  const [isInputFocused, setIsInputFocused] = useState(false)

  const fetchByokAndTier = async () => {
    try {
      const byok = await AsyncStorage.getItem('byok_enabled')
      setIsByokActive(byok === 'true')

      const billing = await api.billing.status()
      if (billing?.tier?.name) {
        setUserTier(billing.tier.name)
      }
    } catch (e) {
      console.warn('Failed to load settings:', e)
    }
  }

  // Load conversation thread when project context changes
  useEffect(() => {
    const syncThread = async () => {
      await initConversations()
      const allThreads = useAIStore.getState().savedConversations
      const targetProjId = selectedProjectId === 'global' ? '' : selectedProjectId
      
      // Find the latest thread for this project
      const matchingThread = allThreads.find(t => t.projectId === targetProjId)
      if (matchingThread) {
        await loadConversation(matchingThread.id)
      } else {
        startNewChat()
      }
      await fetchByokAndTier()
    }
    syncThread()
  }, [selectedProjectId])

  // Sync projects on focus
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      fetchProjects(true)
      fetchByokAndTier()

      return () => {
        setTabBarVisible(true)
      }
    }, [selectedProjectId])
  )

  // Global AI screen remains in 'global' context by default to avoid activating containers.
  // Project-specific contexts are handled inside the project detail's AI Tab.

  // Auto-scroll main timeline on updates
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [messages.length, currentStreamText, isStreaming, currentToolCalls.length])

  // Voice speech setup
  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsListening(true)
    }
    Voice.onSpeechEnd = () => {
      setIsListening(false)
    }
    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value[0]) {
        setInputText(prev => prev + (prev ? " " : "") + e.value[0])
      }
    }
    Voice.onSpeechError = (e: any) => {
      console.warn('[Voice] Speech recognition error:', e)
      setIsListening(false)
    }

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => { })
    }
  }, [])

  // Voice pulsing animation
  useEffect(() => {
    let pulseAnim: Animated.CompositeAnimation | null = null
    if (isListening) {
      pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(voicePulse, {
            toValue: 1.3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(voicePulse, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          })
        ])
      )
      pulseAnim.start()
    } else {
      voicePulse.setValue(1)
    }
    return () => {
      pulseAnim?.stop()
    }
  }, [isListening])

  const toggleListening = async () => {
    if (isListening) {
      try {
        await Voice.stop()
        setIsListening(false)
      } catch (e) {
        console.error(e)
      }
    } else {
      try {
        Keyboard.dismiss()
        setInputText('')
        await Voice.start('en-US')
        setIsListening(true)
      } catch (e) {
        console.error(e)
        Alert.alert(
          'Microphone Access',
          'Could not start voice recognition. Please ensure microphone permissions are granted in your device settings.'
        )
      }
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    const prompt = inputText.trim()
    setInputText('')
    setFriendlyError(null)

    try {
      await sendMessage(prompt, selectedProjectId, undefined, selectedModel)
    } catch (err) {
      const msg = (err as Error).message || ''
      if (msg.includes('LIMIT_EXCEEDED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('monthly token limit exceeded')) {
        setFriendlyError('Rate limit reached. Retry available in 45 seconds. Tap Switch Model or use BYOK to continue.')
      } else if (msg.includes('Gemini API error') || msg.includes('fetch failed')) {
        setFriendlyError('Gemini is currently unavailable. Retrying connection...')
      } else {
        setFriendlyError(msg)
      }
    }
  }

  // Markdown styling
  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
    heading1: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 14, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 10, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#0D1117' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 10, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 6, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 6, marginBottom: 6 },
  }

  // Premium Quick Action Suggestions
  const actionSuggestions = [
    { text: "🚀 Deploy backend service", prompt: "Deploy a backend server for my app." },
    { text: "🔍 Find authentication bugs", prompt: "Inspect authentication files to find errors." },
    { text: "📦 Install Zustand state", prompt: "Add Zustand package and set up state store." },
    { text: "🛠️ Add dark mode theme", prompt: "Modify components to support dark mode theme." }
  ]

  return (
    <TabGenieWrapper index={3}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Glowing Radial Background Gradient */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="radialGrad"
                cx="50%"
                cy="0%"
                rx="70%"
                ry="60%"
                fx="50%"
                fy="0%"
              >
                <Stop offset="0%" stopColor={isDark ? '#1C2030' : '#E0E7FF'} stopOpacity="0.28" />
                <Stop offset="100%" stopColor={isDark ? '#0E1116' : '#F6F8FA'} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#radialGrad)" />
          </Svg>
        </View>

        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: isDark ? '#21262D' : '#D8DEE4', zIndex: 10 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/dashboard')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.statusDot, { backgroundColor: isStreaming ? '#3FB950' : '#8B929A' }]} />
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              CloudCode
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <TouchableOpacity
              style={[styles.modelBadge, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
              onPress={() => setModelSelectorVisible(true)}
            >
              <Cpu size={12} color="#3FB950" />
              <Text style={[styles.modelBadgeText, { color: colors.text }]}>
                {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuBtn}>
              <MoreVertical size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Dropdown Menu */}
        {menuVisible && (
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>
        )}

        {menuVisible && (
          <View style={[styles.dropdownMenuCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
            <TouchableOpacity
              style={[styles.dropdownMenuItemRow, { borderBottomColor: isDark ? '#21262D' : '#F6F8FA' }]}
              onPress={() => {
                setMenuVisible(false)
                startNewChat()
              }}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>New Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownMenuItemRow, { borderBottomColor: isDark ? '#21262D' : '#F6F8FA' }]}
              onPress={() => {
                setMenuVisible(false)
                setModelSelectorVisible(true)
              }}
            >
              <Cpu size={16} color={colors.text} />
              <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>Switch Model</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownMenuItemRow}
              onPress={() => {
                setMenuVisible(false)
                router.push('/activity')
              }}
            >
              <History size={16} color={colors.text} />
              <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>History & Limits</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Conversation flow */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <AICoreLogo />
              <Text style={[styles.welcomeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                What shall we build today?
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Ask me to write code, design projects, install packages, or analyze files in your active workspace.
              </Text>

              {/* Quick Actions Suggestions Grid */}
              <View style={styles.suggestionsContainer}>
                {actionSuggestions.map((sug, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                    onPress={() => {
                      setInputText(sug.prompt)
                      inputRef.current?.focus()
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionCardText, { color: colors.text }]} numberOfLines={1}>
                      {sug.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <View key={msg.id} style={isUser ? styles.userBubbleWrapper : styles.modelBubbleWrapper}>
                    <View style={isUser ? [styles.userBubble, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }] : [styles.modelBubble, { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 8, maxWidth: '100%' }]}>
                      {isUser ? (
                        <Text style={[styles.userBubbleText, { color: colors.text }]}>
                          {msg.text}
                        </Text>
                      ) : (
                        <View style={{ width: '100%' }}>
                          <Markdown style={mdStyles}>
                            {msg.text}
                          </Markdown>
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <View style={styles.toolCallsContainer}>
                              {msg.toolCalls.map((tc, tcIdx) => (
                                <ToolCallBadge key={tcIdx} tool={tc} colors={colors} isDark={isDark} />
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}

              {/* Streaming AI response bubble */}
              {isStreaming && (
                <View style={styles.modelBubbleWrapper}>
                  <View style={[styles.modelBubble, { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 8, maxWidth: '100%' }]}>
                    <View style={{ width: '100%' }}>
                      {currentStreamText.trim() !== '' ? (
                        <Markdown style={mdStyles}>
                          {currentStreamText}
                        </Markdown>
                      ) : (
                        <TypingIndicator colors={colors} />
                      )}
                      {currentToolCalls.length > 0 && (
                        <View style={styles.toolCallsContainer}>
                          {currentToolCalls.map((tc, tcIdx) => (
                            <ToolCallBadge key={tcIdx} tool={tc} colors={colors} isDark={isDark} />
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Container for perfect flow-based keyboard avoidance */}
        <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Friendly Error Display */}
          {friendlyError && (
            <View style={[styles.listeningTooltip, { backgroundColor: isDark ? '#3D1117' : '#FFEBE9', borderColor: '#F85149' }]}>
              <AlertCircle size={16} color="#EB5757" />
              <Text style={{ color: isDark ? '#FF7B72' : '#CF222E', fontSize: 12, flex: 1 }}>{friendlyError}</Text>
            </View>
          )}

          {/* Floating Speech/Listening Tooltip */}
          {isListening && (
            <View style={[styles.listeningTooltip, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              <Animated.View style={[styles.listeningPulseDot, { transform: [{ scale: voicePulse }] }]} />
              <Text style={[styles.listeningTooltipText, { color: colors.text }]}>Listening to voice input...</Text>
            </View>
          )}

          {/* Modern Floating Input Composer */}
          <View style={styles.composerWrapper}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 85 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.composerContainer,
                {
                  borderColor: isInputFocused
                    ? (isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.24)')
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'),
                  borderWidth: isInputFocused ? 1.5 : 1,
                  backgroundColor: isDark ? 'rgba(21, 25, 34, 0.82)' : 'rgba(255, 255, 255, 0.85)',
                  shadowColor: '#000000',
                  shadowOpacity: isInputFocused ? 0.15 : 0.06,
                  shadowRadius: isInputFocused ? 12 : 6,
                  overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
                }
              ]}
            >
              {/* Attachment Button */}
              <TouchableOpacity style={styles.composerLeftBtn} activeOpacity={0.7}>
                <Plus size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* TextInput */}
              <TextInput
                ref={inputRef}
                style={[styles.composerTextInput, { color: colors.text }]}
                placeholder="Ask CloudCode anything..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={1}
                maxLength={2000}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                textAlignVertical="center"
              />

              {/* Right actions: Mic / Send / Stop */}
              <View style={styles.composerRightContainer}>
                {inputText.trim() === '' && !isStreaming && (
                  <TouchableOpacity
                    style={[
                      styles.composerMicBtn,
                      isListening && { backgroundColor: 'rgba(235, 87, 87, 0.15)' }
                    ]}
                    onPress={toggleListening}
                    activeOpacity={0.7}
                  >
                    <Animated.View style={[isListening && { transform: [{ scale: voicePulse }] }]}>
                      <Mic size={18} color={isListening ? '#EB5757' : colors.textSecondary} />
                    </Animated.View>
                  </TouchableOpacity>
                )}

                {isStreaming ? (
                  <TouchableOpacity
                    style={styles.composerStopBtn}
                    onPress={() => stopGeneration()}
                    activeOpacity={0.7}
                  >
                    <Square size={11} fill="#FFFFFF" color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  inputText.trim() !== '' && (
                    <TouchableOpacity
                      style={[styles.composerSendBtn, { backgroundColor: colors.text }]}
                      onPress={handleSend}
                      activeOpacity={0.7}
                    >
                      <ArrowUp size={15} color={isDark ? '#0E1116' : '#FFFFFF'} />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </BlurView>
          </View>
        </View>

        {/* Model Selection Modal */}
        <Modal
          visible={modelSelectorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModelSelectorVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModelSelectorVisible(false)}
          >
            <View style={[styles.selectorDropdownCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select LLM Model</Text>
                <TouchableOpacity onPress={() => setModelSelectorVisible(false)}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}
                onPress={() => {
                  setSelectedModel('gemini')
                  setModelSelectorVisible(false)
                }}
              >
                <Cpu size={14} color="#3FB950" />
                <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedModel === 'gemini' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  Gemini 1.5 Flash (Teammate engine)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB', opacity: (userTier === 'free' && !isByokActive) ? 0.6 : 1 }]}
                onPress={() => {
                  if (userTier === 'free' && !isByokActive) {
                    Alert.alert(
                      'Premium Model Locked',
                      'GPT-4o is restricted to Pro subscriptions. Please upgrade in Settings or configure Bring Your Own Key (BYOK) to unlock.'
                    )
                  } else {
                    setSelectedModel('openai')
                    setModelSelectorVisible(false)
                  }
                }}
              >
                <Shield size={14} color="#2F80ED" />
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedModel === 'openai' ? 'Inter_600SemiBold' : 'Inter_400Regular', flex: 1 }]}>
                    GPT-4o (Premium reasoning)
                  </Text>
                  {userTier === 'free' && !isByokActive && <Lock size={12} color={colors.textSecondary} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB', opacity: (userTier === 'free' && !isByokActive) ? 0.6 : 1 }]}
                onPress={() => {
                  if (userTier === 'free' && !isByokActive) {
                    Alert.alert(
                      'Premium Model Locked',
                      'Claude 3.6 Opus is restricted to Pro subscriptions. Please upgrade in Settings or configure Bring Your Own Key (BYOK) to unlock.'
                    )
                  } else {
                    setSelectedModel('anthropic')
                    setModelSelectorVisible(false)
                  }
                }}
              >
                <Lock size={14} color="#9B51E0" />
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedModel === 'anthropic' ? 'Inter_600SemiBold' : 'Inter_400Regular', flex: 1 }]}>
                    Claude 3.6 Opus (Advanced synthesis)
                  </Text>
                  {userTier === 'free' && !isByokActive && <Lock size={12} color={colors.textSecondary} />}
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 16,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  modelBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  menuBtn: {
    padding: 4,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: '90%',
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 36,
    gap: 10,
  },
  suggestionCard: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionCardText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  modelBubbleWrapper: {
    width: '100%',
  },
  userBubbleWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: SCREEN_WIDTH * 0.8,
    borderWidth: 1,
  },
  userBubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  modelBubble: {
    borderRadius: 16,
    padding: 16,
    maxWidth: SCREEN_WIDTH * 0.8,
    borderBottomLeftRadius: 4,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  toolCallsContainer: {
    marginTop: 12,
    gap: 6,
    width: '100%',
  },
  toolCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'stretch',
    gap: 8,
  },
  toolCallText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  inlineApprovalCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    gap: 6,
  },
  inlineApprovalTitle: {
    fontSize: 13,
  },
  inlineApprovalCommandBox: {
    padding: 8,
    borderRadius: 6,
  },
  inlineApprovalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11.5,
  },
  inlineApprovalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  inlineApprovalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  inlineApprovalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  composerWrapper: {
    zIndex: 99,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  composerLeftBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTextInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    maxHeight: 130,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    margin: 0,
    lineHeight: 20,
  },
  composerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerMicBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerStopBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EB5757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EB5757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  listeningTooltip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 98,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  listeningPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EB5757',
  },
  listeningTooltipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectorDropdownCard: {
    width: '90%',
    maxHeight: '40%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 13,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenuCard: {
    position: 'absolute',
    top: 52,
    right: 16,
    width: 180,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  dropdownMenuItemLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
})
