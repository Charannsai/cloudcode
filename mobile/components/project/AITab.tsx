import React, { useState, useRef, useEffect, memo, useMemo } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, Keyboard,
  TouchableWithoutFeedback, Modal, Dimensions, Alert, Animated, Easing
} from 'react-native'
import { SpringPressable } from '@/components/SpringPressable'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, ChevronDown, ChevronUp, History, X,
  Square, Plus, Check, Camera, Image as ImageIcon, Settings, Trash2,
  Copy, FileText, VolumeHigh, MessageSquare
} from '@/components/HugeIconsShim'
import Svg, { Path } from 'react-native-svg'
import * as Clipboard from 'expo-clipboard'
import { hapticLight } from '@/lib/haptics'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useAIStore, ChatMessage, ToolCallInfo } from '@/store/ai'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
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

const MessageActionButtons = memo(function MessageActionButtons({
  text,
  colors,
  isDark,
}: {
  text: string
  colors: any
  isDark: boolean
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

  const cleanTextForSpeech = (rawText: string) => {
    return rawText
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/[`*#_~\[\]]/g, '')
      .trim()
  }

  const handleSpeak = () => {
    hapticLight()
    const spokenText = cleanTextForSpeech(text)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(spokenText)
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
    </View>
  )
})

interface Props {
  projectId: string
}

export function AITab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const pageBgColor = isDark ? '#030303' : '#FFFFFF'
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setTabIndex, setSettingsSubScreen } = useUIStore()
  const {
    messages, isStreaming, currentStreamText, currentToolCalls,
    sendMessage, stopGeneration, startNewChat, savedConversations, loadConversation
  } = useAIStore()

  const [inputText, setInputText] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [attachModalVisible, setAttachModalVisible] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [quotedText, setQuotedText] = useState<string | null>(null)
  const [selectedMsgForSelect, setSelectedMsgForSelect] = useState<string | null>(null)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  const drawerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (drawerOpen) {
      Animated.timing(drawerAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
    } else {
      Animated.timing(drawerAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start()
    }
  }, [drawerOpen])

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
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [messages.length, currentStreamText, isStreaming])

  const handleSend = async () => {
    const trimmed = inputText.trim()
    if (!trimmed && !attachedImage && !quotedText) return

    let finalPrompt = trimmed
    if (quotedText) {
      finalPrompt = `> [Quoted AI Text]:\n"${quotedText}"\n\n${trimmed}`
    }
    if (attachedImage) {
      finalPrompt = `[Attached Image: ${attachedImage}]\n${finalPrompt}`
    }

    setInputText('')
    setAttachedImage(null)
    setQuotedText(null)
    await sendMessage(finalPrompt, projectId, undefined, 'gemini')
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
    body: { color: colors.text, fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
    code_block: { backgroundColor: isDark ? '#0B0C10' : '#F8FAFC', borderRadius: 8, padding: 10, border: `1px solid ${colors.border}`, fontFamily: 'JetBrainsMono_400Regular' },
    code_inline: { backgroundColor: isDark ? '#161821' : '#F1F5F9', color: colors.text, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontFamily: 'JetBrainsMono_400Regular' },
    link: { color: isDark ? '#58A6FF' : '#2563EB' },
  }), [colors, isDark])

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.82, 0],
  })

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: pageBgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      
      {/* Clean Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: isDark ? '#1A1C23' : '#E5E7EB' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={18} color={isDark ? '#A78BFA' : '#7C3AED'} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Project Assistant</Text>
        </View>

        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 6 }}>
          <TwoLineHamburgerIcon color={colors.text} size={22} />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={msg.role === 'user' ? styles.userRow : styles.modelRow}>
            <View style={msg.role === 'user' ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }] : styles.modelBubble}>
              {msg.role === 'user' ? (
                <Text style={{ color: colors.text, fontSize: 14 }}>{msg.text}</Text>
              ) : (
                <>
                  <Markdown style={markdownStyles}>{msg.text}</Markdown>
                  <MessageActionButtons text={msg.text} colors={colors} isDark={isDark} />
                </>
              )}
            </View>
          </View>
        ))}
        {isStreaming && (
          <View style={{ paddingVertical: 8 }}>
            {currentStreamText ? <Markdown style={markdownStyles}>{currentStreamText}</Markdown> : <ThinkingIndicator colors={colors} isDark={isDark} />}
          </View>
        )}
      </ScrollView>

      {/* Clean Input Composer Bar */}
      <View style={[styles.inputComposerOuter, { paddingBottom: isKeyboardVisible ? 6 : Math.max(insets.bottom, 10), backgroundColor: pageBgColor }]}>
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

        {quotedText && (
          <View style={[styles.imagePreviewChip, { backgroundColor: isDark ? '#161821' : '#F1F5F9', borderColor: colors.border }]}>
            <MessageSquare size={14} color={isDark ? '#A78BFA' : '#7C3AED'} strokeWidth={2} />
            <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 }} numberOfLines={1}>
              "{quotedText}"
            </Text>
            <TouchableOpacity onPress={() => setQuotedText(null)} style={{ padding: 2 }}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[
          styles.cleanInputBox,
          {
            borderColor: isInputFocused ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)') : colors.border,
            backgroundColor: isDark ? '#0B0C10' : '#FFFFFF',
          }
        ]}>
          <TouchableOpacity onPress={() => setAttachModalVisible(true)} style={{ padding: 8 }} activeOpacity={0.7}>
            <Plus size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[styles.cleanTextInput, { color: colors.text }]}
            placeholder="Ask AI about this project..."
            placeholderTextColor={colors.textSecondary + '70'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />

          {isStreaming ? (
            <TouchableOpacity
              onPress={() => stopGeneration()}
              style={[
                styles.sendBtnActive,
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
                styles.sendBtnActive,
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

      {/* Drawer Overlay */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
            <View style={[styles.drawerBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
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
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>Project AI</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <SpringPressable
              onPress={() => {
                startNewChat()
                setDrawerOpen(false)
              }}
              style={[styles.newChatBtn, { backgroundColor: isDark ? '#161821' : '#F1F5F9', borderColor: colors.border }]}
            >
              <Plus size={16} color={colors.text} strokeWidth={2} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>New Chat</Text>
            </SpringPressable>

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
                  <Text style={{ color: colors.text, fontSize: 13.5, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                    {thread.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setDrawerOpen(false)
                setTabIndex(4)
                setSettingsSubScreen('history')
              }}
              style={[styles.openAllBtn, { borderColor: colors.border, backgroundColor: isDark ? '#161821' : '#F8FAFC' }]}
            >
              <History size={16} color={colors.primary} strokeWidth={1.8} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>Open All Conversations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setDrawerOpen(false)
                setTabIndex(4)
                setSettingsSubScreen('limits')
              }}
              style={[styles.drawerSettingsBtn, { borderTopColor: colors.border }]}
            >
              <Settings size={18} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={{ color: colors.textSecondary, fontSize: 13.5, fontFamily: 'Inter_500Medium' }}>Settings & Limits</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  userRow: { alignItems: 'flex-end', marginVertical: 4 },
  modelRow: { alignItems: 'flex-start', marginVertical: 4 },
  userBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '85%' },
  modelBubble: { paddingHorizontal: 4, paddingVertical: 4 },
  inputComposerOuter: { paddingHorizontal: 16, paddingTop: 8 },
  imagePreviewChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  cleanInputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, minHeight: 48 },
  cleanTextInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 120, paddingHorizontal: 8, paddingVertical: 4 },
  sendBtnActive: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  attachPopoverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end', paddingBottom: 72, paddingHorizontal: 16 },
  attachPopoverCard: { width: 190, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, elevation: 6, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  attachOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1 },
  attachOptionText: { fontSize: 13.5, fontFamily: 'Inter_500Medium' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject },
  drawerContent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SCREEN_WIDTH * 0.82, borderRightWidth: 1, paddingHorizontal: 18 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  drawerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 12, marginBottom: 16 },
  drawerSectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recentConvoRow: { paddingVertical: 12, borderBottomWidth: 1 },
  openAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginVertical: 14 },
  drawerSettingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderTopWidth: 1 },
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

export default AITab;
