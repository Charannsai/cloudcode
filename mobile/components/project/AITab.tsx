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
  Shield, Lock, Square, MoreVertical, Plus, Mic
} from 'lucide-react-native'
import Svg, { Circle, Path, Polyline, Line, Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import Voice from '@react-native-voice/voice'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useAgentStore, ReasoningEvent } from '@/store/agentStore'
import Markdown from 'react-native-markdown-display'
import { api } from '@/lib/api'

// Custom SVG Status Indicator Component
interface StatusIconProps {
  status: 'pending' | 'thinking' | 'working' | 'completed' | 'needs_attention'
  color: string
}

function StatusIcon({ status, color }: StatusIconProps) {
  const spinValue = useRef(new Animated.Value(0)).current
  const pulseValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    let spinAnim: Animated.CompositeAnimation | null = null
    let pulseAnim: Animated.CompositeAnimation | null = null

    if (status === 'thinking' || status === 'working') {
      spinValue.setValue(0)
      spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      spinAnim.start()
    } else {
      spinValue.setValue(0)
    }

    if (status === 'needs_attention') {
      pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          })
        ])
      )
      pulseAnim.start()
    } else {
      pulseValue.setValue(1)
    }

    return () => {
      spinAnim?.stop()
      pulseAnim?.stop()
    }
  }, [status])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const animatedStyle = {
    transform: [
      { rotate: spin },
      { scale: pulseValue }
    ]
  }

  switch (status) {
    case 'pending':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <Circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
        </Svg>
      )
    case 'thinking':
      return (
        <Animated.View style={animatedStyle}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="12" r="10" opacity="0.25" />
            <Path d="M12 12 L12 2 A10 10 0 0 1 22 12 Z" fill={color} stroke="none" />
          </Svg>
        </Animated.View>
      )
    case 'working':
      return (
        <Animated.View style={animatedStyle}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
            <Circle cx="12" cy="12" r="10" opacity="0.25" />
            <Path d="M12 12 L12 2 A10 10 0 0 1 12 22 Z" fill={color} stroke="none" />
          </Svg>
        </Animated.View>
      )
    case 'completed':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="9 11 12 14 16 9" />
        </Svg>
      )
    case 'needs_attention':
      return (
        <Animated.View style={animatedStyle}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Line x1="12" y1="8" x2="12" y2="12" />
            <Line x1="12" y1="16" x2="12.01" y2="16" />
          </Svg>
        </Animated.View>
      )
    default:
      return null
  }
}

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
          {/* Outer dashed orbital ring */}
          <Circle cx="50" cy="50" r="45" stroke="url(#coreGrad)" strokeWidth="1.5" strokeDasharray="5 4" fill="none" opacity="0.35" />
          {/* Inner solid ring */}
          <Circle cx="50" cy="50" r="34" stroke="url(#coreGrad)" strokeWidth="1" fill="none" opacity="0.2" />
          {/* Inner core circle */}
          <Circle cx="50" cy="50" r="18" fill="url(#coreGrad)" opacity="0.15" />
          {/* Sparkle star in the center */}
          <Path d="M50 36 L53 45 L62 48 L53 51 L50 60 L47 51 L38 48 L47 45 Z" fill="url(#coreGrad)" />
        </Svg>
      </Animated.View>
    </View>
  )
}

