import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Switch, ScrollView } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { theme, colors, toggleTheme, isDark } = useAppTheme()

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Theme Toggle */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLead}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.login?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || `@${user?.login}` || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'No public email'}</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: 'Cloud ID', value: user?.id || '—' },
            { label: 'App Version', value: '1.2.0' },
            { label: 'Engine', value: 'CloudCore Node/20' },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.error + '40', backgroundColor: colors.error + '10' }]} onPress={handleSignOut}>
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>
      
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>Made with ❤️ for developers</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  section: { paddingHorizontal: 24, paddingTop: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12, opacity: 0.8 },
  card: {
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingRight: 16,
  },
  rowLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowLabel: { fontSize: 17, fontWeight: '600' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '800' },
  profileEmail: { fontSize: 15, opacity: 0.7 },
  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoLabel: { fontSize: 16, opacity: 0.8, fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'right' },
  signOutBtn: {
    margin: 24,
    marginTop: 40,
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
  },
  signOutText: { fontWeight: '900', fontSize: 18 },
  footerText: { textAlign: 'center', fontSize: 13, marginBottom: 48, opacity: 0.5 },
})

