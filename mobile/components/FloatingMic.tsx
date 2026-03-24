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
  withTiming, Easing,
} from 'react-native-reanimated'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'

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

  const [isAwake, setIsAwake] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  
  // Animation values for the "Dynamic Island" pill
  const pillWidth = useSharedValue(160)
  const pulseOpacity = useSharedValue(0.4)
  const [hasVoiceModule, setHasVoiceModule] = useState(true)
  const nativeReady = useRef(false)

  useEffect(() => {
    // Subtle background pulsing to indicate "listening"
    pulseOpacity.value = withRepeat(
      withTiming(0.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    // Setup Voice recognition (will fail in vanilla Expo Go, wrapped in try-catch)
    const initVoice = async () => {
      try {
        Voice.onSpeechResults = onSpeechResults
        Voice.onSpeechError = onSpeechError
        Voice.onSpeechEnd = onSpeechEnd

        nativeReady.current = true
        startContinuousListening()
      } catch (e) {
        console.warn('Voice module not available. Falling back to simulated wake-word.')
        setHasVoiceModule(false)
        nativeReady.current = false
      }
    }

    initVoice()

    return () => {
      if (!nativeReady.current) return
      try {
        // Prevent fatal Uncaught promises if native module is null during unmount
        Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {})
      } catch (e) {}
    }
  }, [])

  const startContinuousListening = useCallback(async () => {
    if (isAwake || showInput || !nativeReady.current) return
    try {
      await Voice.start('en-US')
    } catch (e: any) {
      if (e?.message?.includes('null') || e?.message?.includes('startSpeech')) {
        setHasVoiceModule(false)
        nativeReady.current = false
      }
    }
  }, [isAwake, showInput])

  const onSpeechResults = useCallback((e: SpeechResultsEvent) => {
    const text = (e.value || [])[0]?.toLowerCase() || ''
    if (text.includes('hey cloud')) {
      // Detected wake word!
      handleWakeWordReal(text)
    }
  }, [])

  const onSpeechError = useCallback((e: SpeechErrorEvent) => {
    // It will timeout occasionally, we just restart to keep listening in background
    if (!isAwake && !showInput) {
      setTimeout(startContinuousListening, 500)
    }
  }, [isAwake, showInput, startContinuousListening])

  const onSpeechEnd = useCallback(() => {
    if (!isAwake && !showInput) {
      setTimeout(startContinuousListening, 500)
    }
  }, [isAwake, showInput, startContinuousListening])

  const handleWakeWordReal = useCallback(async (fullText: string) => {
    setIsAwake(true)
    pillWidth.value = withSpring(SCREEN_W - 40, { damping: 15 })

    // Check if they said the wake word + command all at once
    // E.g. "hey cloud fix my bugs"
    const commandMatch = fullText.split('hey cloud ')[1]
    
    try { if (nativeReady.current) await Voice.stop() } catch (e) {}

    setTimeout(() => {
      setIsAwake(false)
      pillWidth.value = withSpring(160)
      if (commandMatch && commandMatch.length > 2) {
        // We caught the full command already
        setVoiceText(commandMatch)
        setShowInput(true)
      } else {
        // They only said "Hey Cloud", open input and wait for command
        setVoiceText('')
        setShowInput(true)
      }
    }, 600)
  }, [])

  const pillAnimStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    opacity: pulseOpacity.value,
  }))

  const getScreenContext = useCallback(() => {
    if (pathname.includes('/editor')) return 'editor'
    if (pathname.includes('/project/')) return 'project'
    if (pathname.includes('/ai')) return 'ai'
    if (pathname.includes('/dashboard')) return 'dashboard'
    if (pathname.includes('/projects')) return 'projects'
    return 'general'
  }, [pathname])

  const handleWakeWordSimulated = useCallback(async () => {
    // Trigger wake state
    setIsAwake(true)
    pillWidth.value = withSpring(SCREEN_W - 40, { damping: 15 })
    
    // Simulate short processing before opening the prompt
    setTimeout(() => {
      setShowInput(true)
      setIsAwake(false)
      pillWidth.value = withSpring(160)
    }, 600)
  }, [])

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

  // Don't show on certain screens like login
  if (pathname === '/' || pathname === '/auth') return null

  return (
    <>
      <View style={styles.topContainer} pointerEvents="box-none">
        <Animated.View style={[
          styles.wakePill,
          pillAnimStyle,
          {
            backgroundColor: isDark ? 'rgba(20,20,25,0.85)' : 'rgba(255,255,255,0.9)',
            borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(79,70,229,0.2)',
          }
        ]}>
          <TouchableOpacity 
            style={styles.pillContent} 
            onPress={handleWakeWordSimulated}
            activeOpacity={0.7}
          >
            <View style={styles.micCircle}>
              <Mic size={14} color="#fff" />
            </View>
            <Text style={[styles.pillText, { color: colors.text }]}>
              {isAwake ? 'Waking up...' : (hasVoiceModule ? 'Say "Hey Cloud"' : 'Tap for "Hey Cloud"')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

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
  topContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 9000,
  },
  wakePill: {
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  micCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
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
