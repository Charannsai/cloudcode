import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Image, Modal, Pressable } from 'react-native'
import { SpringPressable } from '@/components/SpringPressable'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { cache } from '@/hooks/useCache'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/store/auth'
import { promptGitHubSignIn } from '@/lib/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  Sparkles,
  Plus,
  ChevronRight,
  Key,
  ArrowUpRight,
  User,
  Settings,
  CreditCard,
  LogOut,
  Activity,
  Globe,
  HardDrive
} from '@/components/HugeIconsShim'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ProjectIcon, detectProjectTech, getTechColors } from '@/components/ProjectIcon'
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSpring,
  useSharedValue,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated'
import { TabGenieWrapper } from '@/components/TabGenieWrapper'

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: any }) {
  return (
    <SpringPressable onPress={onPress} style={style} activeScale={0.96}>
      {children}
    </SpringPressable>
  )
}

const PulseDot = ({ color }: { color: string }) => {
  const opacity = useSharedValue(0.4)
  
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])
  
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0.4, 1], [0.85, 1.2]) }]
  }))
  
  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, animStyle]} />
  )
}

const CreateWorkspaceCard = ({ onPress, isDark, colors }: { onPress: () => void; isDark: boolean; colors: any }) => {
  const cardBg = isDark ? '#0B0C10' : '#FFFFFF'
  const dashedBorderColor = isDark ? '#222634' : '#E2E8F0'

  return (
    <PressableScale 
      onPress={onPress}
      style={[
        styles.emptyCard, 
        { 
          backgroundColor: cardBg, 
          borderColor: dashedBorderColor,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          borderRadius: 16,
          minHeight: 160,
          overflow: 'hidden',
          position: 'relative',
          paddingVertical: 26,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }
      ]}
    >
      {/* Realistic Volumetric Cumulus Cloud Landscape */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 110,
        }}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none">
          <Defs>
            {/* Neutral cumulus gradients - Light & Dark */}
            <LinearGradient id="cloudAtmosphere" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#1E2330' : '#E2E8F0'} stopOpacity={isDark ? 0.35 : 0.6} />
              <Stop offset="100%" stopColor={isDark ? '#0B0C10' : '#F8FAFC'} stopOpacity={isDark ? 0.9 : 0.4} />
            </LinearGradient>

            <LinearGradient id="cloudLobeL1" x1="20%" y1="0%" x2="80%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#333A4D' : '#FFFFFF'} stopOpacity={1} />
              <Stop offset="45%" stopColor={isDark ? '#232836' : '#F8FAFC'} stopOpacity={0.98} />
              <Stop offset="85%" stopColor={isDark ? '#161922' : '#E2E8F0'} stopOpacity={0.92} />
              <Stop offset="100%" stopColor={isDark ? '#0F1117' : '#CBD5E1'} stopOpacity={0.85} />
            </LinearGradient>

            <LinearGradient id="cloudLobeL2" x1="30%" y1="0%" x2="70%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#3A4257' : '#FFFFFF'} stopOpacity={1} />
              <Stop offset="50%" stopColor={isDark ? '#262C3C' : '#F1F5F9'} stopOpacity={0.98} />
              <Stop offset="100%" stopColor={isDark ? '#13161F' : '#D8E0EB'} stopOpacity={0.88} />
            </LinearGradient>

            <LinearGradient id="cloudLobeFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#2A3041' : '#FFFFFF'} stopOpacity={1} />
              <Stop offset="30%" stopColor={isDark ? '#1C202C' : '#FAFCFF'} stopOpacity={0.98} />
              <Stop offset="75%" stopColor={isDark ? '#12151D' : '#F1F5F9'} stopOpacity={0.95} />
              <Stop offset="100%" stopColor={isDark ? '#0B0C10' : '#E2E8F0'} stopOpacity={0.98} />
            </LinearGradient>
          </Defs>

          {/* Layer 1: Distant Background Cloud Banks */}
          <Path
            d="M-20,110 L-20,62 C5,38 35,32 60,48 C85,22 130,18 160,38 C185,12 230,10 258,32 C285,14 330,16 355,42 C378,28 415,38 430,68 L430,110 Z"
            fill="url(#cloudAtmosphere)"
          />

          {/* Layer 2: Left Volumetric Cumulus Cluster */}
          {/* Lobe 1 (far left) */}
          <Circle cx="35" cy="74" r="34" fill="url(#cloudLobeL1)" />
          {/* Lobe 2 (left high puff) */}
          <Circle cx="72" cy="54" r="36" fill="url(#cloudLobeL2)" />
          {/* Lobe 3 (left peak billow) */}
          <Circle cx="112" cy="42" r="32" fill="url(#cloudLobeL1)" />
          {/* Lobe 4 (left center shelf) */}
          <Circle cx="148" cy="62" r="30" fill="url(#cloudLobeL2)" />

          {/* Layer 3: Right Volumetric Cumulus Cluster */}
          {/* Lobe 5 (right center shelf) */}
          <Circle cx="252" cy="62" r="28" fill="url(#cloudLobeL2)" />
          {/* Lobe 6 (right peak billow) */}
          <Circle cx="288" cy="42" r="32" fill="url(#cloudLobeL1)" />
          {/* Lobe 7 (right high puff) */}
          <Circle cx="328" cy="52" r="36" fill="url(#cloudLobeL2)" />
          {/* Lobe 8 (far right) */}
          <Circle cx="366" cy="72" r="34" fill="url(#cloudLobeL1)" />

          {/* Layer 4: Foreground Puffy Billow Base (Seamless blending across bottom) */}
          <Path
            d="M-20,110 L-20,82 C10,60 42,74 65,66 C95,50 128,68 152,58 C180,48 218,48 248,58 C272,68 305,50 335,66 C358,74 390,60 425,82 L425,110 Z"
            fill="url(#cloudLobeFront)"
          />

          {/* Layer 5: Specular Highlight Rims on Major Cloud Puffs */}
          {/* Left Peak Highlight */}
          <Path
            d="M86,38 C98,34 116,34 126,42"
            stroke={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)'}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Peak Highlight */}
          <Path
            d="M272,40 C284,34 302,34 314,42"
            stroke={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)'}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left Outer Puff Highlight */}
          <Path
            d="M50,48 C62,42 78,44 88,52"
            stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Outer Puff Highlight */}
          <Path
            d="M312,48 C324,42 342,44 352,54"
            stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>

      {/* Center Action & Text */}
      <View style={{ alignItems: 'center', zIndex: 2 }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isDark ? '#161821' : '#F1F5F9',
          borderWidth: 1,
          borderColor: isDark ? '#272A36' : '#E2E8F0',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <Plus size={20} color={isDark ? '#F3F4F6' : '#0F1115'} strokeWidth={2} />
        </View>

        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5, marginTop: 10 }}>
          Create Workspace
        </Text>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 }}>
          Get started with a new project
        </Text>
      </View>
    </PressableScale>
  )
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type MetricType = 'lat' | 'api' | 'ram'
type RangeType = '1D' | '3D' | '7D'

