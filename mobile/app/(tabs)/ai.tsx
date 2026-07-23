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
  Shield, Lock, Square, Plus, ArrowLeft, Folder, Check, Zap, Camera, Image as ImageIcon, Settings, Trash2,
  Copy, FileText, VolumeHigh
} from '@/components/HugeIconsShim'
import Svg, { Circle, Path, Defs, Rect, LinearGradient, Stop } from 'react-native-svg'
import * as Clipboard from 'expo-clipboard'
import { hapticLight } from '@/lib/haptics'
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

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function TwoLineHamburgerIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8H20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M4 16H20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  )
}

function ThinkingIndicator({ colors, isDark }: { colors: any; isDark: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
      <Sparkles size={16} color={isDark ? '#A78BFA' : '#7C3AED'} />
      <Animated.Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, opacity: pulse }}>
        Thinking...
      </Animated.Text>
    </View>
  )
}

const getToolReasoning = (name: string, args: any, result: any, status: string) => {
  const wsName = args.workspaceIdOrName || args.name || ''
  const path = args.path || ''
  const filename = path.split(/[\/\\]/).pop() || ''

  if (name === 'select_workspace') return `Activated workspace '${wsName || 'project'}'.`
  if (name === 'list_files') return `Examined directory contents at '${args.path || 'root'}'.`
  if (name === 'read_file') return `Read file '${filename || path}'.`
  if (name === 'edit_file') return `Updated code in file '${filename || path}'.`
  if (name === 'create_file') return `Created file '${filename || path}'.`
  if (name === 'run_command') return `Executed terminal command '${args.command || ''}'.`
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

  return (
    <View style={{ width: '100%', paddingVertical: 2 }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Sparkles size={14} color={isDark ? '#A78BFA' : '#7C3AED'} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, fontFamily: 'Inter_500Medium' }}>
          {label}
        </Text>
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

const MessageActionButtons = memo(function MessageActionButtons({
  text,
  colors,
  isDark,
  onOpenSelectModal
}: {
  text: string
  colors: any
  isDark: boolean
  onOpenSelectModal: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleCopy = async () => {
    hapticLight()
    await Clipboard.setStringAsync(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleSpeak = () => {
    hapticLight()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        setIsSpeaking(true)
        window.speechSynthesis.speak(utterance)
      }
    } else {
      setIsSpeaking(!isSpeaking)
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 4 }}>
      {/* 1. Copy Button (reactive tick mark for 2 seconds) */}
      <TouchableOpacity
        onPress={handleCopy}
        style={{
          padding: 6,
          borderRadius: 8,
          backgroundColor: copied 
            ? (isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5') 
            : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
        }}
        activeOpacity={0.7}
      >
        {copied ? (
          <Check size={14} color={isDark ? '#34D399' : '#059669'} strokeWidth={2.2} />
        ) : (
          <Copy size={14} color={colors.textSecondary} strokeWidth={1.8} />
        )}
      </TouchableOpacity>

      {/* 2. Read Loud Button */}
      <TouchableOpacity
        onPress={handleSpeak}
        style={{
          padding: 6,
          borderRadius: 8,
          backgroundColor: isSpeaking 
            ? (isDark ? 'rgba(56, 139, 253, 0.18)' : '#DBEAFE') 
            : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
        }}
        activeOpacity={0.7}
      >
        <VolumeHigh 
          size={14} 
          color={isSpeaking ? (isDark ? '#58A6FF' : '#2563EB') : colors.textSecondary} 
          strokeWidth={1.8} 
        />
      </TouchableOpacity>

      {/* 3. Select Text Button */}
      <TouchableOpacity
        onPress={() => {
          hapticLight()
          onOpenSelectModal(text)
        }}
        style={{
          padding: 6,
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        }}
        activeOpacity={0.7}
      >
        <FileText size={14} color={colors.textSecondary} strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  )
})

const TabChatMessageBubble = memo(function TabChatMessageBubble({
  msg,
  colors,
  isDark,
  mdStyles,
  onOpenSelectModal,
}: {
  msg: ChatMessage
  colors: any
  isDark: boolean
  mdStyles: any
  onOpenSelectModal: (text: string) => void
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
              <>
                <Markdown style={mdStyles}>
                  {msg.text}
                </Markdown>
                <MessageActionButtons text={msg.text} colors={colors} isDark={isDark} onOpenSelectModal={onOpenSelectModal} />
              </>
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
  const {
    messages, isStreaming, currentStreamText, currentToolCalls,
    sendMessage, stopGeneration, initConversations, loadConversation, startNewChat, savedConversations
  } = useAIStore()

  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setTabBarVisible, setTabIndex, setSettingsSubScreen } = useUIStore()

  const [inputText, setInputText] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('global')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')

  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [attachModalVisible, setAttachModalVisible] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [selectedMsgForSelect, setSelectedMsgForSelect] = useState<string | null>(null)

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

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    )
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    )
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  useEffect(() => {
    initConversations()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
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
    const targetProject = (selectedProjectId && selectedProjectId !== 'global') ? selectedProjectId : 'global'
    await sendMessage(finalPrompt, targetProject, undefined, selectedModel)
  }

  const handleCameraCapture = () => {
    setAttachModalVisible(false)
    ensureCameraPermission(() => {
      setAttachedImage('captured_photo.jpg')
    })
  }

  const handleGalleryUpload = () => {
    setAttachModalVisible(false)
    ensureMediaLibraryPermission(() => {
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
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: pageBgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        
        {/* Clean Header Bar */}
        <View style={[styles.topHeaderBar, { paddingTop: Math.max(insets.top, 12), borderBottomColor: isDark ? '#1A1C23' : '#E5E7EB' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={18} color={isDark ? '#A78BFA' : '#7C3AED'} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>CloudCode AI</Text>
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
              <Sparkles size={32} color={isDark ? '#A78BFA' : '#7C3AED'} />
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>CloudCode Assistant</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Ask code questions, build features, or manage your workspace.
              </Text>
            </View>
          ) : (
            <>
              {messages.map((msg) => (
                <TabChatMessageBubble key={msg.id} msg={msg} colors={colors} isDark={isDark} mdStyles={markdownStyles} onOpenSelectModal={(t) => setSelectedMsgForSelect(t)} />
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
        <View style={[styles.inputComposerOuter, { paddingBottom: isKeyboardVisible ? 6 : Math.max(insets.bottom, 10), backgroundColor: pageBgColor }]}>
          
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
              <TouchableOpacity
                onPress={() => stopGeneration()}
                style={[
                  styles.inputSendBtnActive,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
                  }
                ]}
                activeOpacity={0.7}
              >
                <Square size={11} fill={isDark ? '#F87171' : '#DC2626'} color={isDark ? '#F87171' : '#DC2626'} />
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

        {/* Compact Popover Menu for + Button */}
        {attachModalVisible && (
          <Modal transparent visible={attachModalVisible} animationType="fade" onRequestClose={() => setAttachModalVisible(false)}>
            <TouchableOpacity style={styles.attachPopoverOverlay} activeOpacity={1} onPress={() => setAttachModalVisible(false)}>
              <View style={[styles.attachPopoverCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
                <TouchableOpacity onPress={handleCameraCapture} style={[styles.attachOptionRow, { borderBottomColor: colors.border }]}>
                  <Camera size={16} color={colors.primary} strokeWidth={1.8} />
                  <Text style={[styles.attachOptionText, { color: colors.text }]}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleGalleryUpload} style={styles.attachOptionRow}>
                  <ImageIcon size={16} color={colors.primary} strokeWidth={1.8} />
                  <Text style={[styles.attachOptionText, { color: colors.text }]}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Select Text Modal */}
        {!!selectedMsgForSelect && (
          <Modal transparent visible={!!selectedMsgForSelect} animationType="fade" onRequestClose={() => setSelectedMsgForSelect(null)}>
            <TouchableOpacity style={styles.attachPopoverOverlay} activeOpacity={1} onPress={() => setSelectedMsgForSelect(null)}>
              <View style={[styles.selectTextCard, { backgroundColor: isDark ? '#161821' : '#FFFFFF', borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }}>Select Response Text</Text>
                  <TouchableOpacity onPress={() => setSelectedMsgForSelect(null)} style={{ padding: 4 }}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 260, marginBottom: 12 }}>
                  <Text
                    selectable={true}
                    style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 }}
                  >
                    {selectedMsgForSelect || ''}
                  </Text>
                </ScrollView>
                <SpringPressable
                  onPress={async () => {
                    if (selectedMsgForSelect) {
                      hapticLight()
                      await Clipboard.setStringAsync(selectedMsgForSelect)
                      setSelectedMsgForSelect(null)
                    }
                  }}
                  style={{ backgroundColor: colors.text, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: isDark ? '#030303' : '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Copy Full Response</Text>
                </SpringPressable>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

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
  headerMenuBtn: {
    padding: 6,
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
  attachPopoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    paddingBottom: 72,
    paddingHorizontal: 16,
  },
  attachPopoverCard: {
    width: 190,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  attachOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  attachOptionText: {
    fontSize: 13.5,
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
  selectTextCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
})
