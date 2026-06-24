import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
  TouchableWithoutFeedback, Modal, Dimensions, Alert
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Bot, User, Terminal, Loader,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Cpu, History, Play, X,
  Shield, Lock, Square
} from 'lucide-react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import { useAgentStore } from '@/store/agentStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'
import { api } from '@/lib/api'

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    activeRun, runsList, isStreaming, plan, timeline, logs, pendingApproval,
    setActiveProject, loadRuns, startNewRun, resumeRun, approvePending, clearActiveRun, stopActiveRun
  } = useAgentStore()
  
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setTabBarVisible } = useUIStore()

  const [inputText, setInputText] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('global')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')
  
  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)
  const consoleScrollRef = useRef<ScrollView>(null)
  
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [showConsoleLogs, setShowConsoleLogs] = useState(false)
  const [friendlyError, setFriendlyError] = useState<string | null>(null)

  const [isByokActive, setIsByokActive] = useState(false)
  const [userTier, setUserTier] = useState('free')

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

  useEffect(() => {
    fetchByokAndTier()
  }, [])

  // Sync projects on focus
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      fetchProjects(true)
      loadRuns(selectedProjectId === 'global' ? undefined : selectedProjectId)
      fetchByokAndTier()

      return () => {
        setTabBarVisible(true)
      }
    }, [selectedProjectId])
  )

  // Automatically determine project context on load
  useEffect(() => {
    if (projects.length === 1) {
      setSelectedProjectId(projects[0].id)
    } else if (projects.length > 1) {
      setSelectedProjectId(projects[0].id)
    } else {
      setSelectedProjectId('global')
    }
  }, [projects])

  // Auto-scroll logs and main timeline
  useEffect(() => {
    if (showConsoleLogs) {
      setTimeout(() => {
        consoleScrollRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [logs, showConsoleLogs])

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [timeline, plan, isStreaming])

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    const prompt = inputText.trim()
    setInputText('')
    setFriendlyError(null)
    Keyboard.dismiss()
    
    if (!activeRun) {
      // Spawn new agent run
      const projId = selectedProjectId === 'global' ? null : selectedProjectId
      await startNewRun(projId, selectedModel, prompt)
    } else {
      // Follow up in active run
      await resumeRun(activeRun.id, prompt)
    }
  }

  // Parse custom friendly errors for better UX
  useEffect(() => {
    const lastEvent = timeline[timeline.length - 1]
    if (lastEvent && lastEvent.status === 'failed' && lastEvent.message) {
      const msg = lastEvent.message
      if (msg.includes('LIMIT_EXCEEDED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('monthly token limit exceeded')) {
        setFriendlyError('Rate limit reached. Retry available in 45 seconds. Tap Switch Model or use BYOK to continue.')
      } else if (msg.includes('Gemini API error') || msg.includes('fetch failed')) {
        setFriendlyError('Gemini is currently unavailable. Retrying connection...')
      } else {
        setFriendlyError(msg)
      }
    } else {
      setFriendlyError(null)
    }
  }, [timeline])

  // Determine current active progress text
  const getActiveProgressText = () => {
    if (pendingApproval) return 'Waiting for action approval...'
    const activeItem = plan.find(p => p.status === 'running')
    if (activeItem) return `Executing: ${activeItem.label}...`
    const lastReasoning = timeline.filter(t => t.title === 'Agent Reasoning').pop()
    if (lastReasoning?.message) {
      // Extract the last sentence or first line
      const lines = lastReasoning.message.trim().split('\n')
      return lines[lines.length - 1] || 'Agent is working...'
    }
    return 'Understanding request...'
  }

  // Markdown rendering configurations
  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    heading1: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 12, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 8, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 2, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 12, padding: 8, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 4, marginBottom: 4 },
  }

  return (
    <TabGenieWrapper index={3}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header (Minimal, Conversation-First) */}
        <View style={[styles.headerRow, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            CloudCode AI
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {/* Model picker */}
            <TouchableOpacity
              style={[styles.modelBadge, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
              onPress={() => setModelSelectorVisible(true)}
            >
              <Cpu size={12} color="#3FB950" />
              <Text style={[styles.modelBadgeText, { color: colors.text }]}>
                {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude'}
              </Text>
            </TouchableOpacity>

            {/* Activity screen icon */}
            <TouchableOpacity
              onPress={() => router.push('/activity')}
              style={styles.activityBtn}
            >
              <History size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation Chat Flow */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {timeline.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <Bot size={48} color={isDark ? '#30363D' : '#8B929A'} style={{ marginBottom: 12 }} />
              <Text style={[styles.welcomeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                How can I help you today?
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Ask me to write code, design projects, install packages, or explain files in your active workspace.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 18 }}>
              {timeline.map((event, index) => {
                const isUser = event.title === 'User Prompt'
                const isReasoning = event.title === 'Agent Reasoning'
                
                // We only render user prompts and AI reasoning text in the chat bubble feed
                if (!isUser && !isReasoning) return null

                return (
                  <View key={event.id} style={[styles.messageRow, isUser ? styles.userRow : styles.modelRow]}>
                    {!isUser && (
                      <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                        <Sparkles size={13} color={isDark ? '#D2A8FF' : '#8250DF'} />
                      </View>
                    )}
                    
                    <View style={[
                      styles.bubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: isDark ? '#21262D' : '#F0F2F5' }]
                        : styles.modelBubble
                    ]}>
                      {isUser ? (
                        <Text style={[styles.messageText, { color: isDark ? '#FFFFFF' : '#1F2328', fontFamily: 'Inter_400Regular' }]}>
                          {event.message}
                        </Text>
                      ) : (
                        <Markdown style={mdStyles}>
                          {event.message || ''}
                        </Markdown>
                      )}
                    </View>
                  </View>
                )
              })}

              {/* Working Progress Card (Only visible when agent is executing/streaming) */}
              {isStreaming && (
                <View style={[styles.progressCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                  <View style={styles.progressCardHeader}>
                    <ActivityIndicator size="small" color={colors.primary} style={{ width: 14, height: 14 }} />
                    <Text style={[styles.progressCardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                      Working...
                    </Text>
                  </View>

                  {/* Checklist of Roadmap tasks */}
                  {plan.length > 0 && (
                    <View style={styles.checklist}>
                      {plan.map((item, idx) => (
                        <View key={idx} style={styles.checklistItem}>
                          {item.status === 'completed' && <CheckCircle2 size={13} color="#3FB950" />}
                          {item.status === 'running' && <ActivityIndicator size="small" color="#2F80ED" style={{ width: 13, height: 13 }} />}
                          {item.status === 'pending' && <Loader size={13} color={colors.textSecondary} />}
                          {item.status === 'failed' && <AlertCircle size={13} color="#EB5757" />}
                          <Text style={[
                            styles.checklistText,
                            {
                              color: item.status === 'completed' ? colors.textSecondary : colors.text,
                              textDecorationLine: item.status === 'completed' ? 'line-through' : 'none'
                            }
                          ]}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Active running step label */}
                  <Text style={[styles.activeProgressLabel, { color: colors.textSecondary }]}>
                    {getActiveProgressText()}
                  </Text>

                  {/* Collapsible monospace terminal logs */}
                  {logs.length > 0 && (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowConsoleLogs(!showConsoleLogs)}
                        style={[styles.logsToggleBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
                      >
                        <Terminal size={12} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                          {showConsoleLogs ? 'Hide Logs' : 'Show Logs'}
                        </Text>
                        {showConsoleLogs ? <ChevronUp size={12} color={colors.text} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={12} color={colors.text} style={{ marginLeft: 'auto' }} />}
                      </TouchableOpacity>

                      {showConsoleLogs && (
                        <View style={[styles.consoleBox, { borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                          <ScrollView
                            ref={consoleScrollRef}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 6 }}
                            nestedScrollEnabled
                          >
                            <Text style={styles.consoleText}>
                              {logs.join('')}
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Friendly Error Display */}
              {friendlyError && (
                <View style={[styles.errorCard, { backgroundColor: isDark ? '#221515' : '#FDF2F2', borderColor: '#F85149' }]}>
                  <AlertCircle size={16} color="#EB5757" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={[styles.errorCardText, { color: isDark ? '#FF7B72' : '#F85149' }]}>
                      {friendlyError}
                    </Text>
                    {friendlyError.includes('Rate limit') && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.errorActionBtn, { backgroundColor: '#EB5757' }]}
                          onPress={handleSend}
                        >
                          <Text style={styles.errorActionText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.errorActionBtn, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}
                          onPress={() => setModelSelectorVisible(true)}
                        >
                          <Text style={[styles.errorActionText, { color: colors.text }]}>Switch Model</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Approvals Card */}
        {pendingApproval && (
          <View style={[styles.approvalCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: '#E2B714' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Shield size={14} color="#E2B714" />
              <Text style={[styles.approvalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                Action Approval Required
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
              The agent wants to run the following terminal command:
            </Text>
            <View style={[styles.approvalCommandBox, { backgroundColor: isDark ? '#0D1117' : '#E1E4E8' }]}>
              <Text style={styles.approvalCommandText}>$ {pendingApproval.command}</Text>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={[styles.approvalBtn, { backgroundColor: '#EB5757' }]}
                onPress={() => approvePending('reject')}
              >
                <Text style={styles.approvalBtnText}>Deny (No)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approvalBtn, { backgroundColor: '#3FB950' }]}
                onPress={() => approvePending('approve')}
              >
                <Text style={styles.approvalBtnText}>Approve (Yes)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer Prompt Input (Tap wrapper container to focus text input) */}
        <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
          <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
            {isStreaming ? (
              <View style={[styles.streamingLoaderBox, { paddingHorizontal: 4 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                  {getActiveProgressText()}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#EB5757',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onPress={() => stopActiveRun()}
                >
                  <Square size={10} fill="#FFFFFF" color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter_700Bold' }}>Stop</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.spawnerInput, { color: colors.text }]}
                  placeholder={activeRun?.status === 'completed' ? "Goal completed. Type follow-up..." : "Describe a goal or ask a question..."}
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : (isDark ? '#21262D' : '#E1E4E8') }]}
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                >
                  <ArrowUp size={16} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Model Selector Modal */}
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
            <View style={[styles.selectorDropdownCard, { backgroundColor: isDark ? '#161B22' : '#FFFFFF', borderColor: isDark ? '#30363D' : '#E5E7EB' }]}>
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
                  Gemini 3 Flash (Fast, resource-governed)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB', opacity: (userTier === 'free' && !isByokActive) ? 0.6 : 1 }]}
                onPress={() => {
                  if (userTier === 'free' && !isByokActive) {
                    Alert.alert(
                      'Premium Model Locked',
                      'GPT-4o is restricted to Pro and Advanced subscriptions. Please upgrade in Settings or configure Bring Your Own Key (BYOK) in settings to unlock.'
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
                      'Claude 3.6 Opus is restricted to Pro and Advanced subscriptions. Please upgrade in Settings or configure Bring Your Own Key (BYOK) in settings to unlock.'
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
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
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
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  activityBtn: {
    padding: 4,
  },
  welcomeContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#8B929A',
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  modelRow: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  modelBubble: {
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressCardTitle: {
    fontSize: 13,
  },
  checklist: {
    gap: 6,
    paddingLeft: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistText: {
    fontSize: 12,
    flex: 1,
  },
  activeProgressLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  logsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  consoleBox: {
    height: 120,
    backgroundColor: '#0D1117',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  consoleText: {
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
  },
  errorCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  errorCardText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  errorActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
  },
  errorActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  approvalCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
  },
  approvalTitle: {
    fontSize: 14,
  },
  approvalCommandBox: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  approvalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: '#F85149',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  approvalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approvalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  spawnerInputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  spawnerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  spawnerInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamingLoaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
})
