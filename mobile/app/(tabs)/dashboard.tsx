import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, Image, Modal, Alert, Pressable } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter, useFocusEffect } from 'expo-router'
import { BlurView } from 'expo-blur'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { cache } from '@/hooks/useCache'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  Cpu, 
  Sparkles,
  GitCommit,
  Plus,
  Box,
  Wifi,
  Database,
  ShieldCheck,
  ChevronRight,
  Activity,
  Key
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import { ConfirmModal } from '@/components/ConfirmModal'
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

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 85, easing: Easing.out(Easing.quad) }) }]
  }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = 0.96 }}
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
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])
  
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0.4, 1], [0.9, 1.3]) }]
  }))
  
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, animStyle]} />
    </View>
  )
}

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { setSettingsSubScreen, setTabBarVisible } = useUIStore()
  const [profileName, setProfileName] = useState('')
  const [profileMenuVisible, setProfileMenuVisible] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)

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

  const DashboardProjectSkeleton = () => (
    <View style={[styles.projectCard, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border, opacity: 0.6 }]}>
      <View style={styles.projectHeader}>
        <View style={[styles.projectIcon, { backgroundColor: isDark ? '#21262D' : '#E5E7EB', width: 36, height: 36, borderRadius: 10 }]} />
        <View style={{ backgroundColor: isDark ? '#21262D' : '#E5E7EB', width: 60, height: 16, borderRadius: 8 }} />
      </View>
      <View style={{ backgroundColor: isDark ? '#21262D' : '#E5E7EB', height: 16, width: '70%', borderRadius: 4, marginTop: 12 }} />
      <View style={{ backgroundColor: isDark ? '#21262D' : '#E5E7EB', height: 12, width: '40%', borderRadius: 4, marginTop: 8 }} />
    </View>
  )



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
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(160)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            Welcome back,
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {profileName || user?.name || user?.login || 'Developer'}
          </Text>
        </View>
        {/* User Avatar */}
        <PressableScale 
          onPress={() => setProfileMenuVisible(true)}
          style={[styles.avatarWrapper, { borderColor: colors.border, backgroundColor: isDark ? '#151922' : '#E5E7EB' }]}
        >
          {user?.avatar_url && !avatarLoadError ? (
            <Image 
              source={{ uri: user.avatar_url }} 
              style={{ width: 42, height: 42, borderRadius: 21 }} 
              onError={() => setAvatarLoadError(true)}
            />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {(profileName || user?.name || user?.login || 'C').substring(0, 1).toUpperCase()}
            </Text>
          )}
        </PressableScale>
      </Animated.View>

      {/* Your Workspaces Carousel */}
      <Animated.View entering={FadeInDown.delay(30).duration(160)} style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>RECENT WORKSPACES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/projects')}>
            <Text style={{ color: '#58A6FF', fontSize: 13, fontFamily: 'Inter_500Medium' }}>View All</Text>
          </TouchableOpacity>
        </View>

        {showSkeletonState ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            <DashboardProjectSkeleton />
            <DashboardProjectSkeleton />
          </ScrollView>
        ) : projects.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border }]}>
            <Box size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>No Workspaces Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Create your first project to get started</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 24 }}>
            {projects.map((project, idx) => (
              <Animated.View key={project.id} entering={FadeInRight.delay(40 + idx * 40).duration(180)}>
                <PressableScale 
                  style={[
                    styles.projectCard, 
                    { 
                      backgroundColor: isDark ? '#151922' : '#FFFFFF', 
                      borderWidth: 0,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.2 : 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                      overflow: 'hidden',
                      position: 'relative'
                    }
                  ]}
                  onPress={() => router.push(`/project/${project.id}`)}
                >
                  {/* Left accent strip for run status */}
                  <View 
                    style={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: 0, 
                      bottom: 0, 
                      width: 3.5, 
                      backgroundColor: project.status === 'running' ? '#3FB950' : '#8B929A' 
                    }} 
                  />
                  <View style={{ paddingLeft: 6, flex: 1, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.text, fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 13.5 }} numberOfLines={1}>
                        {project.name}
                      </Text>
                      {project.status === 'running' && <PulseDot color="#3FB950" />}
                    </View>
                    
                    <View style={{ gap: 2 }}>
                      <Text style={{ color: colors.textTertiary || colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10 }}>
                        TYPE: {project.type.toUpperCase()}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10.5 }}>
                        {project.status === 'running' ? 'Active now' : 'Idle container'}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Glassmorphic Quick Actions */}
      <Animated.View entering={FadeInDown.delay(60).duration(160)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 16 }]}>QUICK TOOLS</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* SSH Keys Pill */}
          <PressableScale 
            style={{ 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderWidth: 0,
              gap: 12
            }}
            onPress={() => {
              setSettingsSubScreen('gitSsh')
              router.push('/(tabs)/settings')
            }}
          >
            <View style={{ 
              width: 34, 
              height: 34, 
              borderRadius: 17, 
              backgroundColor: 'rgba(88, 166, 255, 0.12)', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Key size={16} color="#58A6FF" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>SSH Keys</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10.5, marginTop: 1 }}>Deploy keys</Text>
            </View>
            <ChevronRight size={14} color={colors.textSecondary} strokeWidth={1.5} />
          </PressableScale>

          {/* Copilot Pill */}
          <PressableScale 
            style={{ 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderWidth: 0,
              gap: 12
            }}
            onPress={() => router.push('/(tabs)/ai')}
          >
            <View style={{ 
              width: 34, 
              height: 34, 
              borderRadius: 17, 
              backgroundColor: 'rgba(210, 168, 255, 0.12)', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Sparkles size={16} color="#D2A8FF" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Copilot</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 10.5, marginTop: 1 }}>Ask AI</Text>
            </View>
            <ChevronRight size={14} color={colors.textSecondary} strokeWidth={1.5} />
          </PressableScale>
        </View>
      </Animated.View>

      {/* System Diagnostics */}
      <Animated.View entering={FadeInDown.delay(90).duration(160)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 16 }]}>SYSTEM DIAGNOSTICS</Text>
        <View style={{ borderWidth: 0, paddingHorizontal: 4 }}>
          
          {/* Row 1: Network Routing */}
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Wifi size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text }}>Network Routing</Text>
              </View>
              <Text style={{ fontSize: 12.5, fontFamily: 'JetBrainsMono_600SemiBold', color: '#3FB950' }}>
                optimal ({latency !== null ? `${latency}ms` : '12ms'})
              </Text>
            </View>
          </View>
          
          <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

          {/* Row 2: CPU Load */}
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Cpu size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text }}>Global CPU Load</Text>
              </View>
              <Text style={{ fontSize: 12.5, fontFamily: 'JetBrainsMono_600SemiBold', color: colors.text }}>
                {diagnostics ? `${diagnostics.cpuLoad}%` : '4%'}
              </Text>
            </View>
            <View style={{ height: 2.5, borderRadius: 1.25, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', marginTop: 8, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%', 
                  width: `${diagnostics ? Math.min(diagnostics.cpuLoad, 100) : 4}%`,
                  backgroundColor: diagnostics && diagnostics.cpuLoad > 80 ? '#F85149' : diagnostics && diagnostics.cpuLoad > 50 ? '#D97706' : '#3FB950'
                }} 
              />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

          {/* Row 3: Memory Usage */}
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Database size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text }}>VPS Memory Usage</Text>
              </View>
              <Text style={{ fontSize: 12.5, fontFamily: 'JetBrainsMono_600SemiBold', color: colors.text }}>
                {diagnostics ? `${diagnostics.memoryUsage}%` : '18%'}
              </Text>
            </View>
            <View style={{ height: 2.5, borderRadius: 1.25, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', marginTop: 8, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%', 
                  width: `${diagnostics ? Math.min(diagnostics.memoryUsage, 100) : 18}%`,
                  backgroundColor: diagnostics && diagnostics.memoryUsage > 80 ? '#F85149' : diagnostics && diagnostics.memoryUsage > 50 ? '#D97706' : '#3FB950'
                }} 
              />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

          {/* Row 4: Active Workspaces */}
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Box size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text }}>Active Workspaces</Text>
              </View>
              <Text style={{ fontSize: 12.5, fontFamily: 'JetBrainsMono_600SemiBold', color: colors.textSecondary }}>
                {diagnostics ? `${diagnostics.runningContainers} running` : '0 running'}
              </Text>
            </View>
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
        <Animated.View style={[styles.menuCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }, menuCardAnimatedStyle]}>
          {/* Header User Profile Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
            {user?.avatar_url && !avatarLoadError ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
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
            {/* Go to Profile */}
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

            {/* Settings */}
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

            {/* Billing */}
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

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4, opacity: 0.5 }} />

            {/* Sign Out */}
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
  content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 100 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24 
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FB950',
    shadowColor: '#3FB950',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: { fontSize: 11, letterSpacing: 0.5 },
  title: { fontSize: 22, letterSpacing: -0.6, marginTop: 4 },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: { marginBottom: 28 },
  sectionTitle: { 
    fontSize: 10.5, 
    letterSpacing: 1.0, 
  },
  projectCard: {
    width: width * 0.60,
    height: 110,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: 'Inter_600SemiBold',
  },
  projectName: {
    fontSize: 14,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  projectType: {
    fontSize: 11.5,
  },
  emptyCard: {
    width: '100%',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 14, marginBottom: 4 },
  emptySubtitle: { fontSize: 11.5 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  glassCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    height: 110,
    justifyContent: 'center',
  },
  glassIconBg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  glassTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  glassSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  diagContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  diagIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diagLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  diagValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  diagDivider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
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
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
  },
  diagRowContainer: {
    paddingVertical: 2,
  },
  meterTrack: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingHorizontal: 20,
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
