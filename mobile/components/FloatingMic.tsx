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

  // Hidden dynamically per user request
  return null
}
