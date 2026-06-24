import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Alert, Modal,
  TouchableWithoutFeedback
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal, Loader,
  CheckCircle2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon,
  ChevronDown, ChevronUp, Cpu, Shield, Lock, History, Plus, ChevronRight, Play, X
} from 'lucide-react-native'

import { useAuthStore } from '@/store/auth'
import { useAgentStore, PlanItem, ReasoningEvent, AgentRun } from '@/store/agentStore'
import { useProjectsStore } from '@/store/projects'
import { api } from '@/lib/api'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'

interface Props {
  projectId: string
}

export default function AITab({ projectId }: Props) {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const {
    activeRun, runsList, isStreaming, plan, timeline, logs, pendingApproval,
    setActiveProject, loadRuns, startNewRun, resumeRun, approvePending, clearActiveRun
  } = useAgentStore()

  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('gemini')
  
  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)
  const consoleScrollRef = useRef<ScrollView>(null)
  
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null)

  // Sync project context and runs list on mount / project change
  useEffect(() => {
    setActiveProject(projectId)
  }, [projectId])

  // Auto-scroll logs and main timeline
  useEffect(() => {
    setTimeout(() => {
      consoleScrollRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [logs])

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 200)
  }, [timeline, plan])

  const handleSpawnAgent = async () => {
    if (!inputText.trim() || isStreaming) return
    const prompt = inputText.trim()
    setInputText('')
    Keyboard.dismiss()
    
    await startNewRun(projectId, selectedModel, prompt)
  }

  const handleFollowUp = async () => {
    if (!inputText.trim() || isStreaming || !activeRun) return
    const prompt = inputText.trim()
    setInputText('')
    Keyboard.dismiss()

    await resumeRun(activeRun.id, prompt)
  }

  const formatRunId = (id: string) => {
    return id.substring(0, 8).toUpperCase()
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

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    heading1: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 8, marginBottom: 2, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 2, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 8, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 2, marginBottom: 2 },
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ========================================================= */}
      {/* VIEW A: RUN CREATOR / PROJECT HISTORY                     */}
      {/* ========================================================= */}
      {!activeRun ? (
        <View style={styles.contentWrapper}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Context and Model selector row */}
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={[styles.selectorCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                onPress={() => setModelSelectorVisible(true)}
              >
                <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>LLM Model</Text>
                <View style={styles.selectorValueRow}>
                  <Cpu size={14} color="#3FB950" />
                  <Text style={[styles.selectorValue, { color: colors.text }]}>
                    {selectedModel === 'gemini' ? 'Gemini 3 Flash' : selectedModel === 'openai' ? 'GPT-4o' : 'Claude 3.6 Opus'}
                  </Text>
                  <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Project Past Runs */}
            <View style={{ marginTop: 20 }}>
              <View style={styles.sectionHeader}>
                <History size={16} color={colors.textSecondary} />
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  Project Agent Runs
                </Text>
              </View>

              {runsList.length === 0 ? (
                <View style={[styles.emptyHistoryBox, { borderColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                  <Bot size={28} color={isDark ? '#30363D' : '#8B929A'} style={{ marginBottom: 8 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                    No active agent runs for this project. Use the prompt below to spawn one.
                  </Text>
                </View>
              ) : (
                <View style={styles.runsListContainer}>
                  {runsList.map((run) => (
                    <TouchableOpacity
                      key={run.id}
                      style={[styles.runListItem, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                      onPress={() => resumeRun(run.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.runListHeader}>
                        <Text style={[styles.runListId, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                          RUN #{formatRunId(run.id)}
                        </Text>
                        <View style={[styles.miniStatusBadge, { backgroundColor: getStatusColor(run.status) + '1A' }]}>
                          <Text style={[styles.miniStatusText, { color: getStatusColor(run.status) }]}>
                            {run.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.runListMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        Model: {run.model} • Commands: {run.commands_run}/{run.budget_commands} • Tokens: {run.tokens_used.toLocaleString()}
                      </Text>
                      <ChevronRight size={14} color={colors.textSecondary} style={styles.runListArrow} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Prompt spawner area - tap container to focus text input */}
          <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
            <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.spawnerInput, { color: colors.text }]}
                  placeholder="Task for the agent (e.g., 'Fix the styling in index.css')"
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.spawnBtn, { backgroundColor: inputText.trim() ? colors.primary : (isDark ? '#21262D' : '#E1E4E8') }]}
                  onPress={handleSpawnAgent}
                  disabled={!inputText.trim()}
                >
                  <Play size={14} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      ) : (
        /* ========================================================= */
        /* VIEW B: ACTIVE PROJECT AGENT DASHBOARD                    */
        /* ========================================================= */
        <View style={styles.contentWrapper}>
          {/* Dashboard Subheader */}
          <View style={[styles.subheaderRow, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
            <TouchableOpacity onPress={clearActiveRun} style={styles.backBtn}>
              <ArrowLeft size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.runHeaderId, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
              RUN #{formatRunId(activeRun.id)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeRun.status) + '1A', marginLeft: 8 }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(activeRun.status), fontFamily: 'Inter_700Bold' }]}>
                {activeRun.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, gap: 12 }}
          >
            {/* Resource Ledger */}
            <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
              <View style={styles.ledgerGrid}>
                {/* Tokens */}
                <View style={styles.ledgerItem}>
                  <View style={styles.ledgerMetaRow}>
                    <Text style={[styles.ledgerLabel, { color: colors.textSecondary }]}>Tokens Budget</Text>
                    <Text style={[styles.ledgerVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                      {activeRun.tokens_used.toLocaleString()} / {activeRun.budget_tokens.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}>
                    <View style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#2F80ED',
                        width: `${Math.min(100, (activeRun.tokens_used / activeRun.budget_tokens) * 100)}%`
                      }
                    ]} />
                  </View>
                </View>

                {/* Commands */}
                <View style={styles.ledgerItem}>
                  <View style={styles.ledgerMetaRow}>
                    <Text style={[styles.ledgerLabel, { color: colors.textSecondary }]}>Commands Budget</Text>
                    <Text style={[styles.ledgerVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                      {activeRun.commands_run} / {activeRun.budget_commands}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#30363D' : '#E1E4E8' }]}>
                    <View style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#F2C94C',
                        width: `${Math.min(100, (activeRun.commands_run / activeRun.budget_commands) * 100)}%`
                      }
                    ]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Road Map Checklist */}
            {plan.length > 0 && (
              <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  Plan Roadmap
                </Text>
                <View style={styles.planList}>
                  {plan.map((item, idx) => (
                    <View key={idx} style={styles.planItemRow}>
                      {item.status === 'completed' && <CheckCircle2 size={14} color="#3FB950" />}
                      {item.status === 'running' && <ActivityIndicator size="small" color="#2F80ED" style={{ width: 14, height: 14 }} />}
                      {item.status === 'pending' && <Loader size={14} color={colors.textSecondary} />}
                      {item.status === 'failed' && <AlertCircle size={14} color="#EB5757" />}
                      <Text style={[
                        styles.planItemLabel,
                        {
                          color: item.status === 'completed' ? colors.textSecondary : colors.text,
                          textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
                          fontSize: 12
                        }
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reasoning Timeline */}
            {timeline.length > 0 && (
              <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  Timeline & Reasoning
                </Text>
                <View style={styles.timelineList}>
                  {timeline.map((event) => {
                    const isExpanded = expandedTimelineId === event.id
                    return (
                      <View key={event.id} style={styles.timelineItem}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setExpandedTimelineId(isExpanded ? null : event.id)}
                          style={styles.timelineHeader}
                        >
                          <Sparkles size={11} color={event.title === 'User Prompt' ? '#9B51E0' : '#8250DF'} style={{ marginRight: 6 }} />
                          <Text style={[styles.timelineEventTitle, { color: colors.text, fontSize: 12, fontFamily: 'Inter_600SemiBold' }]}>
                            {event.title}
                          </Text>
                          {event.message && (isExpanded ? <ChevronUp size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />)}
                        </TouchableOpacity>
                        
                        {isExpanded && event.message && (
                          <View style={styles.timelineContent}>
                            <Markdown style={mdStyles}>{event.message}</Markdown>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Live Terminal Log Console */}
            {logs.length > 0 && (
              <View style={[styles.consoleCard, { borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                <View style={styles.consoleHeader}>
                  <Terminal size={12} color="#58A6FF" />
                  <Text style={styles.consoleTitle}>Console Log Output</Text>
                  {isStreaming && <ActivityIndicator size="small" color="#58A6FF" style={{ marginLeft: 'auto' }} />}
                </View>
                <ScrollView
                  ref={consoleScrollRef}
                  style={styles.consoleScroll}
                  contentContainerStyle={{ padding: 6 }}
                  nestedScrollEnabled
                >
                  <Text style={styles.consoleText}>
                    {logs.join('')}
                  </Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Action Approval Card */}
          {pendingApproval && (
            <View style={[styles.approvalFloatingCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: '#E2B714' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={13} color="#E2B714" />
                <Text style={[styles.approvalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13 }]}>
                  Command Approval Required
                </Text>
              </View>
              <View style={[styles.approvalCommandBox, { backgroundColor: isDark ? '#0D1117' : '#E1E4E8' }]}>
                <Text style={styles.approvalCommandText}>
                  $ {pendingApproval.command}
                </Text>
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

          {/* Footer Input for active run - tap container to focus text input */}
          <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
            <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              {isStreaming ? (
                <View style={styles.streamingLoaderBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
                    Agent executing project roadmap...
                  </Text>
                </View>
              ) : (
                <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.spawnerInput, { color: colors.text }]}
                    placeholder={activeRun.status === 'completed' ? "Run finished. Type follow-up..." : "Send guidelines/instructions..."}
                    placeholderTextColor={colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={[styles.spawnBtn, { backgroundColor: inputText.trim() ? colors.primary : (isDark ? '#21262D' : '#E1E4E8') }]}
                    onPress={handleFollowUp}
                    disabled={!inputText.trim()}
                  >
                    <ArrowUp size={14} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

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
                Gemini 3 Flash (Resource-governed)
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
                GPT-4o (Premium reasoning)
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
                Claude 3.6 Opus (Code synthesis)
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
  contentWrapper: {
    flex: 1,
  },
  selectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectorCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectorValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
  },
  emptyHistoryBox: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  runsListContainer: {
    gap: 6,
  },
  runListItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  runListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  runListId: {
    fontSize: 12,
  },
  miniStatusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniStatusText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },
  runListMeta: {
    fontSize: 10,
    paddingRight: 20,
  },
  runListArrow: {
    position: 'absolute',
    right: 10,
    top: 16,
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
  spawnBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  runHeaderId: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9,
  },
  dashboardCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  ledgerGrid: {
    gap: 8,
  },
  ledgerItem: {
    gap: 2,
  },
  ledgerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerLabel: {
    fontSize: 10,
  },
  ledgerVal: {
    fontSize: 11,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  planList: {
    gap: 6,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planItemLabel: {
    flex: 1,
  },
  timelineList: {
    gap: 6,
  },
  timelineItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#30363D',
    paddingBottom: 6,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineEventTitle: {
    flex: 1,
  },
  timelineContent: {
    marginTop: 4,
    paddingLeft: 16,
  },
  consoleCard: {
    backgroundColor: '#0D1117',
    borderRadius: 6,
    borderWidth: 1,
    height: 140,
    overflow: 'hidden',
  },
  consoleHeader: {
    backgroundColor: '#161B22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  consoleTitle: {
    color: '#8B929A',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  consoleScroll: {
    flex: 1,
  },
  consoleText: {
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
  },
  streamingLoaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  approvalFloatingCard: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  approvalTitle: {
    flex: 1,
  },
  approvalCommandBox: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  approvalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
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
    maxHeight: '50%',
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
