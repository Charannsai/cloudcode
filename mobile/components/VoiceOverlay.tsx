import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator,
  Dimensions, ScrollView
} from 'react-native'
import { Accelerometer } from 'expo-sensors'
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'
import { BlurView } from 'expo-blur'
import { useAIStore, ToolCallInfo } from '@/store/ai'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Mic, X, Sparkles, CheckCircle2, AlertCircle, Loader, Wrench, Terminal, FileCode, Play
} from '@/components/HugeIconsShim'
import Animated, {
  FadeIn, FadeInDown, FadeOut, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing
} from 'react-native-reanimated'

import { ensureMicrophonePermission } from '@/lib/permissions'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface Props {
  projectId: string
}

export default function VoiceOverlay({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const {
    sendMessage, isStreaming, currentStreamText, currentToolCalls
  } = useAIStore()

  const [visible, setVisible] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechText, setSpeechText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [executionPhase, setExecutionPhase] = useState<'idle' | 'recording' | 'executing' | 'success' | 'failed'>('idle')
  const [prevToolCalls, setPrevToolCalls] = useState<ToolCallInfo[]>([])

  // Shake detection logic
  useEffect(() => {
    let subscription: any = null
    
    // We calculate shake using x, y, and z forces.
    // Standard magnitude formula: sqrt(x^2 + y^2 + z^2)
    // Average gravity G is around 1.0 when stationary.
    // A sudden force change of > 1.8G indicates a shake.
    subscription = Accelerometer.addListener(data => {
      if (visible) return // ignore shakes if overlay is already active

      const { x, y, z } = data
      const magnitude = Math.sqrt(x * x + y * y + z * z)
      const SHAKE_THRESHOLD = 1.9

      if (magnitude > SHAKE_THRESHOLD) {
        setVisible(true)
        setExecutionPhase('recording')
        setSpeechText('')
        setError(null)
      }
    })

    Accelerometer.setUpdateInterval(100) // Check every 100ms

    return () => {
      subscription && subscription.remove()
    }
  }, [visible])

  // Speech recognition setup when overlay becomes visible
  useEffect(() => {
    if (visible && executionPhase === 'recording') {
      startSpeech()
    } else if (!visible) {
      stopSpeech()
    }
  }, [visible, executionPhase])

  // Sync tool calls to monitor if execution failed
  useEffect(() => {
    if (executionPhase === 'executing') {
      if (currentToolCalls.length > 0) {
        setPrevToolCalls(currentToolCalls)
      }
      
      if (!isStreaming) {
        // Finished streaming
        const hasError = currentToolCalls.some(t => t.status === 'error') || prevToolCalls.some(t => t.status === 'error')
        if (hasError) {
          setExecutionPhase('failed')
        } else {
          setExecutionPhase('success')
          // Auto-dismiss after success
          const timer = setTimeout(() => {
            handleClose()
          }, 2500)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [isStreaming, currentToolCalls, executionPhase])

  const startSpeech = async () => {
    ensureMicrophonePermission(
      async () => {
        try {
          setSpeechText('')
          setError(null)
          setIsListening(false)

          Voice.onSpeechStart = () => setIsListening(true)
          Voice.onSpeechEnd = () => setIsListening(false)
          Voice.onSpeechResults = (e: SpeechResultsEvent) => {
            if (e.value && e.value[0]) {
              setSpeechText(e.value[0])
            }
          }
          Voice.onSpeechError = (e: SpeechErrorEvent) => {
            console.error('[VoiceOverlay] Error:', e)
            setError(e.error?.message || 'Failed to detect speech.')
            setIsListening(false)
          }

          await Voice.start('en-US')
        } catch (err) {
          setError((err as Error).message)
          setIsListening(false)
        }
      },
      () => {
        // Close overlay if permission is denied or dismissed
        handleClose()
      }
    )
  }

  const stopSpeech = async () => {
    try {
      await Voice.stop()
      await Voice.destroy()
    } catch (err) {
      // Ignore
    }
  }

  const handleClose = () => {
    stopSpeech()
    setVisible(false)
    setExecutionPhase('idle')
    setSpeechText('')
    setError(null)
    setPrevToolCalls([])
  }

  const handleExecute = async () => {
    if (!speechText.trim()) return
    await stopSpeech()
    setExecutionPhase('executing')
    setPrevToolCalls([])
    try {
      await sendMessage(speechText, projectId)
    } catch (err) {
      setError((err as Error).message)
      setExecutionPhase('failed')
    }
  }

  // Pulsing mic indicator
  const pulse = useSharedValue(1)
  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    } else {
      pulse.value = withTiming(1.0, { duration: 300 })
    }
  }, [isListening])

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isListening ? 1.0 : 0.8,
  }))

  const renderToolIcon = (toolName: string) => {
    const iconMap: Record<string, any> = {
      read_file: FileCode,
      edit_file: FileCode,
      create_file: FileCode,
      delete_file: FileCode,
      run_command: Terminal,
      list_files: Wrench,
    }
    const Icon = iconMap[toolName] || Wrench
    return <Icon size={12} color={colors.textSecondary} />
  }

  const renderToolStatus = (status: ToolCallInfo['status']) => {
    if (status === 'running') {
      return <ActivityIndicator size="small" color={colors.primary} style={{ scaleX: 0.7, scaleY: 0.7 }} />
    } else if (status === 'pending') {
      return <ActivityIndicator size="small" color="#E2B714" style={{ scaleX: 0.7, scaleY: 0.7 }} />
    } else if (status === 'done') {
      return <CheckCircle2 size={13} color="#3FB950" />
    }
    return <AlertCircle size={13} color="#F85149" />
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View 
          entering={FadeInDown.duration(300).springify()}
          exiting={FadeOut.duration(200)}
          style={[
            styles.card, 
            { 
              backgroundColor: isDark ? 'rgba(11, 12, 16, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border
            }
          ]}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                Voice Shake-to-Act
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(248,81,73,0.1)' : 'rgba(248,81,73,0.05)', borderColor: '#F85149' }]}>
              <AlertCircle size={14} color="#F85149" />
              <Text style={[styles.errorText, { color: isDark ? '#FF7B72' : '#C9D1D9' }]}>{error}</Text>
            </View>
          )}

          {/* recording phase */}
          {executionPhase === 'recording' && (
            <View style={styles.recordingContent}>
              <Text style={[styles.stateSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                {isListening ? 'Speak your request now...' : 'Tap Mic to Start'}
              </Text>

              {/* Pulsing mic */}
              <TouchableOpacity onPress={startSpeech} activeOpacity={0.8} style={styles.micBtnContainer}>
                <Animated.View style={[styles.micPulse, { backgroundColor: colors.primary + '25' }, micPulseStyle]} />
                <View style={[styles.micBtn, { backgroundColor: colors.primary }]}>
                  <Mic size={28} color="#FFFFFF" strokeWidth={1.8} />
                </View>
              </TouchableOpacity>

              <View style={[styles.speechPreviewBox, { backgroundColor: isDark ? '#030303' : '#FAFAFA', borderColor: colors.border }]}>
                <Text style={[styles.speechPreviewText, { color: speechText ? colors.text : colors.textSecondary }]}>
                  {speechText || '“Create a file named api.py”'}
                </Text>
              </View>

              {speechText.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.executeBtn, { backgroundColor: colors.text }]}
                  onPress={handleExecute}
                  activeOpacity={0.8}
                >
                  <Play size={13} color={colors.background} fill={colors.background} />
                  <Text style={[styles.executeBtnText, { color: colors.background, fontFamily: 'Inter_600SemiBold' }]}>
                    Execute Command
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* executing phase */}
          {(executionPhase === 'executing' || executionPhase === 'success' || executionPhase === 'failed') && (
            <View style={styles.executingContent}>
              <View style={[styles.speechPreviewBox, { backgroundColor: isDark ? '#030303' : '#FAFAFA', borderColor: colors.border, marginBottom: 16 }]}>
                <Text style={[styles.speechTextTag, { color: colors.textSecondary }]}>USER SPEECH REQUEST</Text>
                <Text style={[styles.speechPreviewText, { color: colors.text }]}>{speechText}</Text>
              </View>

              <Text style={[styles.queueTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                JSON Action Execution Queue
              </Text>

              <ScrollView style={styles.queueScroll} contentContainerStyle={{ gap: 8 }}>
                {/* Fallback loader if list is still empty */}
                {currentToolCalls.length === 0 && (
                  <View style={styles.planningRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.planningText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                      Planning autonomous steps...
                    </Text>
                  </View>
                )}

                {currentToolCalls.map((tc, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.queueRow, 
                      { 
                        backgroundColor: isDark ? '#161821' : '#FAFAFA', 
                        borderColor: tc.status === 'error' ? '#F85149' : colors.border 
                      }
                    ]}
                  >
                    <View style={styles.queueRowLeft}>
                      {renderToolIcon(tc.name)}
                      <View>
                        <Text style={[styles.toolName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                          {tc.name}
                        </Text>
                        <Text style={[styles.toolArgs, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]} numberOfLines={1}>
                          {JSON.stringify(tc.args)}
                        </Text>
                      </View>
                    </View>
                    {renderToolStatus(tc.status)}
                  </View>
                ))}
              </ScrollView>

              {/* Success / Failed banner */}
              {executionPhase === 'success' && (
                <Animated.View entering={FadeIn} style={[styles.statusBanner, { backgroundColor: '#3FB950' + '15', borderColor: '#3FB950' }]}>
                  <CheckCircle2 size={16} color="#3FB950" />
                  <Text style={[styles.statusBannerText, { color: '#3FB950', fontFamily: 'Inter_600SemiBold' }]}>
                    Autonomous tasks executed successfully!
                  </Text>
                </Animated.View>
              )}

              {executionPhase === 'failed' && (
                <Animated.View entering={FadeIn} style={[styles.statusBanner, { backgroundColor: '#F85149' + '15', borderColor: '#F85149' }]}>
                  <AlertCircle size={16} color="#F85149" />
                  <Text style={[styles.statusBannerText, { color: '#F85149', fontFamily: 'Inter_600SemiBold' }]}>
                    One or more tasks failed to execute.
                  </Text>
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  recordingContent: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  stateSubtitle: {
    fontSize: 13.5,
    opacity: 0.8,
  },
  micBtnContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  micPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  speechPreviewBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
    justifyContent: 'center',
  },
  speechTextTag: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  speechPreviewText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    marginTop: 8,
  },
  executeBtnText: {
    fontSize: 13,
  },
  executingContent: {
    width: '100%',
  },
  queueTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  queueScroll: {
    maxHeight: 180,
    width: '100%',
    marginBottom: 16,
  },
  planningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  planningText: {
    fontSize: 13,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  queueRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  toolName: {
    fontSize: 12.5,
  },
  toolArgs: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
    maxWidth: '90%',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  statusBannerText: {
    fontSize: 12.5,
  },
})
