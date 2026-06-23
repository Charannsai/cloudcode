import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Image, Modal, Pressable } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { cache } from '@/hooks/useCache'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
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
      style={style}
    >
      <Animated.View style={animatedStyle}>
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
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)

  // Load cached projects on startup
  useEffect(() => {
    async function loadCached() {
      const cached = await cache.get<Project[]>('cached_projects')
      if (cached) {
        setProjects(cached.slice(0, 5))
      }
    }
    loadCached()
  }, [])

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

  const fetchProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await api.projects.list()
      const sorted = data.slice(0, 5)
      setProjects(sorted)
      await cache.set('cached_projects', data)
    } catch (error) {
      console.warn('Failed to fetch projects', error)
    } finally {
      setLoading(false)
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

  const metricColor = activeMetric === 'cpu' 
    ? (isDark ? '#D2A8FF' : '#8B5CF6') 
    : activeMetric === 'memory' 
    ? (isDark ? '#58A6FF' : '#3B82F6') 
    : (isDark ? '#3FB950' : '#22C55E')

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
                <View key={i} style={[styles.wsCard, { backgroundColor: subtleBg, borderColor: cardBorder }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? '#30363D' : '#E5E7EB' }} />
                  <View style={{ marginTop: 14 }}>
                    <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: isDark ? '#30363D' : '#E5E7EB' }} />
                    <View style={{ width: 60, height: 10, borderRadius: 4, backgroundColor: isDark ? '#30363D' : '#E5E7EB', marginTop: 6 }} />
                  </View>
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
                      {/* Icon */}
                      <View style={{
                        width: 46, height: 46, borderRadius: 12,
                        backgroundColor: techColors.bg,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ProjectIcon type={project.type} name={project.name} githubUrl={project.github_url} size={24} isDark={isDark} />
                      </View>

                      {/* Name + Tech column */}
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5, letterSpacing: -0.2 }} numberOfLines={1}>
                          {project.name}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 11.5, marginTop: 2, textTransform: 'capitalize' }}>
                          {tech}
                        </Text>
                      </View>

                      {/* Status badge */}
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 5,
                        backgroundColor: isRunning ? (isDark ? 'rgba(63,185,80,0.12)' : 'rgba(34,197,94,0.08)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}>
                        {isRunning ? (
                          <>
                            <PulseDot color="#3FB950" />
                            <Text style={{ color: isDark ? '#3FB950' : '#16A34A', fontSize: 10.5, fontFamily: 'Inter_600SemiBold' }}>Active</Text>
                          </>
                        ) : (
                          <>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: 0.5 }} />
                            <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontFamily: 'Inter_500Medium' }}>Idle</Text>
                          </>
                        )}
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
                  flexDirection: 'row',
                  gap: 8
                }]}
                onPress={() => router.push('/new-project')}
              >
                <Plus size={16} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Create Workspace</Text>
              </PressableScale>
            </ScrollView>
          )}
        </Animated.View>

        {/* Quick Actions - Premium 3-Column Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 12 }]}>Quick Actions</Text>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* New Workspace */}
            <PressableScale 
              onPress={() => router.push('/new-project')}
              style={{ flex: 1 }}
            >
              <View style={[styles.qaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.qaIconWrapper, { backgroundColor: isDark ? 'rgba(63,185,80,0.12)' : 'rgba(34,197,94,0.08)' }]}>
                  <Zap size={16} color={isDark ? '#3FB950' : '#22C55E'} strokeWidth={2.5} />
                </View>
                <Text style={[styles.qaText, { color: colors.text }]} numberOfLines={1}>
                  New Workspace
                </Text>
              </View>
            </PressableScale>

            {/* AI Copilot */}
            <PressableScale 
              onPress={() => router.push('/(tabs)/ai')}
              style={{ flex: 1 }}
            >
              <View style={[styles.qaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.qaIconWrapper, { backgroundColor: isDark ? 'rgba(210,168,255,0.12)' : 'rgba(139,92,246,0.08)' }]}>
                  <Sparkles size={16} color={isDark ? '#D2A8FF' : '#8B5CF6'} strokeWidth={2} />
                </View>
                <Text style={[styles.qaText, { color: colors.text }]} numberOfLines={1}>
                  AI Copilot
                </Text>
              </View>
            </PressableScale>

            {/* SSH Keys */}
            <PressableScale 
              onPress={() => { setSettingsSubScreen('gitSsh'); router.push('/(tabs)/settings') }}
              style={{ flex: 1 }}
            >
              <View style={[styles.qaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.qaIconWrapper, { backgroundColor: isDark ? 'rgba(88,166,255,0.12)' : 'rgba(59,130,246,0.08)' }]}>
                  <Key size={16} color={isDark ? '#58A6FF' : '#3B82F6'} strokeWidth={2} />
                </View>
                <Text style={[styles.qaText, { color: colors.text }]} numberOfLines={1}>
                  SSH Keys
                </Text>
              </View>
            </PressableScale>
          </View>
        </Animated.View>

        {/* System Diagnostics */}
        <Animated.View entering={FadeInDown.delay(150).duration(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 12 }]}>System Health</Text>
          
          {/* Stat cards row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {[
              { id: 'cpu' as const, label: 'CPU', value: `${cpuVal}%`, icon: Cpu, color: isDark ? '#D2A8FF' : '#8B5CF6' },
              { id: 'memory' as const, label: 'Memory', value: `${ramVal}%`, icon: Database, color: isDark ? '#58A6FF' : '#3B82F6' },
              { id: 'latency' as const, label: 'Latency', value: `${latVal}ms`, icon: Wifi, color: isDark ? '#3FB950' : '#22C55E' },
            ].map(stat => {
              const isActive = activeMetric === stat.id
              const IconComp = stat.icon
              return (
                <TouchableOpacity
                  key={stat.id}
                  onPress={() => setActiveMetric(stat.id)}
                  activeOpacity={0.7}
                  style={[styles.statCard, { 
                    backgroundColor: isActive ? (isDark ? '#1C2333' : '#F0F4FF') : cardBg,
                    borderColor: isActive ? stat.color + '40' : cardBorder,
                  }]}
                >
                  <IconComp size={14} color={stat.color} strokeWidth={2} />
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10.5, marginTop: 6 }}>
                    {stat.label}
                  </Text>
                  <Text style={{ color: isActive ? stat.color : colors.text, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 2, letterSpacing: -0.5 }}>
                    {stat.value}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Graph card */}
          <View style={[styles.graphCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
              <View style={{ backgroundColor: metricColor + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: metricColor, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                  {activeMetric === 'cpu' ? `${cpuVal}%` : activeMetric === 'memory' ? `${ramVal}%` : `${latVal}ms`}
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }}>
              <Svg width="100%" height="100" viewBox="0 0 350 100">
                <Defs>
                  <LinearGradient id="graphGlow" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={metricColor} stopOpacity="0.2" />
                    <Stop offset="1" stopColor={metricColor} stopOpacity="0.02" />
                  </LinearGradient>
                </Defs>

                {/* Subtle grid */}
                {[25, 50, 75].map(y => (
                  <Path key={y} d={`M 0 ${y} L 350 ${y}`} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} strokeWidth="0.5" strokeDasharray="3,5" />
                ))}

                {/* Area fill */}
                <Path
                  d={activeMetric === 'cpu' 
                    ? "M 0 70 C 35 30, 70 60, 105 25 C 140 50, 175 80, 210 35 C 245 15, 280 60, 350 45 L 350 100 L 0 100 Z"
                    : activeMetric === 'memory'
                    ? "M 0 55 C 40 50, 80 58, 120 52 C 160 55, 200 48, 240 53 C 280 49, 320 45, 350 42 L 350 100 L 0 100 Z"
                    : "M 0 30 C 35 35, 70 25, 105 70 C 140 25, 175 30, 210 32 C 245 28, 280 26, 350 30 L 350 100 L 0 100 Z"
                  }
                  fill="url(#graphGlow)"
                />

                {/* Line */}
                <Path
                  d={activeMetric === 'cpu' 
                    ? "M 0 70 C 35 30, 70 60, 105 25 C 140 50, 175 80, 210 35 C 245 15, 280 60, 350 45"
                    : activeMetric === 'memory'
                    ? "M 0 55 C 40 50, 80 58, 120 52 C 160 55, 200 48, 240 53 C 280 49, 320 45, 350 42"
                    : "M 0 30 C 35 35, 70 25, 105 70 C 140 25, 175 30, 210 32 C 245 28, 280 26, 350 30"
                  }
                  stroke={metricColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Data points */}
                {(activeMetric === 'cpu' ? [[105,25],[210,35],[350,45]] 
                  : activeMetric === 'memory' ? [[120,52],[240,53],[350,42]]
                  : [[105,70],[210,32],[350,30]]
                ).map(([cx, cy], i) => (
                  <Circle key={i} cx={cx} cy={cy} r="3.5" fill={metricColor} stroke={cardBg} strokeWidth="2" />
                ))}
              </Svg>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              {['Now -20m', '-15m', '-10m', '-5m', 'Now'].map((t, i) => (
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
    width: SCREEN_WIDTH * 0.76,
    height: 92,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
