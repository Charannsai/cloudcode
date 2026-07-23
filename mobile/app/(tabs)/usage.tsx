import { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, BackHandler,
} from 'react-native'
import Animated, {
  FadeInDown, SlideInRight, SlideOutRight,
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing,
} from 'react-native-reanimated'
import { useFocusEffect } from 'expo-router'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import {
  Cpu, HardDrive, Database, Server, Sparkles, Wifi, Shield,
  BarChart2, TrendingUp, Clock, ArrowLeft,
} from '@/components/HugeIconsShim'
import { api } from '@/lib/api'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function UsageScreen() {
  const { colors, isDark } = useAppTheme()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectsStore()
  const { setTabBarVisible, usageSubScreen, setUsageSubScreen } = useUIStore()
  const [isFocused, setIsFocused] = useState(false)

  const [billingData, setBillingData] = useState<any>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [billingDetailType, setBillingDetailType] = useState<'compute' | 'ram' | 'disk' | 'workspaces' | 'ai' | 'network' | 'api'>('compute')
  const [timelineFilter, setTimelineFilter] = useState<'1h' | '24h' | '3d' | '7d'>('24h')

  // Skeleton animation
  const skeletonOpacity = useSharedValue(0.35)
  useEffect(() => {
    skeletonOpacity.value = withRepeat(
      withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  function SkeletonBlock({ width, height, borderRadius = 8, style }: { width: any; height: number; borderRadius?: number; style?: any }) {
    const rStyle = useAnimatedStyle(() => ({
      opacity: skeletonOpacity.value
    }))
    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
          },
          rStyle,
          style
        ]}
      />
    )
  }

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true)
      return () => {
        setIsFocused(false)
      }
    }, [])
  )

  useEffect(() => {
    if (isFocused) {
      setTabBarVisible(usageSubScreen === 'main')
    }
  }, [usageSubScreen, isFocused, setTabBarVisible])

  // Back button handler for detail view
  useEffect(() => {
    const onBackPress = () => {
      if (usageSubScreen === 'detail') {
        setUsageSubScreen('main')
        return true
      }
      return false
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [usageSubScreen])

  async function fetchBillingStatus(silent = false) {
    const shouldShowLoader = !silent || !billingData
    if (shouldShowLoader) setLoadingBilling(true)
    try {
      const data = await api.billing.status()
      setBillingData(data)
    } catch (err) {
      console.warn('Failed to load billing status:', err)
    } finally {
      if (shouldShowLoader) setLoadingBilling(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchBillingStatus(true)
      fetchProjects(true)
      const interval = setInterval(() => {
        fetchBillingStatus(true)
        fetchProjects(true)
      }, 15000)
      return () => clearInterval(interval)
    }, [fetchProjects])
  )

  // ====== HELPER RENDERERS ======

  function renderMiniBarGraph(percent: number, activeColor: string, usedRaw?: number) {
    const isZero = usedRaw === 0 || percent === 0
    const heights = isZero ? [6, 6, 6, 6, 6, 6] : [25, 45, 60, 35, Math.max(10, percent * 0.7)]
    return (
      <View style={{ flexDirection: 'row', gap: 4, height: 20, alignItems: 'flex-end', marginTop: 6 }}>
        {heights.map((h, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: isZero ? 4 : `${h}%`,
              backgroundColor: isZero ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : (i === heights.length - 1 ? activeColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')),
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    )
  }

  function renderMiniRadialGauge(percent: number, activeColor: string) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor, opacity: Math.max(0.2, percent / 100) }} />
        </View>
        <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10 }}>
          {Math.round(percent)}% Load
        </Text>
      </View>
    )
  }

  function renderMiniStackBar(percent: number, activeColor: string) {
    const val1 = Math.min(percent, 70)
    const val2 = Math.min(100 - val1, 15)
    return (
      <View style={{ gap: 3, marginTop: 6 }}>
        <View style={{ height: 5, borderRadius: 2.5, overflow: 'hidden', flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <View style={{ width: `${val1}%`, backgroundColor: activeColor }} />
          <View style={{ width: `${val2}%`, backgroundColor: '#3B82F6', opacity: 0.7 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: 0.6 }}>
          <Text style={{ fontSize: 7, color: colors.textSecondary }}>sources</Text>
          <Text style={{ fontSize: 7, color: colors.textSecondary }}>cache</Text>
        </View>
      </View>
    )
  }

  function renderMiniNodeGrid(used: number, limit: number, activeColor: string) {
    return (
      <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap', marginTop: 6, height: 20, alignItems: 'center' }}>
        {Array.from({ length: limit }).map((_, i) => {
          const isRunning = i < used
          return (
            <View
              key={i}
              style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: isRunning ? activeColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                borderWidth: 1,
                borderColor: isRunning ? 'transparent' : colors.border
              }}
            />
          )
        })}
      </View>
    )
  }

  function renderMiniSparkline(percent: number, activeColor: string, usedRaw?: number) {
    const isZero = usedRaw === 0 || percent === 0
    const tokenActivity = isZero ? [6, 6, 6, 6, 6, 6, 6, 6] : [10, 40, 25, 75, 45, 60, 30, Math.max(15, percent * 0.7)]
    return (
      <View style={{ flexDirection: 'row', gap: 2, height: 20, alignItems: 'flex-end', marginTop: 6 }}>
        {tokenActivity.map((val, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: isZero ? 4 : `${val}%`,
              backgroundColor: isZero ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : activeColor,
              opacity: isZero ? 1 : 0.3 + (i * 0.1),
              borderTopLeftRadius: 1.5,
              borderTopRightRadius: 1.5
            }}
          />
        ))}
      </View>
    )
  }

  function renderMetricCard(
    type: 'compute' | 'ram' | 'disk' | 'workspaces' | 'ai' | 'network' | 'api',
    label: string,
    usedStr: string,
    limitStr: string,
    percent: number,
    Icon: any,
    color: string,
    usedRaw?: number,
    limitRaw?: number
  ) {
    const displayPercent = isNaN(percent) ? 0 : Math.min(percent, 100)
    const cardWidth = type === 'compute' ? '100%' : '48.2%'
    const cardHeight = type === 'compute' ? 145 : 125

    return (
      <TouchableOpacity
        key={label}
        activeOpacity={0.85}
        onPress={() => {
          setBillingDetailType(type)
          setUsageSubScreen('detail')
          fetchProjects(true)
        }}
        style={{
          width: cardWidth as any,
          backgroundColor: isDark ? '#111622' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          borderRadius: 8,
          padding: 14,
          height: cardHeight,
          justifyContent: 'space-between',
          shadowColor: isDark ? color : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View
            style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: isDark ? `${color}15` : `${color}10`,
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Icon size={14} color={color} strokeWidth={2.5} />
          </View>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 9 }}>
            DETAIL ↗
          </Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 11, opacity: 0.8 }}>
            {label}
          </Text>
          <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_700Bold', fontSize: 13, marginTop: 1 }}>
            {usedStr}
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 1 }}>
            limit: {limitStr}
          </Text>
        </View>

        {type === 'compute' && renderMiniBarGraph(displayPercent, color, usedRaw)}
        {type === 'ram' && renderMiniRadialGauge(displayPercent, color)}
        {type === 'disk' && renderMiniStackBar(displayPercent, color)}
        {type === 'workspaces' && renderMiniNodeGrid(usedRaw || 0, limitRaw || 3, color)}
        {type === 'ai' && renderMiniSparkline(displayPercent, color, usedRaw)}
        {type === 'network' && renderMiniSparkline(displayPercent, color, usedRaw)}
        {type === 'api' && renderMiniBarGraph(displayPercent, color, usedRaw)}
      </TouchableOpacity>
    )
  }

  // ====== COMPUTE HISTORY DATA ======

  const getComputeHistoryData = () => {
    const sessions = billingData?.sessions || []
    const nowMs = Date.now()
    let intervals: { start: number; end: number; label: string }[] = []

    if (timelineFilter === '1h') {
      for (let i = 5; i >= 0; i--) {
        const end = nowMs - i * 10 * 60 * 1000
        const start = end - 10 * 60 * 1000
        const dateObj = new Date(end)
        const label = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
        intervals.push({ start, end, label })
      }
    } else if (timelineFilter === '24h') {
      for (let i = 5; i >= 0; i--) {
        const end = nowMs - i * 4 * 60 * 60 * 1000
        const start = end - 4 * 60 * 60 * 1000
        const dateObj = new Date(end)
        const label = `${String(dateObj.getHours()).padStart(2, '0')}:00`
        intervals.push({ start, end, label })
      }
    } else if (timelineFilter === '3d') {
      for (let i = 2; i >= 0; i--) {
        const end = nowMs - i * 24 * 60 * 60 * 1000
        const start = end - 24 * 60 * 60 * 1000
        const dateObj = new Date(end)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${months[dateObj.getMonth()]} ${dateObj.getDate()}`
        intervals.push({ start, end, label })
      }
    } else if (timelineFilter === '7d') {
      for (let i = 6; i >= 0; i--) {
        const end = nowMs - i * 24 * 60 * 60 * 1000
        const start = end - 24 * 60 * 60 * 1000
        const dateObj = new Date(end)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${months[dateObj.getMonth()]} ${dateObj.getDate()}`
        intervals.push({ start, end, label })
      }
    }

    let values = intervals.map(interval => {
      let totalMinutes = 0
      for (const s of sessions) {
        const sStart = new Date(s.startedAt).getTime()
        const sEnd = s.endedAt ? new Date(s.endedAt).getTime() : nowMs
        const overlap = Math.max(0, Math.min(sEnd, interval.end) - Math.max(sStart, interval.start))
        totalMinutes += overlap / 60000
      }
      return totalMinutes
    })

    const totalConsumed = values.reduce((sum, v) => sum + v, 0)
    return { intervals, values, hasData: totalConsumed > 0, totalConsumedMinutes: totalConsumed }
  }

  const getTokenHistoryData = () => {
    const computeData = getComputeHistoryData()
    const aiUsed = billingData?.usage?.aiTokens?.used || 0
    if (aiUsed === 0) {
      return { intervals: computeData.intervals, values: computeData.intervals.map(() => 0), hasData: false, totalTokens: 0 }
    }
    let values
    if (computeData.hasData) {
      values = computeData.values.map(val => {
        const pct = val / (computeData.totalConsumedMinutes || 1)
        return Math.round(pct * aiUsed)
      })
    } else {
      values = computeData.intervals.map(() => Math.round(aiUsed / computeData.intervals.length))
    }
    return { intervals: computeData.intervals, values, hasData: true, totalTokens: aiUsed }
  }

  // ====== DETAIL VIEW RENDERERS ======

  function renderDetailView() {
    const usage = billingData?.usage || {
      workspaces: { used: 0, limit: 3 },
      cpu: { usedHours: 0, limitHours: 50 },
      ram: { usedMB: 0, limitMB: 512 },
      disk: { usedGB: 0, limitGB: 5 },
      aiTokens: { used: 0, limit: 50000 }
    }

    const type = billingDetailType
    const currentTier = billingData?.tier || { name: 'free', displayName: 'Free Plan' }

    let title = ''
    let color = '#334155'
    let Icon = Cpu
    let percent = 0
    let valueStr = ''
    let limitStr = ''

    if (type === 'compute') {
      title = 'Compute Session Analytics'
      color = '#334155'; Icon = Cpu
      percent = (usage.cpu.usedHours / (usage.cpu.limitHours || 1)) * 100
      valueStr = `${usage.cpu.usedHours} hrs`
      limitStr = usage.cpu.limitHours === 99999 ? 'Unlimited' : `${usage.cpu.limitHours} hrs`
    } else if (type === 'ram') {
      title = 'Memory (RAM) Footprint'
      color = '#475569'; Icon = HardDrive
      percent = (usage.ram.usedMB / (usage.ram.limitMB || 1)) * 100
      valueStr = `${usage.ram.usedMB} MB`
      limitStr = `${usage.ram.limitMB} MB`
    } else if (type === 'disk') {
      title = 'SSD Disk Storage'
      color = '#334155'; Icon = Database
      percent = (usage.disk.usedGB / (usage.disk.limitGB || 1)) * 100
      valueStr = `${usage.disk.usedGB} GB`
      limitStr = `${usage.disk.limitGB} GB`
    } else if (type === 'workspaces') {
      title = 'Workspace Nodes'
      color = '#1E293B'; Icon = Server
      percent = (usage.workspaces.used / (usage.workspaces.limit || 1)) * 100
      valueStr = `${usage.workspaces.used}`
      limitStr = `${usage.workspaces.limit}`
    } else if (type === 'ai') {
      title = 'AI Token Consumption'
      color = '#475569'; Icon = Sparkles
      percent = (usage.aiTokens.used / (usage.aiTokens.limit || 1)) * 100
      valueStr = usage.aiTokens.used.toLocaleString()
      limitStr = usage.aiTokens.limit.toLocaleString()
    } else if (type === 'network') {
      title = 'Network Bandwidth'
      color = '#64748B'; Icon = Wifi
      percent = currentTier.name === 'free' ? (12 / 15) * 100 : 50
      valueStr = usage.workspaces.used > 0 ? (currentTier.name === 'free' ? '12 Mbps' : '380 Mbps') : '0 Mbps'
      limitStr = currentTier.name === 'free' ? '15 Mbps Cap' : 'Uncapped'
    } else if (type === 'api') {
      title = 'API Rate Limits'
      color = '#1E293B'; Icon = Shield
      percent = currentTier.name === 'free' ? ((usage.workspaces.used * 4) / 25) * 100 : currentTier.name === 'pro' ? ((usage.workspaces.used * 4) / 500) * 100 : 0
      valueStr = usage.workspaces.used > 0 ? `${usage.workspaces.used * 4} req/min` : '0 req/min'
      limitStr = currentTier.name === 'free' ? '25 req/min' : currentTier.name === 'pro' ? '500 req/min' : 'Uncapped'
    }

    const displayPercent = isNaN(percent) ? 0 : Math.min(percent, 100)

    return (
      <View style={{ gap: 20, paddingBottom: 40 }}>
        <View style={styles.subHeader}>
          <TouchableOpacity
            onPress={() => setUsageSubScreen('main')}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{title}</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          {/* Summary Card */}
          <View style={{
            backgroundColor: isDark ? '#111622' : '#FFFFFF',
            borderWidth: 1, borderColor: colors.border, borderRadius: 8,
            padding: 18, gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: isDark ? `${color}15` : `${color}10`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{valueStr}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>of {limitStr}</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: isDark ? '#161821' : '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${displayPercent}%`, backgroundColor: color, borderRadius: 4 }} />
            </View>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 }}>
              {Math.round(displayPercent)}% of allocation used this billing cycle
            </Text>
          </View>

          {/* Timeline filter for compute and AI */}
          {(type === 'compute' || type === 'ai') && (
            <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.border }}>
              {([
                { key: '1h' as const, label: '1 Hr' },
                { key: '24h' as const, label: '24 Hr' },
                { key: '3d' as const, label: '3 Day' },
                { key: '7d' as const, label: '7 Day' }
              ]).map((t) => {
                const isActive = timelineFilter === t.key
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTimelineFilter(t.key)}
                    style={{
                      flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6,
                      backgroundColor: isActive ? (isDark ? '#161821' : '#FFFFFF') : 'transparent',
                    }}
                  >
                    <Text style={{ color: isActive ? color : colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>{t.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Compute timeline graph */}
          {type === 'compute' && (() => {
            const history = getComputeHistoryData()
            if (!history.hasData) {
              return (
                <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 24, alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Clock size={22} color={color} />
                  </View>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }}>No Compute Activity</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                    No compute usage recorded in this period.
                  </Text>
                </View>
              )
            }
            const maxValue = Math.max(...history.values, 1)
            return (
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 14 }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>COMPUTE HOURS TIMELINE</Text>
                <View style={{ height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 10 }}>
                  {history.values.map((val, idx) => {
                    const heightPercent = (val / maxValue) * 100
                    const label = history.intervals[idx].label
                    const displayVal = val >= 60 ? `${(val / 60).toFixed(1)}h` : `${Math.round(val)}m`
                    return (
                      <View key={idx} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 9, color: color, fontFamily: 'JetBrainsMono_400Regular' }}>{displayVal}</Text>
                        <View style={{ width: '100%', height: `${Math.max(4, heightPercent)}%`, backgroundColor: color, borderRadius: 4, opacity: 0.85 }} />
                        <Text style={{ fontSize: 8, color: colors.textSecondary, textAlign: 'center', width: '100%' }} numberOfLines={1}>{label}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })()}

          {/* AI tokens graph */}
          {type === 'ai' && (() => {
            const history = getTokenHistoryData()
            if (!history.hasData) {
              return (
                <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 24, alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Sparkles size={22} color={color} />
                  </View>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 15 }}>No AI Tokens Used</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                    Interact with the AI assistant to begin using tokens.
                  </Text>
                </View>
              )
            }
            const maxValue = Math.max(...history.values, 1)
            return (
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 14 }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>AI TOKEN CONSUMPTION</Text>
                <View style={{ height: 120, justifyContent: 'flex-end', paddingTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 6 }}>
                    {history.values.map((val, idx) => {
                      const heightPercent = (val / maxValue) * 100
                      const label = history.intervals[idx].label
                      return (
                        <View key={idx} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 8, color: color, fontFamily: 'JetBrainsMono_400Regular' }}>{val.toLocaleString()}</Text>
                          <View style={{ width: '100%', height: `${Math.max(4, heightPercent * 0.8)}%`, backgroundColor: color, opacity: 0.15 + (idx * 0.08), borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1, borderColor: color }} />
                          <Text style={{ fontSize: 8, color: colors.textSecondary, textAlign: 'center', width: '100%' }} numberOfLines={1}>{label}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </View>
            )
          })()}

          {/* RAM dial */}
          {type === 'ram' && (
            <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 20, alignItems: 'center', gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5, alignSelf: 'flex-start' }}>MEMORY SEGMENTS</Text>
              <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: 70, borderWidth: 12, borderColor: displayPercent > 0 ? color : 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }] }]} />
                <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'JetBrainsMono_700Bold' }}>{Math.round(displayPercent)}%</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium' }}>Load Level</Text>
              </View>
              <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 6 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'JetBrainsMono_700Bold' }}>{valueStr}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 9 }}>Allocated</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'JetBrainsMono_700Bold' }}>{limitStr}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 9 }}>Max Limit</Text>
                </View>
              </View>
            </View>
          )}

          {/* Workspaces node grid */}
          {type === 'workspaces' && (
            <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>WORKSPACE NODE MATRIX</Text>
              <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10 }}>
                {Array.from({ length: usage.workspaces.limit || 3 }).map((_, i) => {
                  const isAllocated = i < (usage.workspaces.used || 0)
                  const isRunning = isAllocated && (projects[i]?.status === 'running' || projects[i]?.status === 'ready')
                  return (
                    <View
                      key={i}
                      style={{
                        width: 70, height: 70, borderRadius: 6,
                        borderWidth: 2, borderColor: isAllocated ? color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                        borderStyle: isAllocated ? 'solid' : 'dashed',
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isAllocated ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'transparent',
                      }}
                    >
                      <Server size={18} color={isAllocated ? color : colors.textSecondary} opacity={isAllocated ? 1 : 0.4} />
                      <Text style={{ color: isAllocated ? colors.text : colors.textSecondary, fontSize: 8, fontFamily: 'Inter_600SemiBold', marginTop: 4 }}>
                        {isAllocated ? (isRunning ? 'ACTIVE' : 'READY') : 'FREE'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* Network & API info cards */}
          {(type === 'network' || type === 'api') && (
            <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 18, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Current:</Text>
                <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'JetBrainsMono_700Bold' }}>{valueStr}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Limit:</Text>
                <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'JetBrainsMono_700Bold' }}>{limitStr}</Text>
              </View>
            </View>
          )}

          {/* Disk breakdown */}
          {type === 'disk' && (() => {
            const breakdown = billingData?.diskBreakdown || []
            const totalMB = breakdown.reduce((sum: number, p: any) => sum + (p.sizeMB || 0), 0)
            return (
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 14 }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 }}>DISK SEGMENTATION</Text>
                {breakdown.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                      {breakdown.map((item: any, idx: number) => {
                        const pct = totalMB > 0 ? (item.sizeMB / totalMB) * 100 : 0
                        return <View key={item.id} style={{ width: `${pct}%`, backgroundColor: color, opacity: 1 - (idx * 0.15) }} />
                      })}
                    </View>
                    <View style={{ gap: 8 }}>
                      {breakdown.map((item: any, idx: number) => {
                        const pct = totalMB > 0 ? (item.sizeMB / totalMB) * 100 : 0
                        return (
                          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: 1 - (idx * 0.15) }} />
                              <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Inter_500Medium' }}>{item.name}</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'JetBrainsMono_400Regular' }}>
                              {item.sizeMB >= 1024 ? `${(item.sizeMB / 1024).toFixed(2)} GB` : `${item.sizeMB} MB`} ({Math.round(pct)}%)
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No storage allocated.</Text>
                )}
              </View>
            )
          })()}
        </View>
      </View>
    )
  }

  // ====== MAIN USAGE VIEW ======

  function renderUsageMain() {
    const usage = billingData?.usage || {
      workspaces: { used: 0, limit: 3 },
      cpu: { usedHours: 0, limitHours: 50 },
      ram: { usedMB: 0, limitMB: 512 },
      disk: { usedGB: 0, limitGB: 5 },
      aiTokens: { used: 0, limit: 50000 },
      networkSpeed: { currentMbps: 15, limitMbps: 15 }
    }
    const currentTier = billingData?.tier || { name: 'free', displayName: 'Free Plan', price: { monthly: 0 } }

    if (loadingBilling && !billingData) {
      return (
        <View style={{ gap: 20, paddingBottom: 40 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Usage</Text>
          </View>
          <View style={{ paddingHorizontal: 24, gap: 16 }}>
            <SkeletonBlock width="100%" height={145} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonBlock width="48.2%" height={125} />
              <SkeletonBlock width="48.2%" height={125} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonBlock width="48.2%" height={125} />
              <SkeletonBlock width="48.2%" height={125} />
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={{ gap: 20, paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Usage</Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 }}>
            {currentTier.displayName} · Current billing cycle
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          {/* Metrics Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            {renderMetricCard(
              'compute', 'Compute Hours',
              `${usage.cpu.usedHours} hrs`,
              usage.cpu.limitHours === 99999 ? 'Unlimited' : `${usage.cpu.limitHours} hrs`,
              (usage.cpu.usedHours / (usage.cpu.limitHours || 1)) * 100,
              Cpu, '#334155', usage.cpu.usedHours
            )}
            {renderMetricCard(
              'ram', 'Memory (RAM)',
              `${usage.ram.usedMB} MB`, `${usage.ram.limitMB} MB`,
              (usage.ram.usedMB / (usage.ram.limitMB || 1)) * 100,
              HardDrive, '#475569', usage.ram.usedMB
            )}
            {renderMetricCard(
              'workspaces', 'Workspaces',
              `${usage.workspaces.used}`, `${usage.workspaces.limit}`,
              (usage.workspaces.used / (usage.workspaces.limit || 1)) * 100,
              Server, '#1E293B', usage.workspaces.used, usage.workspaces.limit
            )}
            {renderMetricCard(
              'disk', 'SSD Storage',
              `${usage.disk.usedGB} GB`, `${usage.disk.limitGB} GB`,
              (usage.disk.usedGB / (usage.disk.limitGB || 1)) * 100,
              Database, '#334155', usage.disk.usedGB
            )}
            {renderMetricCard(
              'ai', 'AI Tokens',
              usage.aiTokens.used.toLocaleString(), usage.aiTokens.limit.toLocaleString(),
              (usage.aiTokens.used / (usage.aiTokens.limit || 1)) * 100,
              Sparkles, '#475569', usage.aiTokens.used
            )}
            {renderMetricCard(
              'network', 'Network Speed',
              usage.workspaces.used > 0 ? (currentTier.name === 'free' ? '12 Mbps' : '380 Mbps') : '0 Mbps',
              currentTier.name === 'free' ? '15 Mbps Cap' : 'Uncapped',
              currentTier.name === 'free' ? (12 / 15) * 100 : 50,
              Wifi, '#64748B', usage.workspaces.used > 0 ? 12 : 0
            )}
            {renderMetricCard(
              'api', 'API Rate Limit',
              usage.workspaces.used > 0 ? `${usage.workspaces.used * 4} req/min` : '0 req/min',
              currentTier.name === 'free' ? '25 req/min' : currentTier.name === 'pro' ? '500 req/min' : 'Uncapped',
              currentTier.name === 'free' ? ((usage.workspaces.used * 4) / 25) * 100 : currentTier.name === 'pro' ? ((usage.workspaces.used * 4) / 500) * 100 : 0,
              Shield, '#1E293B', usage.workspaces.used > 0 ? usage.workspaces.used * 4 : 0
            )}
          </View>

          {/* Usage History */}
          {billingData?.usageHistory && billingData.usageHistory.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}>USAGE HISTORY</Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#111622' : '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                {billingData.usageHistory.map((item: any, idx: number, arr: any[]) => (
                  <View key={item.month} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>{item.month}</Text>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontFamily: 'Inter_400Regular' }}>
                        {item.cpuHours} hrs CPU · {item.tokens.toLocaleString()} tokens
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <TabGenieWrapper index={3}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loadingBilling}
              onRefresh={() => fetchBillingStatus(false)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <Animated.View entering={FadeInDown.duration(160)} style={{ flex: 1 }}>
            {renderUsageMain()}
          </Animated.View>
        </ScrollView>

        {/* Detail overlay */}
        {usageSubScreen === 'detail' && (
          <Animated.View
            entering={SlideInRight.duration(160).easing(Easing.out(Easing.quad))}
            exiting={SlideOutRight.duration(130).easing(Easing.in(Easing.quad))}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 10 }]}
          >
            <ScrollView
              style={[styles.container, { backgroundColor: colors.background }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {renderDetailView()}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 10,
  },
  subTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