// Convert raw technical logs and actions into clean, natural teammate language
function translateTechnicalAction(title: string, message?: string): string {
  if (!title) return "Preparing workspace..."

  if (title.startsWith("Executing Action:")) {
    const toolName = title.replace("Executing Action:", "").trim()
    
    switch (toolName) {
      case 'list_dir':
        return "Looking through your project structure."
      case 'grep_search': {
        if (message) {
          const match = message.match(/Query:\s*['"]?([^'"]+)['"]?/)
          const query = match ? match[1] : ""
          return query ? `Searching for where "${query}" is implemented.` : "Searching your codebase for related logic."
        }
        return "Searching your codebase for related logic."
      }
      case 'read_file':
      case 'view_file':
      case 'view_file_content': {
        const path = message || ""
        const filename = path.split(/[\/\\]/).pop() || ""
        if (filename === 'package.json' || filename === 'package-lock.json' || filename === 'app.json') {
          return "Checking which technologies this project uses."
        }
        if (path.includes('components/') || path.includes('app/') || path.includes('screens/')) {
          return `Inspecting the user interface code in ${filename}.`
        }
        if (path.includes('store/') || path.includes('context/') || path.includes('redux/')) {
          return `Examining state management structure in ${filename}.`
        }
        return filename ? `Reviewing the contents of ${filename}.` : "Reading project files to gather context."
      }
      case 'write_to_file':
      case 'replace_file_content':
      case 'multi_replace_file_content': {
        const path = message || ""
        const filename = path.split(/[\/\\]/).pop() || ""
        return filename ? `Integrating changes into ${filename}.` : "Writing code modifications to your project."
      }
      case 'run_command': {
        const cmd = message || ""
        if (cmd.includes('npm install') || cmd.includes('yarn install') || cmd.includes('pod install') || cmd.includes('npm i')) {
          return "Installing required dependencies."
        }
        if (cmd.includes('npm run') || cmd.includes('expo start') || cmd.includes('metro')) {
          return "Preparing the development environment."
        }
        if (cmd.includes('test') || cmd.includes('jest') || cmd.includes('mocha')) {
          return "Running the test suite to verify changes."
        }
        if (cmd.includes('lint') || cmd.includes('eslint')) {
          return "Checking code style and formatting."
        }
        return "Running development commands."
      }
      default:
        return `Executing a helper task to advance the goal.`
    }
  }

  if (title === 'Plan Checklist Formulated') {
    return "I've organized the step-by-step implementation plan."
  }
  if (title === 'Action Approval Required') {
    return "Waiting for your approval on a terminal command."
  }
  if (title === 'Run Execution Failure') {
    return "Encountered an obstacle. Working on a recovery plan."
  }
  
  return title
}

// Compute the state of our 6 premium phases based on active run data
interface Phase {
  id: string
  title: string
  status: 'pending' | 'thinking' | 'working' | 'completed' | 'needs_attention'
  message: string
  subActions: string[]
  technicalDetails: {
    title: string
    content: string
    status: string
    timestamp: number
  }[]
}

