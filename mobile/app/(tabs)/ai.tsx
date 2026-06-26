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
  Shield, Lock, Square, MoreVertical, Plus, Mic, ArrowLeft, Folder,
  Plug, MessageSquare, Check
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

// Sleek and Trendy AI Thinking Wave Loader Component
function ThinkingIndicator({ colors, isDark }: { colors: any; isDark: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current
  const shimmer = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    // 1. Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // 2. Pulsing fade animation
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

    // 3. Shimmer wave animation
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
        {/* Rotating Micro AI Core Orb */}
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

        {/* Pulsing Sleek Label */}
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

      {/* Shimmering Wave Skeleton Bar */}
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

// Tool call reasoning generator mapping to plain English
const getToolReasoning = (name: string, args: any, result: any, status: string) => {
  const wsName = args.workspaceIdOrName || args.name || ''
  const path = args.path || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  if (name === 'select_workspace') {
    if (status === 'error') {
      return `Attempted to open and activate the workspace '${wsName || 'project'}', but encountered a container startup issue. Waking up a sleeping workspace container can sometimes experience temporary timeouts.`
    }
    return `Successfully woke up and activated the project workspace '${wsName || 'project'}'. This container is now warm and ready to compile files, run shell terminal commands, and perform development operations.`
  }

  if (name === 'list_workspaces') {
    return `Scanned your account projects to retrieve a fresh list of available workspaces, verifying which project environments are currently ready or sleeping.`
  }

  if (name === 'list_files') {
    const targetDir = args.path === '.' ? 'root' : `'${args.path}'`
    return `Examined the directory contents at the ${targetDir} folder of the workspace to inspect the project skeleton, helping locate files and map the workspace layout.`
  }

  if (name === 'read_file') {
    return `Opened and read the contents of the file '${filename || path || 'file'}' to inspect its implementation, configuration parameters, or code structure.`
  }

  if (name === 'edit_file') {
    return `Updated specific code snippets within the file '${filename || path || 'file'}' to integrate modifications, fix bugs, or add requested logic.`
  }

  if (name === 'create_file') {
    return `Created a new file at '${filename || path || 'file'}' and populated it with the required code structure or initial configurations.`
  }

  if (name === 'delete_file') {
    return `Removed the file '${filename || path || 'file'}' from the workspace directory to clean up or delete unused code assets.`
  }

  if (name === 'create_project') {
    return `Provisioned and initialized a new project named '${wsName}' with the requested template configuration and workspace dependencies.`
  }

  if (name === 'run_command') {
    const cmdStr = args.command || ''
    if (status === 'error') {
      return `Attempted to run the terminal command '${cmdStr}', but the process returned a non-zero exit code or failed to execute. Expand the activity logs to see execution warnings.`
    }
    return `Executed the terminal command '${cmdStr}' inside the workspace shell environment to run build tasks, install package dependencies, or start active services.`
  }

  return `Performed the action '${name.replace(/_/g, ' ')}' inside the workspace to fulfill the requested task.`
}

// Minimalist Collapsible Tool Call Badge Component
function ToolCallBadge({ tool, colors, isDark }: { tool: ToolCallInfo; colors: any; isDark: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const name = tool.name
  const args = tool.args || {}
  const status = tool.status
  const result = tool.result as any

  const path = (args.path as string) || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  let label = ''
  let ToolIcon = Sparkles

  if (name === 'run_command') {
    label = args.command ? `Run: ${args.command}` : 'Shell Command'
    ToolIcon = Terminal
  } else if (name === 'list_files') {
    label = args.path && args.path !== '.' ? `List Files: ${args.path}` : 'List Files'
    ToolIcon = Folder
  } else if (name === 'create_project') {
    label = args.name ? `Create Project: ${args.name}` : 'Create Project'
    ToolIcon = Sparkles
  } else if (name === 'select_workspace') {
    const wsName = (args.workspaceIdOrName as string) || ''
    label = wsName ? `Select Workspace: ${wsName}` : 'Select Workspace'
    ToolIcon = Folder
  } else if (name === 'list_workspaces') {
    label = 'List Workspaces'
    ToolIcon = Folder
  } else {
    // Elegant fallback for file tools or other future tools
    const isFileTool = name.endsWith('_file') || name.includes('file')
    const op = name.replace('_file', '').replace('view_file_content', 'read')
    // Replace underscores with spaces and capitalize each word
    const prettyOp = op.split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    if (filename) {
      label = `${prettyOp}: ${filename}`
    } else {
      label = isFileTool ? `${prettyOp} File` : prettyOp
    }
    ToolIcon = Folder
  }

  // Pulsing animation for active/running state (Blink label design)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null
    if (status === 'running' || status === 'pending') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      )
      anim.start()
    } else {
      pulseAnim.setValue(1)
    }
    return () => {
      anim?.stop()
    }
  }, [status])

  let StatusIcon: React.ReactNode = null
  let textStyle = { color: colors.text }

  if (status === 'running' || status === 'pending') {
    const activeColor = isDark ? '#58A6FF' : '#0969DA'
    StatusIcon = <ActivityIndicator size="small" color={activeColor} style={{ width: 14, height: 14 }} />
  } else if (status === 'done') {
    const successColor = isDark ? '#3FB950' : '#1A7F37'
    StatusIcon = <CheckCircle2 size={14} color={successColor} />
  } else if (status === 'error') {
    const errorColor = isDark ? '#FF7B72' : '#CF222E'
    StatusIcon = <AlertCircle size={14} color={errorColor} />
    textStyle = { color: errorColor }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Deduce expanded details content
  const renderDetails = () => {
    if (!isExpanded) return null
    const textReasoning = getToolReasoning(name, args, result, status)
    return (
      <View style={[
        styles.detailCollapseContainer,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderLeftWidth: 1.5,
          marginLeft: 7,
          paddingLeft: 12,
          marginTop: 4,
          marginBottom: 6
        }
      ]}>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 12.5,
          lineHeight: 19,
          fontFamily: 'Inter_400Regular'
        }}>
          {textReasoning}
        </Text>
      </View>
    )
  }

  const handleApproveAction = async (action: 'approve' | 'reject') => {
    if (!args.approvalId) return
    try {
      await useAIStore.getState().submitApproval(args.approvalId as string, action)
    } catch (e) {
      Alert.alert('Error', 'Failed to submit approval.')
    }
  }

  const isBlinking = status === 'running' || status === 'pending'

  return (
    <View style={{ width: '100%', paddingVertical: 2 }}>
      <TouchableOpacity
        style={[
          styles.toolCallBadgeCompact,
          {
            backgroundColor: 'transparent',
            borderWidth: 0,
            paddingVertical: 4,
            paddingHorizontal: 0,
          }
        ]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {StatusIcon}
          {isBlinking ? (
            <Animated.Text
              style={[
                styles.toolCallText,
                textStyle,
                {
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  opacity: pulseAnim,
                  flex: 1
                }
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          ) : (
            <Text
              style={[
                styles.toolCallText,
                textStyle,
                {
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  flex: 1
                }
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </View>

        {isExpanded ? (
          <ChevronUp size={14} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={14} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {renderDetails()}

      {status === 'pending' && !!args.approvalId && (
        <View style={[
          styles.inlineApprovalCard,
          {
            backgroundColor: isDark ? '#1C1500' : '#FFFDF0',
            borderColor: isDark ? '#E2B714' : '#F1E05A',
            marginLeft: 22,
            marginTop: 4,
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
      }).start(() => {
        setShouldRender(false)
      })
    }
  }, [visible])

  if (!shouldRender) return null

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  })

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1]
  })

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0]
  })

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }, { translateY }] }]}>
      {children}
    </Animated.View>
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
        <View style={[styles.headerRow, { borderBottomColor: 'transparent', borderBottomWidth: 0, backgroundColor: 'transparent', zIndex: 100 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/dashboard')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', flex: 1, marginRight: 22 }}>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }]}>
              CloudCodeAI
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
              onPress={() => setModelSelectorVisible(!modelSelectorVisible)}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontFamily: 'Inter_600SemiBold' }}>
                {selectedModel === 'gemini' ? 'Gemini 1.5 Flash' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude 3.6 Opus'}
              </Text>
              <ChevronDown size={11} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={[styles.menuBtn, { marginLeft: 'auto' }]}>
            <MoreVertical size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Clean Stylish Inline Model Dropdown */}
        {modelSelectorVisible && (
          <TouchableWithoutFeedback onPress={() => setModelSelectorVisible(false)}>
            <View style={styles.dropdownBackdrop} />
          </TouchableWithoutFeedback>
        )}

        <AnimatedDropdown
          visible={modelSelectorVisible}
          style={[
            styles.inlineModelDropdown,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              backgroundColor: isDark ? 'rgba(28, 31, 38, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              top: insets.top + 52,
              width: 220,
              borderRadius: 14,
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.inlineModelItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 16 }]}
            onPress={() => {
              setSelectedModel('gemini')
              setModelSelectorVisible(false)
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Cpu size={14} color="#3FB950" />
                <Text style={[styles.inlineModelLabel, { color: colors.text, fontFamily: selectedModel === 'gemini' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  Gemini 1.5 Flash
                </Text>
              </View>
              {selectedModel === 'gemini' && <Check size={14} color="#3FB950" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inlineModelItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 16, opacity: (userTier === 'free' && !isByokActive) ? 0.6 : 1 }]}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Shield size={14} color="#2F80ED" />
                <Text style={[styles.inlineModelLabel, { color: colors.text, fontFamily: selectedModel === 'openai' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  GPT-4o Premium
                </Text>
              </View>
              {selectedModel === 'openai' && <Check size={14} color="#2F80ED" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inlineModelItem, { borderBottomWidth: 0, paddingHorizontal: 16, opacity: (userTier === 'free' && !isByokActive) ? 0.6 : 1 }]}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Lock size={14} color="#9B51E0" />
                <Text style={[styles.inlineModelLabel, { color: colors.text, fontFamily: selectedModel === 'anthropic' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  Claude 3.6 Opus
                </Text>
              </View>
              {selectedModel === 'anthropic' && <Check size={14} color="#9B51E0" />}
            </View>
          </TouchableOpacity>
        </AnimatedDropdown>

        {/* Action Dropdown Menu */}
        {menuVisible && (
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>
        )}

        <AnimatedDropdown
          visible={menuVisible}
          style={[
            styles.dropdownMenuCard,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderWidth: 1,
              backgroundColor: isDark ? 'rgba(28, 31, 38, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              borderRadius: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 6,
              paddingVertical: 4,
              width: 190,
              top: insets.top + 52,
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.dropdownMenuItemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
            onPress={() => {
              setMenuVisible(false)
              startNewChat()
            }}
          >
            <Plus size={16} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }]}>New Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownMenuItemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
            onPress={() => {
              setMenuVisible(false)
              setModelSelectorVisible(true)
            }}
          >
            <Cpu size={16} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }]}>Switch Model</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownMenuItemRow, { borderBottomWidth: 0, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
            onPress={() => {
              setMenuVisible(false)
              router.push('/activity')
            }}
          >
            <History size={16} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }]}>History & Limits</Text>
          </TouchableOpacity>
        </AnimatedDropdown>

        {/* Conversation flow */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <Text style={[
                styles.welcomeGreeting,
                {
                  color: colors.text,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                  fontSize: 26,
                  fontWeight: '300',
                  textAlign: 'center',
                  lineHeight: 36,
                  opacity: 0.95,
                  letterSpacing: -0.2,
                }
              ]}>
                {(() => {
                  const hours = new Date().getHours()
                  let greet = 'Good evening'
                  if (hours >= 5 && hours < 12) greet = 'Good morning'
                  else if (hours >= 12 && hours < 17) greet = 'Good afternoon'
                  return `${greet}.\nWhat can I do for you?`
                })()}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <View key={msg.id} style={isUser ? styles.userBubbleWrapper : styles.modelBubbleWrapper}>
                    <View style={isUser ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9ECEF', borderColor: 'transparent', borderWidth: 0 }] : [styles.modelBubble, { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 8, maxWidth: '100%' }]}>
                      {isUser ? (
                        <Text style={[styles.userBubbleText, { color: colors.text }]}>
                          {msg.text}
                        </Text>
                      ) : (
                        <View style={{ width: '100%' }}>
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <View style={[styles.toolCallsContainer, { marginBottom: 8 }]}>
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
              })}

              {/* Streaming AI response bubble */}
              {isStreaming && (
                <View style={styles.modelBubbleWrapper}>
                  <View style={[styles.modelBubble, { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 8, maxWidth: '100%' }]}>
                    <View style={{ width: '100%' }}>
                      {currentToolCalls.length > 0 && (
                        <View style={[styles.toolCallsContainer, { marginBottom: 8 }]}>
                          {currentToolCalls.map((tc, tcIdx) => (
                            <ToolCallBadge key={tcIdx} tool={tc} colors={colors} isDark={isDark} />
                          ))}
                        </View>
                      )}
                      {currentStreamText.trim() !== '' ? (
                        <Markdown style={mdStyles}>
                          {currentStreamText}
                        </Markdown>
                      ) : (
                        currentStreamText.trim() === '' && (
                          <ThinkingIndicator colors={colors} isDark={isDark} />
                        )
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

          {/* Modern Floating Input Composer - Stacked Manus AI Style */}
          <View style={styles.composerWrapper}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 85 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.composerContainer,
                {
                  borderColor: isInputFocused
                    ? (isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)')
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                  borderWidth: 1,
                  backgroundColor: isDark ? 'rgba(26, 29, 36, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  shadowColor: '#000000',
                  shadowOpacity: isInputFocused ? 0.12 : 0.05,
                  shadowRadius: isInputFocused ? 10 : 5,
                  overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
                  borderRadius: 28,
                  paddingHorizontal: 10,
                  paddingTop: 12,
                  paddingBottom: 10,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }
              ]}
            >
              {/* Row 1: borderless TextInput */}
              <TextInput
                ref={inputRef}
                style={[styles.composerTextInput, { color: colors.text }]}
                placeholder="Assign a task or ask anything..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                textAlignVertical="top"
                scrollEnabled={true}
              />

              {/* Row 2: stacked Toolbar Actions */}
              <View style={styles.composerToolbar}>
                {/* Left Actions */}
                <View style={styles.toolbarLeft}>
                  <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.7}>
                    <Plus size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.7}>
                    <Plug size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Right Actions */}
                <View style={styles.toolbarRight}>
                  <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.7}>
                    <MessageSquare size={18} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {inputText.trim() === '' && !isStreaming ? (
                    <TouchableOpacity
                      style={[
                        styles.toolbarBtn,
                        isListening && { backgroundColor: 'rgba(235, 87, 87, 0.1)' }
                      ]}
                      onPress={toggleListening}
                      activeOpacity={0.7}
                    >
                      <Animated.View style={[isListening && { transform: [{ scale: voicePulse }] }]}>
                        <Mic size={18} color={isListening ? '#EB5757' : colors.textSecondary} />
                      </Animated.View>
                    </TouchableOpacity>
                  ) : null}

                  {isStreaming ? (
                    <TouchableOpacity
                      style={styles.composerStopBtn}
                      onPress={() => stopGeneration()}
                      activeOpacity={0.7}
                    >
                      <Square size={10} fill="#FFFFFF" color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    inputText.trim() !== '' && (
                      <TouchableOpacity
                        style={[styles.composerSendBtn, { backgroundColor: colors.text }]}
                        onPress={handleSend}
                        activeOpacity={0.7}
                      >
                        <ArrowUp size={14} color={isDark ? '#0E1116' : '#FFFFFF'} />
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        </View>


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
    paddingTop: Dimensions.get('window').height * 0.28,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeGreeting: {
    fontSize: 26,
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
    borderWidth: 0,
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
    marginTop: 8,
    gap: 4,
    width: '100%',
  },
  toolCallBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  toolCallText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  detailCollapseContainer: {
    width: '100%',
  },
  detailMetaLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  detailCodeBox: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginTop: 2,
  },
  detailCodeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    lineHeight: 15,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  composerTextInput: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    minHeight: 28,
    maxHeight: 130,
    paddingTop: Platform.OS === 'ios' ? 6 : 4,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    paddingHorizontal: 12,
    margin: 0,
    lineHeight: 20,
  },
  composerToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 6,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  dropdownBackdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: 98,
  },
  inlineModelDropdown: {
    position: 'absolute',
    alignSelf: 'center',
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 9999,
  },
  inlineModelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  inlineModelLabel: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
  },
})
