import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Switch, ScrollView } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Moon, Sun, User, Info, LogOut, ChevronRight, Github, Shield } from 'lucide-react-native'

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.text }]}>
                <Text style={[styles.avatarText, { color: colors.card }]}>
                  {user?.login?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.githubBadge, { backgroundColor: colors.text }]}>
              <Github size={10} color={colors.card} strokeWidth={3} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name || `@${user?.login}`}
            </Text>
            <View style={styles.profileStatus}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || 'Connected via GitHub'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <ThemeIcon size={20} color={colors.text} strokeWidth={2} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.text }}
              thumbColor={colors.card}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT & SECURITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Shield size={20} color={colors.text} strokeWidth={2} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Active Sessions</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SYSTEM INFO</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: 'CloudCore Engine', value: 'v2.4.0', icon: Info },
            { label: 'Workspace Hub', value: 'Stable', icon: User },
          ].map((item, idx, arr) => (
            <View 
              key={item.label} 
              style={[
                styles.row, 
                idx !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                  <item.icon size={20} color={colors.text} strokeWidth={2} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.signOutBtn, { backgroundColor: colors.errorBackground, borderColor: colors.error + '20' }]} 
        onPress={handleSignOut}
      >
        <LogOut size={20} color={colors.error} strokeWidth={2.5} style={{ marginRight: 12 }} />
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        CloudCode Mobile Edition • Made with care
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
  title: { 
    fontSize: 28, 
    fontFamily: 'Inter_900Black', 
    letterSpacing: -1,
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { 
    fontSize: 11, 
    fontFamily: 'Inter_700Bold', 
    letterSpacing: 1, 
    marginBottom: 12, 
    marginLeft: 8,
    opacity: 0.6 
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  profileCard: {
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontFamily: 'Inter_800ExtraBold' },
  githubBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  profileStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    minHeight: 64,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  signOutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  signOutText: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 16,
  },
  footerText: { 
    textAlign: 'center', 
    fontSize: 12, 
    fontFamily: 'Inter_500Medium',
    marginTop: 32,
    marginBottom: 60, 
    opacity: 0.4 
  },
})

