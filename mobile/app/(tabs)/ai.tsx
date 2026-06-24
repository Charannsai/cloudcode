import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Keyboard, Share, Alert, Modal,
  Animated, Easing, TouchableWithoutFeedback
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  Sparkles, ArrowUp, Trash2, Bot, User, FileCode, Terminal, Loader,
  CheckCircle2, AlertCircle, Wrench, FolderTree, Bug, Package, ArrowLeft, Copy, Share as ShareIcon,
  ChevronDown, ChevronUp, Cpu, Shield, Lock, History, Plus, ChevronRight, Play, X
} from 'lucide-react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import { useAgentStore, PlanItem, ReasoningEvent, AgentRun } from '@/store/agentStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import * as Clipboard from 'expo-clipboard'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function AIScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const {
    activeRun, runsList, isStreaming, plan, timeline, logs, pendingApproval,
    setActiveProject, loadRuns, startNewRun, resumeRun, approvePending, clearActiveRun
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
  
  const [projectSelectorVisible, setProjectSelectorVisible] = useState(false)
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false)
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null)

  // Sync projects and past runs on focus
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisible(false)
      fetchProjects(true)
      loadRuns(selectedProjectId === 'global' ? undefined : selectedProjectId)

      return () => {
        setTabBarVisible(true)
      }
    }, [selectedProjectId])
  )

  // Auto-scroll console logs and main timeline
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
    
    await startNewRun(
      selectedProjectId === 'global' ? null : selectedProjectId,
      selectedModel,
      prompt
    )
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

  // Markdown rendering configurations
  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    heading1: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 8, marginBottom: 2, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 2, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#161B22' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 8, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 2, marginBottom: 2 },
  }

  return (
    <TabGenieWrapper index={3}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ========================================================= */}
        {/* VIEW A: RUN SELECTOR / CREATION VIEW                      */}
        {/* ========================================================= */}
        {!activeRun ? (
          <View style={styles.contentWrapper}>
            {/* Minimal Premium Header */}
            <View style={[styles.headerRow, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color={isDark ? '#D2A8FF' : '#8250DF'} />
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  CloudCode AI Agent
                </Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {/* Context Picker Cards */}
              <View style={styles.selectorGrid}>
                {/* Project selector */}
                <TouchableOpacity
                  style={[styles.selectorCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}
                  onPress={() => setProjectSelectorVisible(true)}
                >
                  <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Workspace Context</Text>
                  <View style={styles.selectorValueRow}>
                    <Bot size={14} color={colors.primary} />
                    <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
                      {selectedProjectId === 'global' ? 'Global Assistant' : projects.find(p => p.id === selectedProjectId)?.name || 'Select Workspace'}
                    </Text>
                    <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>

                {/* Model selector */}
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

              {/* History / Past Runs Section */}
              <View style={{ marginTop: 24 }}>
                <View style={styles.sectionHeader}>
                  <History size={16} color={colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                    Active & Past Runs
                  </Text>
                </View>

                {runsList.length === 0 ? (
                  <View style={[styles.emptyHistoryBox, { borderColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                    <Bot size={28} color={isDark ? '#30363D' : '#8B929A'} style={{ marginBottom: 8 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                      No active agent runs found for this context. Use the prompt below to spawn one.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.runsListContainer}>
                    {runsList.slice(0, 5).map((run) => (
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

            {/* Input Spawner area */}
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.spawnerInput, { color: colors.text }]}
                    placeholder="Describe a goal (e.g. 'Build a React dashboard with Chart.js')"
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
                    <Text style={[styles.spawnBtnText, { color: inputText.trim() ? '#FFFFFF' : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                      Spawn Agent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        ) : (
          /* ========================================================= */
          /* VIEW B: AUTONOMOUS AGENT DASHBOARD VIEW                    */
          /* ========================================================= */
          <View style={styles.contentWrapper}>
            {/* Active Run Header */}
            <View style={[styles.headerRow, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}>
              <TouchableOpacity onPress={clearActiveRun} style={styles.backBtn}>
                <ArrowLeft size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.runHeaderId, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                    RUN #{formatRunId(activeRun.id)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeRun.status) + '1A' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(activeRun.status), fontFamily: 'Inter_700Bold' }]}>
                      {activeRun.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.runHeaderMeta, { color: colors.textSecondary }]}>
                  Model: {activeRun.model.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Dashboard Scrollable Body */}
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 12, gap: 16 }}
            >
              {/* 1. Resource Ledger & Meters */}
              <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  Resource Governance Ledger
                </Text>
                <View style={styles.ledgerGrid}>
                  {/* Tokens */}
                  <View style={styles.ledgerItem}>
                    <View style={styles.ledgerMetaRow}>
                      <Text style={[styles.ledgerLabel, { color: colors.textSecondary }]}>AI Budget Tokens</Text>
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
                      <Text style={[styles.ledgerLabel, { color: colors.textSecondary }]}>Command Executions</Text>
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

              {/* 2. Checklist Plan Planner */}
              {plan.length > 0 && (
                <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                    Execution Roadmap
                  </Text>
                  <View style={styles.planList}>
                    {plan.map((item, idx) => (
                      <View key={idx} style={styles.planItemRow}>
                        {item.status === 'completed' && <CheckCircle2 size={15} color="#3FB950" />}
                        {item.status === 'running' && <ActivityIndicator size="small" color="#2F80ED" style={{ width: 15, height: 15 }} />}
                        {item.status === 'pending' && <Loader size={15} color={colors.textSecondary} />}
                        {item.status === 'failed' && <AlertCircle size={15} color="#EB5757" />}
                        <Text style={[
                          styles.planItemLabel,
                          {
                            color: item.status === 'completed' ? colors.textSecondary : colors.text,
                            textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
                            fontFamily: item.status === 'running' ? 'Inter_600SemiBold' : 'Inter_400Regular'
                          }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 3. Progressive Reasoning Timeline */}
              {timeline.length > 0 && (
                <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#21262D' : '#D8DEE4' }]}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                    Agent Timeline & Reasoning
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
                            <Sparkles size={12} color={event.title === 'User Prompt' ? '#9B51E0' : '#8250DF'} style={{ marginRight: 6 }} />
                            <Text style={[styles.timelineEventTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                              {event.title}
                            </Text>
                            {event.message && (isExpanded ? <ChevronUp size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />)}
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

              {/* 4. Live Console Terminal Card */}
              {logs.length > 0 && (
                <View style={[styles.consoleCard, { borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                  <View style={styles.consoleHeader}>
                    <Terminal size={14} color="#58A6FF" />
                    <Text style={styles.consoleTitle}>Live Monospace Output</Text>
                    {isStreaming && <ActivityIndicator size="small" color="#58A6FF" style={{ marginLeft: 'auto' }} />}
                  </View>
                  <ScrollView
                    ref={consoleScrollRef}
                    style={styles.consoleScroll}
                    contentContainerStyle={{ padding: 8 }}
                    nestedScrollEnabled
                  >
                    <Text style={styles.consoleText}>
                      {logs.join('')}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            {/* Approvals Popup Modal Card (Placed directly next to input area) */}
            {pendingApproval && (
              <View style={[styles.approvalFloatingCard, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: '#E2B714' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Shield size={14} color="#E2B714" />
                  <Text style={[styles.approvalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                    Permission Required
                  </Text>
                </View>
                <Text style={[styles.approvalPromptText, { color: colors.textSecondary }]}>
                  The agent wants to run the following terminal command:
                </Text>
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

            {/* Footer Input Area to Continue / Follow-up */}
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[styles.spawnerInputContainer, { borderTopColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                {isStreaming ? (
                  <View style={styles.streamingLoaderBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 8 }}>
                      Agent is executing plan steps...
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.spawnerInputBox, { backgroundColor: isDark ? '#161B22' : '#F6F8FA', borderColor: isDark ? '#30363D' : '#D1D5DB' }]}>
                    <TextInput
                      ref={inputRef}
                      style={[styles.spawnerInput, { color: colors.text }]}
                      placeholder={activeRun.status === 'completed' ? "Run finished. Type follow-up..." : "Provide guidance or prompt..."}
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
                      <ArrowUp size={16} color={inputText.trim() ? '#FFFFFF' : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}

        {/* Workspace Selector Modal */}
        <Modal
          visible={projectSelectorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProjectSelectorVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setProjectSelectorVisible(false)}
          >
            <View style={[styles.selectorDropdownCard, { backgroundColor: isDark ? '#161B22' : '#FFFFFF', borderColor: isDark ? '#30363D' : '#E5E7EB' }]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Workspace Context</Text>
                <TouchableOpacity onPress={() => setProjectSelectorVisible(false)}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}
                onPress={() => {
                  setSelectedProjectId('global')
                  setProjectSelectorVisible(false)
                }}
              >
                <Bot size={14} color={colors.primary} />
                <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedProjectId === 'global' ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  Global Assistant (No workspace context)
                </Text>
              </TouchableOpacity>

              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.dropdownItem, { borderBottomColor: isDark ? '#21262D' : '#E5E7EB' }]}
                  onPress={() => {
                    setSelectedProjectId(p.id)
                    setProjectSelectorVisible(false)
                  }}
                >
                  <FileCode size={14} color={colors.textSecondary} />
                  <Text style={[styles.dropdownItemText, { color: colors.text, fontFamily: selectedProjectId === p.id ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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
                  Claude 3.6 Opus (Advanced code synthesis)
                </Text>
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
  contentWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
  },
  backBtn: {
    padding: 4,
  },
  runHeaderId: {
    fontSize: 16,
  },
  runHeaderMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectorValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
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
  emptyHistoryBox: {
    padding: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  runsListContainer: {
    gap: 8,
  },
  runListItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  runListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  runListId: {
    fontSize: 13,
  },
  miniStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniStatusText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },
  runListMeta: {
    fontSize: 11,
    paddingRight: 20,
  },
  runListArrow: {
    position: 'absolute',
    right: 12,
    top: 20,
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
  spawnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  spawnBtnText: {
    fontSize: 12,
  },
  dashboardCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    marginBottom: 10,
  },
  ledgerGrid: {
    gap: 12,
  },
  ledgerItem: {
    gap: 4,
  },
  ledgerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerLabel: {
    fontSize: 11,
  },
  ledgerVal: {
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
  planList: {
    gap: 8,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planItemLabel: {
    fontSize: 13,
    flex: 1,
  },
  timelineList: {
    gap: 8,
  },
  timelineItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#30363D',
    paddingBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineEventTitle: {
    fontSize: 13,
  },
  timelineContent: {
    marginTop: 6,
    paddingLeft: 18,
  },
  consoleCard: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    borderWidth: 1,
    height: 180,
    overflow: 'hidden',
  },
  consoleHeader: {
    backgroundColor: '#161B22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  consoleTitle: {
    color: '#8B929A',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  consoleScroll: {
    flex: 1,
  },
  consoleText: {
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
  },
  streamingLoaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  approvalFloatingCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  approvalTitle: {
    fontSize: 14,
  },
  approvalPromptText: {
    fontSize: 12,
    marginBottom: 8,
  },
  approvalCommandBox: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  approvalCommandText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
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
    maxHeight: '60%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
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
