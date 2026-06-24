import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
  TouchableWithoutFeedback, Modal, Dimensions, Alert
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Bot, Terminal, Loader,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Cpu, History, X,
  Shield, Lock, Square
} from 'lucide-react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useAgentStore } from '@/store/agentStore'
import Markdown from 'react-native-markdown-display'
import { api } from '@/lib/api'

interface Props {
  projectId: string
}

export default function AITab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const {
    activeRun, runsList, isStreaming, plan, timeline, logs, pendingApproval,
    setActiveProject, loadRuns, startNewRun, resumeRun, approvePending, clearActiveRun, stopActiveRun
  } = useAgentStore()
  
  const router = useRouter()

  const [inputText, setInputText] = useState('')
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

  // Sync project context on mount
  useEffect(() => {
    setActiveProject(projectId)
    fetchByokAndTier()
  }, [projectId])

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
      // Spawn new agent run for this specific workspace
      await startNewRun(projectId, selectedModel, prompt)
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
        setFriendlyError('Rate limit reached. Retry available in 45 seconds. Tap Switch Model or use BYOK.')
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
      const lines = lastReasoning.message.trim().split('\n')
      return lines[lines.length - 1] || 'Agent is working...'
    }
    return 'Understanding request...'
  }

  // Markdown rendering configurations
  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    heading1: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 10, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 6, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 2, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 6, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 2, marginBottom: 2 },
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Tab Subheader Row */}
      <View style={[styles.subheaderRow, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Bot size={14} color={colors.primary} />
          <Text style={[styles.subheaderTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Workspace Copilot
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {/* Model picker badge */}
          <TouchableOpacity
            style={[styles.modelBadge, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
            onPress={() => setModelSelectorVisible(true)}
          >
            <Cpu size={10} color="#3FB950" />
            <Text style={[styles.modelBadgeText, { color: colors.text }]}>
              {selectedModel === 'gemini' ? 'Gemini' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude'}
            </Text>
          </TouchableOpacity>

          {/* Activity link */}
          <TouchableOpacity
            onPress={() => router.push('/activity')}
            style={styles.activityBtn}
          >
            <History size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages flow */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {timeline.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Bot size={36} color={isDark ? '#30363D' : '#8B929A'} style={{ marginBottom: 10 }} />
            <Text style={[styles.welcomeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Workspace Agent
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Describe changes or ask questions about this project's code. The agent can read, create, and edit files directly in this workspace.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {timeline.map((event) => {
              const isUser = event.title === 'User Prompt'
              const isReasoning = event.title === 'Agent Reasoning'
              
              if (!isUser && !isReasoning) return null

              return (
                <View key={event.id} style={[styles.messageRow, isUser ? styles.userRow : styles.modelRow]}>
                  {!isUser && (
                    <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                      <Sparkles size={11} color={isDark ? '#D2A8FF' : '#8250DF'} />
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

            {/* Working Progress Card */}
            {isStreaming && (
              <View style={[styles.progressCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <View style={styles.progressCardHeader}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ width: 12, height: 12 }} />
                  <Text style={[styles.progressCardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                    Working...
                  </Text>
                </View>

                {plan.length > 0 && (
                  <View style={styles.checklist}>
                    {plan.map((item, idx) => (
                      <View key={idx} style={styles.checklistItem}>
                        {item.status === 'completed' && <CheckCircle2 size={12} color="#3FB950" />}
                        {item.status === 'running' && <ActivityIndicator size="small" color="#2F80ED" style={{ width: 12, height: 12 }} />}
                        {item.status === 'pending' && <Loader size={12} color={colors.textSecondary} />}
                        {item.status === 'failed' && <AlertCircle size={12} color="#EB5757" />}
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

                <Text style={[styles.activeProgressLabel, { color: colors.textSecondary }]}>
                  {getActiveProgressText()}
                </Text>

                {logs.length > 0 && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowConsoleLogs(!showConsoleLogs)}
                      style={[styles.logsToggleBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
                    >
                      <Terminal size={11} color={colors.text} style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                        {showConsoleLogs ? 'Hide Logs' : 'Show Logs'}
                      </Text>
                      {showConsoleLogs ? <ChevronUp size={11} color={colors.text} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={11} color={colors.text} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>

                    {showConsoleLogs && (
                      <View style={[styles.consoleBox, { borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                        <ScrollView
                          ref={consoleScrollRef}
                          style={{ flex: 1 }}
                          contentContainerStyle={{ padding: 4 }}
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
                <AlertCircle size={14} color="#EB5757" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[styles.errorCardText, { color: isDark ? '#FF7B72' : '#F85149' }]}>
                    {friendlyError}
                  </Text>
                  {friendlyError.includes('Rate limit') && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Shield size={13} color="#E2B714" />
            <Text style={[styles.approvalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13 }]}>
              Action Approval Required
            </Text>
          </View>
          <View style={[styles.approvalCommandBox, { backgroundColor: isDark ? '#0D1117' : '#E1E4E8' }]}>
            <Text style={styles.approvalCommandText}>$ {pendingApproval.command}</Text>
          </View>
          <View style={styles.approvalActions}>
            <TouchableOpacity
              style={[styles.approvalBtn, { backgroundColor: '#EB5757' }]}
              onPress={() => approvePending('reject')}
            >
              <Text style={styles.approvalBtnText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approvalBtn, { backgroundColor: '#3FB950' }]}
              onPress={() => approvePending('approve')}
            >
              <Text style={styles.approvalBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Spawner Input area - tap container wrapper to focus input */}
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
          {isStreaming ? (
            <View style={styles.streamingLoaderBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
                Agent executing workspace plan...
              </Text>
            </View>
          ) : (
            <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
              <TextInput
                ref={inputRef}
                style={[styles.spawnerInput, { color: colors.text }]}
                placeholder={activeRun?.status === 'completed' ? "Goal completed. Type follow-up..." : "Send guidelines or prompt..."}
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
                <ArrowUp size={14} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
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
                Gemini 3 Flash (Fast)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}
              onPress={() => {
                setSelectedModel('openai')
                setModelSelectorVisible(false)
              }}
            >
              <Shield size={14} color="#2F80ED" />
              <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedModel === 'openai' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                GPT-4o (Reasoning)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}
              onPress={() => {
                setSelectedModel('anthropic')
                setModelSelectorVisible(false)
              }}
            >
              <Lock size={14} color="#9B51E0" />
              <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedModel === 'anthropic' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                Claude 3.6 Opus (Synthesis)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  subheaderTitle: {
    fontSize: 14,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  modelBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  activityBtn: {
    padding: 4,
  },
  welcomeContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#8B929A',
    textAlign: 'center',
    lineHeight: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  modelRow: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  modelBubble: {
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    gap: 6,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressCardTitle: {
    fontSize: 12,
  },
  checklist: {
    gap: 4,
    paddingLeft: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistText: {
    fontSize: 11,
    flex: 1,
  },
  activeProgressLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  logsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  consoleBox: {
    height: 90,
    backgroundColor: '#0D1117',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  consoleText: {
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
  },
  errorCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
    marginTop: 6,
  },
  errorCardText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  errorActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    justifyContent: 'center',
  },
  errorActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  approvalCard: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  approvalTitle: {
    fontSize: 13,
  },
  approvalCommandBox: {
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  approvalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: '#F85149',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  approvalBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  approvalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  spawnerInputContainer: {
    padding: 8,
    borderTopWidth: 1,
  },
  spawnerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  spawnerInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    maxHeight: 60,
    paddingVertical: 4,
  },
  sendBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamingLoaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
    padding: 14,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 12,
  },
})
