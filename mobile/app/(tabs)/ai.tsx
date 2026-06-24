import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share, Alert, Modal,
  Switch, Animated, Easing, TouchableWithoutFeedback
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal, Loader,
  CheckCircle2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon,
  Mic, Volume2, VolumeX, FolderGit2, ChevronDown, ChevronUp, Cpu, Shield, Lock,
  MoreVertical, History, Plus, ChevronRight, StopCircle
} from 'lucide-react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useProjectsStore } from '@/store/projects'
import { api } from '@/lib/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'
import * as Speech from 'expo-speech'
// Removed react-native-reanimated for performance optimization
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as ReanimatedEasing,
  runOnJS
} from 'react-native-reanimated'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const formatTimestamp = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate real-time execution logs from active/past tool calls
function getRealtimeReasoning(toolCalls: ToolCallInfo[], isStreaming: boolean): string[] {
  const steps: string[] = []
  
  if (!toolCalls || toolCalls.length === 0) {
    if (isStreaming) {
      steps.push('Analyzing query and workspace context...')
      steps.push('Planning next steps...')
    } else {
      steps.push('Completed analysis.')
    }
    return steps
  }

  toolCalls.forEach((tc) => {
    let statusText = 'Completed'
    if (tc.status === 'pending') statusText = 'Waiting for permission'
    if (tc.status === 'running') statusText = 'Running'
    if (tc.status === 'error') statusText = 'Failed'

    if (tc.name === 'read_file') {
      steps.push(`${statusText} reading file: ${tc.args?.path || ''}`)
    } else if (tc.name === 'edit_file') {
      steps.push(`${statusText} editing file: ${tc.args?.path || ''}`)
    } else if (tc.name === 'create_file') {
      steps.push(`${statusText} creating file: ${tc.args?.path || ''}`)
    } else if (tc.name === 'delete_file') {
      steps.push(`${statusText} deleting file: ${tc.args?.path || ''}`)
    } else if (tc.name === 'run_command') {
      steps.push(`${statusText} command: "${tc.args?.command || ''}"`)
    } else if (tc.name === 'list_files') {
      steps.push(`${statusText} scanning project structure`)
    } else {
      steps.push(`${statusText} tool call: ${tc.name}`)
    }
  })

  if (isStreaming) {
    const lastTc = toolCalls[toolCalls.length - 1]
    if (lastTc.status === 'done') {
      steps.push('Synthesizing results and planning next steps...')
    }
  }

  return steps
}


