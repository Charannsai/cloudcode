import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useRouter } from 'expo-router'
import { 
  Cpu, 
  TrendingUp, 
  Clock, 
  Zap,
  ChevronRight,
  Terminal,
  Sparkles,
  GitCommit,
  FileCode,
  Activity,
  Plus,
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme()
  const { handleScroll } = useScrollVisibility()
  const router = useRouter()

  const stats = [
    { label: 'Workspaces', value: '12', icon: Activity, accent: '#3FB950' },
    { label: 'Uptime', value: '99.9%', icon: TrendingUp, accent: '#58A6FF' },
    { label: 'CPU Load', value: '24%', icon: Cpu, accent: '#D2A8FF' },
    { label: 'Sessions', value: '3', icon: Zap, accent: '#F0883E' },
  ]

  const recentActivity = [
    { action: 'Pushed to main', project: 'cloud-api-v2', time: '2m ago', icon: GitCommit },
    { action: 'Edited server.ts', project: 'auth-service', time: '15m ago', icon: FileCode },
    { action: 'Ran npm install', project: 'frontend-app', time: '1h ago', icon: Terminal },
  ]

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Welcome back</Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={[styles.newBtn, { backgroundColor: colors.text }]}
          onPress={() => router.push('/new-project')}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.background} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: stat.accent + '12' }]}>
                <stat.icon size={16} color={stat.accent} strokeWidth={1.8} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/projects')}
            activeOpacity={0.7}
          >
            <Terminal size={20} color={colors.text} strokeWidth={1.5} />
            <Text style={[styles.actionLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Open Terminal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/ai')}
            activeOpacity={0.7}
          >
            <Sparkles size={20} color={colors.text} strokeWidth={1.5} />
            <Text style={[styles.actionLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Ask AI</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Recent Activity */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>RECENT ACTIVITY</Text>
        <View style={[styles.activityList, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          {recentActivity.map((item, i) => {
            const Icon = item.icon
            return (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.activityItem,
                  i < recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                activeOpacity={0.6}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.background }]}>
                  <Icon size={14} color={colors.textSecondary} strokeWidth={1.8} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{item.action}</Text>
                  <Text style={[styles.activityMeta, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {item.project} · {item.time}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            )
          })}
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
    marginBottom: 32 
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  title: { fontSize: 28, letterSpacing: -0.8 },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10,
    marginBottom: 32 
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 22, letterSpacing: -0.5 },
  statLabel: { fontSize: 12 },
  section: { marginBottom: 28 },
  sectionTitle: { 
    fontSize: 11, 
    letterSpacing: 1, 
    marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  actionLabel: { fontSize: 13 },
  activityList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14 },
  activityMeta: { fontSize: 12, marginTop: 1, opacity: 0.7 },
})
