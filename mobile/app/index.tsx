import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, ScrollView,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Cloud, Terminal, Github, Box, Zap, ChevronRight } from 'lucide-react-native'
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
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.header}>
           <View style={styles.logoRow}>
              <Cloud size={24} color={colors.text} strokeWidth={2.5} />
              <Text style={[styles.logoText, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>Taskk</Text>
           </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.tagline, { color: colors.text, fontFamily: 'Inter_900Black' }]}>
            Develop Systems,{'\n'}Master <Text style={{ color: '#f97316' }}>Logic.</Text>
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            A cloud-native IDE designed for builders.{'\n'}Full shell access, Docker, and zero-latency preview.
          </Text>
        </View>

        {/* Visual Cue - Cards like the image */}
        <View style={styles.featureGrid}>
          {[
            { icon: Terminal, label: 'Terminal', sub: 'Streaming Shell', color: '#10b981' },
            { icon: Box, label: 'Docker', sub: 'Isolated Nodes', color: '#3b82f6' },
            { icon: Zap, label: 'Preview', sub: 'Hot Reloading', color: '#f59e0b' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <item.icon size={20} color={item.color} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={[styles.featureLabel, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{item.label}</Text>
                <Text style={[styles.featureSub, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action area */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, signingIn && styles.btnDisabled]}
            onPress={signInWithGitHub}
            disabled={signingIn}
            activeOpacity={0.9}
          >
            {signingIn ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={[styles.primaryBtnText, { color: colors.background, fontFamily: 'Inter_700Bold' }]}>Connect with GitHub</Text>
                <Github size={20} color={colors.background} strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7}>
            <Text style={[styles.secondaryBtnText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Explore Projects</Text>
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            By continuing, you agree to our Terms of Service.{'\n'}Secure OAuth via GitHub.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 60,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  hero: {
    marginBottom: 48,
  },
  tagline: {
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  featureGrid: {
    gap: 12,
    marginBottom: 64,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionArea: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    opacity: 0.8,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 20,
    opacity: 0.5,
  },
})

