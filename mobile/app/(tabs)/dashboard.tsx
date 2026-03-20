import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Clock, 
  Zap,
  ChevronRight,
  Code2,
  Cpu
} from 'lucide-react-native'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'

export default function DashboardScreen() {
  const { colors } = useAppTheme()
  const { handleScroll } = useScrollVisibility()

  const stats = [
    { label: 'Workspaces', value: '12', icon: LayoutDashboard, color: '#6366f1' },
    { label: 'Uptime', value: '99.9%', icon: TrendingUp, color: '#10b981' },
    { label: 'CPU Usage', value: '24%', icon: Cpu, color: '#f59e0b' },
    { label: 'Active Sessions', value: '3', icon: Zap, color: '#ec4899' },
  ]

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back to CloudCode</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <stat.icon size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {[1, 2, 3].map((_, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.activityIcon}>
              <Clock size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>Updated main.js</Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>2 hours ago • cloud-api-v2</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Code2 size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Open Editor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Cpu size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Cloud Shell</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 64, paddingBottom: 160 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12,
    marginBottom: 32 
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  activityTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  actionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
})
