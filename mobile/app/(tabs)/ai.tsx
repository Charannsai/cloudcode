import React, { useState, useRef, useEffect, memo, useMemo } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, Keyboard,
  TouchableWithoutFeedback, Modal, Dimensions, Alert, Animated, Easing, Image
} from 'react-native'
import { SpringPressable } from '@/components/SpringPressable'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Bot, Terminal, Loader,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Cpu, History, X,
  Shield, Lock, Square, Plus, ArrowLeft, Folder, Check, Zap, Camera, Image as ImageIcon, Settings, Trash2
} from '@/components/HugeIconsShim'
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
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
import { ConfirmModal } from '@/components/ConfirmModal'
import { ensureCameraPermission, ensureMediaLibraryPermission } from '@/lib/permissions'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

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

// Two-Liner Hamburger Icon
function TwoLineHamburgerIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8H20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M4 16H20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  )
}

// Sleek AI Thinking Wave Loader Component
function ThinkingIndicator({ colors, isDark }: { colors: any; isDark: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current
  const shimmer = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 100,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const rotateStr = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const translateX = shimmer.interpolate({
    inputRange: [-100, 100],
    outputRange: [-150, 150],
  })

  return (
    <View style={{ gap: 8, paddingVertical: 12, paddingHorizontal: 4, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.View style={{ transform: [{ rotate: rotateStr }] }}>
          <Svg width="18" height="18" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="microCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#388BFD" stopOpacity="0.9" />
                <Stop offset="60%" stopColor="#892CDC" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#F43F5E" stopOpacity="0.9" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="42" stroke="url(#microCoreGrad)" strokeWidth="8" fill="none" />
            <Path d="M50 25 L54 42 L71 46 L54 50 L50 67 L46 50 L29 46 L46 42 Z" fill="url(#microCoreGrad)" />
          </Svg>
        </Animated.View>

        <Animated.Text
          style={{
            fontSize: 13,
            fontFamily: 'Inter_600SemiBold',
            color: colors.textSecondary,
            opacity: pulse,
          }}
        >
          CloudCode is thinking...
        </Animated.Text>
      </View>

      <View
        style={{
          height: 3,
          width: 180,
          borderRadius: 1.5,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: '60%',
            position: 'absolute',
            transform: [{ translateX }],
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={isDark ? '#1F2937' : '#E5E7EB'} stopOpacity="0" />
                <Stop offset="50%" stopColor={isDark ? '#374151' : '#D1D5DB'} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={isDark ? '#1F2937' : '#E5E7EB'} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shimmerGrad)" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  )
}

// Tool Call Reasoning Generator
const getToolReasoning = (name: string, args: any, result: any, status: string) => {
  const wsName = args.workspaceIdOrName || args.name || ''
  const path = args.path || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  if (name === 'select_workspace') {
    if (status === 'error') {
      return `Attempted to open workspace '${wsName || 'project'}', but encountered a container issue.`
    }
    return `Activated workspace container '${wsName || 'project'}'.`
  }
  if (name === 'list_files') {
    return `Examined directory contents at '${args.path || 'root'}'.`
  }
  if (name === 'read_file') {
    return `Read contents of file '${filename || path}'.`
  }
  if (name === 'edit_file') {
    return `Updated code in file '${filename || path}'.`
  }
  if (name === 'create_file') {
    return `Created new file '${filename || path}'.`
  }
  if (name === 'run_command') {
    return `Executed terminal command '${args.command || ''}'.`
  }
  return `Performed action '${name.replace(/_/g, ' ')}'.`
}

function ToolCallBadge({ tool, colors, isDark }: { tool: ToolCallInfo; colors: any; isDark: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const name = tool.name
  const args = tool.args || {}
  const status = tool.status

  const path = (args.path as string) || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  let label = name
  if (name === 'run_command') label = args.command ? `Run: ${args.command}` : 'Shell Command'
  else if (name === 'list_files') label = args.path ? `List: ${args.path}` : 'List Files'
  else if (filename) label = `${name.replace('_file', '')}: ${filename}`

  const isBlinking = status === 'running' || status === 'pending'
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isBlinking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [isBlinking])

  return (
    <View style={{ width: '100%', paddingVertical: 2 }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Sparkles size={14} color={isDark ? '#A78BFA' : '#7C3AED'} />
        {isBlinking ? (
          <Animated.Text style={{ color: colors.textSecondary, fontSize: 13, opacity: pulseAnim, flex: 1, fontFamily: 'Inter_500Medium' }}>
            {label}
          </Animated.Text>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, fontFamily: 'Inter_500Medium' }}>
            {label}
          </Text>
        )}
        {isExpanded ? <ChevronUp size={14} color={colors.textSecondary} /> : <ChevronDown size={14} color={colors.textSecondary} />}
      </TouchableOpacity>
      {isExpanded && (
        <View style={{ padding: 8, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', marginTop: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {getToolReasoning(name, args, tool.result, status)}
          </Text>
        </View>
      )}
    </View>
  )
}

function AnimatedDropdown({ visible, children, style }: { visible: boolean; children: React.ReactNode; style?: any }) {
  const [shouldRender, setShouldRender] = useState(visible)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.back(0.8)),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setShouldRender(false))
    }
  }, [visible])

  if (!shouldRender) return null

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  )
}

