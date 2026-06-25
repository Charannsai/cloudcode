import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, Platform, Dimensions, Alert
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  ArrowLeft, Cpu, Folder, HardDrive, History, CheckCircle2, AlertCircle,
  Terminal, Shield, Clock, ChevronDown, ChevronUp, Sparkles, X, ChevronRight
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { useAgentStore } from '@/store/agentStore'
import { useAIStore } from '@/store/ai'
import Markdown from 'react-native-markdown-display'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface BillingStats {
  workspacesUsed: number
  workspacesLimit: number
  tokensUsed: number
  tokensLimit: number
  storageUsed: number
  storageLimit: number
}

export default function ActivityScreen() {
  const { colors, isDark } = useAppTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  
  const { runsList, loadRuns, activeProjectId } = useAgentStore()
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null)
  const [loadingResources, setLoadingResources] = useState(true)
  const [isByokActive, setIsByokActive] = useState(false)
  
  // Detail Modal state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showConsoleLogs, setShowConsoleLogs] = useState(false)
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  const checkByok = async () => {
    try {
      const byok = await AsyncStorage.getItem('byok_enabled')
      setIsByokActive(byok === 'true')
    } catch (e) {
      console.warn('Failed to load BYOK setting in activity:', e)
    }
  }

  useEffect(() => {
    loadRuns(activeProjectId || undefined)
    fetchBilling()
    checkByok()
  }, [activeProjectId])

  const fetchBilling = async () => {
    setLoadingResources(true)
    try {
      const data = await api.billing.status()
      if (data) {
        setBillingStats({
          workspacesUsed: data.usage?.workspaces?.used || 0,
          workspacesLimit: data.limits?.container?.maxWorkspaces || 3,
          tokensUsed: data.usage?.aiTokens?.used || 0,
          tokensLimit: data.limits?.ai?.monthlyTokens || 100000,
          storageUsed: Number(data.usage?.disk?.usedGB || 0.8),
          storageLimit: data.limits?.container?.diskGB || 2
        })
      }
    } catch (err) {
      console.warn('Failed to load billing usage:', err)
    } finally {
      setLoadingResources(false)
    }
  }

  const handleOpenRunDetail = async (runId: string) => {
    setSelectedRunId(runId)
    setLoadingDetail(true)
    setShowConsoleLogs(false)
    setExpandedStepId(null)
    
    try {
      const data = await api.ai.getRun(runId)
      setRunDetail(data)
    } catch (err) {
      Alert.alert('Error', 'Failed to load run details')
      setSelectedRunId(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleResumeRun = async (runId: string) => {
    try {
      await useAIStore.getState().loadStatefulConversation(runId)
      router.replace('/(tabs)/ai')
    } catch (e) {
      Alert.alert('Error', 'Failed to resume conversation.')
    }
  }

  const formatRunId = (id: string) => {
    return id.substring(0, 8).toUpperCase()
  }

  const formatTokens = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#3FB950'
      case 'executing': return '#2F80ED'
      case 'waiting': return '#F2C94C'
      case 'failed': return '#EB5757'
      case 'planning': return '#9B51E0'
      case 'paused': return '#828282'
      default: return colors.textSecondary
    }
  }

  // Compile stdout logs from past run steps
  const extractPastLogs = (steps: any[]): string => {
    if (!steps) return ''
    return steps
      .filter(s => s.type === 'tool_result' && s.content?.name === 'run_command' && s.content?.response?.output)
      .map(s => `\n$ ${steps.find(prev => prev.type === 'tool_call' && prev.content?.name === 'run_command' && prev.step_index < s.step_index)?.content?.args?.command || 'command'}\n${s.content.response.output}`)
      .join('\n')
  }

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    heading1: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 8, marginBottom: 2, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 6, marginBottom: 2, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 2, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 6, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 2, marginBottom: 2 },
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
          Activity & Governance
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* 1. Resource Consumption Ledger */}
        <View style={[styles.card, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 0 }]}>
              Plan & Quota Limits
            </Text>
            {isByokActive && (
              <View style={{ backgroundColor: '#3FB95020', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#3FB950', fontSize: 10, fontFamily: 'Inter_700Bold' }}>BYOK Mode Active</Text>
              </View>
            )}
          </View>

          {loadingResources || !billingStats ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.metersList}>
              {/* Tokens */}
              <View style={styles.meterItem}>
                <View style={styles.meterHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Cpu size={14} color="#2F80ED" />
                    <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>AI Monthly Tokens</Text>
                  </View>
                  <Text style={[styles.meterVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                    {formatTokens(billingStats.tokensUsed)} / {formatTokens(billingStats.tokensLimit)}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#2F80ED',
                      width: `${Math.min(100, (billingStats.tokensUsed / billingStats.tokensLimit) * 100)}%`
                    }
                  ]} />
                </View>
              </View>

              {/* BYOK Suggestion */}
              {!isByokActive ? (
                <View style={{ backgroundColor: isDark ? '#1C2128' : '#EAECEF', padding: 10, borderRadius: 8, marginTop: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    💡 **Suggest BYOK**: Configure your own API keys in Settings to bypass monthly token limits.
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: isDark ? '#1C2128' : '#EAECEF', padding: 10, borderRadius: 8, marginTop: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                    ✅ Using custom API keys. Monthly token quotas are bypassed.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 2. Historical Agent Runs */}
        <View>
          <View style={styles.sectionHeader}>
            <History size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              Past Conversations
            </Text>
          </View>

          {runsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                No past conversations found.
              </Text>
            </View>
          ) : (
            <View style={styles.runsList}>
              {runsList.map((run) => (
                <TouchableOpacity
                  key={run.id}
                  style={[styles.runItem, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                  onPress={() => handleResumeRun(run.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.runHeaderRow}>
                    <Text style={[styles.runTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                      Chat Conversation
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.runMetaText, { color: colors.textSecondary, marginTop: 2 }]}>
                    Model: {run.model === 'gemini' ? 'Gemini' : run.model === 'openai' ? 'GPT-4o' : 'Claude'} • {run.tokens_used.toLocaleString()} tokens
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} style={styles.arrowIcon} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Run Detail Modal */}
      <Modal
        visible={!!selectedRunId}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedRunId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', borderColor: isDark ? '#21262D' : '#E5E7EB' }]}>
            {loadingDetail || !runDetail ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading conversation history...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                      Past Conversation
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Model: {runDetail.run.model === 'gemini' ? 'Gemini' : runDetail.run.model === 'openai' ? 'GPT-4o' : 'Claude'} • Status: {runDetail.run.status}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRunId(null)} style={styles.closeBtn}>
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Scroll Content */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
                  <View style={{ gap: 18 }}>
                    {runDetail.steps
                      .filter((step: any) => step.type === 'reasoning')
                      .map((step: any) => {
                        const isUser = step.content.role === 'user'
                        const msgText = step.content.text || step.content.message || ''
                        if (!msgText) return null

                        return (
                          <View key={step.id} style={[styles.messageRow, isUser ? styles.userRow : styles.modelRow]}>
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
                                  {msgText}
                                </Text>
                              ) : (
                                <Markdown style={mdStyles}>
                                  {msgText}
                                </Markdown>
                              )}
                            </View>
                          </View>
                        )
                      })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 14,
  },
  metersList: {
    gap: 14,
  },
  meterItem: {
    gap: 6,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 12,
  },
  meterVal: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  runsList: {
    gap: 8,
  },
  runItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  runHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  runTitle: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
  },
  runMetaText: {
    fontSize: 11,
    marginBottom: 2,
  },
  runUsageText: {
    fontSize: 11,
    paddingRight: 24,
  },
  arrowIcon: {
    position: 'absolute',
    right: 12,
    top: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
  },
  closeBtn: {
    padding: 4,
  },
  detailPanel: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  panelTitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panelItem: {
    width: '46%',
    gap: 2,
  },
  panelLabel: {
    fontSize: 10,
  },
  panelVal: {
    fontSize: 13,
  },
  consoleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  consolePanel: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    borderWidth: 1,
    height: 180,
    padding: 8,
  },
  consoleText: {
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  auditTimeline: {
    gap: 6,
  },
  auditStep: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#30363D',
    paddingBottom: 6,
  },
  auditStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditStepTitle: {
    fontSize: 13,
  },
  auditStepContent: {
    marginTop: 4,
    paddingLeft: 16,
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
})
