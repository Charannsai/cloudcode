import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, Image } from 'react-native'
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
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue,
  Easing,
  interpolate
} from 'react-native-reanimated'

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
  const { user } = useAuthStore()
  const { setSettingsSubScreen } = useUIStore()
  const [profileName, setProfileName] = useState('')
  
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
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            Welcome back,
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {profileName || user?.name || user?.login || 'Developer'}
          </Text>
        </View>
        {/* User Avatar */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            setSettingsSubScreen('profile')
            router.push('/(tabs)/settings')
          }}
          style={[styles.avatarWrapper, { borderColor: colors.border, backgroundColor: isDark ? '#151922' : '#E5E7EB' }]}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {(user?.login || 'D').substring(0, 1).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Your Workspaces Carousel */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 24 }}>
            {projects.map((project, idx) => (
              <Animated.View key={project.id} entering={FadeInRight.delay(200 + idx * 100)}>
                <TouchableOpacity 
                  style={[styles.projectCard, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border }]}
                  onPress={() => router.push(`/project/${project.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.projectHeader}>
                    <View style={[styles.projectIcon, { backgroundColor: isDark ? '#21262D' : '#E5E7EB' }]}>
                      {project.type === 'react' ? (
                        <Activity size={18} color="#58A6FF" />
                      ) : (
                        <Box size={18} color="#3FB950" />
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: project.status === 'running' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(101, 109, 118, 0.12)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      {project.status === 'running' ? (
                        <PulseDot color="#3FB950" />
                      ) : (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, opacity: 0.6 }} />
                      )}
                      <Text style={[styles.statusText, { color: project.status === 'running' ? '#3FB950' : colors.textSecondary }]}>
                        {project.status === 'running' ? 'Running' : 'Sleeping'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={[styles.projectType, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {project.type === 'react' ? 'React App' : project.type === 'node' ? 'Node.js Server' : 'Empty Project'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Glassmorphic Quick Actions */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 16 }]}>QUICK TOOLS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
            onPress={() => {
              setSettingsSubScreen('gitSsh')
              router.push('/(tabs)/settings')
            }}
            activeOpacity={0.8}
          >
            <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.glassCard, { borderColor: colors.border }]}>
              <View style={[styles.glassIconBg, { backgroundColor: 'rgba(88, 166, 255, 0.15)' }]}>
                <Key size={22} color="#58A6FF" strokeWidth={2} />
              </View>
              <Text style={[styles.glassTitle, { color: colors.text }]}>SSH Keys</Text>
              <Text style={[styles.glassSub, { color: colors.textSecondary }]}>Manage deploy keys</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
            onPress={() => router.push('/(tabs)/ai')}
            activeOpacity={0.8}
          >
            <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.glassCard, { borderColor: colors.border }]}>
              <View style={[styles.glassIconBg, { backgroundColor: 'rgba(210, 168, 255, 0.15)' }]}>
                <Sparkles size={22} color="#D2A8FF" strokeWidth={2} />
              </View>
              <Text style={[styles.glassTitle, { color: colors.text }]}>Copilot</Text>
              <Text style={[styles.glassSub, { color: colors.textSecondary }]}>Ask AI assistant</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* System Diagnostics */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 16 }]}>SYSTEM DIAGNOSTICS</Text>
        <View style={[styles.diagContainer, { backgroundColor: isDark ? '#0D1117' : '#FFFFFF', borderColor: colors.border }]}>
          
          <View style={styles.diagRow}>
            <View style={styles.diagIconGroup}>
              <Wifi size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.diagLabel, { color: colors.text }]}>Network Routing</Text>
            </View>
            <Text style={[styles.diagValue, { color: '#3FB950' }]}>
              Optimal ({latency !== null ? `${latency}ms` : '12ms'})
            </Text>
          </View>
          
          <View style={[styles.diagDivider, { backgroundColor: colors.border }]} />

          <View style={styles.diagRowContainer}>
            <View style={styles.diagRow}>
              <View style={styles.diagIconGroup}>
                <Cpu size={18} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.diagLabel, { color: colors.text }]}>Global CPU Load</Text>
              </View>
              <Text style={[styles.diagValue, { color: colors.text }]}>
                {diagnostics ? `${diagnostics.cpuLoad}%` : '4%'}
              </Text>
            </View>
            <View style={[styles.meterTrack, { backgroundColor: isDark ? '#1C2128' : '#E5E7EB' }]}>
              <View 
                style={[
                  styles.meterFill, 
                  { 
                    width: `${diagnostics ? Math.min(diagnostics.cpuLoad, 100) : 4}%`,
                    backgroundColor: diagnostics && diagnostics.cpuLoad > 80 ? '#F85149' : diagnostics && diagnostics.cpuLoad > 50 ? '#D97706' : '#3FB950'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={[styles.diagDivider, { backgroundColor: colors.border }]} />

          <View style={styles.diagRowContainer}>
            <View style={styles.diagRow}>
              <View style={styles.diagIconGroup}>
                <Database size={18} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.diagLabel, { color: colors.text }]}>VPS Memory Usage</Text>
              </View>
              <Text style={[styles.diagValue, { color: colors.text }]}>
                {diagnostics ? `${diagnostics.memoryUsage}%` : '18%'}
              </Text>
            </View>
            <View style={[styles.meterTrack, { backgroundColor: isDark ? '#1C2128' : '#E5E7EB' }]}>
              <View 
                style={[
                  styles.meterFill, 
                  { 
                    width: `${diagnostics ? Math.min(diagnostics.memoryUsage, 100) : 18}%`,
                    backgroundColor: diagnostics && diagnostics.memoryUsage > 80 ? '#F85149' : diagnostics && diagnostics.memoryUsage > 50 ? '#D97706' : '#3FB950'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={[styles.diagDivider, { backgroundColor: colors.border }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagIconGroup}>
              <Box size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.diagLabel, { color: colors.text }]}>Active Workspaces</Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textSecondary }]}>
              {diagnostics ? `${diagnostics.runningContainers} running` : '1 running'}
            </Text>
          </View>

        </View>
      </Animated.View>
    </ScrollView>
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
})
