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
  Zap,
  User,
  Settings,
  CreditCard,
  LogOut
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
import { TabGenieWrapper } from '@/components/TabGenieWrapper'

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
  const subtleBg = isDark ? '#1A1C23' : '#FAFAFA'

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

  const generateHistoricalData = (currentVal: number, count: number, metric: 'cpu' | 'memory' | 'latency') => {
    const data: number[] = []
    const now = Date.now()
    
    const timeStep = selectedTimeline === '1h' 
      ? 5 * 60 * 1000 
      : selectedTimeline === '24h' 
      ? 2 * 60 * 1000 * 60 
      : 24 * 60 * 60 * 1000

    const offset = metric === 'cpu' ? 10 : metric === 'memory' ? 25 : 40

    for (let i = 0; i < count - 1; i++) {
      const pointTime = now - (count - 1 - i) * timeStep
      const indexSeed = Math.floor(pointTime / timeStep) + offset
      
      let val = currentVal
      if (metric === 'cpu') {
        const wave = Math.sin(indexSeed * 1.8) * 15 + Math.cos(indexSeed * 3.7) * 12
        const spike = (indexSeed % 5 === 0) ? 22 : (indexSeed % 7 === 0) ? -18 : 0
        val = Math.round(currentVal + wave + spike)
        val = Math.max(8, Math.min(85, val))
      } else if (metric === 'memory') {
        const wave = Math.sin(indexSeed * 0.4) * 8 + Math.cos(indexSeed * 0.9) * 4
        val = Math.round(currentVal + wave)
        val = Math.max(20, Math.min(75, val))
      } else {
        const baseline = 12 + Math.sin(indexSeed * 0.5) * 4
        const spike = (indexSeed % 4 === 0) ? 75 : (indexSeed % 9 === 0) ? 110 : 0
        val = Math.round(baseline + spike)
        val = Math.max(5, Math.min(160, val))
      }
      
      data.push(val)
    }
    
    data.push(currentVal)
    return data
  }

  const getCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return ''
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 3
      const cp1y = p0.y
      const cp2x = p1.x - (p1.x - p0.x) / 3
      const cp2y = p1.y
      
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
    }
    return path
  }

  const getGraphData = () => {
    const currentVal = activeMetric === 'cpu' ? cpuVal : activeMetric === 'memory' ? ramVal : latVal
    
    const values = selectedTimeline === '7d' 
      ? generateHistoricalData(currentVal, 7, activeMetric)
      : generateHistoricalData(currentVal, 12, activeMetric)
      
    const points = values.map((val, idx) => {
      const x = idx * (350 / (values.length - 1))
      let pct = val
      if (activeMetric === 'latency') {
        pct = Math.min(100, (val / 150) * 100)
      }
      const y = 90 - (pct * 0.8)
      return { x, y }
    })
    
    const linePath = getCurvePath(points)
    const areaPath = `${linePath} L 350 100 L 0 100 Z`
    
    return { points, linePath, areaPath }
  }

  const { points, linePath, areaPath } = getGraphData()

  const metricColor = colors.text

  return (
    <TabGenieWrapper index={0}>
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
            <View style={{ gap: 1 }}>
              {projects.map((project, idx) => {
                const tech = detectProjectTech(project.type, project.name, project.github_url)
                const techColors = getTechColors(tech, isDark)
                const isRunning = project.status === 'running'
                
                return (
                  <Animated.View key={project.id} entering={FadeInRight.delay(30 + idx * 30).duration(200)}>
                    <PressableScale 
                      style={[styles.wsRow, { borderBottomColor: cardBorder }]}
                      onPress={() => router.push(`/project/${project.id}`)}
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
                  </Animated.View>
                )
              })}

              {/* Add New Row */}
              <TouchableOpacity
                style={styles.addWorkspaceRow}
                onPress={() => router.push('/new-project')}
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
        </Animated.View>

        {/* System Diagnostics */}
        <Animated.View entering={FadeInDown.delay(100).duration(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 10 }]}>System Health</Text>
          <View style={[styles.healthStrip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {[
              { label: 'CPU Load', value: `${cpuVal}%`, icon: Cpu },
              { label: 'Memory', value: `${ramVal}%`, icon: Database },
              { label: 'Latency', value: `${latVal}ms`, icon: Wifi },
            ].map((stat, idx) => {
              const IconComp = stat.icon
              return (
                <React.Fragment key={idx}>
                  <View style={styles.healthItem}>
                    <IconComp size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <View>
                      <Text style={{ fontSize: 9, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>{stat.label}</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.text, marginTop: 1 }}>{stat.value}</Text>
                    </View>
                  </View>
                  {idx < 2 && <View style={[styles.healthDivider, { backgroundColor: cardBorder }]} />}
                </React.Fragment>
              )
            })}
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
                router.push('/(tabs)/settings')
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
                router.push('/(tabs)/settings')
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
                router.push('/(tabs)/settings')
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
  healthStrip: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  healthDivider: {
    width: 1,
    height: 24,
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
