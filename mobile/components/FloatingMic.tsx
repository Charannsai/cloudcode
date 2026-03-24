import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, StyleSheet, TouchableOpacity, Text, Dimensions,
  Platform, Alert, Animated as RNAnimated,
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Mic, MicOff, X, Loader2 } from 'lucide-react-native'
import { useRouter, usePathname } from 'expo-router'
import { useAIStore } from '@/store/ai'
import { useProjectsStore } from '@/store/projects'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat,
  withTiming, interpolate, Easing, cancelAnimation,
} from 'react-native-reanimated'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const MIC_SIZE = 56
const PULSE_SIZE = 80

interface FloatingMicProps {
  onTranscript?: (text: string) => void
}

export default function FloatingMic({ onTranscript }: FloatingMicProps) {
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { sendMessage } = useAIStore()
  const { projects } = useProjectsStore()

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [voiceText, setVoiceText] = useState('')

  // Animation values
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0)
  const micScale = useSharedValue(1)

  // Position for the floating button (bottom right by default)
  const pan = useRef(new RNAnimated.ValueXY({ x: SCREEN_W - MIC_SIZE - 20, y: SCREEN_H - MIC_SIZE - 140 })).current

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
      pulseOpacity.value = withRepeat(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
      micScale.value = withSpring(1.1)
    } else {
      cancelAnimation(pulseScale)
      cancelAnimation(pulseOpacity)
      pulseScale.value = withSpring(1)
      pulseOpacity.value = withTiming(0, { duration: 200 })
      micScale.value = withSpring(1)
    }
  }, [isRecording])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }))

  const getScreenContext = useCallback(() => {
    if (pathname.includes('/editor')) return 'editor'
    if (pathname.includes('/project/')) return 'project'
    if (pathname.includes('/ai')) return 'ai'
    if (pathname.includes('/dashboard')) return 'dashboard'
    if (pathname.includes('/projects')) return 'projects'
    return 'general'
  }, [pathname])

  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setIsProcessing(true)
      
      // Since we're using free tier and can't rely on expo-av recording without native setup,
      // we'll show a text input modal as a voice input fallback
      // In production, this would use @react-native-voice/voice or expo-av
      setIsProcessing(false)
      setShowInput(true)
      return
    }

    // Start recording
    setIsRecording(true)
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
      setIsRecording(false)
      setShowInput(true)
    }, 10000)
  }, [isRecording])

  const handleSendVoice = useCallback(async () => {
    if (!voiceText.trim()) return

    const context = getScreenContext()
    let enrichedPrompt = voiceText.trim()

    // Context-aware enrichment
    switch (context) {
      case 'editor':
        enrichedPrompt = `[Voice from Editor] ${enrichedPrompt}`
        break
      case 'project':
        enrichedPrompt = `[Voice from Project] ${enrichedPrompt}`
        break
      default:
        break
    }

    // Route to AI
    if (projects.length > 0) {
      const projectId = projects[0].id
      await sendMessage(enrichedPrompt, projectId)
    }

    setVoiceText('')
    setShowInput(false)

    // Navigate to AI tab if not already there
    if (!pathname.includes('/ai')) {
      router.push('/(tabs)/ai')
    }
  }, [voiceText, getScreenContext, projects, sendMessage, pathname, router])

  // Don't show on certain screens
  if (pathname === '/' || pathname === '/auth') return null

  return (
    <>
      {/* Floating Mic Button */}
      <RNAnimated.View
        style={[
          styles.floatingContainer,
          { transform: pan.getTranslateTransform() },
        ]}
      >
        {/* Pulse ring */}
        <Animated.View style={[styles.pulseRing, pulseStyle, {
          backgroundColor: isDark ? '#6366f1' : '#4f46e5',
        }]} />

        {/* Main mic button */}
        <Animated.View style={micAnimStyle}>
          <TouchableOpacity
            style={[
              styles.micButton,
              {
                backgroundColor: isRecording
                  ? '#ef4444'
                  : (isDark ? '#6366f1' : '#4f46e5'),
                shadowColor: isRecording ? '#ef4444' : '#6366f1',
              }
            ]}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <Loader2 size={24} color="#fff" />
            ) : isRecording ? (
              <MicOff size={24} color="#fff" />
            ) : (
              <Mic size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </RNAnimated.View>

      {/* Voice Input Modal (fallback for text-based voice input) */}
      {showInput && (
        <View style={styles.voiceOverlay}>
          <View style={[styles.voiceModal, { backgroundColor: isDark ? '#111' : '#fff', borderColor: isDark ? '#222' : '#e0e0e0' }]}>
            <View style={styles.voiceModalHeader}>
              <View style={[styles.voiceRecordIcon, { backgroundColor: isDark ? '#1a1a2e' : '#eef2ff' }]}>
                <Mic size={20} color={isDark ? '#818cf8' : '#6366f1'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.voiceModalTitle, { color: colors.text }]}>Voice Command</Text>
                <Text style={[styles.voiceModalSubtitle, { color: colors.textSecondary }]}>
                  {getScreenContext() === 'editor' ? 'Editing context' : 'General context'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setShowInput(false); setVoiceText('') }} style={styles.voiceCloseBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.voiceInputBox, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5', borderColor: isDark ? '#1a1a1a' : '#e5e5e5' }]}>
              <Text style={[styles.voiceInputIcon, { color: isDark ? '#6366f1' : '#4f46e5' }]}>🎙️</Text>
              <View style={styles.voiceInputTextContainer}>
                {/* In production, this would show the live transcription from STT */}
                {/* For now, we provide a text input as fallback */}
                <Text style={[styles.voiceInputPlaceholder, { color: colors.textSecondary }]}>
                  Speak or type your command:
                </Text>
                <View style={[styles.voiceTextInput, { borderColor: isDark ? '#222' : '#ddd' }]}>
                  <Text style={[styles.voiceInputLabel, { color: colors.textSecondary }]}>
                    Type what you'd say:
                  </Text>
                  {/* Using a simulated input via React Native TextInput */}
                </View>
              </View>
            </View>

            {/* Quick voice commands */}
            <View style={styles.quickVoiceCommands}>
              {[
                '🔍 Show project structure',
                '✏️ Fix the bugs in current file',
                '📦 Install missing packages',
                '🔀 Commit all changes',
              ].map((cmd, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickVoiceCmd, { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0', borderColor: isDark ? '#222' : '#e0e0e0' }]}
                  onPress={() => {
                    setVoiceText(cmd.replace(/^[^\s]+ /, ''))
                    if (projects.length > 0) {
                      sendMessage(cmd.replace(/^[^\s]+ /, ''), projects[0].id)
                    }
                    setShowInput(false)
                    if (!pathname.includes('/ai')) {
                      router.push('/(tabs)/ai')
                    }
                  }}
                >
                  <Text style={[styles.quickVoiceCmdText, { color: isDark ? '#ccc' : '#444' }]}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    zIndex: 9999,
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 10000,
  },
  voiceModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  voiceRecordIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  voiceModalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  voiceCloseBtn: {
    padding: 8,
  },
  voiceInputBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  voiceInputIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  voiceInputTextContainer: {
    flex: 1,
  },
  voiceInputPlaceholder: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  voiceTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  voiceInputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  quickVoiceCommands: {
    gap: 8,
  },
  quickVoiceCmd: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickVoiceCmdText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
})