function computePhases(
  activeRun: any,
  turnEvents: ReasoningEvent[],
  plan: any[],
  logs: string[],
  pendingApproval: any
): Phase[] {
  const phases: Phase[] = [
    {
      id: 'thinking',
      title: 'Thinking',
      status: 'pending',
      message: 'Analyzing your request and project context...',
      subActions: [],
      technicalDetails: []
    },
    {
      id: 'understanding',
      title: 'Understanding Project',
      status: 'pending',
      message: 'Inspecting files, configurations, and dependencies...',
      subActions: [],
      technicalDetails: []
    },
    {
      id: 'planning',
      title: 'Planning',
      status: 'pending',
      message: 'Designing the optimal implementation strategy...',
      subActions: [],
      technicalDetails: []
    },
    {
      id: 'implementing',
      title: 'Implementing',
      status: 'pending',
      message: 'Creating components and applying code updates...',
      subActions: [],
      technicalDetails: []
    },
    {
      id: 'verifying',
      title: 'Verifying',
      status: 'pending',
      message: 'Testing and validating the changes...',
      subActions: [],
      technicalDetails: []
    },
    {
      id: 'completed',
      title: 'Completed',
      status: 'pending',
      message: 'All tasks completed successfully.',
      subActions: [],
      technicalDetails: []
    }
  ]

  if (!activeRun) {
    return phases
  }

  const hasPlan = plan && plan.length > 0
  const isRunCompleted = activeRun.status === 'completed'
  const isRunFailed = activeRun.status === 'failed'

  turnEvents.forEach((event) => {
    if (event.title === 'User Prompt') return

    const techTitle = event.title
    const techMessage = event.message || ''
    const translated = translateTechnicalAction(techTitle, techMessage)

    const detail = {
      title: techTitle,
      content: techMessage,
      status: event.status,
      timestamp: event.timestamp
    }

    if (
      techTitle.includes('list_dir') ||
      techTitle.includes('grep_search') ||
      (techTitle.includes('read_file') && !hasPlan) ||
      (techTitle.includes('view_file') && !hasPlan)
    ) {
      phases[1].subActions.push(translated)
      phases[1].technicalDetails.push(detail)
    } else if (techTitle === 'Plan Checklist Formulated' || techTitle.includes('planning')) {
      phases[2].subActions.push(translated)
      phases[2].technicalDetails.push(detail)
    } else if (
      techTitle.includes('write_to_file') ||
      techTitle.includes('replace_file_content') ||
      techTitle.includes('multi_replace_file_content') ||
      (techTitle.includes('read_file') && hasPlan) ||
      (techTitle.includes('view_file') && hasPlan)
    ) {
      phases[3].subActions.push(translated)
      phases[3].technicalDetails.push(detail)
    } else if (techTitle.includes('run_command')) {
      const cmd = techMessage
      if (cmd.includes('test') || cmd.includes('jest') || cmd.includes('lint') || cmd.includes('eslint') || cmd.includes('tsc')) {
        phases[4].subActions.push(translated)
        phases[4].technicalDetails.push(detail)
      } else {
        if (hasPlan) {
          phases[3].subActions.push(translated)
          phases[3].technicalDetails.push(detail)
        } else {
          phases[1].subActions.push(translated)
          phases[1].technicalDetails.push(detail)
        }
      }
    } else if (techTitle === 'Agent Reasoning') {
      if (!hasPlan) {
        phases[0].technicalDetails.push(detail)
      } else {
        phases[2].technicalDetails.push(detail)
      }
    } else if (techTitle === 'Action Approval Required') {
      phases[3].technicalDetails.push(detail)
    } else {
      if (hasPlan) {
        phases[3].technicalDetails.push(detail)
      } else {
        phases[1].technicalDetails.push(detail)
      }
    }
  })

  // Derive customized messages
  const reasoningEvents = turnEvents.filter(e => e.title === 'Agent Reasoning')
  const firstReasoning = reasoningEvents[0]?.message || ''

  if (firstReasoning) {
    const cleanMsg = firstReasoning.trim().split(/[.!?]\s+/)[0]
    if (cleanMsg && cleanMsg.length > 10 && cleanMsg.length < 150) {
      phases[0].message = cleanMsg + "."
    }
  }

  // Determine statuses
  // Phase 0: Thinking
  if (isRunCompleted || isRunFailed) {
    phases[0].status = 'completed'
  } else if (turnEvents.length > 0) {
    phases[0].status = hasPlan ? 'completed' : 'thinking'
  }

  // Phase 1: Understanding
  if (phases[1].subActions.length > 0) {
    if (hasPlan || isRunCompleted) {
      phases[1].status = 'completed'
    } else {
      phases[1].status = 'working'
    }
  } else if (phases[0].status === 'completed') {
    phases[1].status = hasPlan ? 'completed' : 'thinking'
  }

  // Phase 2: Planning
  if (hasPlan) {
    phases[2].status = (phases[3].subActions.length > 0 || isRunCompleted) ? 'completed' : 'working'
    phases[2].message = `I've formulated a checklist with ${plan.length} steps to achieve your goal.`
  } else if (phases[1].status === 'completed') {
    phases[2].status = 'thinking'
  }

  // Phase 3: Implementing
  if (phases[3].subActions.length > 0) {
    const isDoneImplementing = (phases[4].subActions.length > 0 || isRunCompleted)
    phases[3].status = isDoneImplementing ? 'completed' : 'working'
    const edits = plan.filter(p => p.status === 'completed').length
    phases[3].message = `Applying implementation steps. Progress: ${edits} of ${plan.length} completed.`
  } else if (phases[2].status === 'completed') {
    phases[3].status = 'thinking'
  }

  // Phase 4: Verifying
  if (phases[4].subActions.length > 0 || (isRunCompleted && plan.length > 0)) {
    phases[4].status = isRunCompleted ? 'completed' : 'working'
    phases[4].message = isRunCompleted ? 'All changes verified successfully.' : 'Validating implementation against project requirements...'
  } else if (phases[3].status === 'completed') {
    phases[4].status = 'thinking'
  }

  // Phase 5: Completed
  if (isRunCompleted) {
    phases[5].status = 'completed'
    phases[5].message = 'Everything is fully integrated, tested, and ready.'
  } else if (isRunFailed) {
    const activePhase = phases.find(p => p.status === 'working' || p.status === 'thinking')
    if (activePhase) {
      activePhase.status = 'needs_attention'
    }
  }

  // Handle Action approvals
  if (pendingApproval) {
    const activePhase = phases.find(p => p.status === 'working' || p.status === 'thinking') || phases[3]
    activePhase.status = 'needs_attention'
    activePhase.message = 'Waiting for your approval to run a terminal command.'
  }

  // De-duplicate actions
  phases.forEach(p => {
    p.subActions = Array.from(new Set(p.subActions))
  })

  return phases
}

