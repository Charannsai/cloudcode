import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share, Alert, Modal,
  Switch, Animated, Easing
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
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'

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
  const [isActionLoading, setIsActionLoading] = useState(false)
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

  const handleApprove = async () => {
    const approvalId = tool.args?.approvalId as string
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

  const handleReject = async () => {
    const approvalId = tool.args?.approvalId as string
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

  const isPending = tool.status === 'pending'
  const isRunning = tool.status === 'running'
  const isError = tool.status === 'error'
  const isDone = tool.status === 'done'

  // Determine status text & colors
  const statusBg = isPending
    ? 'rgba(226, 183, 20, 0.12)'
    : isRunning
      ? 'rgba(88, 166, 255, 0.12)'
      : isDone
        ? 'rgba(63, 185, 80, 0.12)'
        : 'rgba(248, 81, 73, 0.12)'
  
  const statusColor = isPending
    ? '#E2B714'
    : isRunning
      ? '#58A6FF'
      : isDone
        ? '#3FB950'
        : '#F85149'

  const statusText = isPending
    ? 'PENDING'
    : isRunning
      ? 'RUNNING'
      : isDone
        ? 'DONE'
        : 'ERROR'

  // Render Command Line Executions
  if (tool.name === 'run_command') {
    const command = (tool.args?.command || '') as string
    const resultObj = tool.result as any
    const output = (resultObj?.output || resultObj?.error || resultObj?.message || '') as string

    return (
      <View style={[styles.terminalBox, { backgroundColor: '#0D1117', borderColor: '#21262D', marginVertical: 6 }]}>
        <View style={styles.terminalHeader}>
          <View style={styles.terminalDots}>
            <View style={[styles.terminalDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#27C93F' }]} />
          </View>
          <Text style={styles.terminalTitle}>bash (workspace)</Text>
          <View style={{ backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: statusColor, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{statusText}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.terminalContent}>
            <Text style={styles.terminalPromptLine}>
              <Text style={styles.terminalPrompt}>$ </Text>
              <Text style={styles.terminalCommandText}>{command}</Text>
            </Text>

            {isPending && (
              <View style={styles.permissionCard}>
                <Text style={styles.permissionText}>
                  ⚠️ Shell execution requires approval.
                </Text>
                <View style={styles.permissionActionRow}>
                  <TouchableOpacity
                    style={[styles.permissionBtn, styles.approveBtn]}
                    onPress={handleApprove}
                    disabled={isActionLoading}
                    activeOpacity={0.8}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.approveBtnText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.permissionBtn, styles.rejectBtn]}
                    onPress={handleReject}
                    disabled={isActionLoading}
                    activeOpacity={0.8}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="#F85149" />
                    ) : (
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isRunning && (
              <View style={styles.terminalRunningRow}>
                <ActivityIndicator size="small" color="#58A6FF" style={{ marginRight: 6 }} />
                <Text style={styles.terminalRunningText}>Executing command...</Text>
              </View>
            )}

            {(output || isDone || isError) && !isPending && (
              <Text style={[
                styles.terminalOutputText,
                isError && { color: '#F85149' }
              ]}>
                {output || (isDone ? 'Command completed with no output.' : '')}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    )
  }

  // File Operations Card Design (read_file, edit_file, create_file, delete_file, list_files)
  let accentColor = '#8B929A'
  let label = tool.name
  let Icon = FileCode
  let bgTint = isDark ? '#1C2128' : '#F6F8FA'

  if (tool.name === 'create_file') {
    accentColor = '#3FB950'
    label = 'Create File'
    Icon = Plus
    bgTint = isDark ? 'rgba(63, 185, 80, 0.05)' : 'rgba(230, 255, 236, 0.4)'
  } else if (tool.name === 'edit_file') {
    accentColor = '#58A6FF'
    label = 'Edit File'
    Icon = FileCode
    bgTint = isDark ? 'rgba(88, 166, 255, 0.05)' : 'rgba(221, 244, 255, 0.4)'
  } else if (tool.name === 'delete_file') {
    accentColor = '#F85149'
    label = 'Delete File'
    Icon = Trash2
    bgTint = isDark ? 'rgba(248, 81, 73, 0.05)' : 'rgba(255, 235, 235, 0.4)'
  } else if (tool.name === 'read_file') {
    accentColor = '#8250DF'
    label = 'Read File'
    Icon = FileCode
    bgTint = isDark ? 'rgba(130, 80, 223, 0.05)' : 'rgba(245, 240, 255, 0.4)'
  } else if (tool.name === 'list_files') {
    accentColor = '#D97706'
    label = 'List Directory'
    Icon = FolderTree
    bgTint = isDark ? 'rgba(217, 119, 6, 0.05)' : 'rgba(255, 253, 230, 0.4)'
  }

  const target = (tool.args?.path || '') as string

  // Compile summary & preview
  let summaryText = ''
  let previewText = ''

  if (tool.name === 'read_file' && tool.result) {
    const res = tool.result as any
    if (res.content) {
      const lines = res.content.split('\n')
      summaryText = `Read ${lines.length} lines`
      previewText = lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '')
    } else if (res.error) {
      summaryText = `Failed to read: ${res.error}`
    }
  } else if (tool.name === 'create_file') {
    const content = (tool.args?.content || '') as string
    const lines = content.split('\n')
    summaryText = `Created with ${lines.length} lines`
    previewText = lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '')
  } else if (tool.name === 'edit_file') {
    const replacement = (tool.args?.replacementContent || tool.args?.replacement || '') as string
    const targetContent = (tool.args?.targetContent || tool.args?.target || '') as string
    summaryText = `Replacing code chunk`
    previewText = `- Target:\n${targetContent.split('\n').slice(0, 1).join('\n')}\n+ Replacement:\n${replacement.split('\n').slice(0, 1).join('\n')}`
  } else if (tool.name === 'list_files' && tool.result) {
    const res = tool.result as any
    if (res.files) {
      summaryText = `Found ${res.files.length} items`
      previewText = res.files.slice(0, 3).map((f: string) => `- ${f}`).join('\n') + (res.files.length > 3 ? '\n...' : '')
    } else if (res.error) {
      summaryText = `Error: ${res.error}`
    }
  } else if (tool.name === 'delete_file') {
    summaryText = `Deleted file from project workspace`
  }

  const hasFullPreview = !!(previewText && (tool.result || tool.args?.content || tool.args?.replacement || tool.args?.replacementContent))

  return (
    <View style={[
      styles.fileCardContainer,
      {
        backgroundColor: bgTint,
        borderLeftColor: accentColor,
        borderColor: isDark ? '#21262D' : '#D8DEE4',
      }
    ]}>
      {/* File Card Header */}
      <View style={styles.fileCardHeader}>
        <View style={styles.fileCardTitleContainer}>
          <Icon size={14} color={accentColor} style={{ marginRight: 6 }} />
          <Text style={[styles.fileCardLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            {label}
          </Text>
        </View>
        <View style={{ backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: statusColor, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{statusText}</Text>
        </View>
      </View>

      {/* Target Path */}
      <Text style={[styles.fileCardPath, { color: colors.textSecondary }]} numberOfLines={1}>
        {target || 'Workspace Root'}
      </Text>

      {/* Summary */}
      {summaryText ? (
        <Text style={[styles.fileCardSummary, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>
          {summaryText}
        </Text>
      ) : null}

      {/* Mini Code Preview Box */}
      {previewText ? (
        <View style={[styles.fileCardPreviewBox, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
          <Text style={[styles.fileCardPreviewText, { color: isDark ? '#C9D1D9' : '#24292F' }]}>
            {previewText}
          </Text>
        </View>
      ) : null}

      {/* Preview details action button */}
      {hasFullPreview && (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.previewLinkBtn, { borderColor: accentColor }]}
            onPress={() => setModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.previewLinkBtnText, { color: accentColor }]}>View Full Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Content Preview Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: 'transparent' }]}>
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
              backgroundColor: isDark ? '#151922' : '#FFFFFF',
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
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11 }]}>
                {target}
              </Text>
            </View>

            <ScrollView style={{ flex: 1, marginVertical: 8 }} showsVerticalScrollIndicator={true}>
              <View style={[styles.fullPreviewCodeBox, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <Text style={[styles.fullPreviewCodeText, { color: isDark ? '#C9D1D9' : '#24292F' }]}>
                  {(() => {
                    if (tool.name === 'read_file' && tool.result) {
                      return (tool.result as any).content || 'No content';
                    }
                    if (tool.name === 'create_file') {
                      return (tool.args?.content || '') as string;
                    }
                    if (tool.name === 'edit_file') {
                      const replacement = (tool.args?.replacementContent || tool.args?.replacement || '') as string;
                      const targetContent = (tool.args?.targetContent || tool.args?.target || '') as string;
                      return `Target:\n${targetContent}\n\nReplacement:\n${replacement}`;
                    }
                    if (tool.name === 'list_files' && tool.result) {
                      return (tool.result as any).files?.join('\n') || 'No files';
                    }
                    return 'No details available.';
                  })()}
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
          </View>
        </View>
      </Modal>
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
            <Markdown style={mdStyles}>
              {message.text}
            </Markdown>

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
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  const [selectedModel, setSelectedModel] = useState<'gemini' | 'openai' | 'anthropic'>('gemini')
  const [modelModalVisible, setModelModalVisible] = useState(false)
  const [userTier, setUserTier] = useState<string>('free')

  const [menuVisible, setMenuVisible] = useState(false)
  const [historyModalVisible, setHistoryModalVisible] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

  const modelAnim = useRef(new Animated.Value(0)).current
  const menuAnim = useRef(new Animated.Value(0)).current
  const historyAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (modelModalVisible) {
      modelAnim.setValue(0)
      Animated.timing(modelAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start()
    }
  }, [modelModalVisible])

  useEffect(() => {
    if (menuVisible) {
      menuAnim.setValue(0)
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 90,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start()
    }
  }, [menuVisible])

  useEffect(() => {
    if (historyModalVisible) {
      historyAnim.setValue(0)
      Animated.timing(historyAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start()
    }
  }, [historyModalVisible])

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
      setTabBarVisible(false)
      fetchProjects(true)

      // Fetch active user tier status for premium model checks
      api.billing.status()
        .then(data => {
          if (data?.tier?.name) {
            setUserTier(data.tier.name)
          }
        })
        .catch(err => console.warn('Failed to load user tier config:', err))

      // Load conversation history and check BYOK keys status
      initConversations()

      return () => setTabBarVisible(true)
    }, [fetchProjects, setTabBarVisible])
  )

  // Thinking animation states removed for performance

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
    await sendMessage(text, selectedProjectId, undefined, selectedModel)
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
              {selectedProjectId === 'global' || !selectedProjectId ? 'General Assistant' : selectedProject?.name || 'Workspace'}
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

      {/* Switcher removed */}

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
              {currentToolCalls.map((tc, i) => (
                <ToolCallRow key={i} tool={tc} isDark={isDark} colors={colors} />
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
                <View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setReasoningExpanded(!reasoningExpanded)}
                  >
                    <View style={styles.typingIndicator}>
                      <View style={styles.thinkingTextContainer}>
                        <ActivityIndicator size="small" color={isDark ? '#8B929A' : '#656D76'} style={{ marginRight: 6 }} />
                        <Text style={[styles.thinkingChar, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_500Medium' }]}>
                          Thinking...
                        </Text>
                      </View>
                      {reasoningExpanded ? (
                        <ChevronUp size={12} color={isDark ? '#8B929A' : '#656D76'} style={{ marginLeft: 4 }} />
                      ) : (
                        <ChevronDown size={12} color={isDark ? '#8B929A' : '#656D76'} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {reasoningExpanded && (
                    <View style={styles.reasoningContainer}>
                      {getRealtimeReasoning(currentToolCalls, isStreaming).map((step, idx) => (
                        <Text key={idx} style={[styles.reasoningStep, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_400Regular' }]}>
                          • {step}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.background, 
        borderTopColor: isDark ? '#21262D' : '#D8DEE4',
        paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16
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
      </View>

      {/* Model Selection Modal */}
      <Modal
        visible={modelModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setModelModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: 'transparent' }]}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                opacity: modelAnim 
              }
            ]} 
          />
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModelModalVisible(false)}
          />
          <Animated.View style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? '#151922' : '#FFFFFF', 
              borderColor: isDark ? '#21262D' : '#E5E7EB',
              transform: [
                {
                  translateY: modelAnim.interpolate({
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
                Select AI Model
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose which model powers your coding assistant.
              </Text>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
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
              style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
              onPress={() => setModelModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.15)', 
                opacity: menuAnim 
              }
            ]} 
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <Animated.View 
            style={[
              styles.popoverCard,
              {
                backgroundColor: isDark ? '#151922' : '#FFFFFF',
                borderColor: isDark ? '#21262D' : '#D8DEE4',
                top: insets.top > 0 ? insets.top + 50 : 60,
                right: 16,
                opacity: menuAnim,
                transform: [
                  {
                    scale: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    })
                  }
                ]
              }
            ]}
          >
            {/* Workspace Context Section */}
            <Text style={[styles.popoverHeader, { color: colors.textSecondary, paddingBottom: 6 }]}>CHAT CONTEXT</Text>
            
            <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingRight: 10 }}
              >
                {/* General Assistant Card */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.contextCard,
                    {
                      borderColor: (selectedProjectId === 'global' || !selectedProjectId)
                        ? '#8B5CF6'
                        : (isDark ? '#21262D' : '#D8DEE4'),
                      backgroundColor: (selectedProjectId === 'global' || !selectedProjectId)
                        ? (isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(243, 239, 255, 1)')
                        : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    setSelectedProjectId('global')
                    setMenuVisible(false)
                  }}
                >
                  <Sparkles size={11} color={(selectedProjectId === 'global' || !selectedProjectId) ? '#8B5CF6' : colors.textSecondary} />
                  <Text style={[
                    styles.contextCardText,
                    { 
                      color: (selectedProjectId === 'global' || !selectedProjectId) ? colors.text : colors.textSecondary,
                      fontFamily: (selectedProjectId === 'global' || !selectedProjectId) ? 'Inter_600SemiBold' : 'Inter_400Regular'
                    }
                  ]}>
                    General Assistant
                  </Text>
                </TouchableOpacity>

                {/* Project Context Cards */}
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id
                  return (
                    <TouchableOpacity
                      key={proj.id}
                      activeOpacity={0.8}
                      style={[
                        styles.contextCard,
                        {
                          borderColor: isSelected
                            ? (isDark ? '#58A6FF' : '#0969DA')
                            : (isDark ? '#21262D' : '#D8DEE4'),
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(88, 166, 255, 0.12)' : 'rgba(235, 244, 255, 1)')
                            : 'transparent',
                        }
                      ]}
                      onPress={() => {
                        setSelectedProjectId(proj.id)
                        setMenuVisible(false)
                      }}
                    >
                      <FolderGit2 size={11} color={isSelected ? (isDark ? '#58A6FF' : '#0969DA') : colors.textSecondary} />
                      <Text style={[
                        styles.contextCardText,
                        { 
                          color: isSelected ? colors.text : colors.textSecondary,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular'
                        }
                      ]} numberOfLines={1}>
                        {proj.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            <View style={[styles.popoverDivider, { backgroundColor: isDark ? '#21262D' : '#E1E4E8', marginBottom: 4 }]} />

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
          </Animated.View>
        </View>
      </Modal>

      {/* Past Conversations Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setHistoryModalVisible(false)}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? '#151922' : '#FFFFFF', 
              borderColor: isDark ? '#21262D' : '#E5E7EB' 
            }
          ]}>
            <View style={[styles.modalDragHandle, { backgroundColor: isDark ? '#30363D' : '#D1D5DB' }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                Past Conversations
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Restore previous chats or clear your history.
              </Text>
            </View>

            <ScrollView 
              style={[styles.modalList, { maxHeight: 350 }]} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
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
              style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
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
  toolCard: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 4,
    borderWidth: 1,
  },
  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  toolLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  toolTarget: { fontSize: 10, fontFamily: 'JetBrainsMono_400Regular', flex: 1 },
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
  toolRowContainer: {
    marginBottom: 4,
    width: '100%',
  },
  toolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 6,
  },
  toolLabelText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  toolTargetText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    flex: 1,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 3,
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
})
