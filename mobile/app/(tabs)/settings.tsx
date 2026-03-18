import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native'
import { useAuthStore } from '@/store/auth'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.profileCard}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.login?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || `@${user?.login}` || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'No public email'}</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Cloud ID', value: user?.id || '—' },
            { label: 'App Version', value: '1.0.0' },
            { label: 'Phase', value: 'Phase 0' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4a4a6a', letterSpacing: 1, marginBottom: 10 },
  profileCard: {
    backgroundColor: '#0e0e1a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#ffffff0d',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e1e30',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c6bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  profileEmail: { fontSize: 14, color: '#5a5a7a' },
  infoCard: {
    backgroundColor: '#0e0e1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff0d',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
    gap: 10,
  },
  infoLabel: { fontSize: 15, color: '#8a8a9a' },
  infoValue: { fontSize: 15, color: '#ffffff', fontWeight: '600', flex: 1, textAlign: 'right' },
  signOutBtn: {
    margin: 20,
    marginTop: 'auto',
    marginBottom: 40,
    backgroundColor: '#ef444415',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  signOutText: { color: '#ef4444', fontWeight: '800', fontSize: 17 },
})