// Phase Card Component
interface PhaseItemProps {
  phase: Phase
  isExpanded: boolean
  onToggleExpand: () => void
  onApprove: (action: 'approve' | 'reject') => void
  pendingApproval: any
  colors: any
  isDark: boolean
}

function PhaseItem({
  phase,
  isExpanded,
  onToggleExpand,
  onApprove,
  pendingApproval,
  colors,
  isDark
}: PhaseItemProps) {
  const [showTech, setShowTech] = useState(false)

  let statusColor = colors.textSecondary
  if (phase.status === 'thinking') statusColor = isDark ? '#A5D6FF' : '#0969DA'
  if (phase.status === 'working') statusColor = isDark ? '#58A6FF' : '#0969DA'
  if (phase.status === 'completed') statusColor = isDark ? '#3FB950' : '#1A7F37'
  if (phase.status === 'needs_attention') statusColor = isDark ? '#FF7B72' : '#CF222E'

  const isActive = phase.status === 'thinking' || phase.status === 'working' || phase.status === 'needs_attention'

  return (
    <View style={[styles.phaseCard, { borderLeftColor: statusColor }]}>
      <TouchableOpacity
        style={styles.phaseHeader}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <StatusIcon status={phase.status} color={statusColor} />
        <Text style={[
          styles.phaseTitle,
          {
            color: isActive ? colors.text : colors.textSecondary,
            fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular'
          }
        ]}>
          {phase.title}
        </Text>
        {(phase.subActions.length > 0 || phase.technicalDetails.length > 0) && (
          <View style={{ marginLeft: 'auto' }}>
            {isExpanded ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.phaseBody}>
          <Text style={[styles.phaseMessage, { color: colors.textSecondary }]}>
            {phase.message}
          </Text>

          {phase.subActions.length > 0 && (
            <View style={styles.subActionsList}>
              {phase.subActions.map((act, idx) => (
                <View key={idx} style={styles.subActionRow}>
                  <View style={[styles.subActionBullet, { backgroundColor: statusColor }]} />
                  <Text style={[styles.subActionText, { color: colors.text }]}>
                    {act}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {phase.status === 'needs_attention' && pendingApproval && (
            <View style={[
              styles.inlineApprovalCard,
              {
                backgroundColor: isDark ? '#1C1500' : '#FFFDF0',
                borderColor: isDark ? '#E2B714' : '#F1E05A',
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Shield size={14} color="#E2B714" />
                <Text style={[styles.inlineApprovalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  Action Approval Required
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                To proceed, I need to run this command:
              </Text>
              <View style={[styles.inlineApprovalCommandBox, { backgroundColor: isDark ? '#0D1117' : '#E9ECEF' }]}>
                <Text style={[styles.inlineApprovalCommandText, { color: isDark ? '#FF7B72' : '#CF222E' }]}>
                  $ {pendingApproval.command}
                </Text>
              </View>
              <View style={styles.inlineApprovalActions}>
                <TouchableOpacity
                  style={[styles.inlineApprovalBtn, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}
                  onPress={() => onApprove('reject')}
                >
                  <Text style={[styles.inlineApprovalBtnText, { color: colors.text }]}>Deny</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineApprovalBtn, { backgroundColor: '#3FB950' }]}
                  onPress={() => onApprove('approve')}
                >
                  <Text style={styles.inlineApprovalBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {phase.technicalDetails.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={styles.techToggleBtn}
                onPress={() => setShowTech(!showTech)}
                activeOpacity={0.7}
              >
                <Terminal size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.techToggleText, { color: colors.textSecondary }]}>
                  {showTech ? "Hide technical details" : "Show technical details"}
                </Text>
              </TouchableOpacity>

              {showTech && (
                <View style={[styles.techConsoleBox, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {phase.technicalDetails.map((detail, idx) => (
                      <View key={idx} style={{ marginBottom: 8 }}>
                        <Text style={[styles.techDetailTitle, { color: isDark ? '#8B929A' : '#57606A' }]}>
                          [{new Date(detail.timestamp).toLocaleTimeString()}] {detail.title}
                        </Text>
                        {detail.content ? (
                          <Text style={[styles.techDetailContent, { color: isDark ? '#C9D1D9' : '#24292F' }]}>
                            {detail.content}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

interface Props {
  projectId: string
}

export default function AITab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const {
    activeRun, runsList, isStreaming, plan, timeline, logs, pendingApproval,
    setActiveProject, loadRuns, startNewRun, resumeRun, approvePending, clearActiveRun, stopActiveRun
  } = useAgentStore()
  
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')
  
  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)
  
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [friendlyError, setFriendlyError] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)

  const [isByokActive, setIsByokActive] = useState(false)
  const [userTier, setUserTier] = useState('free')

  // Expanded phase tracking
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null)

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

  // Sync project context on mount
  useEffect(() => {
    setActiveProject(projectId)
    fetchByokAndTier()
  }, [projectId])

  // Auto-scroll main timeline on updates
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [timeline.length, plan.length, isStreaming])

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
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {})
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

  // Automatically expand active phase
  useEffect(() => {
    if (activeRun && isStreaming) {
      const activePhases = computePhases(activeRun, timeline, plan, logs, pendingApproval)
      const activeIndex = activePhases.findIndex(p => p.status === 'thinking' || p.status === 'working' || p.status === 'needs_attention')
      if (activeIndex !== -1) {
        setExpandedPhaseId(activePhases[activeIndex].id)
      }
    }
  }, [activeRun, isStreaming, timeline.length, plan.length, pendingApproval])

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    const prompt = inputText.trim()
    setInputText('')
    setFriendlyError(null)
    Keyboard.dismiss()
    
    if (!activeRun) {
      await startNewRun(projectId, selectedModel, prompt)
    } else {
      await resumeRun(activeRun.id, prompt)
    }
  }

  // Parse custom friendly errors
  useEffect(() => {
    const lastEvent = timeline[timeline.length - 1]
    if (lastEvent && lastEvent.status === 'failed' && lastEvent.message) {
      const msg = lastEvent.message
      if (msg.includes('LIMIT_EXCEEDED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('monthly token limit exceeded')) {
        setFriendlyError('Rate limit reached. Retry available in 45 seconds. Tap Switch Model or use BYOK.')
      } else if (msg.includes('Gemini API error') || msg.includes('fetch failed')) {
        setFriendlyError('Gemini is currently unavailable. Retrying connection...')
      } else {
        setFriendlyError(msg)
      }
    } else {
      setFriendlyError(null)
    }
  }, [timeline])

  // Get current objective sentence
  const getObjectiveSentence = (turnEvents: ReasoningEvent[]) => {
    const activePhases = computePhases(activeRun, turnEvents, plan, logs, pendingApproval)
    const currentActive = activePhases.find(p => p.status === 'thinking' || p.status === 'working' || p.status === 'needs_attention')
    if (currentActive) {
      return currentActive.message
    }
    return 'Ready to build together.'
  }

  // Group timeline events into turns
  const groupTurns = () => {
    const turns: {
      id: string
      userPrompt: ReasoningEvent | null
      agentReasoning: ReasoningEvent | null
      events: ReasoningEvent[]
      isLastTurn: boolean
    }[] = []
    
    let currentTurn: typeof turns[0] | null = null

    for (const event of timeline) {
      if (event.title === 'User Prompt') {
        if (currentTurn) {
          turns.push(currentTurn)
        }
        currentTurn = {
          id: event.id,
          userPrompt: event,
          agentReasoning: null,
          events: [],
          isLastTurn: false
        }
      } else if (event.title === 'Agent Reasoning') {
        if (!currentTurn) {
          currentTurn = {
            id: event.id,
            userPrompt: null,
            agentReasoning: event,
            events: [],
            isLastTurn: false
          }
        } else {
          currentTurn.agentReasoning = event
        }
      } else {
        if (currentTurn) {
          currentTurn.events.push(event)
        }
      }
    }

    if (currentTurn) {
      currentTurn.isLastTurn = true
      turns.push(currentTurn)
    }

    return turns
  }

  const chatTurns = groupTurns()

  // Markdown styling
  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    heading1: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 8, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#0D1117' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 8, borderRadius: 8, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 4, marginBottom: 4 },
  }

  interface ChatTurn {
    id: string
    userPrompt: ReasoningEvent | null
    agentReasoning: ReasoningEvent | null
    events: ReasoningEvent[]
    isLastTurn: boolean
  }

  // Premium Quick Action Suggestions
  const actionSuggestions = [
    { text: "🚀 Deploy backend service", prompt: "Deploy a backend server for my app." },
    { text: "🔍 Find authentication bugs", prompt: "Inspect authentication files to find errors." },
    { text: "📦 Install Zustand state", prompt: "Add Zustand package and set up state store." },
    { text: "🛠️ Add dark mode theme", prompt: "Modify components to support dark mode theme." }
  ]

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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

      {/* Subheader */}
      <View style={[styles.subheaderRow, { borderBottomColor: isDark ? '#21262D' : '#D8DEE4', zIndex: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.statusDot, { backgroundColor: isStreaming ? '#3FB950' : '#8B929A' }]} />
          <Text style={[styles.subheaderTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Workspace Copilot
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <TouchableOpacity
            style={[styles.modelBadge, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
            onPress={() => setModelSelectorVisible(true)}
          >
            <Cpu size={10} color="#3FB950" />
            <Text style={[styles.modelBadgeText, { color: colors.text }]}>
              {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuBtn}>
            <MoreVertical size={16} color={colors.text} />
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
              clearActiveRun()
            }}
          >
            <Plus size={14} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>New Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownMenuItemRow, { borderBottomColor: isDark ? '#21262D' : '#F6F8FA' }]}
            onPress={() => {
              setMenuVisible(false)
              setModelSelectorVisible(true)
            }}
          >
            <Cpu size={14} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>Switch Model</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownMenuItemRow}
            onPress={() => {
              setMenuVisible(false)
              router.push('/activity')
            }}
          >
            <History size={14} color={colors.text} />
            <Text style={[styles.dropdownMenuItemLabel, { color: colors.text }]}>History & Limits</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Conversation flow */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {chatTurns.length === 0 ? (
          <View style={styles.welcomeContainer}>
            {/* Premium Rotating orbital AI Core orb */}
            <AICoreLogo />
            <Text style={[styles.welcomeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Workspace Agent
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Describe changes or ask questions about this project's code. I can read, create, and edit files directly in this workspace.
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
            {chatTurns.map((turn, turnIdx) => {
              const turnPhases = computePhases(activeRun, turn.events, plan, logs, pendingApproval)
              const objective = getObjectiveSentence(turn.events)

              return (
                <View key={turn.id || turnIdx} style={styles.turnContainer}>
                  {/* User Prompt */}
                  {turn.userPrompt && (
                    <View style={styles.userBubbleWrapper}>
                      <View style={[styles.userBubble, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                        <Text style={[styles.userBubbleText, { color: colors.text }]}>
                          {turn.userPrompt.message}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Agent Teammate Response Card */}
                  <View style={[styles.teammateCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4', borderWidth: isDark ? 0 : 1 }]}>
                    {/* Premium Teammate Header */}
                    <View style={styles.teammateHeader}>
                      <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                        <Sparkles size={13} color="#3FB950" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.teammateName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                          CloudCode Partner
                        </Text>
                        {turn.isLastTurn && isStreaming && (
                          <Text style={[styles.objectiveText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {objective}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Main streaming reasoning message */}
                    {turn.agentReasoning && turn.agentReasoning.message && (
                      <View style={styles.markdownWrapper}>
                        <Markdown style={mdStyles}>
                          {turn.agentReasoning.message}
                        </Markdown>
                      </View>
                    )}

                    {/* Subtle divider */}
                    {turn.events.length > 0 && <View style={[styles.cardDivider, { backgroundColor: isDark ? '#21262D' : '#D8DEE4' }]} />}

                    {/* Stepper Phase Timeline (Progressive Disclosure) */}
                    {turn.events.length > 0 && (
                      <View style={styles.timelineWrapper}>
                        {turnPhases.map((phase) => {
                          const isExpanded = turn.isLastTurn ? (expandedPhaseId === phase.id) : false
                          
                          return (
                            <PhaseItem
                              key={phase.id}
                              phase={phase}
                              isExpanded={isExpanded}
                              onToggleExpand={() => {
                                if (turn.isLastTurn) {
                                  setExpandedPhaseId(expandedPhaseId === phase.id ? null : phase.id)
                                }
                              }}
                              onApprove={approvePending}
                              pendingApproval={pendingApproval}
                              colors={colors}
                              isDark={isDark}
                            />
                          )
                        })}
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
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

        {/* Modern Floating Input Composer (with Focused Glow Border) */}
        <View style={styles.composerWrapper}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 100}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.composerContainer,
              {
                borderColor: isInputFocused
                  ? (isDark ? '#388BFD' : '#0969DA')
                  : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'),
                borderWidth: isInputFocused ? 1.5 : 1,
                backgroundColor: isDark ? 'rgba(21, 25, 34, 0.82)' : 'rgba(255, 255, 255, 0.85)',
                shadowColor: isInputFocused ? (isDark ? '#388BFD' : '#0969DA') : '#000000',
                shadowOpacity: isInputFocused ? (isDark ? 0.22 : 0.1) : (isDark ? 0.1 : 0.05),
                shadowRadius: isInputFocused ? 18 : 10,
                overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
              }
            ]}
          >
            {/* Attachment Button */}
            <TouchableOpacity style={styles.composerLeftBtn} activeOpacity={0.7}>
              <Plus size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Context chip */}
            <View style={[
              styles.contextChip,
              {
                backgroundColor: isDark ? 'rgba(56, 139, 253, 0.1)' : 'rgba(9, 105, 218, 0.06)',
                borderColor: isDark ? 'rgba(56, 139, 253, 0.22)' : 'rgba(9, 105, 218, 0.15)',
                borderWidth: 1
              }
            ]}>
              <Text style={[styles.contextChipText, { color: isDark ? '#58A6FF' : '#0969DA' }]}>
                Project
              </Text>
            </View>

            {/* TextInput */}
            <TextInput
              ref={inputRef}
              style={[styles.composerTextInput, { color: colors.text }]}
              placeholder={activeRun?.status === 'completed' ? "Goal completed. Ask follow-up..." : "Ask Copilot anything..."}
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
                  onPress={() => stopActiveRun()}
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
                Gemini 3.5 Flash (Teammate engine)
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  subheaderTitle: {
    fontSize: 14,
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
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  menuBtn: {
    padding: 4,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '90%',
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 32,
    gap: 8,
  },
  suggestionCard: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  suggestionCardText: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
  },
  turnContainer: {
    gap: 10,
  },
  userBubbleWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  userBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: SCREEN_WIDTH * 0.8,
    borderWidth: 1,
  },
  userBubbleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  teammateCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  teammateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teammateName: {
    fontSize: 14,
  },
  objectiveText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  markdownWrapper: {
    paddingLeft: 2,
  },
  cardDivider: {
    height: 1,
    marginVertical: 2,
  },
  timelineWrapper: {
    gap: 8,
  },
  phaseCard: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 2,
    gap: 4,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseTitle: {
    fontSize: 12.5,
  },
  phaseBody: {
    marginTop: 2,
    gap: 6,
    paddingLeft: 26,
  },
  phaseMessage: {
    fontSize: 11.5,
    lineHeight: 15,
    fontFamily: 'Inter_400Regular',
  },
  subActionsList: {
    gap: 4,
    marginTop: 2,
  },
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subActionBullet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  subActionText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
  },
  inlineApprovalCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  inlineApprovalTitle: {
    fontSize: 12,
  },
  inlineApprovalCommandBox: {
    padding: 6,
    borderRadius: 6,
  },
  inlineApprovalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  inlineApprovalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  inlineApprovalBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineApprovalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  techToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  techToggleText: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
  },
  techConsoleBox: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 6,
    marginTop: 2,
  },
  techDetailTitle: {
    fontSize: 9.5,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  techDetailContent: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9.5,
    marginTop: 2,
    paddingLeft: 4,
  },
  composerWrapper: {
    zIndex: 99,
  },
  bottomContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 8,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  composerLeftBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contextChipText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  composerTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 6 : 2,
    paddingBottom: Platform.OS === 'ios' ? 6 : 2,
    paddingHorizontal: 0,
    margin: 0,
    lineHeight: 18,
  },
  composerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerMicBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerStopBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 98,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  listeningPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EB5757',
  },
  listeningTooltipText: {
    fontSize: 11,
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
    top: 42,
    right: 12,
    width: 160,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dropdownMenuItemLabel: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
  },
})