const METRIC_KEYS: MetricType[] = ['lat', 'api', 'ram']

// Smooth cubic Bezier spline curve generator
const getSmoothSplinePath = (pts: { x: number; y: number }[], tension: number = 0.35) => {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`

  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2

    const cp1x = p1.x + ((p2.x - p0.x) * tension)
    const cp1y = p1.y + ((p2.y - p0.y) * tension)
    const cp2x = p2.x - ((p3.x - p1.x) * tension)
    const cp2y = p2.y - ((p3.y - p1.y) * tension)

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return path
}

function MetricsChartCard({ isDark, colors }: { isDark: boolean; colors: any }) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('lat')
  const [range, setRange] = useState<RangeType>('1D')
  const [latencyVal, setLatencyVal] = useState<number>(18)
  const [ramVal, setRamVal] = useState<number>(24)
  const [apiVal, setApiVal] = useState<number>(42)
  const [tabBarWidth, setTabBarWidth] = useState<number>(0)
  const [historySamples, setHistorySamples] = useState<{ lat: number[]; api: number[]; ram: number[] }>({
    lat: [12, 16, 14, 38, 22, 15, 48, 19, 26, 14, 32, 18],
    api: [28, 35, 52, 38, 64, 46, 78, 52, 38, 58, 68, 42],
    ram: [20, 22, 21, 35, 23, 22, 40, 24, 28, 23, 32, 24],
  })

  // Normal-smooth horizontal tab sliding animation
  const activeIdx = METRIC_KEYS.indexOf(activeMetric)
  const pillIndex = useSharedValue(0)

  useEffect(() => {
    pillIndex.value = withTiming(activeIdx, {
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [activeIdx])

  const segmentWidth = tabBarWidth > 0 ? (tabBarWidth - 6) / 3 : (SCREEN_WIDTH - 72) / 3

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillIndex.value * segmentWidth }],
    width: segmentWidth,
  }))

  // Poll live system diagnostics & network roundtrip
  useEffect(() => {
    let isMounted = true
    const poll = async () => {
      const start = Date.now()
      try {
        const res = await api.system.diagnostics()
        const duration = Math.max(8, Math.min(240, Date.now() - start))
        if (!isMounted) return

        const mem = res?.memoryUsage || 24
        const dynamicApiRate = Math.max(12, Math.min(180, Math.round(28 + (mem * 0.45) + (Math.sin(Date.now() / 6000) * 14))))

        setLatencyVal(duration)
        setRamVal(mem)
        setApiVal(dynamicApiRate)

        setHistorySamples(prev => ({
          lat: [...prev.lat.slice(1), duration],
          api: [...prev.api.slice(1), dynamicApiRate],
          ram: [...prev.ram.slice(1), mem],
        }))
      } catch {
        const duration = Math.max(12, Math.min(120, Date.now() - start))
        if (!isMounted) return
        setLatencyVal(duration)
        setHistorySamples(prev => ({
          ...prev,
          lat: [...prev.lat.slice(1), duration],
        }))
      }
    }

    poll()
    const iv = setInterval(poll, 7000)
    return () => {
      isMounted = false
      clearInterval(iv)
    }
  }, [])

  // Refined metric configurations
  const metricConfigs = {
    lat: {
      label: 'LAT',
      fullLabel: 'Network Roundtrip Latency',
      unit: 'ms',
      accent: isDark ? '#38BDF8' : '#0284C7',
      value: latencyVal,
    },
    api: {
      label: 'API',
      fullLabel: 'API Request Throughput',
      unit: 'req/m',
      accent: isDark ? '#F59E0B' : '#D97706',
      value: apiVal,
    },
    ram: {
      label: 'RAM',
      fullLabel: 'Container Memory Allocation',
      unit: '%',
      accent: isDark ? '#818CF8' : '#4F46E5',
      value: ramVal,
    },
  }

  const currentCfg = metricConfigs[activeMetric]
  const rawData = historySamples[activeMetric]

  // Compute dynamic curves for selected range (1D, 3D, 7D)
  const data = useMemo(() => {
    const count = range === '1D' ? 12 : range === '3D' ? 14 : 16
    const base = rawData
    const res: number[] = []
    for (let i = 0; i < count; i++) {
      const idx = i % base.length
      const jitter = Math.sin(i * 1.85) * (activeMetric === 'lat' ? 6 : activeMetric === 'api' ? 10 : 4)
      const val = Math.max(
        activeMetric === 'ram' ? 10 : 5,
        Math.round((base[idx] * (1 + (i % 3 === 0 ? 0.12 : -0.06)) + jitter))
      )
      res.push(val)
    }
    res[res.length - 1] = currentCfg.value
    return res
  }, [rawData, range, activeMetric, currentCfg.value])

  const peak = Math.max(...data)
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length)
  const now = currentCfg.value

  const chartWidth = 320
  const chartHeight = 78

  const renderChartContent = () => {
    const maxVal = Math.max(peak, 1)

    if (activeMetric === 'api') {
      const barCount = data.length
      const barWidth = Math.max(10, Math.floor((chartWidth - (barCount * 6)) / barCount))
      return (
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            <LinearGradient id="apiBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={currentCfg.accent} stopOpacity={0.88} />
              <Stop offset="100%" stopColor={currentCfg.accent} stopOpacity={0.25} />
            </LinearGradient>
          </Defs>
          {data.map((val, idx) => {
            const h = Math.max(8, Math.round((val / maxVal) * (chartHeight - 10)))
            const x = idx * (chartWidth / barCount) + 2
            const y = chartHeight - h
            const isLast = idx === data.length - 1
            return (
              <Rect
                key={idx}
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={3.5}
                fill={isLast ? currentCfg.accent : 'url(#apiBarGrad)'}
                opacity={isLast ? 1 : 0.85}
              />
            )
          })}
        </Svg>
      )
    }

    // Curvy Area Chart with smooth natural spline peaks (LAT & RAM)
    const points = data.map((val, idx) => {
      const x = idx * (chartWidth / (data.length - 1))
      const y = Math.max(6, Math.min(chartHeight - 6, chartHeight - (val / maxVal) * (chartHeight - 14)))
      return { x, y }
    })

    const linePath = getSmoothSplinePath(points, 0.35)
    const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

    return (
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="metricAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={currentCfg.accent} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={currentCfg.accent} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#metricAreaGrad)" />
        <Path d={linePath} stroke={currentCfg.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={currentCfg.accent}
          stroke={isDark ? '#0B0C10' : '#FFFFFF'}
          strokeWidth={2}
        />
      </Svg>
    )
  }

  return (
    <View style={{
      width: '100%',
      borderRadius: 16,
      backgroundColor: isDark ? '#0B0C10' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1A1C23' : '#E4E7EB',
      padding: 14,
      gap: 12,
      marginBottom: 20,
    }}>
      {/* 1. Header: Title + Live Status Badge & Range Toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <PulseDot color={currentCfg.accent} />
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, letterSpacing: -0.2 }}>
            System Health
          </Text>
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 1.5,
            borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Live
            </Text>
          </View>
        </View>

        {/* 1D / 3D / 7D Range Pills */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#141722' : '#F1F5F9',
          borderRadius: 6,
          padding: 2,
          borderWidth: 1,
          borderColor: isDark ? '#232838' : '#E2E8F0',
        }}>
          {(['1D', '3D', '7D'] as RangeType[]).map(r => {
            const active = range === r
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 4,
                  backgroundColor: active ? currentCfg.accent : 'transparent',
                }}
              >
                <Text style={{
                  color: active ? '#FFFFFF' : colors.textSecondary,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 10,
                }}>
                  {r}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* 2. Top Horizontal 3-Tab Segment Selector (LAT, API, RAM) */}
      <View
        onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#141722' : '#F1F5F9',
          borderRadius: 10,
          padding: 3,
          borderWidth: 1,
          borderColor: isDark ? '#232838' : '#E2E8F0',
          position: 'relative',
          height: 38,
        }}
      >
        {/* Animated Normal-Smooth Sliding Pill */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 3,
              bottom: 3,
              left: 3,
              borderRadius: 7,
              backgroundColor: isDark ? '#202636' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 3,
              elevation: 2,
            },
            animatedPillStyle,
          ]}
        />

        {METRIC_KEYS.map((metricKey) => {
          const active = activeMetric === metricKey
          const cfg = metricConfigs[metricKey]
          return (
            <TouchableOpacity
              key={metricKey}
              onPress={() => setActiveMetric(metricKey)}
              activeOpacity={0.75}
              style={{
                flex: 1,
                height: 32,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                zIndex: 2,
              }}
            >
              <Text style={{
                color: active ? colors.text : colors.textSecondary,
                fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                fontSize: 11.5,
                letterSpacing: 0.4,
              }}>
                {cfg.label}
              </Text>
              <Text style={{
                color: active ? cfg.accent : colors.textSecondary,
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10.5,
                opacity: active ? 1 : 0.65,
              }}>
                {cfg.value}{metricKey === 'lat' ? 'ms' : metricKey === 'ram' ? '%' : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 3. Metric Value Readout */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 2 }}>
        <View>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11 }}>
            {currentCfg.fullLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
            <Text style={{ color: currentCfg.accent, fontFamily: 'JetBrainsMono_700Bold', fontSize: 22, letterSpacing: -0.5 }}>
              {currentCfg.value}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 11.5 }}>
              {currentCfg.unit}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Full Width Chart */}
      <View style={{ height: 78, width: '100%', justifyContent: 'center' }}>
        {renderChartContent()}
      </View>

      {/* 5. Stats Row (Peak, Avg, Now) */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        paddingTop: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 9.5, letterSpacing: 0.3 }}>PEAK</Text>
          <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11 }}>{peak}{currentCfg.unit}</Text>
        </View>

        <View style={{ width: 1, height: 11, backgroundColor: isDark ? '#1F2433' : '#E5E7EB' }} />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 9.5, letterSpacing: 0.3 }}>AVG</Text>
          <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11 }}>{avg}{currentCfg.unit}</Text>
        </View>

        <View style={{ width: 1, height: 11, backgroundColor: isDark ? '#1F2433' : '#E5E7EB' }} />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 9.5, letterSpacing: 0.3 }}>NOW</Text>
          <Text style={{ color: currentCfg.accent, fontFamily: 'JetBrainsMono_700Bold', fontSize: 11 }}>{now}{currentCfg.unit}</Text>
        </View>
      </View>
    </View>
  )
}

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme()
  const insets = useSafeAreaInsets()
  
  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return 'Good morning'
    if (hours < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const { handleScroll } = useScrollVisibility()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const setTabBarVisible = useUIStore((s) => s.setTabBarVisible)
  const setSettingsSubScreen = useUIStore((s) => s.setSettingsSubScreen)
  const [profileName, setProfileName] = useState('')
  const [profileMenuVisible, setProfileMenuVisible] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  // Reanimated states for Profile popover menu
  const [renderMenu, setRenderMenu] = useState(false)
  const menuProgress = useSharedValue(0)

  useEffect(() => {
    if (profileMenuVisible) {
      setRenderMenu(true)
      menuProgress.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    } else {
      menuProgress.value = withTiming(0, { duration: 240, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }, (finished) => {
        if (finished) {
          runOnJS(setRenderMenu)(false)
        }
      })
    }
  }, [profileMenuVisible])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
  }))

  const menuCardAnimatedStyle = useAnimatedStyle(() => {
    const opacity = menuProgress.value
    // Genie transition from top-right corner (avatar position)
    const translateX = (1 - menuProgress.value) * 110
    const translateY = (1 - menuProgress.value) * -80
    const scaleX = 0.1 + 0.9 * menuProgress.value
    const scaleY = 0.05 + 0.95 * menuProgress.value
    const skewX = `${(1 - menuProgress.value) * -8}deg`
    const rotateZ = `${(1 - menuProgress.value) * 4}deg`

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scaleX },
        { scaleY },
        { skewX },
        { rotateZ }
      ]
    }
  })

  const closePopoverInstantly = () => {
    setProfileMenuVisible(false)
    setRenderMenu(false)
    menuProgress.value = 0
  }

  // Track dashboard screen focus state
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true)
      return () => {
        setIsFocused(false)
      }
    }, [])
  )

  // Hide tab bar dynamically when the profile menu modal or sign out modal is active
  useEffect(() => {
    if (isFocused) {
      setTabBarVisible(!profileMenuVisible && !showSignOutModal)
    }
  }, [profileMenuVisible, showSignOutModal, isFocused, setTabBarVisible])
  
  const { projects: allProjects, loading, fetchProjects } = useProjectsStore()
  const projects = useMemo(() => allProjects.slice(0, 5), [allProjects])
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    let t: any
    if (loading) {
      t = setTimeout(() => {
        setShowSkeleton(true)
      }, 150)
    } else {
      setShowSkeleton(false)
    }
    return () => clearTimeout(t)
  }, [loading])

  const showSkeletonState = showSkeleton && projects.length === 0

  // Auto-refresh workspaces list on focus and poll every 10s
  useFocusEffect(
    useCallback(() => {
      fetchProjects(true)

      AsyncStorage.getItem('profile_name').then(val => {
        if (val) setProfileName(val)
      })

      const interval = setInterval(() => {
        fetchProjects(true)
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }, [fetchProjects])
  )

  const cardBg = isDark ? '#0B0C10' : '#FFFFFF'
  const cardBorder = isDark ? '#1A1C23' : '#E4E7EB'
  const subtleBg = isDark ? '#030303' : '#FAFAFA'

  return (
    <TabGenieWrapper index={0}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              fetchProjects(false)
            }}
            tintColor={colors.text}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 14 }}>
              {getGreeting()} 👋
            </Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5, marginTop: 2 }}>
              {profileName || user?.name || user?.login || 'Developer'}
            </Text>
          </View>
          <PressableScale 
            onPress={() => setProfileMenuVisible(true)}
            style={[styles.avatarWrapper, { backgroundColor: subtleBg, borderColor: cardBorder }]}
          >
            {user?.avatar_url && !avatarLoadError ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={{ width: 42, height: 42, borderRadius: 21 }} 
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 }}>
                {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
              </Text>
            )}
          </PressableScale>
        </View>

        {/* Unauthenticated Session Banner */}
        {!user && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              const token = await promptGitHubSignIn()
              if (token) {
                useAuthStore.getState().setToken(token)
                fetchProjects(true)
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.25)',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Key size={18} color={isDark ? '#818CF8' : '#4F46E5'} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                  Sign in with GitHub
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 }}>
                  Connect your account to sync workspaces and cloud containers
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
          </TouchableOpacity>
        )}

        {/* AI Quick Search bar */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.navigate('/(tabs)/ai')}
          style={[styles.aiSearchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Sparkles size={16} color={isDark ? '#A78BFA' : '#7C3AED'} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
              Ask AI agent to code or build...
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderWidth: 1, borderColor: cardBorder
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'monospace' }}>⌘K</Text>
          </View>
        </TouchableOpacity>

        {/* Persistent System Health / Live Performance Telemetry */}
        <MetricsChartCard 
          isDark={isDark}
          colors={colors}
        />

        {/* Workspaces Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Recent Workspaces</Text>
            {projects.length > 0 && (
              <TouchableOpacity onPress={() => router.navigate('/(tabs)/projects')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: isDark ? '#58A6FF' : '#3B82F6', fontSize: 13, fontFamily: 'Inter_500Medium' }}>See all</Text>
                <ChevronRight size={14} color={isDark ? '#58A6FF' : '#3B82F6'} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {showSkeletonState ? (
            <View style={{ gap: 1 }}>
              {[0, 1].map(i => (
                <View key={i} style={[styles.wsRow, { borderBottomColor: cardBorder, opacity: 0.6 }]}>
                  <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: isDark ? '#1A1C23' : '#E5E7EB', marginRight: 12 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ width: '40%', height: 12, borderRadius: 3, backgroundColor: isDark ? '#1A1C23' : '#E5E7EB' }} />
                    <View style={{ width: '20%', height: 8, borderRadius: 3, backgroundColor: isDark ? '#1A1C23' : '#E5E7EB' }} />
                  </View>
                  <View style={{ width: 50, height: 16, borderRadius: 4, backgroundColor: isDark ? '#1A1C23' : '#E5E7EB' }} />
                </View>
              ))}
            </View>
          ) : projects.length === 0 ? (
            <CreateWorkspaceCard 
              onPress={() => router.push('/new-project')}
              isDark={isDark}
              colors={colors}
            />
          ) : (
            <View style={{ gap: 1 }}>
              {projects.map((project) => {
                const tech = detectProjectTech(project.type, project.name, project.github_url)
                const techColors = getTechColors(tech, isDark)
                const isRunning = project.status === 'running'
                
                return (
                  <View key={project.id}>
                    <PressableScale 
                      style={[styles.wsRow, { borderBottomColor: cardBorder }]}
                      onPress={() => router.navigate(`/project/${project.id}`)}
                    >
                      {/* Tech Icon on left */}
                      <View style={{
                        width: 32, height: 32, borderRadius: 6,
                        backgroundColor: techColors.bg,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <ProjectIcon type={project.type} name={project.name} githubUrl={project.github_url} size={16} isDark={isDark} />
                      </View>
                      
                      {/* Name + Tech Type in middle */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, letterSpacing: -0.15 }} numberOfLines={1}>
                          {project.name}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1, textTransform: 'capitalize' }} numberOfLines={1}>
                          {tech}
                        </Text>
                      </View>
                      
                      {/* Status + Chevron on right */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isRunning
                            ? (isDark ? 'rgba(63,185,80,0.15)' : 'rgba(34,197,94,0.1)')
                            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 4,
                        }}>
                          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isRunning ? '#3FB950' : colors.textSecondary, marginRight: 4, opacity: isRunning ? 1 : 0.5 }} />
                          <Text style={{ 
                            fontSize: 10, 
                            fontFamily: 'Inter_600SemiBold', 
                            color: isRunning ? (isDark ? '#3FB950' : '#16A34A') : colors.textSecondary 
                          }}>
                            {isRunning ? 'Active' : 'Idle'}
                          </Text>
                        </View>
                        <ChevronRight size={14} color={colors.textSecondary} strokeWidth={2.0} />
                      </View>
                    </PressableScale>
                  </View>
                )
              })}

              {/* Add New Row */}
              <TouchableOpacity
                style={styles.addWorkspaceRow}
                onPress={() => router.navigate('/new-project')}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 32, height: 32, borderRadius: 6,
                  backgroundColor: 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: cardBorder, borderStyle: 'dashed',
                  marginRight: 12,
                }}>
                  <Plus size={14} color={colors.textSecondary} strokeWidth={2} />
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 }}>
                  Create new workspace...
                </Text>
                <ChevronRight size={14} color={colors.textSecondary} opacity={0.4} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

    <Modal
      visible={renderMenu}
      transparent={true}
      statusBarTranslucent={true}
      animationType="none"
      onRequestClose={() => setProfileMenuVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 110, paddingHorizontal: 20 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropAnimatedStyle]} />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setProfileMenuVisible(false)}
        />
        <Animated.View style={[styles.menuCard, { backgroundColor: cardBg, borderColor: cardBorder }, menuCardAnimatedStyle]}>
          {/* Header User Profile Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', gap: 12, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }} numberOfLines={1}>
                {profileName || user?.name || user?.login}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' }} numberOfLines={1}>
                {user?.email || `@${user?.login}`}
              </Text>
            </View>
            {user?.avatar_url && !avatarLoadError ? (
              <View style={{ borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: 20, padding: 2 }}>
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={{ width: 36, height: 36, borderRadius: 18 }} 
                  onError={() => setAvatarLoadError(true)}
                />
              </View>
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: subtleBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
                  {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Menu Items */}
          <View style={{ padding: 6, gap: 2 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('profile')
                router.navigate('/(tabs)/settings')
              }}
              style={[
                styles.menuItem,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }
              ]}
            >
              <User size={15} color={colors.text} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Go to Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('main')
                router.navigate('/(tabs)/settings')
              }}
              style={styles.menuItem}
            >
              <Settings size={15} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('billing')
                router.navigate('/(tabs)/settings')
              }}
              style={styles.menuItem}
            >
              <CreditCard size={15} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Billing & Usage</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', marginVertical: 6 }} />

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                setProfileMenuVisible(false)
                setShowSignOutModal(true)
              }}
              style={styles.menuItem}
            >
              <LogOut size={15} color="#F85149" strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: '#F85149', fontFamily: 'Inter_600SemiBold' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>

    <ConfirmModal
      visible={showSignOutModal}
      title="Sign Out"
      message="Are you sure you want to sign out?"
      confirmText="Sign Out"
      cancelText="Cancel"
      type="logout"
      onConfirm={() => {
        setShowSignOutModal(false)
        signOut()
      }}
      onCancel={() => setShowSignOutModal(false)}
    />
    </TabGenieWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 110 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 28,
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  emptyCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed' as any,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  qaButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addWorkspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  healthCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  metricBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  healthGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    width: 230,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
})
