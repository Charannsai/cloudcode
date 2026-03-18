import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'

const { width } = Dimensions.get('window')
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function WelcomeScreen() {
  const { user, loading } = useAuthStore()
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
      // Opens our backend which redirects to GitHub OAuth
      // GitHub will redirect back to our backend callback
      // which then deep-links cloudcode://auth?token=...
      const githubOAuthUrl = `${API_URL}/api/auth/github`

      const result = await WebBrowser.openAuthSessionAsync(
        githubOAuthUrl,
        'cloudcode://auth', // redirect URL scheme to listen for
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      )

      if (result.type === 'success' && result.url) {
        // The URL is cloudcode://auth?token=...
        // The root _layout.tsx deep link listener will handle extracting the token
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
      <View style={styles.container}>
        <ActivityIndicator color="#7c6bff" size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>☁️</Text>
          <Text style={styles.logoText}>CloudCode</Text>
        </View>
        <Text style={styles.tagline}>
          Your dev environment,{'\n'}always in your pocket.
        </Text>
        <Text style={styles.sub}>
          Full terminal. Live preview. Real projects.{'\n'}From your phone.
        </Text>
      </View>

      {/* Feature pills */}
      <View style={styles.features}>
        {[
          { icon: '📦', label: 'Isolated containers per project' },
          { icon: '⚡', label: 'Live terminal streaming' },
          { icon: '🌐', label: 'In-app live preview' },
          { icon: '🐙', label: 'Import any GitHub repo' },
        ].map(({ icon, label }) => (
          <View key={label} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* GitHub Sign In */}
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
            <Text style={styles.githubIcon}>🐙</Text>
            <Text style={styles.githubBtnText}>Continue with GitHub</Text>
          </>
        )}
      </TouchableOpacity>

      {signingIn && (
        <Text style={styles.signingInHint}>
          Opening GitHub in your browser...
        </Text>
      )}

      <Text style={styles.terms}>
        By continuing you agree to our Terms of Service
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#7c6bff18',
    top: -100,
    right: -100,
  },
  orb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#00d4ff12',
    bottom: 80,
    left: -80,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  logoEmoji: { fontSize: 38 },
  logoText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  sub: {
    fontSize: 15,
    color: '#6a6a8a',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    width: '100%',
    backgroundColor: '#0e0e1a',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#ffffff0d',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: { fontSize: 22 },
  featureLabel: { fontSize: 15, color: '#b0b0c0', fontWeight: '500' },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#24292e',
    paddingVertical: 17,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  githubBtnDisabled: { opacity: 0.6 },
  githubIcon: { fontSize: 22 },
  githubBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  signingInHint: {
    color: '#5a5a7a',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  terms: {
    fontSize: 12,
    color: '#3a3a5a',
    textAlign: 'center',
    marginTop: 4,
  },
})
