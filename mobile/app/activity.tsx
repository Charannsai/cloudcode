import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, Platform, Dimensions, Alert, Animated, Easing, TouchableWithoutFeedback
} from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import {
  ArrowLeft, Cpu, Folder, History, CheckCircle2, AlertCircle,
  Clock, ChevronDown, Sparkles, X, MoreVertical
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
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
  
  const { runsList, loadRuns, deleteRuns, activeProjectId } = useAgentStore()
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null)
  const [loadingResources, setLoadingResources] = useState(true)
  const [isByokActive, setIsByokActive] = useState(false)
  
  // Detail Modal state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // New Selection & Pagination State
  const [visibleCount, setVisibleCount] = useState(5)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set())
  const [activeMenuRunId, setActiveMenuRunId] = useState<string | null>(null)

  // Skeleton shimmer animation
  const shimmerTranslate = useRef(new Animated.Value(-150)).current

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null
    if (loadingResources) {
      anim = Animated.loop(
        Animated.timing(shimmerTranslate, {
          toValue: 350,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      anim.start()
    } else {
      shimmerTranslate.setValue(-150)
    }
    return () => {
      anim?.stop()
    }
  }, [loadingResources])
  
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

  const handleDeleteSingle = (runId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to clear this conversation history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRuns([runId])
              if (runsList.length <= 6) {
                setVisibleCount(5)
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete conversation.')
            }
          }
        }
      ]
    )
  }

  const handleBulkDelete = () => {
    if (selectedRunIds.size === 0) return
    Alert.alert(
      'Delete Selected Chats',
      `Are you sure you want to delete the ${selectedRunIds.size} selected conversations? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRuns(Array.from(selectedRunIds))
              setSelectedRunIds(new Set())
              setIsSelectionMode(false)
              setVisibleCount(5)
            } catch (e) {
              Alert.alert('Error', 'Failed to delete conversations.')
            }
          }
        }
      ]
    )
  }

  const handleToggleSelectAll = () => {
    const visibleRuns = runsList.slice(0, visibleCount)
    const allSelected = visibleRuns.every(r => selectedRunIds.has(r.id))
    
    const newSelected = new Set(selectedRunIds)
    if (allSelected) {
      visibleRuns.forEach(r => newSelected.delete(r.id))
    } else {
      visibleRuns.forEach(r => newSelected.add(r.id))
    }
    setSelectedRunIds(newSelected)
  }

  const handleCancelSelection = () => {
    setSelectedRunIds(new Set())
    setIsSelectionMode(false)
  }

  const getConversationTitle = (run: any) => {
    const firstStep = run.agent_steps?.[0]
    const firstPrompt = firstStep?.content?.text || firstStep?.content?.message || ''
    if (firstPrompt) {
      const cleanPrompt = firstPrompt
        .replace(/\[Project files:[\s\S]*?\]\n*/g, '')
        .replace(/\[Currently open file:[\s\S]*?\]\n*/g, '')
        .trim()
      return cleanPrompt.length > 32 ? cleanPrompt.substring(0, 30).trim() + '...' : cleanPrompt
    }
    const modelLabel = run.model === 'gemini' ? 'Gemini' : run.model === 'openai' ? 'GPT-4o' : 'Claude'
    return `${modelLabel} Chat Session`
  }

  const formatTokens = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const renderQuotaSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={[styles.skeletonText, { width: 120, height: 14, backgroundColor: isDark ? '#21262D' : '#E1E4E8', borderRadius: 4 }]} />
          <View style={[styles.skeletonText, { width: 60, height: 14, backgroundColor: isDark ? '#21262D' : '#E1E4E8', borderRadius: 4 }]} />
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#21262D' : '#E1E4E8', overflow: 'hidden' }]}>
          <Animated.View
            style={{
              width: 150,
              height: '100%',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              transform: [{ translateX: shimmerTranslate }],
            }}
          />
        </View>
      </View>
    )
  }

  const mdStyles = {
    body: { color: isDark ? '#E6EDF3' : '#1F2328', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
    heading1: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    heading2: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 8, marginBottom: 4, color: isDark ? '#F3F4F6' : '#0E1116' },
    code_inline: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#1C2128' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 4 },
    fence: { fontFamily: 'JetBrainsMono_400Regular', backgroundColor: isDark ? '#0D1117' : '#F6F8FA', color: isDark ? '#E6EDF3' : '#0E1116', fontSize: 11, padding: 8, borderRadius: 6, overflow: 'hidden' as const, marginVertical: 4, borderWidth: 1, borderColor: isDark ? '#21262D' : '#D8DEE4' },
    paragraph: { marginTop: 4, marginBottom: 4 },
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0E1116' : '#F6F8FA', paddingTop: insets.top }]}>
      {/* Glowing Radial Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="radialGrad"
              cx="50%"
              cy="0%"
              rx="70%"
              ry="60%"
              fx="50%"
              fy="0%"
            >
              <Stop offset="0%" stopColor={isDark ? '#1C2030' : '#E0E7FF'} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={isDark ? '#0E1116' : '#F6F8FA'} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#radialGrad)" />
        </Svg>
      </View>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#21262D' : '#D8DEE4' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
          Activity & Governance
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* 1. Conversation History (HISTORY FIRST) */}
        <View style={{ minHeight: 200 }}>
          <View style={styles.sectionHeader}>
            <History size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }]}>
              Conversation History
            </Text>
          </View>

          {/* Selection Mode Bar */}
          {isSelectionMode && (
            <View style={[
              styles.selectionBar,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                backgroundColor: isDark ? 'rgba(21, 25, 34, 0.9)' : 'rgba(255, 255, 255, 0.95)'
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={handleToggleSelectAll} style={styles.selectionBarBtn} activeOpacity={0.7}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 12.5 }}>
                    {runsList.slice(0, visibleCount).every(r => selectedRunIds.has(r.id)) ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <View style={[styles.dividerVertical, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
                  {selectedRunIds.size} selected
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {selectedRunIds.size > 0 && (
                  <TouchableOpacity onPress={handleBulkDelete} style={styles.selectionBarBtn} activeOpacity={0.7}>
                    <Text style={{ color: '#FF7B72', fontFamily: 'Inter_700Bold', fontSize: 12.5 }}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleCancelSelection} style={styles.selectionBarBtn} activeOpacity={0.7}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 12.5 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {runsList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: isDark ? '#21262D' : '#D8DEE4', backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
                No past conversations found.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {runsList.slice(0, visibleCount).map((run) => {
                const isSelected = selectedRunIds.has(run.id)
                const chatTitle = getConversationTitle(run)
                const isMenuOpen = activeMenuRunId === run.id

                return (
                  <View key={run.id} style={{ zIndex: isMenuOpen ? 100 : 1 }}>
                    <TouchableOpacity
                      style={[
                        styles.runItem,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                          borderColor: isSelected
                            ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')
                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                          borderWidth: isSelected ? 1.5 : 1,
                          borderRadius: 12,
                          padding: 14,
                        }
                      ]}
                      onPress={() => {
                        if (isSelectionMode) {
                          const newSelected = new Set(selectedRunIds)
                          if (newSelected.has(run.id)) {
                            newSelected.delete(run.id)
                          } else {
                            newSelected.add(run.id)
                          }
                          setSelectedRunIds(newSelected)
                        } else {
                          handleOpenRunDetail(run.id)
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        {isSelectionMode ? (
                          <View style={[
                            styles.checkboxCircle,
                            {
                              borderColor: isSelected ? colors.text : (isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)'),
                              backgroundColor: isSelected ? colors.text : 'transparent'
                            }
                          ]}>
                            {isSelected && <X size={10} color={isDark ? '#0E1116' : '#FFFFFF'} />}
                          </View>
                        ) : (
                          <View style={[styles.runAvatarCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <Clock size={16} color={colors.textSecondary} />
                          </View>
                        )}
                        
                        <View style={{ flex: 1 }}>
                          <View style={styles.runHeaderRow}>
                            <Text style={[styles.runTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }]} numberOfLines={1}>
                              {chatTitle}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                              {new Date(run.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={[styles.runMetaText, { color: colors.textSecondary, marginTop: 2, fontFamily: 'Inter_500Medium', fontSize: 11.5 }]}>
                            Model: {run.model === 'gemini' ? 'Gemini' : run.model === 'openai' ? 'GPT-4o' : 'Claude'} • {run.tokens_used.toLocaleString()} tokens
                          </Text>
                        </View>

                        {!isSelectionMode && (
                          <TouchableOpacity
                            onPress={() => setActiveMenuRunId(isMenuOpen ? null : run.id)}
                            style={{ padding: 4 }}
                          >
                            <MoreVertical size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Inline Glassmorphic Action Dropdown */}
                    {isMenuOpen && (
                      <>
                        <TouchableWithoutFeedback onPress={() => setActiveMenuRunId(null)}>
                          <View style={styles.dropdownBackdrop} />
                        </TouchableWithoutFeedback>
                        <BlurView
                          intensity={Platform.OS === 'ios' ? 75 : 100}
                          tint={isDark ? 'dark' : 'light'}
                          style={[
                            styles.inlineDropdownCard,
                            {
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                              backgroundColor: isDark ? 'rgba(21, 25, 34, 0.9)' : 'rgba(255, 255, 255, 0.92)'
                            }
                          ]}
                        >
                          <TouchableOpacity
                            style={[styles.dropdownRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                            onPress={() => {
                              setActiveMenuRunId(null)
                              handleResumeRun(run.id)
                            }}
                          >
                            <Text style={[styles.dropdownLabel, { color: colors.text }]}>Open Convo</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.dropdownRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                            onPress={() => {
                              setActiveMenuRunId(null)
                              setIsSelectionMode(true)
                              setSelectedRunIds(new Set([run.id]))
                            }}
                          >
                            <Text style={[styles.dropdownLabel, { color: colors.text }]}>Select Convo</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dropdownRow}
                            onPress={() => {
                              setActiveMenuRunId(null)
                              handleDeleteSingle(run.id)
                            }}
                          >
                            <Text style={[styles.dropdownLabel, { color: '#FF7B72' }]}>Clear Convo</Text>
                          </TouchableOpacity>
                        </BlurView>
                      </>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Faded pagination button */}
          {runsList.length > visibleCount && (
            <View style={styles.paginationContainer}>
              <Svg style={styles.fadeOverlay} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="fadeOverlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={isDark ? '#0E1116' : '#F6F8FA'} stopOpacity="0" />
                    <Stop offset="100%" stopColor={isDark ? '#0E1116' : '#F6F8FA'} stopOpacity="0.98" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#fadeOverlayGrad)" />
              </Svg>
              <TouchableOpacity
                style={[
                  styles.showMoreBtn,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    backgroundColor: isDark ? 'rgba(21,25,34,0.85)' : 'rgba(255,255,255,0.9)'
                  }
                ]}
                onPress={() => setVisibleCount(prev => prev + 5)}
                activeOpacity={0.8}
              >
                <Text style={[styles.showMoreText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  Show More
                </Text>
                <ChevronDown size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. Plan & Quota Limits (QUOTA LIMITS SECOND, AT THE BOTTOM) */}
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            borderWidth: 1,
            borderRadius: 16,
            padding: 18,
            marginTop: 8,
          }
        ]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }]}>
              Plan & Quota Limits
            </Text>
            {isByokActive && (
              <View style={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#3FB950', fontSize: 10, fontFamily: 'Inter_700Bold' }}>BYOK Active</Text>
              </View>
            )}
          </View>

          {loadingResources || !billingStats ? (
            renderQuotaSkeleton()
          ) : (
            <View style={styles.metersList}>
              {/* Tokens - SLEEK DARK ACCENTS (NO BLUE) */}
              <View style={styles.meterItem}>
                <View style={styles.meterHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Cpu size={15} color={isDark ? '#E6EDF3' : '#24292E'} />
                    <Text style={[styles.meterLabel, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>AI Monthly Tokens</Text>
                  </View>
                  <Text style={[styles.meterVal, { color: colors.text, fontFamily: 'JetBrainsMono_700Bold' }]}>
                    {formatTokens(billingStats.tokensUsed)} / {formatTokens(billingStats.tokensLimit)}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#21262D' : '#E1E4E8' }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: isDark ? '#8B929A' : '#24292E',
                      width: `${Math.min(100, (billingStats.tokensUsed / billingStats.tokensLimit) * 100)}%`
                    }
                  ]} />
                </View>
              </View>
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
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 100}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? 'rgba(14, 17, 22, 0.95)' : 'rgba(255, 255, 255, 0.97)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                borderWidth: 1,
              }
            ]}
          >
            {loadingDetail || !runDetail ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontFamily: 'Inter_500Medium' }}>Loading conversation history...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }]}>
                      {getConversationTitle(runDetail.run)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontFamily: 'Inter_500Medium', marginTop: 2 }}>
                      Model: {runDetail.run.model === 'gemini' ? 'Gemini' : runDetail.run.model === 'openai' ? 'GPT-4o' : 'Claude'} • Status: {runDetail.run.status}
                    </Text>
                  </View>
                  
                  {/* Resume Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.text,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 14,
                      marginRight: 10
                    }}
                    onPress={() => {
                      setSelectedRunId(null)
                      handleResumeRun(runDetail.run.id)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isDark ? '#0E1116' : '#FFFFFF', fontSize: 11.5, fontFamily: 'Inter_700Bold' }}>Resume</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setSelectedRunId(null)} style={styles.closeBtn} activeOpacity={0.7}>
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Scroll Content */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
                  <View style={{ gap: 20 }}>
                    {runDetail.steps
                      .filter((step: any) => step.type === 'reasoning')
                      .map((step: any) => {
                        const isUser = step.content.role === 'user'
                        const msgText = step.content.text || step.content.message || ''
                        if (!msgText) return null

                        return (
                          <View key={step.id} style={isUser ? styles.userBubbleWrapper : styles.modelBubbleWrapper}>
                            <View style={isUser ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderWidth: 1 }] : [styles.modelBubble, { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, paddingVertical: 4, maxWidth: '100%' }]}>
                              {isUser ? (
                                <Text style={[styles.userBubbleText, { color: colors.text }]}>
                                  {msgText}
                                </Text>
                              ) : (
                                <View style={{ width: '100%' }}>
                                  <Markdown style={mdStyles}>
                                    {msgText}
                                  </Markdown>
                                </View>
                              )}
                            </View>
                          </View>
                        )
                      })}
                  </View>
                </ScrollView>
              </View>
            )}
          </BlurView>
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
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
    fontSize: 12.5,
  },
  meterVal: {
    fontSize: 12.5,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  runItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runTitle: {
    fontSize: 13,
  },
  runMetaText: {
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
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
    padding: 6,
  },
  userBubbleWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  modelBubbleWrapper: {
    width: '100%',
  },
  userBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 2,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  modelBubble: {
    borderRadius: 16,
    padding: 16,
    maxWidth: SCREEN_WIDTH * 0.8,
    borderBottomLeftRadius: 2,
  },
  userBubbleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },

  // New Selection Styles
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectionBarBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dividerVertical: {
    width: 1,
    height: 14,
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },

  // Dropdown Styles
  dropdownBackdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
  },
  inlineDropdownCard: {
    position: 'absolute',
    right: 14,
    top: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  dropdownRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownLabel: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
  },

  // Pagination Styles
  paginationContainer: {
    height: 85,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: -40,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 12.5,
  },

  // Skeleton Styles
  skeletonContainer: {
    paddingVertical: 4,
  },
  skeletonText: {
    backgroundColor: 'transparent',
  },
})
