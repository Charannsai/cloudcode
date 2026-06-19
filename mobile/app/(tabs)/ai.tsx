import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share, Alert, Modal
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal, Loader,
  CheckCircle2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon,
  Mic, Volume2, VolumeX, FolderGit2, ChevronDown, ChevronUp
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
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function ToolCallRow({ tool, isDark, colors }: { tool: ToolCallInfo; isDark: boolean; colors: any }) {
  const [expanded, setExpanded] = useState(tool.status === 'pending')
  const [isActionLoading, setIsActionLoading] = useState(false)

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
    read_file: 'Reading file',
    edit_file: 'Editing file',
    create_file: 'Creating file',
    delete_file: 'Deleting file',
    run_command: 'Shell command',
    list_files: 'Listing files',
  }

  const label = labelMap[tool.name] || tool.name
  const target = (tool.args?.path || tool.args?.command || '') as string

  useEffect(() => {
    if (tool.status === 'pending') {
      setExpanded(true)
    }
  }, [tool.status])

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

  // Dynamic status text or badge color
  const statusColor = isPending
    ? (isDark ? '#E2B714' : '#B08500')
    : isRunning
      ? (isDark ? '#58A6FF' : '#0969DA')
      : isDone
        ? '#3FB950'
        : '#F85149'

  const renderDetails = () => {
    if (tool.name === 'run_command') {
      const command = (tool.args?.command || '') as string
      const resultObj = tool.result as any
      const output = (resultObj?.output || resultObj?.error || resultObj?.message || '') as string

      return (
        <View style={[styles.terminalBox, { backgroundColor: '#0D1117', borderColor: '#21262D' }]}>
          {/* Header bar of terminal */}
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.terminalDot, { backgroundColor: '#FF5F56' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#FFBD2E' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#27C93F' }]} />
            </View>
            <Text style={styles.terminalTitle}>bash (workspace)</Text>
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
                    ⚠️ Command requires approval to execute.
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

    // For file system tools
    let paramDetails = ''
    let resultDetails = ''

    if (tool.name === 'read_file') {
      paramDetails = `Path: ${tool.args?.path || ''}`
      if (tool.result) {
        const res = tool.result as any
        if (res.content) {
          const lines = res.content.split('\n')
          const preview = lines.slice(0, 5).join('\n')
          const count = lines.length
          resultDetails = `Read ${count} lines:\n${preview}${lines.length > 5 ? '\n...' : ''}`
        } else if (res.error) {
          resultDetails = `Error: ${res.error}`
        }
      }
    } else if (tool.name === 'edit_file') {
      paramDetails = `Path: ${tool.args?.path || ''}\nTarget length: ${(tool.args?.target as string)?.length || 0} chars`
      if (tool.result) {
        const res = tool.result as any
        resultDetails = res.error ? `Error: ${res.error}` : `Success: ${res.message || 'File edited'}`
      }
    } else if (tool.name === 'create_file') {
      paramDetails = `Path: ${tool.args?.path || ''}\nContent length: ${(tool.args?.content as string)?.length || 0} chars`
      if (tool.result) {
        const res = tool.result as any
        resultDetails = res.error ? `Error: ${res.error}` : `Success: ${res.message || 'File created'}`
      }
    } else if (tool.name === 'delete_file') {
      paramDetails = `Path: ${tool.args?.path || ''}`
      if (tool.result) {
        const res = tool.result as any
        resultDetails = res.error ? `Error: ${res.error}` : `Success: ${res.message || 'File deleted'}`
      }
    } else if (tool.name === 'list_files') {
      paramDetails = `Directory: ${tool.args?.path || ''}`
      if (tool.result) {
        const res = tool.result as any
        if (res.files) {
          resultDetails = `Found ${res.files.length} files:\n` + res.files.slice(0, 5).map((f: string) => `- ${f}`).join('\n') + (res.files.length > 5 ? '\n...' : '')
        } else if (res.error) {
          resultDetails = `Error: ${res.error}`
        }
      }
    }

    return (
      <View style={[styles.expandedDetailsCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
        {paramDetails ? <Text style={[styles.detailsParamText, { color: isDark ? '#8B929A' : '#57606A' }]}>{paramDetails}</Text> : null}
        {resultDetails ? (
          <Text style={[styles.detailsResultText, { color: isDark ? '#C9D1D9' : '#24292F', backgroundColor: isDark ? '#0D1117' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
            {resultDetails}
          </Text>
        ) : isRunning ? (
          <Text style={[styles.detailsParamText, { color: isDark ? '#8B929A' : '#57606A', fontStyle: 'italic' }]}>Executing operation...</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.toolRowContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        style={[styles.toolHeaderRow, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
      >
        <View style={styles.toolHeaderLeft}>
          {isRunning ? (
            <ActivityIndicator size="small" color={statusColor} style={{ width: 14, height: 14 }} />
          ) : isPending ? (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          ) : isDone ? (
            <CheckCircle2 size={14} color={statusColor} />
          ) : (
            <AlertCircle size={14} color={statusColor} />
          )}
          <Icon size={13} color={isDark ? '#8B929A' : '#57606A'} strokeWidth={1.8} />
          <Text style={[styles.toolLabelText, { color: isDark ? '#8B929A' : '#57606A' }]}>
            {label}
          </Text>
          <Text style={[styles.toolTargetText, { color: isDark ? '#C9D1D9' : '#24292F' }]} numberOfLines={1}>
            {target}
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={14} color={isDark ? '#8B929A' : '#57606A'} />
        ) : (
          <ChevronDown size={14} color={isDark ? '#8B929A' : '#57606A'} />
        )}
      </TouchableOpacity>

      {expanded && renderDetails()}
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

  const insets = useSafeAreaInsets()

  const [inputText, setInputText] = useState('')
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false)
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
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

  // Hide the global tab bar completely when on this screen and sync projects
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      fetchProjects(true)
      return () => setTabBarVisible(true)
    }, [fetchProjects])
  )

  // Jumping letters animation for Thinking state
  const letter0 = useSharedValue(0)
  const letter1 = useSharedValue(0)
  const letter2 = useSharedValue(0)
  const letter3 = useSharedValue(0)
  const letter4 = useSharedValue(0)
  const letter5 = useSharedValue(0)
  const letter6 = useSharedValue(0)
  const letter7 = useSharedValue(0)

  useEffect(() => {
    const isThinking = isStreaming && !currentStreamText && currentToolCalls.length === 0
    if (isThinking) {
      const animateLetter = (anim: any, delay: number) => {
        setTimeout(() => {
          anim.value = withRepeat(
            withSequence(
              withTiming(-3, { duration: 180, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 180, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 600 })
            ),
            -1,
            false
          )
        }, delay)
      }
      animateLetter(letter0, 0)
      animateLetter(letter1, 80)
      animateLetter(letter2, 160)
      animateLetter(letter3, 240)
      animateLetter(letter4, 320)
      animateLetter(letter5, 400)
      animateLetter(letter6, 480)
      animateLetter(letter7, 560)
    } else {
      letter0.value = 0; letter1.value = 0; letter2.value = 0; letter3.value = 0;
      letter4.value = 0; letter5.value = 0; letter6.value = 0; letter7.value = 0;
    }
  }, [isStreaming, currentStreamText, currentToolCalls.length])

  const styleL0 = useAnimatedStyle(() => ({ transform: [{ translateY: letter0.value }] }))
  const styleL1 = useAnimatedStyle(() => ({ transform: [{ translateY: letter1.value }] }))
  const styleL2 = useAnimatedStyle(() => ({ transform: [{ translateY: letter2.value }] }))
  const styleL3 = useAnimatedStyle(() => ({ transform: [{ translateY: letter3.value }] }))
  const styleL4 = useAnimatedStyle(() => ({ transform: [{ translateY: letter4.value }] }))
  const styleL5 = useAnimatedStyle(() => ({ transform: [{ translateY: letter5.value }] }))
  const styleL6 = useAnimatedStyle(() => ({ transform: [{ translateY: letter6.value }] }))
  const styleL7 = useAnimatedStyle(() => ({ transform: [{ translateY: letter7.value }] }))

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
                  setWorkspaceModalVisible(true)
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
            {selectedProjectId === 'global' ? (
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 0 }]}>
                Ask questions, explain code, or brainstorm ideas.{'\n'}Universal AI mode is active.
              </Text>
            ) : (
              <>
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
              </>
            )}
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
                        {['T', 'h', 'i', 'n', 'k', 'i', 'n', 'g'].map((char, index) => {
                          const animStyles = [styleL0, styleL1, styleL2, styleL3, styleL4, styleL5, styleL6, styleL7]
                          return (
                            <Animated.Text
                              key={index}
                              style={[
                                styles.thinkingChar,
                                animStyles[index],
                                { color: isDark ? '#8B929A' : '#656D76' }
                              ]}
                            >
                              {char}
                            </Animated.Text>
                          )
                        })}
                      </View>
                      {reasoningExpanded ? (
                        <ChevronUp size={12} color={isDark ? '#8B929A' : '#656D76'} style={{ marginLeft: 4, marginTop: 1 }} />
                      ) : (
                        <ChevronDown size={12} color={isDark ? '#8B929A' : '#656D76'} style={{ marginLeft: 4, marginTop: 1 }} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {reasoningExpanded && (
                    <Animated.View entering={FadeInDown.duration(200)} style={styles.reasoningContainer}>
                      <Text style={[styles.reasoningStep, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_400Regular' }]}>
                        Analyzing workspace context...
                      </Text>
                      <Text style={[styles.reasoningStep, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_400Regular' }]}>
                        Locating relevant codebase items...
                      </Text>
                      <Text style={[styles.reasoningStep, { color: isDark ? '#8B929A' : '#656D76', fontFamily: 'Inter_400Regular' }]}>
                        Formulating response strategy...
                      </Text>
                    </Animated.View>
                  )}
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

      {/* Workspace Switcher Modal */}
      <Modal
        visible={workspaceModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setWorkspaceModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setWorkspaceModalVisible(false)}
          />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? '#151922' : '#FFFFFF', 
              borderColor: isDark ? '#21262D' : '#E5E7EB' 
            }
          ]}>
            {/* Drag/Indicator Handle */}
            <View style={[styles.modalDragHandle, { backgroundColor: isDark ? '#2D333B' : '#E5E7EB' }]} />
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                Switch Workspace
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Connect your AI chat to a different workspace context:
              </Text>
            </View>

            <ScrollView 
              style={styles.modalList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {projects.map((proj) => {
                const isSelected = selectedProjectId === proj.id
                return (
                  <TouchableOpacity
                    key={proj.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedProjectId(proj.id)
                      setWorkspaceModalVisible(false)
                    }}
                    style={[
                      styles.projectOption,
                      {
                        backgroundColor: isSelected 
                          ? (isDark ? '#1C2128' : '#F0F2F5')
                          : 'transparent'
                      }
                    ]}
                  >
                    <View style={styles.projectOptionLeft}>
                      <FolderGit2 
                        size={14} 
                        color={isSelected ? (isDark ? '#58A6FF' : '#0969DA') : colors.textSecondary} 
                        style={{ marginRight: 10 }} 
                      />
                      <Text style={[
                        styles.projectName,
                        { 
                          color: colors.text,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular'
                        }
                      ]}>
                        {proj.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <CheckCircle2 size={14} color={isDark ? '#58A6FF' : '#0969DA'} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setWorkspaceModalVisible(false)}
              style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#1C2128' : '#F0F2F5' }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                Cancel
              </Text>
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
    flexDirection: 'row', 
    marginBottom: 10, 
    gap: 8,
    alignItems: 'flex-start',
  },
  userWrapper: { justifyContent: 'flex-end' },
  modelWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 26, 
    height: 26, 
    borderRadius: 13,
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.78, 
    borderRadius: 16, 
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: { 
    borderBottomRightRadius: 16,
  },
  modelBubble: { 
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
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
  thinkingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  actionRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 6,
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  modalList: {
    minHeight: 150,
    maxHeight: 260,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  projectOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    flex: 1,
  },
  modalCancelBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    fontSize: 14,
  },
  reasoningContainer: {
    paddingLeft: 4,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  reasoningStep: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  thinkingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingChar: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  toolRowContainer: {
    marginBottom: 6,
    width: '100%',
  },
  toolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  toolLabelText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  toolTargetText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  terminalBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    minHeight: 100,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    paddingBottom: 6,
    marginBottom: 8,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 4,
  },
  terminalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  terminalTitle: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    color: '#8B929A',
  },
  terminalContent: {
    flex: 1,
  },
  terminalPromptLine: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  terminalPrompt: {
    color: '#3FB950',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
  },
  terminalCommandText: {
    color: '#E6EDF3',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
  },
  terminalRunningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  terminalRunningText: {
    color: '#58A6FF',
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  terminalOutputText: {
    color: '#C9D1D9',
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 16,
    marginTop: 4,
  },
  permissionCard: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  permissionText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  permissionActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  permissionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#238636',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderColor: '#F85149',
    borderWidth: 1,
  },
  rejectBtnText: {
    color: '#F85149',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  expandedDetailsCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  detailsParamText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    marginBottom: 4,
  },
  detailsResultText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 4,
    lineHeight: 14,
  },
})