const TabChatMessageBubble = memo(function TabChatMessageBubble({
  msg,
  colors,
  isDark,
  mdStyles,
}: {
  msg: ChatMessage
  colors: any
  isDark: boolean
  mdStyles: any
}) {
  const isUser = msg.role === 'user'
  return (
    <View style={isUser ? styles.userBubbleWrapper : styles.modelBubbleWrapper}>
      <View style={isUser ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }] : [styles.modelBubble, { backgroundColor: 'transparent' }]}>
        {isUser ? (
          <Text style={[styles.userBubbleText, { color: colors.text }]}>
            {msg.text}
          </Text>
        ) : (
          <View style={{ width: '100%' }}>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                {msg.toolCalls.map((tc, tcIdx) => (
                  <ToolCallBadge key={tcIdx} tool={tc} colors={colors} isDark={isDark} />
                ))}
              </View>
            )}
            {msg.text.trim() !== '' && (
              <Markdown style={mdStyles}>
                {msg.text}
              </Markdown>
            )}
          </View>
        )}
      </View>
    </View>
  )
})

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const pageBgColor = isDark ? '#030303' : '#FFFFFF'
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    messages, isStreaming, currentStreamText, currentToolCalls, activeProjectId,
    sendMessage, clearChat, stopGeneration, initConversations, loadConversation, deleteConversation, startNewChat, savedConversations
  } = useAIStore()

  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setTabBarVisible, setTabIndex, setSettingsSubScreen } = useUIStore()

  const [inputText, setInputText] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('global')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')

  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [attachModalVisible, setAttachModalVisible] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)

  const [isInputFocused, setIsInputFocused] = useState(false)

  // Drawer animation
  const drawerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (drawerOpen) {
      Animated.timing(drawerAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start()
    }
  }, [drawerOpen])

  useEffect(() => {
    initConversations()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      fetchProjects(true)
      initConversations()
      return () => {
        setTabBarVisible(true)
      }
    }, [])
  )

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [messages.length, currentStreamText, isStreaming, currentToolCalls.length])

  const handleSend = async () => {
    const trimmed = inputText.trim()
    if (!trimmed && !attachedImage) return

    let finalPrompt = trimmed
    if (attachedImage) {
      finalPrompt = `[Attached Image: ${attachedImage}]\n${trimmed}`
    }

    setInputText('')
    setAttachedImage(null)
    const targetProject = selectedProjectId === 'global' ? '' : selectedProjectId
    await sendMessage(finalPrompt, targetProject, undefined, selectedModel)
  }

  const handleCameraCapture = () => {
    setAttachModalVisible(false)
    ensureCameraPermission(() => {
      // Simulate/Trigger Camera photo selection
      setAttachedImage('captured_photo.jpg')
    })
  }

  const handleGalleryUpload = () => {
    setAttachModalVisible(false)
    ensureMediaLibraryPermission(() => {
      // Simulate/Trigger Gallery image selection
      setAttachedImage('uploaded_design_mockup.png')
    })
  }

  const markdownStyles = useMemo(() => ({
    body: { color: colors.text, fontSize: 14.5, lineHeight: 22, fontFamily: 'Inter_400Regular' },
    code_block: { backgroundColor: isDark ? '#0B0C10' : '#F8FAFC', borderRadius: 8, padding: 12, border: `1px solid ${colors.border}`, fontFamily: 'JetBrainsMono_400Regular' },
    code_inline: { backgroundColor: isDark ? '#161821' : '#F1F5F9', color: colors.text, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontFamily: 'JetBrainsMono_400Regular' },
    link: { color: isDark ? '#58A6FF' : '#2563EB' },
  }), [colors, isDark])

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.85, 0],
  })

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  })

  return (
    <TabGenieWrapper index={2}>
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: pageBgColor }]}>
        
        {/* Modern Top Bar */}
        <View style={[styles.topHeaderBar, { paddingTop: Math.max(insets.top, 12), borderBottomColor: isDark ? '#1A1C23' : '#E5E7EB' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AICoreLogo />
            <TouchableOpacity onPress={() => setModelSelectorVisible(!modelSelectorVisible)} style={[styles.modelBadge, { backgroundColor: isDark ? '#161821' : '#F1F5F9', borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                {selectedModel === 'gemini' ? 'Gemini 3.5' : selectedModel === 'openai' ? 'ChatGPT 5.5' : selectedModel === 'anthropic' ? 'Claude 4.6' : 'Groq'}
              </Text>
              <ChevronDown size={11} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Two-Liner Hamburger Icon Menu Trigger */}
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={[styles.headerMenuBtn, { marginLeft: 'auto' }]}>
            <TwoLineHamburgerIcon color={colors.text} size={22} />
          </TouchableOpacity>
        </View>

        {/* Conversation Message Area */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && !isStreaming ? (
            <View style={styles.emptyWelcomeView}>
              <AICoreLogo />
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>CloudCode Assistant</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Ask code questions, build features, or manage your workspace.
              </Text>
            </View>
          ) : (
            <>
              {messages.map((msg) => (
                <TabChatMessageBubble key={msg.id} msg={msg} colors={colors} isDark={isDark} mdStyles={markdownStyles} />
              ))}
              {isStreaming && (
                <View style={styles.streamingWrapper}>
                  {currentToolCalls.length > 0 && (
                    <View style={{ marginBottom: 8, width: '100%' }}>
                      {currentToolCalls.map((tc, tcIdx) => (
                        <ToolCallBadge key={tcIdx} tool={tc} colors={colors} isDark={isDark} />
                      ))}
                    </View>
                  )}
                  {currentStreamText.trim() !== '' ? (
                    <Markdown style={markdownStyles}>{currentStreamText}</Markdown>
                  ) : (
                    <ThinkingIndicator colors={colors} isDark={isDark} />
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Clean Input Composer Bar */}
        <View style={[styles.inputComposerOuter, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: pageBgColor }]}>
          
          {/* Image Attachment Preview Badge */}
          {attachedImage && (
            <View style={[styles.imagePreviewChip, { backgroundColor: isDark ? '#161821' : '#F1F5F9', borderColor: colors.border }]}>
              <ImageIcon size={14} color={isDark ? '#58A6FF' : '#2563EB'} />
              <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 }} numberOfLines={1}>
                {attachedImage}
              </Text>
              <TouchableOpacity onPress={() => setAttachedImage(null)} style={{ padding: 2 }}>
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Single Clean Input Bar */}
          <View style={[
            styles.cleanInputBox,
            {
              borderColor: isInputFocused ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)') : colors.border,
              backgroundColor: isDark ? '#0B0C10' : '#FFFFFF',
            }
          ]}>
            {/* Left: Plus Button ONLY */}
            <TouchableOpacity onPress={() => setAttachModalVisible(true)} style={styles.inputPlusBtn} activeOpacity={0.7}>
              <Plus size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Input Field */}
            <TextInput
              ref={inputRef}
              style={[styles.cleanTextInput, { color: colors.text }]}
              placeholder="Ask anything or assign a task..."
              placeholderTextColor={colors.textSecondary + '70'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />

            {/* Right: Send / Stop Button ONLY */}
            {isStreaming ? (
              <TouchableOpacity onPress={() => stopGeneration()} style={styles.inputSendBtnActive} activeOpacity={0.7}>
                <Square size={12} fill="#FFFFFF" color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSend}
                disabled={inputText.trim() === '' && !attachedImage}
                style={[
                  styles.inputSendBtnActive,
                  { backgroundColor: (inputText.trim() !== '' || attachedImage) ? colors.text : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') }
                ]}
                activeOpacity={0.7}
              >
                <ArrowUp size={14} color={(inputText.trim() !== '' || attachedImage) ? (isDark ? '#030303' : '#FFFFFF') : colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Attachment Options Modal (Camera vs Gallery) */}
        <Modal transparent visible={attachModalVisible} animationType="fade" onRequestClose={() => setAttachModalVisible(false)}>
          <TouchableOpacity style={styles.attachModalOverlay} activeOpacity={1} onPress={() => setAttachModalVisible(false)}>
            <View style={[styles.attachModalContent, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
              <Text style={[styles.attachModalTitle, { color: colors.text }]}>Attach Media</Text>
              
              <TouchableOpacity onPress={handleCameraCapture} style={[styles.attachOptionRow, { borderBottomColor: colors.border }]}>
                <Camera size={18} color={colors.primary} strokeWidth={1.8} />
                <Text style={[styles.attachOptionText, { color: colors.text }]}>Take Photo (Camera)</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleGalleryUpload} style={styles.attachOptionRow}>
                <ImageIcon size={18} color={colors.primary} strokeWidth={1.8} />
                <Text style={[styles.attachOptionText, { color: colors.text }]}>Upload Image (Gallery)</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Slide-in Side Drawer Menu Overlay */}
        {drawerOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
              <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[
              styles.drawerContent,
              {
                backgroundColor: isDark ? '#0B0C10' : '#FFFFFF',
                borderColor: colors.border,
                transform: [{ translateX: drawerTranslateX }],
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 20),
              }
            ]}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>CloudCode AI</Text>
                <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Action 1: + New Chat */}
              <SpringPressable
                onPress={() => {
                  startNewChat()
                  setDrawerOpen(false)
                }}
                style={[styles.newChatDrawerBtn, { backgroundColor: isDark ? '#161821' : '#F1F5F9', borderColor: colors.border }]}
              >
                <Plus size={16} color={colors.text} strokeWidth={2} />
                <Text style={[styles.newChatDrawerText, { color: colors.text }]}>New Chat</Text>
              </SpringPressable>

              {/* Section: Previous Conversations (Top 5) */}
              <Text style={[styles.drawerSectionLabel, { color: colors.textSecondary }]}>Recent Conversations</Text>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {savedConversations.slice(0, 5).map((thread) => (
                  <TouchableOpacity
                    key={thread.id}
                    onPress={async () => {
                      await loadConversation(thread.id)
                      setDrawerOpen(false)
                    }}
                    style={[styles.recentConvoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                  >
                    <Text style={[styles.recentConvoTitle, { color: colors.text }]} numberOfLines={1}>
                      {thread.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Open All Conversations Button */}
              <TouchableOpacity
                onPress={() => {
                  setDrawerOpen(false)
                  setTabIndex(4)
                  setSettingsSubScreen('history')
                }}
                style={[styles.openAllConvosBtn, { borderColor: colors.border, backgroundColor: isDark ? '#161821' : '#F8FAFC' }]}
              >
                <History size={16} color={colors.primary} strokeWidth={1.8} />
                <Text style={[styles.openAllConvosText, { color: colors.text }]}>Open All Conversations</Text>
              </TouchableOpacity>

              {/* Settings Button */}
              <TouchableOpacity
                onPress={() => {
                  setDrawerOpen(false)
                  setTabIndex(4)
                  setSettingsSubScreen('limits')
                }}
                style={[styles.drawerSettingsBtn, { borderTopColor: colors.border }]}
              >
                <Settings size={18} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[styles.drawerSettingsText, { color: colors.textSecondary }]}>Settings & Limits</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>
        )}

      </KeyboardAvoidingView>
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 8,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerMenuBtn: {
    padding: 6,
  },
  orbContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWelcomeView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  welcomeSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  modelBubbleWrapper: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  userBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  modelBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  userBubbleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  streamingWrapper: {
    paddingVertical: 8,
  },
  inputComposerOuter: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  imagePreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cleanInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 48,
  },
  inputPlusBtn: {
    padding: 8,
  },
  cleanTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputSendBtnActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  attachModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  attachModalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  attachOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  attachOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  drawerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.82,
    borderRightWidth: 1,
    paddingHorizontal: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  newChatDrawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  newChatDrawerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  recentConvoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentConvoTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
  },
  openAllConvosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 14,
  },
  openAllConvosText: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  drawerSettingsText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
  },
})
