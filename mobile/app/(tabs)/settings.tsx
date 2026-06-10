import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Switch, ScrollView } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Moon, Sun, Shield, LogOut, Github, Server, Lock, Cpu, ChevronRight } from 'lucide-react-native'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { colors, toggleTheme, isDark } = useAppTheme()

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  const ThemeIcon = isDark ? Moon : Sun

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Settings</Text>
      </View>

      {/* Profile */}
      <View style={[styles.profileCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.background }]}>
              <Text style={[styles.avatarText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {user?.login?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              {user?.name || user?.login}
            </Text>
            <View style={styles.profileBadgeRow}>
              <Github size={11} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.profileSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                GitHub · Authenticated
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={colors.textSecondary} strokeWidth={1.5} />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>PREFERENCES</Text>
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
                <ThemeIcon size={16} color={colors.text} strokeWidth={1.5} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.text }}
              thumbColor={colors.background}
            />
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>SYSTEM STATUS</Text>
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          {[
            { label: 'Runtime Engine', value: 'v2.4.10', icon: Server },
            { label: 'Cloud Gateway', value: 'Active', icon: Cpu, valueColor: '#3FB950' },
            { label: 'Encryption', value: 'AES-256', icon: Lock },
          ].map((item, idx, arr) => (
            <View 
              key={item.label} 
              style={[
                styles.row,
                idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
                  <item.icon size={16} color={colors.text} strokeWidth={1.5} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{item.label}</Text>
              </View>
              <Text style={[styles.rowValue, { 
                color: item.valueColor || colors.textSecondary, 
                fontFamily: 'JetBrainsMono_400Regular' 
              }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity 
        style={[styles.signOutBtn, { borderColor: colors.border }]}
        onPress={handleSignOut}
        activeOpacity={0.6}
      >
        <LogOut size={16} color={'#F85149'} strokeWidth={1.5} />
        <Text style={[styles.signOutText, { color: '#F85149', fontFamily: 'Inter_500Medium' }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        CloudCode · Production
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  title: { fontSize: 28, letterSpacing: -0.8 },
  profileCard: {
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { 
    width: 44, height: 44, borderRadius: 22, 
    alignItems: 'center', justifyContent: 'center' 
  },
  avatarText: { fontSize: 18 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, letterSpacing: -0.2 },
  profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  profileSub: { fontSize: 12, opacity: 0.7 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 12 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: { fontSize: 14 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 32,
    opacity: 0.3,
  },
})
