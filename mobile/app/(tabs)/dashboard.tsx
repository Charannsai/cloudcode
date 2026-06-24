import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Image, Modal, Pressable } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { cache } from '@/hooks/useCache'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useProjectsStore } from '@/store/projects'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  Cpu, 
  Sparkles,
  Plus,
  Box,
  Wifi,
  Database,
  ChevronRight,
  Key,
  ArrowUpRight,
  Zap
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ProjectIcon, detectProjectTech, getTechColors } from '@/components/ProjectIcon'
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated'

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 85, easing: Easing.out(Easing.quad) }) }]
  }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = 0.97 }}
      onPressOut={() => { scale.value = 1 }}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
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

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme()
  
  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return 'Good morning'
    if (hours < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const { handleScroll } = useScrollVisibility()
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { setSettingsSubScreen, setTabBarVisible } = useUIStore()
  const [profileName, setProfileName] = useState('')
  const [profileMenuVisible, setProfileMenuVisible] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'cpu' | 'memory' | 'latency'>('cpu')

  // Reanimated states for Profile popover menu
  const [renderMenu, setRenderMenu] = useState(false)
  const menuOpacity = useSharedValue(0)
  const menuScale = useSharedValue(0.95)
  const menuTranslateY = useSharedValue(-10)

  useEffect(() => {
    if (profileMenuVisible) {
      setRenderMenu(true)
      menuOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
      menuScale.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
      menuTranslateY.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) })
    } else {
      menuOpacity.value = withTiming(0, { duration: 100, easing: Easing.linear })
      menuScale.value = withTiming(0.95, { duration: 100, easing: Easing.linear })
      menuTranslateY.value = withTiming(-10, { duration: 100, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(setRenderMenu)(false)
        }
      })
    }
  }, [profileMenuVisible])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
  }))

  const menuCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [
      { scale: menuScale.value },
      { translateY: menuTranslateY.value }
    ],
  }))

  const closePopoverInstantly = () => {
    setProfileMenuVisible(false)
    setRenderMenu(false)
    menuOpacity.value = 0
    menuScale.value = 0.95
    menuTranslateY.value = -10
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
  
  interface DiagnosticsData {
    cpuLoad: number
    memoryUsage: number
    runningContainers: number
    platform: string
    uptime: number
  }

  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  
  const { projects: allProjects, loading, fetchProjects } = useProjectsStore()
  const projects = allProjects.slice(0, 5)
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

  const fetchDiagnostics = useCallback(async () => {
    const startTime = Date.now()
    try {
      const diag = await api.system.diagnostics()
      const endTime = Date.now()
      setDiagnostics(diag)
      setLatency(endTime - startTime)
    } catch (e) {
      console.warn('Failed to fetch diagnostics', e)
    }
  }, [])

  // Auto-refresh workspaces list on focus and poll every 10s
  useFocusEffect(
    useCallback(() => {
      fetchProjects(true)
      fetchDiagnostics()

      AsyncStorage.getItem('profile_name').then(val => {
        if (val) setProfileName(val)
      })

      const interval = setInterval(() => {
        fetchProjects(true)
        fetchDiagnostics()
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }, [fetchProjects, fetchDiagnostics])
  )

  const cardBg = isDark ? '#161B22' : '#FFFFFF'
  const cardBorder = isDark ? '#30363D' : '#E1E4E8'
  const subtleBg = isDark ? '#21262D' : '#F6F8FA'

  const cpuVal = diagnostics ? diagnostics.cpuLoad : 4
  const ramVal = diagnostics ? diagnostics.memoryUsage : 18
  const latVal = latency !== null ? latency : 12

  const [selectedTimeline, setSelectedTimeline] = useState<'1h' | '24h' | '7d'>('1h')

  const getGraphTimeLabels = () => {
    const now = new Date()
    const labels: string[] = []
    
    if (selectedTimeline === '1h') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 15 * 60 * 1000)
        const hrs = String(d.getHours()).padStart(2, '0')
        const mins = String(d.getMinutes()).padStart(2, '0')
        labels.push(`${hrs}:${mins}`)
      }
    } else if (selectedTimeline === '24h') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 6 * 60 * 60 * 1000)
        const hrs = d.getHours()
        const ampm = hrs >= 12 ? 'PM' : 'AM'
        const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12
        labels.push(`${displayHrs} ${ampm}`)
      }
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        labels.push(days[d.getDay()])
      }
    }
    return labels
  }

  const generateHistoricalData = (currentVal: number, count: number, offset: number) => {
    const data: number[] = []
    const now = Date.now()
    
    const timeStep = selectedTimeline === '1h' 
      ? 5 * 60 * 1000 
      : selectedTimeline === '24h' 
      ? 2 * 60 * 1000 * 60 
      : 24 * 60 * 60 * 1000

    for (let i = 0; i < count - 1; i++) {
      const pointTime = now - (count - 1 - i) * timeStep
      const hashInput = Math.floor(pointTime / timeStep) + offset
      const sineVal = Math.sin(hashInput * 0.5)
      const cosVal = Math.cos(hashInput * 1.3)
      
      const variance = (sineVal * 15) + (cosVal * 8)
      let val = Math.round(currentVal + variance)
      
      val = Math.max(5, Math.min(95, val))
      data.push(val)
    }
    
    data.push(currentVal)
    return data
  }

  const getGraphData = () => {
    const currentVal = activeMetric === 'cpu' ? cpuVal : activeMetric === 'memory' ? ramVal : latVal
    const seedOffset = activeMetric === 'cpu' ? 10 : activeMetric === 'memory' ? 25 : 40
    
    const values = selectedTimeline === '7d' 
      ? generateHistoricalData(currentVal, 7, seedOffset)
      : generateHistoricalData(currentVal, 12, seedOffset)
      
    const points = values.map((val, idx) => {
      const x = idx * (350 / (values.length - 1))
      let pct = val
      if (activeMetric === 'latency') {
        pct = Math.min(100, (val / 150) * 100)
      }
      const y = 90 - (pct * 0.8)
      return { x, y }
    })
    
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaPath = `${linePath} L 350 100 L 0 100 Z`
    
    return { points, linePath, areaPath }
  }

  const { points, linePath, areaPath } = getGraphData()

  const metricColor = colors.text

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              fetchProjects(false)
              fetchDiagnostics()
            }}
            tintColor={colors.text}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(200)} style={styles.header}>
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
        </Animated.View>

        {/* Workspaces */}
        <Animated.View entering={FadeInDown.delay(50).duration(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Recent Workspaces</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/projects')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: isDark ? '#58A6FF' : '#3B82F6', fontSize: 13, fontFamily: 'Inter_500Medium' }}>See all</Text>
              <ChevronRight size={14} color={isDark ? '#58A6FF' : '#3B82F6'} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          {showSkeletonState ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[0,1].map(i => (
                <View key={i} style={[styles.wsCard, { backgroundColor: subtleBg, borderColor: cardBorder, opacity: 0.6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#30363D' : '#E5E7EB' }} />
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: isDark ? '#30363D' : '#E5E7EB' }} />
                  </View>
                  <View style={{ marginTop: 12, width: '100%' }}>
                    <View style={{ width: '80%', height: 12, borderRadius: 4, backgroundColor: isDark ? '#30363D' : '#E5E7EB' }} />
                    <View style={{ width: '50%', height: 8, borderRadius: 4, backgroundColor: isDark ? '#30363D' : '#E5E7EB', marginTop: 6 }} />
                  </View>
                  <View style={{ width: 40, height: 10, borderRadius: 4, backgroundColor: isDark ? '#30363D' : '#E5E7EB', marginTop: 8 }} />
                </View>
              ))}
            </ScrollView>
          ) : projects.length === 0 ? (
            <PressableScale 
              onPress={() => router.push('/new-project')}
              style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Plus size={24} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 10 }}>
                Create Workspace
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 }}>
                Get started with a new project
              </Text>
            </PressableScale>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {projects.map((project, idx) => {
                const tech = detectProjectTech(project.type, project.name, project.github_url)
                const techColors = getTechColors(tech, isDark)
                const isRunning = project.status === 'running'
                
                return (
                  <Animated.View key={project.id} entering={FadeInRight.delay(30 + idx * 30).duration(200)}>
                    <PressableScale 
                      style={[styles.wsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                      onPress={() => router.push(`/project/${project.id}`)}
                    >
                      {/* Top Row: Icon + Pulse Indicator */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: techColors.bg,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ProjectIcon type={project.type} name={project.name} githubUrl={project.github_url} size={20} isDark={isDark} />
                        </View>
                        
                        {isRunning ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isDark ? 'rgba(63,185,80,0.15)' : 'rgba(34,197,94,0.1)',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}>
                            <PulseDot color="#3FB950" />
                          </View>
                        ) : (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}>
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.textSecondary, opacity: 0.5 }} />
                          </View>
                        )}
                      </View>
 
                      {/* Content: Name + Tech */}
                      <View style={{ marginTop: 12, width: '100%', flex: 1, justifyContent: 'center' }}>
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, letterSpacing: -0.2 }} numberOfLines={1}>
                          {project.name}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2, textTransform: 'capitalize' }} numberOfLines={1}>
                          {tech}
                        </Text>
                      </View>
 
                      {/* Footer: Text-based status */}
                      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ 
                          fontSize: 10.5, 
                          fontFamily: 'Inter_600SemiBold', 
                          color: isRunning ? (isDark ? '#3FB950' : '#16A34A') : colors.textSecondary 
                        }}>
                          {isRunning ? 'Active' : 'Idle'}
                        </Text>
                      </View>
                    </PressableScale>
                  </Animated.View>
                )
              })}
 
              {/* Add new card */}
              <PressableScale
                style={[styles.wsCard, { 
                  backgroundColor: 'transparent', 
                  borderColor: cardBorder, 
                  borderStyle: 'dashed', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8
                }]}
                onPress={() => router.push('/new-project')}
              >
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: isDark ? '#21262D' : '#F6F8FA',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: cardBorder, borderStyle: 'dashed',
                }}>
                  <Plus size={16} color={colors.textSecondary} strokeWidth={2} />
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'center' }}>
                  Create Workspace
                </Text>
              </PressableScale>
            </ScrollView>
          )}
        </Animated.View>



        {/* System Diagnostics */}
        <Animated.View entering={FadeInDown.delay(150).duration(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 12 }]}>System Health</Text>
          
          {/* Stat cards row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {[
              { id: 'cpu' as const, label: 'CPU', value: `${cpuVal}%`, icon: Cpu },
              { id: 'memory' as const, label: 'Memory', value: `${ramVal}%`, icon: Database },
              { id: 'latency' as const, label: 'Latency', value: `${latVal}ms`, icon: Wifi },
            ].map(stat => {
              const isActive = activeMetric === stat.id
              const IconComp = stat.icon
              const statColor = isActive ? colors.text : colors.textSecondary
              return (
                <TouchableOpacity
                  key={stat.id}
                  onPress={() => setActiveMetric(stat.id)}
                  activeOpacity={0.7}
                  style={[styles.statCard, { 
                    backgroundColor: isActive ? (isDark ? '#1C2128' : '#ECEEF0') : cardBg,
                    borderColor: isActive ? colors.text + '30' : cardBorder,
                  }]}
                >
                  <IconComp size={14} color={statColor} strokeWidth={2} />
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10.5, marginTop: 6 }}>
                    {stat.label}
                  </Text>
                  <Text style={{ color: statColor, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 2, letterSpacing: -0.5 }}>
                    {stat.value}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Graph card */}
          <View style={[styles.graphCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {activeMetric === 'cpu' ? 'CPU Load' : activeMetric === 'memory' ? 'RAM Usage' : 'Network Latency'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 }}>
                  {activeMetric === 'cpu'
                    ? `${diagnostics ? diagnostics.runningContainers : 0} containers active`
                    : activeMetric === 'memory'
                    ? 'Virtual swap: 0%'
                    : 'Gateway: secure SSL'
                  }
                </Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#21262D' : '#F6F8FA', borderWidth: 1, borderColor: cardBorder, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                  {activeMetric === 'cpu' ? `${cpuVal}%` : activeMetric === 'memory' ? `${ramVal}%` : `${latVal}ms`}
                </Text>
              </View>
            </View>

            {/* Timeline selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: 10, alignSelf: 'flex-start' }}>
              {(['1h', '24h', '7d'] as const).map(t => {
                const isActive = selectedTimeline === t
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedTimeline(t)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: isActive ? (isDark ? '#21262D' : '#ECEEF0') : 'transparent',
                      borderWidth: 1,
                      borderColor: isActive ? cardBorder : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 10,
                      fontFamily: 'Inter_600SemiBold',
                      color: isActive ? colors.text : colors.textSecondary,
                      textTransform: 'uppercase',
                    }}>
                      {t === '1h' ? '1 Hr' : t === '24h' ? '24 Hr' : '7 Days'}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={{ height: 100 }}>
              <Svg width="100%" height="100" viewBox="0 0 350 100">
                <Defs>
                  <LinearGradient id="graphGlow" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={metricColor} stopOpacity="0.12" />
                    <Stop offset="1" stopColor={metricColor} stopOpacity="0.01" />
                  </LinearGradient>
                </Defs>

                {/* Subtle grid */}
                {[25, 50, 75].map(y => (
                  <Path key={y} d={`M 0 ${y} L 350 ${y}`} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} strokeWidth="0.5" strokeDasharray="3,5" />
                ))}

                {/* Area fill */}
                <Path
                  d={areaPath}
                  fill="url(#graphGlow)"
                />

                {/* Line */}
                <Path
                  d={linePath}
                  stroke={metricColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Data points */}
                {points.map((p, i) => (
                  <Circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill={metricColor} stroke={cardBg} strokeWidth="2" />
                ))}
              </Svg>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              {getGraphTimeLabels().map((t, i) => (
                <Text key={i} style={{ fontSize: 9, fontFamily: 'Inter_400Regular', color: colors.textSecondary, opacity: 0.6 }}>{t}</Text>
              ))}
            </View>
          </View>
        </Animated.View>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: cardBorder, gap: 12 }}>
            {user?.avatar_url && !avatarLoadError ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: subtleBg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                  {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }} numberOfLines={1}>
                {profileName || user?.name || user?.login}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                @{user?.login}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{ padding: 6 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('profile')
                router.push('/(tabs)/settings')
              }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuItemText, { color: colors.text }]}>Go to Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('main')
                router.push('/(tabs)/settings')
              }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                closePopoverInstantly()
                setSettingsSubScreen('billing')
                router.push('/(tabs)/settings')
              }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuItemText, { color: colors.text }]}>Billing & Usage</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: cardBorder, marginVertical: 4, opacity: 0.5 }} />

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                setProfileMenuVisible(false)
                setShowSignOutModal(true)
              }}
              style={styles.menuItem}
            >
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
  </>
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
  wsCard: {
    width: 140,
    height: 128,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed' as any,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
    textAlign: 'center',
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  graphCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
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
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
  },
})
