import { useState, useEffect } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, 
  TextInput, ActivityIndicator, Alert, Linking 
} from 'react-native'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { 
  Moon, Sun, Shield, LogOut, Github, Server, Lock, Cpu, ChevronRight,
  Key, Copy, RefreshCw, AlertCircle, Check
} from 'lucide-react-native'
import { ConfirmModal } from '@/components/ConfirmModal'
import { api } from '@/lib/api'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { colors, toggleTheme, isDark } = useAppTheme()
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  // Git Author Info state
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(false)

  // SSH Key state
  const [hasSshKey, setHasSshKey] = useState(false)
  const [sshPublicKey, setSshPublicKey] = useState<string | null>(null)
  const [sshHistory, setSshHistory] = useState<{ timestamp: string, publicKey: string }[]>([])
  const [generatingSsh, setGeneratingSsh] = useState(false)
  const [loadingSsh, setLoadingSsh] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      // 1. Load Git author info from cache
      const cachedName = await AsyncStorage.getItem('git_author_name')
      const cachedEmail = await AsyncStorage.getItem('git_author_email')
      if (cachedName) setGitName(cachedName)
      if (cachedEmail) setGitEmail(cachedEmail)

      // 2. Load SSH key status from global API
      try {
        const ssh = await api.git.ssh.globalGet()
        setHasSshKey(ssh.hasKey)
        setSshPublicKey(ssh.publicKey)
        setSshHistory(ssh.history || [])
      } catch (err) {
        console.warn('Failed to load global SSH key:', err)
      } finally {
        setLoadingSsh(false)
      }
    }
    loadData()
  }, [])

  const handleSaveConfig = async () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      Alert.alert('Error', 'Author Name and Email are required.')
      return
    }
    setLoadingConfig(true)
    try {
      await AsyncStorage.setItem('git_author_name', gitName.trim())
      await AsyncStorage.setItem('git_author_email', gitEmail.trim())
      Alert.alert('Success', 'Git credentials saved globally.')
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleGenerateSsh = async () => {
    setGeneratingSsh(true)
    try {
      const res = await api.git.ssh.globalGenerate()
      setHasSshKey(res.hasKey)
      setSshPublicKey(res.publicKey)
      setSshHistory(res.history || [])
      Alert.alert('Success', 'SSH Key Pair generated successfully.')
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setGeneratingSsh(false)
    }
  }

  const promptGenerateSsh = () => {
    if (hasSshKey) {
      Alert.alert(
        'Generate New Key?',
        'Generating a new SSH key will instantly overwrite your existing key. You will need to add the new key to GitHub, and the old one will stop working immediately. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Generate New Key', style: 'destructive', onPress: handleGenerateSsh }
        ]
      )
    } else {
      handleGenerateSsh()
    }
  }

  function handleSignOut() {
    setShowSignOutModal(true)
  }

  const confirmSignOut = () => {
    setShowSignOutModal(false)
    signOut()
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

      {/* Git & SSH Configuration */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>GIT & SSH CONFIGURATION</Text>
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border, padding: 16, gap: 16 }]}>
          
          {/* Author info */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Git Author Credentials</Text>
            <TextInput
              style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
              placeholder="Author Name (e.g. John Doe)"
              placeholderTextColor={colors.textSecondary + '60'}
              value={gitName}
              onChangeText={setGitName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.inputField, { color: colors.text, borderColor: colors.border }]}
              placeholder="Author Email"
              placeholderTextColor={colors.textSecondary + '60'}
              value={gitEmail}
              onChangeText={setGitEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={handleSaveConfig} 
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              disabled={loadingConfig}
              activeOpacity={0.8}
            >
              {loadingConfig ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                  Save Author Info
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

          {/* SSH Keys */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>SSH Deploy Keys</Text>
            
            {loadingSsh ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 8 }} />
            ) : hasSshKey && sshPublicKey ? (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: isDark ? 'rgba(63, 185, 80, 0.08)' : '#e6ffec', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(63, 185, 80, 0.2)' : '#3FB950', gap: 12 }}>
                  <Text style={{ color: isDark ? '#3FB950' : '#1a7f37', fontFamily: 'Inter_700Bold', fontSize: 13 }}>SSH Key Generated</Text>
                  
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>1. Copy your public key:</Text>
                    <TouchableOpacity 
                      onPress={() => { 
                        Clipboard.setStringAsync(sshPublicKey); 
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      style={{ backgroundColor: copied ? (isDark ? 'rgba(63, 185, 80, 0.15)' : '#e6ffec') : 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: copied ? '#3FB950' : colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, flex: 1 }} numberOfLines={1}>{sshPublicKey}</Text>
                      <Text style={{ color: copied ? '#3FB950' : colors.primary, fontSize: 11, fontFamily: 'Inter_700Bold', marginLeft: 8 }}>{copied ? 'COPIED ✓' : 'COPY'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>2. Add key to GitHub settings:</Text>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL('https://github.com/settings/ssh/new')}
                      style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 6 }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Open GitHub Settings ↗</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={promptGenerateSsh} 
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  disabled={generatingSsh}
                  activeOpacity={0.8}
                >
                  {generatingSsh ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Regenerate SSH Key</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                  Generate an SSH key pair to push commits and pull changes securely without typing credentials.
                </Text>
                <TouchableOpacity 
                  onPress={promptGenerateSsh} 
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  disabled={generatingSsh}
                  activeOpacity={0.8}
                >
                  {generatingSsh ? (
                    <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                      Generate SSH Key
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>SYSTEM STATUS</Text>
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#151922' : '#FFFFFF', borderColor: colors.border }]}>
          {[
            { label: 'Runtime Engine', value: 'v1.0.0', icon: Server },
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

      <View style={styles.footerContainer}>
        <Image
          source={require('../../assets/cloudcodelogo.png')}
          style={[styles.footerLogo, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <Text style={[styles.footerText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          v1.0.0
        </Text>
      </View>

      <ConfirmModal
        visible={showSignOutModal}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="logout"
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutModal(false)}
      />
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
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    gap: 8,
    opacity: 0.25,
  },
  footerLogo: {
    height: 40,
    width: 166,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  inputField: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  primaryBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
})
