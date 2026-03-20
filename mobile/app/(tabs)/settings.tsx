import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Switch, ScrollView } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Moon, Sun, Shield, Info, LogOut, ChevronRight, Github, Monitor, Database } from 'lucide-react-native'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { colors, toggleTheme, isDark } = useAppTheme()

  function handleSignOut() {
    Alert.alert('Session', 'Terminate this active session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate', style: 'destructive', onPress: signOut },
    ])
  }

  const ThemeIcon = isDark ? Moon : Sun

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>System</Text>
      </View>

      {/* Profile Section */}
      <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
        <View style={styles.avatarWrapper}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
              <Text style={[styles.avatarText, { color: colors.text }]}>{user?.login?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: colors.text }]}>
            <Github size={10} color={colors.background} strokeWidth={3} />
          </View>
        </View>
        <View style={styles.profileMeta}>
          <Text style={[styles.profileName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            {user?.name || user?.login}
          </Text>
          <Text style={[styles.profileSub, { color: colors.textSecondary }]}>GitHub Authenticated</Text>
        </View>
      </View>

      <View style={styles.list}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCES</Text>
        
        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <ThemeIcon size={20} color={colors.text} strokeWidth={2} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Interface</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.text }}
            thumbColor={colors.background}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>NODE STATUS</Text>

        {[
          { label: 'Control Plane', value: 'v2.4.10', icon: Monitor },
          { label: 'Cloud Gateway', value: 'Active', icon: Database },
          { label: 'Security Layer', value: 'Encrypted', icon: Shield },
        ].map((item, idx) => (
          <View 
            key={item.label} 
            style={[
              styles.row, 
              { borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}
          >
            <View style={styles.rowLeft}>
              <item.icon size={20} color={colors.text} strokeWidth={2} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.signOutBtn}
        onPress={handleSignOut}
        activeOpacity={0.6}
      >
        <LogOut size={18} color={colors.error} strokeWidth={2} />
        <Text style={[styles.signOutText, { color: colors.error, fontFamily: 'Inter_500Medium' }]}>Terminate Session</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        CloudCode Engine • Production Environment
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 20,
  },
  title: { fontSize: 24, letterSpacing: -0.5 },
  profileSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 16 },
  profileSub: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  list: { marginTop: 20 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginHorizontal: 24,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 13, opacity: 0.7 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
    marginHorizontal: 24,
    paddingVertical: 12,
  },
  signOutText: { fontSize: 15 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 40,
    marginBottom: 160,
    opacity: 0.4,
  },
})

