import { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

const { width } = Dimensions.get('window')

export default function WelcomeScreen() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/projects')
    }
  }, [user, loading, router])

  async function signInWithGithub() {
    const redirectUrl = process.env.EXPO_PUBLIC_API_URL + '/api/auth/callback'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectUrl },
    })
    if (error) { console.error(error); return }
    if (data.url) await WebBrowser.openBrowserAsync(data.url)
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
      {/* Gradient orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>☁️</Text>
          <Text style={styles.logo}>CloudCode</Text>
        </View>
        <Text style={styles.tagline}>
          Your dev environment,{'\n'}always in your pocket.
        </Text>
        <Text style={styles.sub}>
          Full terminal access. Live preview.{'\n'}Real projects. From your phone.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '📦', text: 'Isolated containers per project' },
          { icon: '⚡', text: 'Live terminal streaming' },
          { icon: '🌐', text: 'In-app live preview' },
          { icon: '🐙', text: 'Import from GitHub' },
        ].map(({ icon, text }) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.githubBtn} onPress={signInWithGithub}>
        <Text style={styles.githubBtnIcon}>🐙</Text>
        <Text style={styles.githubBtnText}>Continue with GitHub</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to our Terms of Service
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7c6bff22',
    top: -80,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00d4ff15',
    bottom: 60,
    left: -60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 36,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  sub: {
    fontSize: 15,
    color: '#8a8a9a',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    width: '100%',
    backgroundColor: '#141420',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 15,
    color: '#c0c0d0',
    fontWeight: '500',
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#7c6bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7c6bff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  githubBtnIcon: {
    fontSize: 20,
  },
  githubBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  terms: {
    fontSize: 12,
    color: '#4a4a5a',
    textAlign: 'center',
  },
})