function ToolCallRow({ tool, isDark, colors }: { tool: ToolCallInfo; isDark: boolean; colors: any }) {
  const [modalOpen, setModalOpen] = useState(false)
  const previewAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (modalOpen) {
      previewAnim.setValue(0)
      Animated.timing(previewAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start()
    }
  }, [modalOpen])

  const isPending = tool.status === 'pending'
  const isRunning = tool.status === 'running'
  const isError = tool.status === 'error'
  const isDone = tool.status === 'done'

  // Determine status text & colors
  const statusColor = isPending
    ? '#E2B714'
    : isRunning
      ? '#58A6FF'
      : isDone
        ? '#3FB950'
        : '#F85149'

  const statusText = isPending
    ? 'Pending Approval'
    : isRunning
      ? 'Running...'
      : isDone
        ? 'Success'
        : 'Failed'

  // Determine Icon and Label for tool
  let Icon = FileCode
  let label = tool.name
  let target = (tool.args?.path || tool.args?.command || '') as string

  if (tool.name === 'run_command') {
    Icon = Terminal
    label = 'Execute Command'
  } else if (tool.name === 'create_file') {
    Icon = Plus
    label = 'Create File'
  } else if (tool.name === 'edit_file') {
    Icon = FileCode
    label = 'Edit File'
  } else if (tool.name === 'delete_file') {
    Icon = Trash2
    label = 'Delete File'
  } else if (tool.name === 'read_file') {
    Icon = FileCode
    label = 'Read File'
  } else if (tool.name === 'list_files') {
    Icon = FolderTree
    label = 'List Directory'
  }

  // Compile summary & preview content
  let summaryText = ''
  let fullContent = ''

  if (tool.name === 'run_command') {
    const resultObj = tool.result as any
    const output = (resultObj?.output || resultObj?.error || resultObj?.message || '') as string
    summaryText = isPending 
      ? 'Requires user approval'
      : isRunning
        ? 'Executing in workspace...'
        : isError
          ? 'Failed to execute'
          : 'Executed successfully'
    fullContent = output || 'No console output returned.'
  } else if (tool.name === 'read_file') {
    const res = tool.result as any
    if (res?.content) {
      const lines = res.content.split('\n')
      summaryText = `Read ${lines.length} lines`
      fullContent = res.content
    } else if (res?.error) {
      summaryText = `Error: ${res.error}`
      fullContent = res.error
    }
  } else if (tool.name === 'create_file') {
    const content = (tool.args?.content || '') as string
    const lines = content.split('\n')
    summaryText = `Created with ${lines.length} lines`
    fullContent = content
  } else if (tool.name === 'edit_file') {
    const replacement = (tool.args?.replacementContent || tool.args?.replacement || '') as string
    const targetContent = (tool.args?.targetContent || tool.args?.target || '') as string
    summaryText = `Applied code changes`
    fullContent = `<<<< TARGET CODE <<<<\n${targetContent}\n==== REPLACEMENT ==== \n${replacement}\n>>>> OUTPUT >>>>`
  } else if (tool.name === 'list_files') {
    const res = tool.result as any
    if (res?.files) {
      summaryText = `Scanned ${res.files.length} files`
      fullContent = res.files.join('\n')
    } else if (res?.error) {
      summaryText = `Error: ${res.error}`
      fullContent = res.error
    }
  } else if (tool.name === 'delete_file') {
    summaryText = `Deleted file`
    fullContent = `Deleted file at: ${target}`
  }

  const hasDetails = !!(!isPending && !isRunning && (tool.result || tool.args?.content || tool.args?.replacement || tool.args?.replacementContent))

  return (
    <View style={[
      styles.toolCard,
      {
        backgroundColor: isDark ? '#161B22' : '#F6F8FA',
        borderColor: isDark ? '#21262D' : '#D8DEE4',
      }
    ]}>
      <View style={styles.toolHeader}>
        <View style={styles.toolHeaderLeft}>
          <Icon size={14} color={isDark ? '#8B929A' : '#656D76'} style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.toolLabelText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              {label}
            </Text>
            <Text style={[styles.toolTargetText, { color: colors.textSecondary }]} numberOfLines={1}>
              {target}
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium' }}>
            {statusText}
          </Text>
        </View>
      </View>

      {summaryText ? (
        <View style={styles.toolSummaryRow}>
          <Text style={[styles.toolSummaryText, { color: colors.textSecondary }]}>
            {summaryText}
          </Text>
          {hasDetails && (
            <TouchableOpacity 
              onPress={() => setModalOpen(true)}
              style={styles.toolDetailsBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolDetailsBtnText, { color: colors.primary }]}>
                {tool.name === 'run_command' ? 'View Output' : 'View Details'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Details Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                opacity: previewAnim 
              }
            ]} 
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalOpen(false)}
          />
          <Animated.View style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
              borderColor: isDark ? '#21262D' : '#E5E7EB',
              height: '80%',
              transform: [
                {
                  translateY: previewAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [150, 0],
                  })
                }
              ]
            }
          ]}>
            <View style={[styles.modalDragHandle, { backgroundColor: isDark ? '#30363D' : '#D1D5DB' }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                {label} Details
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 }]} numberOfLines={1}>
                {target}
              </Text>
            </View>

            <ScrollView style={{ flex: 1, marginVertical: 8 }} showsVerticalScrollIndicator={true}>
              <View style={[styles.fullPreviewCodeBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <Text style={[styles.fullPreviewCodeText, { color: isDark ? '#C9D1D9' : '#24292F' }]}>
                  {fullContent}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
              onPress={() => setModalOpen(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

function MessageBubble({ message, isDark, colors, onSpeakPress, speakingMessageId }: {
  message: ChatMessage; isDark: boolean; colors: any; onSpeakPress: (id: string, text: string) => void; speakingMessageId: string | null
}) {
  const isUser = message.role === 'user'
  const [reasoningExpanded, setReasoningExpanded] = useState(false)

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

  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0
  const reasoningSteps = hasToolCalls ? getRealtimeReasoning(message.toolCalls!, false) : []

  return (
    <View
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
          ? [styles.userBubble, { backgroundColor: isDark ? '#21262D' : '#F0F2F5' }]
          : styles.modelBubble
      ]}>
        {/* Collapsible Persistent Reasoning Accordion */}
        {hasToolCalls && (
          <View style={[
            styles.persistentReasoningCard,
            {
              backgroundColor: isDark ? '#151922' : '#F6F8FA',
              borderColor: isDark ? '#21262D' : '#D8DEE4',
            }
          ]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setReasoningExpanded(!reasoningExpanded)}
              style={styles.reasoningHeaderRow}
            >
              <Sparkles size={12} color={isDark ? '#D2A8FF' : '#8250DF'} style={{ marginRight: 6 }} />
              <Text style={[styles.reasoningTitleText, { color: colors.textSecondary }]}>
                Thought Process ({message.toolCalls?.length} steps)
              </Text>
              {reasoningExpanded ? (
                <ChevronUp size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
              ) : (
                <ChevronDown size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>

            {reasoningExpanded && (
              <View style={styles.reasoningStepsList}>
                {reasoningSteps.map((step, idx) => (
                  <View key={idx} style={styles.reasoningStepRow}>
                    <CheckCircle2 size={10} color="#3FB950" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={[styles.reasoningStepText, { color: colors.textSecondary }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tool calls */}
        {message.toolCalls?.map((tc, i) => (
          <ToolCallRow key={i} tool={tc} isDark={isDark} colors={colors} />
        ))}

        {isUser ? (
          <Text style={[styles.messageText, { color: isDark ? '#FFFFFF' : '#1F2328' }]}>
            {message.text}
          </Text>
        ) : (
          <View>
            {message.text ? (
              <Markdown style={mdStyles}>
                {message.text}
              </Markdown>
            ) : null}

            {/* AI Action Row */}
            {message.text ? (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => Clipboard.setStringAsync(message.text)}
                  activeOpacity={0.7}
                >
                  <Copy size={12} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => Share.share({ message: message.text })}
                  activeOpacity={0.7}
                >
                  <ShareIcon size={12} color={colors.textSecondary} strokeWidth={1.5} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => onSpeakPress(message.id, message.text)}
                  activeOpacity={0.7}
                >
                  {speakingMessageId === message.id ? (
                    <VolumeX size={12} color={colors.primary} strokeWidth={1.5} />
                  ) : (
                    <Volume2 size={12} color={colors.textSecondary} strokeWidth={1.5} />
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
    </View>
  )
}

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    messages, isStreaming, currentStreamText, currentToolCalls,
    sendMessage, clearChat, pendingPrompt, setPendingPrompt,
    activeProjectId: selectedProjectId, setActiveProject: setSelectedProjectId,
    currentThreadId, savedConversations, byokEnabled, byokConfigured,
    initConversations, loadConversation, deleteConversation, toggleByok, startNewChat, stopGeneration
  } = useAIStore()
  const insets = useSafeAreaInsets()

  const [inputText, setInputText] = useState('')
  const inputRef = useRef<TextInput>(null)
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  const [selectedModel, setSelectedModel] = useState<'gemini' | 'openai' | 'anthropic'>('gemini')
  const [modelModalVisible, setModelModalVisible] = useState(false)
  const [userTier, setUserTier] = useState<string>('free')
  const [byokTokensUsed, setByokTokensUsed] = useState(0)

  const [menuVisible, setMenuVisible] = useState(false)
  const [historyModalVisible, setHistoryModalVisible] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

  // Reanimated states for Model Selection Modal
  const [renderModelModal, setRenderModelModal] = useState(false)
  const modelProgress = useSharedValue(0)

  useEffect(() => {
    if (modelModalVisible) {
      setRenderModelModal(true)
      modelProgress.value = withTiming(1, { duration: 180, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) })
    } else {
      modelProgress.value = withTiming(0, { duration: 140, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) }, (finished) => {
        if (finished) {
          runOnJS(setRenderModelModal)(false)
        }
      })
    }
  }, [modelModalVisible])

  const modelBackdropStyle = useAnimatedStyle(() => ({
    opacity: modelProgress.value,
  }))

  const modelCardStyle = useAnimatedStyle(() => {
    const progress = modelProgress.value
    const scale = 0.95 + 0.05 * progress
    const translateY = (1 - progress) * 12
    return {
      opacity: progress,
      transform: [{ scale }, { translateY }],
    }
  })

  // Reanimated states for History Modal
  const [renderHistoryModal, setRenderHistoryModal] = useState(false)
  const historyProgress = useSharedValue(0)

  useEffect(() => {
    if (historyModalVisible) {
      setRenderHistoryModal(true)
      historyProgress.value = withTiming(1, { duration: 180, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) })
    } else {
      historyProgress.value = withTiming(0, { duration: 140, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) }, (finished) => {
        if (finished) {
          runOnJS(setRenderHistoryModal)(false)
        }
      })
    }
  }, [historyModalVisible])

  const historyBackdropStyle = useAnimatedStyle(() => ({
    opacity: historyProgress.value,
  }))

  const historyCardStyle = useAnimatedStyle(() => {
    const progress = historyProgress.value
    const scale = 0.95 + 0.05 * progress
    const translateY = (1 - progress) * 12
    return {
      opacity: progress,
      transform: [{ scale }, { translateY }],
    }
  })

  // Reanimated states for history dropdown menu
  const [renderMenu, setRenderMenu] = useState(false)
  const menuProgress = useSharedValue(0)

  useEffect(() => {
    if (menuVisible) {
      setRenderMenu(true)
      menuProgress.value = withTiming(1, { duration: 180, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) })
    } else {
      menuProgress.value = withTiming(0, { duration: 140, easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1) }, (finished) => {
        if (finished) {
          runOnJS(setRenderMenu)(false)
        }
      })
    }
  }, [menuVisible])

  const menuBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
  }))

  const menuCardAnimatedStyle = useAnimatedStyle(() => {
    const progress = menuProgress.value
    const opacity = progress
    // Warp out of three-dot header button (top-right, approx right: 32)
    const translateX = (1 - progress) * 99
    const translateY = (1 - progress) * -80
    const scaleX = 0.05 + 0.95 * progress
    const scaleY = 0.05 + 0.95 * progress
    const skewX = `${(1 - progress) * -8}deg`
    const rotateZ = `${(1 - progress) * 4}deg`

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scaleX },
        { scaleY },
        { skewX },
        { rotateZ }
      ]
    }
  })

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
      sendMessage(prompt, selectedProjectId, undefined, selectedModel)
    }
  }, [pendingPrompt, selectedProjectId, isStreaming, selectedModel])

  // Hide the global tab bar completely when on this screen and sync projects
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(true)
      fetchProjects(true)

      // Fetch active user tier status for premium model checks
      api.billing.status()
        .then(data => {
          if (data?.tier?.name) {
            setUserTier(data.tier.name)
          }
          if (data?.usage?.byokTokens) {
            setByokTokensUsed(data.usage.byokTokens.used)
          }
        })
        .catch(err => console.warn('Failed to load user tier config:', err))

      // Load conversation history and check BYOK keys status
      initConversations()

      return () => {}
    }, [fetchProjects, setTabBarVisible])
  )

  // Auto-select global for the main assistant
  useEffect(() => {
    setSelectedProjectId('global')
  }, [])

  // Auto-expand reasoning accordion during active stream
  useEffect(() => {
    if (isStreaming) {
      setReasoningExpanded(true)
    }
  }, [isStreaming])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, currentStreamText])

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    if (!selectedProjectId) return

    const text = inputText.trim()
    setInputText('')
    await sendMessage(text, selectedProjectId, undefined, selectedModel)
  }

  // Find if there is any pending command tool call in the active streaming list or in the last message
  const getPendingCommand = () => {
    if (isStreaming && currentToolCalls) {
      const pending = currentToolCalls.find(tc => tc.name === 'run_command' && tc.status === 'pending')
      if (pending) return pending
    }
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'model' && lastMsg.toolCalls) {
        const pending = lastMsg.toolCalls.find(tc => tc.name === 'run_command' && tc.status === 'pending')
        if (pending) return pending
      }
    }
    return null
  }

  const handleApproveCommand = async (approvalId: string) => {
    if (!approvalId) return
    setIsActionLoading(true)
    try {
      await api.ai.approve(approvalId, 'approve')
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to approve command')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectCommand = async (approvalId: string) => {
    if (!approvalId) return
    setIsActionLoading(true)
    try {
      await api.ai.approve(approvalId, 'reject')
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to reject command')
    } finally {
      setIsActionLoading(false)
    }
  }

  const pendingCommand = getPendingCommand()
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
    <TabGenieWrapper index={3}>
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[
        styles.header,
        {
          borderBottomColor: isDark ? '#21262D' : '#D8DEE4',
          paddingTop: insets.top > 0 ? insets.top + 8 : 20,
        }
      ]}>
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
              General Assistant
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            onPress={() => setModelModalVisible(true)}
            style={[styles.modelPill, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            {selectedModel === 'gemini' && <Sparkles size={12} color="#8B5CF6" />}
            {selectedModel === 'openai' && <Cpu size={12} color="#10B981" />}
            {selectedModel === 'anthropic' && <Shield size={12} color="#D97706" />}
            <Text style={[styles.modelPillText, { color: colors.text }]}>
              {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'openai' ? 'gpt-4o' : 'Claude Opus 4.6'}
            </Text>
            <ChevronDown size={10} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={[styles.clearBtn, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA' }]} activeOpacity={0.7}>
            <MoreVertical size={16} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BYOK Stats Banner */}
      {byokEnabled && (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#e6ffec', 
          paddingVertical: 8, 
          paddingHorizontal: 16, 
          borderBottomWidth: 1, 
          borderBottomColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#10B98130' 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Shield size={12} color="#10B981" />
            <Text style={{ color: isDark ? '#10B981' : '#059669', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>BYOK Session Active</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'JetBrainsMono_400Regular' }}>
            BYOK Stats: <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_600SemiBold' }}>{byokTokensUsed.toLocaleString()}</Text> tokens
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !isStreaming && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              <Sparkles size={28} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.2} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Hi {username}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16 }]}>
              Ask questions, write/edit code, run terminal commands, or brainstorm ideas.
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

            {!byokConfigured && (
              <TouchableOpacity
                onPress={() => {
                  useUIStore.getState().setSettingsSubScreen('aiKeys')
                  router.push('/(tabs)/settings')
                }}
                activeOpacity={0.8}
                style={[
                  styles.byokPromoCard,
                  {
                    backgroundColor: isDark ? '#1C2128' : '#F6F8FA',
                    borderColor: isDark ? '#21262D' : '#D8DEE4',
                  }
                ]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    Bring Your Own Key (BYOK)
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                    AI features are currently using default hosted keys. Tap to configure your custom API keys.
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
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
          <View style={[styles.messageBubbleWrapper, styles.modelWrapper]}>
            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4', borderWidth: 1 }]}>
              <Sparkles size={14} color={isDark ? '#D2A8FF' : '#8250DF'} strokeWidth={1.5} />
            </View>
            <View style={[styles.bubble, styles.modelBubble]}>
              
              {/* Live Streaming Reasoning Accordion */}
              {(currentToolCalls.length > 0 || !currentStreamText) && (
                <View style={[
                  styles.persistentReasoningCard,
                  {
                    backgroundColor: isDark ? '#151922' : '#F6F8FA',
                    borderColor: isDark ? '#21262D' : '#D8DEE4',
                    marginBottom: 6,
                  }
                ]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setReasoningExpanded(!reasoningExpanded)}
                    style={styles.reasoningHeaderRow}
                  >
                    <ActivityIndicator size="small" color={isDark ? '#D2A8FF' : '#8250DF'} style={{ marginRight: 6 }} />
                    <Text style={[styles.reasoningTitleText, { color: colors.textSecondary }]}>
                      Thought Process ({getRealtimeReasoning(currentToolCalls, isStreaming).length} steps)
                    </Text>
                    {reasoningExpanded ? (
                      <ChevronUp size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                    ) : (
                      <ChevronDown size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>

                  {reasoningExpanded && (
                    <View style={styles.reasoningStepsList}>
                      {getRealtimeReasoning(currentToolCalls, isStreaming).map((step, idx) => {
                        const isLast = idx === getRealtimeReasoning(currentToolCalls, isStreaming).length - 1
                        const showSpinner = isLast && isStreaming && !currentStreamText
                        return (
                          <View key={idx} style={styles.reasoningStepRow}>
                            {showSpinner ? (
                              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6, transform: [{ scale: 0.7 }] }} />
                            ) : (
                              <CheckCircle2 size={10} color="#3FB950" style={{ marginRight: 6, marginTop: 2 }} />
                            )}
                            <Text style={[styles.reasoningStepText, { color: colors.textSecondary }]}>
                              {step}
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Tool calls */}
              {currentToolCalls.map((tc, i) => (
                <ToolCallRow key={i} tool={tc} isDark={isDark} colors={colors} />
              ))}

              {/* Streaming Text */}
              {currentStreamText ? (
                <Markdown style={mdStyles}>
                  {(() => {
                    const str = currentStreamText
                    const match = str.match(/```/g)
                    if (match && match.length % 2 !== 0) return str + '\n```\n ▊'
                    return str + ' ▊'
                  })()}
                </Markdown>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating command execution approval modal */}
      {pendingCommand && (
        <View style={[
          styles.floatingApprovalCard,
          {
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            borderColor: isDark ? '#30363D' : '#E1E4E8',
            bottom: insets.bottom > 0 ? insets.bottom + 70 : 86
          }
        ]}>
          <View style={styles.floatingApprovalHeader}>
            <Terminal size={14} color={isDark ? '#E2B714' : '#D97706'} style={{ marginRight: 6 }} />
            <Text style={[styles.floatingApprovalTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              AI Requesting Shell Execution
            </Text>
          </View>
          
          <Text style={[styles.floatingApprovalSubtitle, { color: colors.textSecondary }]}>
            The assistant wants to run the following command in your workspace:
          </Text>

          <View style={[styles.floatingApprovalCodeBox, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
            <Text style={[styles.floatingApprovalCodeText, { color: isDark ? '#E6EDF3' : '#1F2328' }]}>
              $ {pendingCommand.args?.command as string}
            </Text>
          </View>

          <View style={styles.floatingApprovalActionRow}>
            <TouchableOpacity
              style={[styles.floatingApprovalBtn, styles.floatingRejectBtn]}
              onPress={() => handleRejectCommand(pendingCommand.args?.approvalId as string)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingRejectBtnText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.floatingApprovalBtn, styles.floatingApproveBtn]}
              onPress={() => handleApproveCommand(pendingCommand.args?.approvalId as string)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.floatingApproveBtnText}>Run Command</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.background, 
        borderTopColor: isDark ? '#21262D' : '#D8DEE4',
        paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16
      }]}>
        <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
          <View style={[styles.inputBox, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
            <TextInput
              ref={inputRef}
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

            {isStreaming ? (
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: '#F85149' }
                ]}
                onPress={stopGeneration}
                activeOpacity={0.8}
              >
                <StopCircle size={15} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: inputText.trim()
                      ? (isDark ? '#F3F4F6' : '#0E1116')
                      : (isDark ? '#1C2128' : '#F6F8FA')
                  }
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <ArrowUp
                  size={16}
                  color={inputText.trim() ? (isDark ? '#0E1116' : '#FFFFFF') : (isDark ? '#484F58' : '#8C959F')}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Model Selection Modal */}
      {renderModelModal && (
        <Modal
          visible={renderModelModal}
          transparent
          animationType="none"
          statusBarTranslucent={true}
          onRequestClose={() => setModelModalVisible(false)}
        >
          <View style={styles.centeredModalBackdrop}>
            <Reanimated.View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                },
                modelBackdropStyle
              ]} 
            />
            <TouchableOpacity 
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setModelModalVisible(false)}
            />
            <Reanimated.View style={[
              styles.centeredModalCard, 
              { 
                backgroundColor: isDark ? '#161B22' : '#FFFFFF', 
                borderColor: isDark ? '#30363D' : '#E1E4E8',
              },
              modelCardStyle
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }]}>
                  Select AI Model
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                  Choose which model powers your coding assistant.
                </Text>
              </View>

              <ScrollView style={[styles.modalList, { maxHeight: 300 }]} showsVerticalScrollIndicator={false}>
                {/* Gemini Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedModel('gemini')
                    setModelModalVisible(false)
                  }}
                  style={[
                    styles.projectOption,
                    { backgroundColor: isDark ? '#0E1116' : '#F6F8FA' },
                    selectedModel === 'gemini' && { backgroundColor: isDark ? '#1C2128' : '#E6F4EA' }
                  ]}
                >
                  <View style={styles.projectOptionLeft}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Sparkles size={14} color="#8B5CF6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Gemini Flash</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Fast, default assistant with rich tool integration.</Text>
                    </View>
                  </View>
                  {selectedModel === 'gemini' && <CheckCircle2 size={16} color="#8B5CF6" />}
                </TouchableOpacity>

                {/* OpenAI Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (userTier === 'free') {
                      Alert.alert(
                        'Premium Feature',
                        'gpt-4o is restricted to Pro and Advanced tiers. Please upgrade your billing plan in Settings.'
                      )
                      return
                    }
                    setSelectedModel('openai')
                    setModelModalVisible(false)
                  }}
                  style={[
                    styles.projectOption,
                    { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', marginTop: 8 },
                    selectedModel === 'openai' && { backgroundColor: isDark ? '#1C2128' : '#E6F4EA' },
                    userTier === 'free' && { opacity: 0.6 }
                  ]}
                >
                  <View style={styles.projectOptionLeft}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Cpu size={14} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>gpt-4o</Text>
                        {userTier === 'free' && (
                          <View style={{ backgroundColor: '#22c55e20', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ color: '#22c55e', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>ChatGPT flagship model for high reasoning and logic.</Text>
                    </View>
                  </View>
                  {userTier === 'free' ? (
                    <Lock size={14} color={colors.textSecondary} strokeWidth={1.5} />
                  ) : (
                    selectedModel === 'openai' && <CheckCircle2 size={16} color="#10B981" />
                  )}
                </TouchableOpacity>

                {/* Anthropic Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (userTier === 'free') {
                      Alert.alert(
                        'Premium Feature',
                        'Claude Opus 4.6 is restricted to Pro and Advanced tiers. Please upgrade your billing plan in Settings.'
                      )
                      return
                    }
                    setSelectedModel('anthropic')
                    setModelModalVisible(false)
                  }}
                  style={[
                    styles.projectOption,
                    { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', marginTop: 8 },
                    selectedModel === 'anthropic' && { backgroundColor: isDark ? '#1C2128' : '#E6F4EA' },
                    userTier === 'free' && { opacity: 0.6 }
                  ]}
                >
                  <View style={styles.projectOptionLeft}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(217, 119, 6, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Shield size={14} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Claude Opus 4.6</Text>
                        {userTier === 'free' && (
                          <View style={{ backgroundColor: '#22c55e20', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ color: '#22c55e', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>State of the art reasoning & code planning capabilities.</Text>
                    </View>
                  </View>
                  {userTier === 'free' ? (
                    <Lock size={14} color={colors.textSecondary} strokeWidth={1.5} />
                  ) : (
                    selectedModel === 'anthropic' && <CheckCircle2 size={16} color="#D97706" />
                  )}
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity 
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#E1E4E8', borderWidth: 1, borderRadius: 8, marginTop: 12 }]}
                onPress={() => setModelModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }]}>Cancel</Text>
              </TouchableOpacity>
            </Reanimated.View>
          </View>
        </Modal>
      )}

      {/* Dropdown Menu Modal */}
      {renderMenu && (
        <Modal
          visible={renderMenu}
          transparent
          animationType="none"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Reanimated.View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: 'rgba(0, 0, 0, 0.15)'
                },
                menuBackdropAnimatedStyle
              ]} 
            />
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setMenuVisible(false)}
            />
            <Reanimated.View 
              style={[
                styles.popoverCard,
                {
                  backgroundColor: isDark ? '#151922' : '#FFFFFF',
                  borderColor: isDark ? '#21262D' : '#D8DEE4',
                  top: insets.top > 0 ? insets.top + 50 : 60,
                  right: 16,
                },
                menuCardAnimatedStyle
              ]}
            >
              {/* Context switcher removed */}

              {/* New Chat */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.popoverItem}
                onPress={() => {
                  startNewChat()
                  setMenuVisible(false)
                }}
              >
                <Plus size={13} color={colors.text} />
                <Text style={[styles.popoverItemText, { color: colors.text }]}>New Chat Thread</Text>
              </TouchableOpacity>

              <View style={[styles.popoverDivider, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]} />

              {/* Past Conversations */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.popoverItem}
                onPress={() => {
                  setMenuVisible(false)
                  setHistoryModalVisible(true)
                }}
              >
                <History size={13} color={colors.text} />
                <Text style={[styles.popoverItemText, { color: colors.text }]}>Past Conversations</Text>
                {savedConversations.length > 0 && (
                  <View style={styles.popoverBadge}>
                    <Text style={styles.popoverBadgeText}>{savedConversations.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.popoverDivider, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]} />

              {/* BYOK Toggle / Configure */}
              {byokConfigured ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.popoverItem}
                  onPress={() => {
                    toggleByok(!byokEnabled)
                  }}
                >
                  <Shield size={13} color={byokEnabled ? '#10B981' : colors.text} />
                  <Text style={[styles.popoverItemText, { color: colors.text }]}>
                    {byokEnabled ? 'Use BYOK (Enabled)' : 'Use BYOK (Disabled)'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.popoverItem}
                  onPress={() => {
                    setMenuVisible(false)
                    useUIStore.getState().setSettingsSubScreen('aiKeys')
                    router.push('/(tabs)/settings')
                  }}
                >
                  <Lock size={13} color="#F59E0B" />
                  <Text style={[styles.popoverItemText, { color: colors.text }]}>Configure BYOK Keys</Text>
                </TouchableOpacity>
              )}

              <View style={[styles.popoverDivider, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]} />

              {/* Switch Model Shortcut */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.popoverItem}
                onPress={() => {
                  setMenuVisible(false)
                  setModelModalVisible(true)
                }}
              >
                <Cpu size={13} color={colors.text} />
                <Text style={[styles.popoverItemText, { color: colors.text }]}>Switch Model...</Text>
              </TouchableOpacity>
            </Reanimated.View>
          </View>
        </Modal>
      )}
        {/* Past Conversations Modal */}
      {renderHistoryModal && (
        <Modal
          visible={renderHistoryModal}
          transparent
          animationType="none"
          statusBarTranslucent={true}
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.centeredModalBackdrop}>
            <Reanimated.View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                },
                historyBackdropStyle
              ]} 
            />
            <TouchableOpacity 
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setHistoryModalVisible(false)}
            />
            <Reanimated.View style={[
              styles.centeredModalCard, 
              { 
                backgroundColor: isDark ? '#161B22' : '#FFFFFF', 
                borderColor: isDark ? '#30363D' : '#E1E4E8',
              },
              historyCardStyle
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }]}>
                  Past Conversations
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                  Restore previous chats or clear your history.
                </Text>
              </View>

              <ScrollView 
                style={[styles.modalList, { maxHeight: 300 }]} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 6 }}
              >
                {savedConversations.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <History size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                      No saved conversations found.
                    </Text>
                  </View>
                ) : (
                  savedConversations.map((thread) => {
                    const isCurrent = currentThreadId === thread.id
                    const projName = thread.projectId === 'global' ? 'General Assistant' : (projects.find(p => p.id === thread.projectId)?.name || 'Workspace')

                    return (
                      <View
                        key={thread.id}
                        style={[
                          styles.historyItemRow,
                          {
                            borderColor: colors.border,
                            backgroundColor: isCurrent ? (isDark ? '#1C2128' : '#F0F2F5') : 'transparent'
                          }
                        ]}
                      >
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            loadConversation(thread.id)
                            setHistoryModalVisible(false)
                          }}
                          style={{ flex: 1, paddingVertical: 10, paddingLeft: 12 }}
                        >
                          <Text style={[styles.historyItemTitle, { color: colors.text, fontFamily: isCurrent ? 'Inter_600SemiBold' : 'Inter_400Regular' }]} numberOfLines={1}>
                            {thread.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                              {formatTimestamp(thread.timestamp)}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>•</Text>
                            <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Inter_500Medium' }}>
                              {projName}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Delete Conversation',
                              'Are you sure you want to permanently delete this conversation history?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Delete', 
                                  style: 'destructive',
                                  onPress: () => deleteConversation(thread.id)
                                }
                              ]
                            )
                          }}
                          style={styles.historyDeleteBtn}
                        >
                          <Trash2 size={14} color="#F85149" strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>
                    )
                  })
                )}
              </ScrollView>

              <TouchableOpacity 
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#E1E4E8', borderWidth: 1, borderRadius: 8, marginTop: 12 }]}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }]}>Close</Text>
              </TouchableOpacity>
            </Reanimated.View>
          </View>
        </Modal>
      )}
      </KeyboardAvoidingView>
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 11, marginTop: 1, opacity: 0.7 },
  clearBtn: {
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  messagesContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 16 },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 20, marginBottom: 4, letterSpacing: -0.5 },
  emptySubtitle: {
    fontSize: 13, textAlign: 'center',
    lineHeight: 18, opacity: 0.6, marginBottom: 16,
  },
  quickPrompts: { width: '100%', gap: 6 },
  quickPrompt: {
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 6, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  quickPromptText: { fontSize: 12, letterSpacing: -0.2 },
  messageBubbleWrapper: {
    flexDirection: 'row', 
    marginBottom: 8, 
    gap: 6,
    alignItems: 'flex-start',
  },
  userWrapper: { justifyContent: 'flex-end' },
  modelWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 24, 
    height: 24, 
    borderRadius: 4,
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.82, 
    borderRadius: 6, 
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  userBubble: {},
  modelBubble: { 
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  messageText: {
    fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, letterSpacing: -0.1,
  },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4,
  },
  typingDot: {
    width: 4, height: 4, borderRadius: 2,
  },
  typingText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  thinkingText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actionRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginTop: 4,
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  actionText: {
    fontSize: 9, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.2,
  },
  inputContainer: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 6, borderWidth: 1, paddingHorizontal: 10,
    paddingVertical: 6, gap: 6,
  },
  input: {
    flex: 1, fontSize: 13,
    maxHeight: 100, paddingVertical: 4, lineHeight: 18,
  },
  sendBtn: {
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 20,
  },
  modalDragHandle: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
  modalList: {
    minHeight: 120,
    maxHeight: 260,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  projectOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectName: {
    fontSize: 13,
    flex: 1,
  },
  modalCancelBtn: {
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 13,
  },
  reasoningContainer: {
    paddingLeft: 4,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  reasoningStep: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.8,
  },
  thinkingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingChar: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  terminalBox: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
    minHeight: 80,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    paddingBottom: 4,
    marginBottom: 6,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 3,
  },
  terminalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  terminalTitle: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
    color: '#8B929A',
  },
  terminalContent: {
    flex: 1,
  },
  terminalPromptLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  terminalPrompt: {
    color: '#3FB950',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  terminalCommandText: {
    color: '#E6EDF3',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  terminalRunningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  terminalRunningText: {
    color: '#58A6FF',
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  terminalOutputText: {
    color: '#C9D1D9',
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 14,
    marginTop: 2,
  },
  permissionCard: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    marginBottom: 2,
    alignSelf: 'stretch',
  },
  permissionText: {
    color: '#E6EDF3',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  permissionActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  permissionBtn: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#238636',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderColor: '#F85149',
    borderWidth: 1,
  },
  rejectBtnText: {
    color: '#F85149',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  expandedDetailsCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
  },
  detailsParamText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    marginBottom: 2,
  },
  detailsResultText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 2,
    lineHeight: 12,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  modelPillText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  byokPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
    width: '100%',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuOptionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  badge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  historyItemTitle: {
    fontSize: 13,
    paddingRight: 8,
  },
  historyDeleteBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
  },
  fileCardContainer: {
    borderLeftWidth: 3,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginVertical: 4,
    width: '100%',
  },
  fileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fileCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCardLabel: {
    fontSize: 12,
  },
  fileCardPath: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    marginBottom: 4,
  },
  fileCardSummary: {
    fontSize: 11,
    marginBottom: 4,
  },
  fileCardPreviewBox: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    marginTop: 2,
  },
  fileCardPreviewText: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 12,
  },
  previewLinkBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  previewLinkBtnText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  fullPreviewCodeBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  fullPreviewCodeText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 14,
  },
  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  popoverCard: {
    position: 'absolute',
    width: 230,
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 8,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  popoverItemText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  popoverBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  popoverBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },
  popoverDivider: {
    height: 1,
    marginHorizontal: 8,
  },
  popoverHeader: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  contextCardText: {
    fontSize: 11,
  },
  centeredModalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredModalCard: {
    width: '90%',
    maxWidth: 345,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  persistentReasoningCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 4,
    width: '100%',
  },
  reasoningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  reasoningTitleText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  reasoningStepsList: {
    marginTop: 6,
    paddingLeft: 4,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 6,
  },
  reasoningStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
  },
  reasoningStepText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 14,
    flex: 1,
  },
  floatingApprovalCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 99,
  },
  floatingApprovalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  floatingApprovalTitle: {
    fontSize: 13,
  },
  floatingApprovalSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
  },
  floatingApprovalCodeBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  floatingApprovalCodeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  floatingApprovalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  floatingApprovalBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingApproveBtn: {
    backgroundColor: '#238636',
  },
  floatingApproveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  floatingRejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F85149',
  },
  floatingRejectBtnText: {
    color: '#F85149',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  toolCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 3,
    width: '100%',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  toolLabelText: {
    fontSize: 11,
  },
  toolTargetText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toolSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 4,
  },
  toolSummaryText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  toolDetailsBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  toolDetailsBtnText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
})
