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
import Markdown from 'react-native-markdown-display'

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
  
  // Detail Modal state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showConsoleLogs, setShowConsoleLogs] = useState(false)
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  useEffect(() => {
    loadRuns(activeProjectId || undefined)
    fetchBilling()
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
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            Resource Consumption
          </Text>

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

              {/* Workspaces */}
              <View style={styles.meterItem}>
                <View style={styles.meterHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Folder size={14} color="#3FB950" />
                    <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Workspace Containers</Text>
                  </View>
                  <Text style={[styles.meterVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                    {billingStats.workspacesUsed} / {billingStats.workspacesLimit}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#3FB950',
                      width: `${Math.min(100, (billingStats.workspacesUsed / billingStats.workspacesLimit) * 100)}%`
                    }
                  ]} />
                </View>
              </View>

              {/* Storage */}
              <View style={styles.meterItem}>
                <View style={styles.meterHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <HardDrive size={14} color="#F2C94C" />
                    <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Disk Storage</Text>
                  </View>
                  <Text style={[styles.meterVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                    {billingStats.storageUsed.toFixed(1)} GB / {billingStats.storageLimit} GB
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#F2C94C',
                      width: `${Math.min(100, (billingStats.storageUsed / billingStats.storageLimit) * 100)}%`
                    }
                  ]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 2. Historical Agent Runs */}
        <View>
          <View style={styles.sectionHeader}>
            <History size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              Agent Execution Audit Logs
            </Text>
          </View>

          {runsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                No past agent executions found.
              </Text>
            </View>
          ) : (
            <View style={styles.runsList}>
              {runsList.map((run) => (
                <TouchableOpacity
                  key={run.id}
                  style={[styles.runItem, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                  onPress={() => handleOpenRunDetail(run.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.runHeaderRow}>
                    <Text style={[styles.runTitle, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                      RUN #{formatRunId(run.id)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(run.status) + '1A' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(run.status), fontFamily: 'Inter_700Bold' }]}>
                        {run.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.runMetaText, { color: colors.textSecondary }]}>
                    Model: {run.model} • Duration: {Math.round(run.duration_sec / 60)}m
                  </Text>
                  <Text style={[styles.runUsageText, { color: colors.textSecondary }]}>
                    Commands: {run.commands_run}/{run.budget_commands} • Tokens: {run.tokens_used.toLocaleString()}
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
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading run history...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                      RUN DETAILS #{formatRunId(runDetail.run.id)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Model: {runDetail.run.model} • Status: {runDetail.run.status}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRunId(null)} style={styles.closeBtn}>
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Scroll Content */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
                  {/* Detailed consumption panel */}
                  <View style={[styles.detailPanel, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                    <Text style={[styles.panelTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                      Infrastructure Consumption Metrics
                    </Text>
                    <View style={styles.panelGrid}>
                      <View style={styles.panelItem}>
                        <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>AI Tokens Used</Text>
                        <Text style={[styles.panelVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                          {runDetail.run.tokens_used.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.panelItem}>
                        <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>Command Executions</Text>
                        <Text style={[styles.panelVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                          {runDetail.run.commands_run} / {runDetail.run.budget_commands}
                        </Text>
                      </View>
                      <View style={styles.panelItem}>
                        <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>File Writes Run</Text>
                        <Text style={[styles.panelVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                          {runDetail.run.file_writes_run}
                        </Text>
                      </View>
                      <View style={styles.panelItem}>
                        <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>Duration Allocated</Text>
                        <Text style={[styles.panelVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                          {Math.round(runDetail.run.duration_sec / 60)}m / 20m
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Toggle terminal logs */}
                  {extractPastLogs(runDetail.steps).length > 0 && (
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowConsoleLogs(!showConsoleLogs)}
                        style={[styles.consoleToggleBtn, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}
                      >
                        <Terminal size={14} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                          {showConsoleLogs ? 'Hide Console stdout Logs' : 'View Console stdout Logs'}
                        </Text>
                        {showConsoleLogs ? <ChevronUp size={14} color={colors.text} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color={colors.text} style={{ marginLeft: 'auto' }} />}
                      </TouchableOpacity>

                      {showConsoleLogs && (
                        <View style={[styles.consolePanel, { borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                          <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                            <Text style={styles.consoleText}>
                              {extractPastLogs(runDetail.steps)}
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Event Alerts Ledger */}
                  {runDetail.events.length > 0 && (
                    <View style={[styles.detailPanel, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                      <Text style={[styles.panelTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                        Governance & Execution Events
                      </Text>
                      <View style={{ gap: 6, marginTop: 6 }}>
                        {runDetail.events.map((ev: any) => (
                          <View key={ev.id} style={styles.eventRow}>
                            <Shield size={12} color="#E2B714" style={{ marginTop: 2 }} />
                            <Text style={{ color: colors.text, fontSize: 12, flex: 1 }}>
                              {ev.message}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Detailed Timeline Steps */}
                  <View>
                    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 12 }}>
                      Planner Timeline Audit Log
                    </Text>
                    <View style={styles.auditTimeline}>
                      {runDetail.steps.map((step: any, idx: number) => {
                        const isExpanded = expandedStepId === step.id
                        let title = step.type.toUpperCase()
                        let msg = ''
                        
                        if (step.type === 'reasoning') {
                          title = step.content.role === 'user' ? 'User Prompt' : 'AI Reasoning'
                          msg = step.content.text || ''
                        } else if (step.type === 'plan') {
                          title = 'Plan Checklist Prepared'
                          msg = step.content.items ? step.content.items.map((it: string) => `✓ ${it}`).join('\n') : step.content.plan || ''
                        } else if (step.type === 'tool_call') {
                          title = `Tool Invocation: ${step.content.name}`
                          msg = JSON.stringify(step.content.args, null, 2)
                        } else if (step.type === 'tool_result') {
                          title = `Tool Response: ${step.content.name}`
                          msg = JSON.stringify(step.content.response, null, 2)
                        } else if (step.type === 'error') {
                          title = 'Execution Error'
                          msg = step.content.message || ''
                        }

                        return (
                          <View key={step.id} style={styles.auditStep}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setExpandedStepId(isExpanded ? null : step.id)}
                              style={styles.auditStepHeader}
                            >
                              <Sparkles size={11} color={step.type === 'error' ? '#EB5757' : '#8250DF'} style={{ marginRight: 6 }} />
                              <Text style={[styles.auditStepTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }]}>
                                {title}
                              </Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 10, marginLeft: 8 }}>
                                Step {step.step_index}
                              </Text>
                              {msg && (isExpanded ? <ChevronUp size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />)}
                            </TouchableOpacity>

                            {isExpanded && msg && (
                              <View style={styles.auditStepContent}>
                                <Markdown style={mdStyles}>{msg}</Markdown>
                              </View>
                            )}
                          </View>
                        )
                      })}
                    </View>
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
})
