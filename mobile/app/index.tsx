import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, ScrollView, Platform,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function WelcomeScreen() {
  const { user, loading } = useAuthStore()
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/projects')
    }
  }, [user, loading, router])

  async function signInWithGitHub() {
    setSigningIn(true)
    try {
      const expoDeepLink = Linking.createURL('/auth')
      const githubOAuthUrl = `${API_URL}/api/auth/github?redirect_uri=${encodeURIComponent(expoDeepLink)}`

      const result = await WebBrowser.openAuthSessionAsync(
        githubOAuthUrl,
        'cloudcode://auth',
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      )

      if (result.type === 'success' && result.url) {
        Linking.openURL(result.url)
      }
    } catch (err) {
      console.error('Sign in error:', err)
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background orbs */}
      <View style={[styles.orb1, { backgroundColor: colors.primary + '15' }]} />
      <View style={[styles.orb2, { backgroundColor: colors.accent + '10' }]} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="cloud" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>CloudCode</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>
            Develop anywhere.{'\n'}Deploy everywhere.
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            The first IDE built for mobile first.{'\n'}Full shell access, live preview, and Docker control.
          </Text>
        </View>

        {/* Feature Grid alternative */}
        <View style={styles.grid}>
          {[
            { icon: 'terminal', label: 'Real Terminal', sub: 'Low latency streaming' },
            { icon: 'logo-github', label: 'GitHub Sync', sub: 'Instant repo import' },
            { icon: 'cube-outline', label: 'Sandboxed', sub: 'Isolated Docker nodes' },
            { icon: 'flash-outline', label: 'Fast Preview', sub: 'Hot reloading tunnel' },
          ].map(({ icon, label, sub }) => (
            <View key={label} style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background }]}>
                <Ionicons name={icon as any} size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.gridLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action area */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[styles.githubBtn, signingIn && styles.githubBtnDisabled]}
            onPress={signInWithGitHub}
            disabled={signingIn}
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-github" size={24} color="#fff" />
                <Text style={styles.githubBtnText}>Continue with GitHub</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            Secure. Private. Open Source.{'\n'}By signing in, you agree to our <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms</Text>.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: height * 0.12,
    paddingBottom: 60,
  },
  orb1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.4,
    right: -width * 0.3,
  },
  orb2: {
    position: 'absolute',
    width: width * 1,
    height: width * 1,
    borderRadius: width * 0.5,
    bottom: -width * 0.2,
    left: -width * 0.4,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
    opacity: 0.8,
  },
  tagline: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -1,
    marginBottom: 16,
  },
  sub: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 48,
  },
  gridItem: {
    width: (width - 56 - 12) / 2,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { fontSize: 16, fontWeight: '800' },
  gridSub: { fontSize: 12, opacity: 0.7, fontWeight: '500' },
  actionArea: {
    width: '100%',
    alignItems: 'center',
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#000',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 24,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  githubBtnDisabled: { opacity: 0.6 },
  githubBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  terms: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
  },
})

