import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import { api } from '@/lib/api'
import { Project } from '@/types'
import { 
  Cpu, 
  Terminal,
  Sparkles,
  GitCommit,
  Plus,
  Box,
  Wifi,
  Database,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue,
  Easing
} from 'react-native-reanimated'

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const router = useRouter()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Pulsing animation for server status dot
  const pulseAnim = useSharedValue(1)
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await api.projects.list()
      // Sort by recently updated if possible, or just take first 5
      setProjects(data.slice(0, 5))
    } catch (error) {
      console.warn('Failed to fetch projects', error)
    } finally {
      setLoading(false)
    }
  }

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }))

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Animated.View style={[styles.statusDot, pulseStyle]} />
            <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Secure Connection Active
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Overview</Text>
        </View>
        <TouchableOpacity 
          style={[styles.newBtn, { backgroundColor: isDark ? '#FFFFFF' : '#0E1116' }]}
          onPress={() => router.push('/new-project')}
          activeOpacity={0.8}
        >
          <Plus size={20} color={isDark ? '#000' : '#FFF'} strokeWidth={2.5} />
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

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {[1, 2].map((i) => (
              <View key={i} style={[styles.projectCard, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border }]}>
                <ActivityIndicator color={colors.textSecondary} style={{ alignSelf: 'center', marginTop: 40 }} />
              </View>
            ))}
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
                    <View style={[styles.statusBadge, { backgroundColor: project.status === 'running' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(101, 109, 118, 0.15)' }]}>
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
            style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
            onPress={() => router.push('/(tabs)/projects')}
            activeOpacity={0.8}
          >
            <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.glassCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.glassIconBg, { backgroundColor: 'rgba(88, 166, 255, 0.15)' }]}>
                <Terminal size={22} color="#58A6FF" strokeWidth={2} />
              </View>
              <Text style={[styles.glassTitle, { color: colors.text }]}>Terminal</Text>
              <Text style={[styles.glassSub, { color: colors.textSecondary }]}>Manage environments</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
            onPress={() => router.push('/(tabs)/ai')}
            activeOpacity={0.8}
          >
            <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.glassCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
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
            <Text style={[styles.diagValue, { color: '#3FB950' }]}>Optimal (12ms)</Text>
          </View>
          
          <View style={[styles.diagDivider, { backgroundColor: colors.border }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagIconGroup}>
              <Cpu size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.diagLabel, { color: colors.text }]}>Global CPU Load</Text>
            </View>
            <Text style={[styles.diagValue, { color: colors.textSecondary }]}>4%</Text>
          </View>

          <View style={[styles.diagDivider, { backgroundColor: colors.border }]} />

          <View style={styles.diagRow}>
            <View style={styles.diagIconGroup}>
              <Database size={18} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.diagLabel, { color: colors.text }]}>Storage Encryption</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} color="#3FB950" />
              <Text style={[styles.diagValue, { color: colors.textSecondary }]}>Active</Text>
            </View>
          </View>

        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 140 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 40 
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3FB950',
    shadowColor: '#3FB950',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  greeting: { fontSize: 12, letterSpacing: 0.5 },
  title: { fontSize: 32, letterSpacing: -1, marginTop: 4 },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: { marginBottom: 36 },
  sectionTitle: { 
    fontSize: 11, 
    letterSpacing: 1.2, 
  },
  projectCard: {
    width: width * 0.65,
    height: 140,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  projectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  projectName: {
    fontSize: 18,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  projectType: {
    fontSize: 13,
  },
  emptyCard: {
    width: '100%',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 16, marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 16 },
  glassCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    height: 140,
    justifyContent: 'center',
  },
  glassIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  glassTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  glassSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  diagContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  diagIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  diagValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  diagDivider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  }
})
