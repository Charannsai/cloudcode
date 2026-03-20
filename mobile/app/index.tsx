import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Github, Terminal, Box, Shield, Zap } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
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
      const authUrl = `${API_URL}/api/auth/github?platform=mobile`
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('/auth/callback')
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          setToken(token)
          router.replace('/(tabs)/projects')
        }
      }
    } catch (err) {
      console.error('Auth Error:', err)
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>CloudCode</Text>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
            High-performance{'\n'}
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>cloud development.</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Secure environments for modern engineering teams. Provision nodes in seconds.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: Terminal, label: 'Instant Shell', sub: 'Low-latency TTY protocol' },
            { icon: Box, label: 'Virtual Nodes', sub: 'Isolated container stacks' },
            { icon: Shield, label: 'E2E Security', sub: 'Military-grade encryption' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureRow, idx !== 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <item.icon size={20} color={colors.text} strokeWidth={1.5} />
              <View>
                <Text style={[styles.featureLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{item.label}</Text>
                <Text style={[styles.featureSub, { color: colors.textSecondary }]}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: colors.text }]} 
            onPress={signInWithGitHub}
            disabled={signingIn}
          >
            {signingIn ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Github size={18} color={colors.background} strokeWidth={2} />
                <Text style={[styles.btnText, { color: colors.background, fontFamily: 'Inter_600SemiBold' }]}>
                  Establish Identity
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.legal, { color: colors.textSecondary }]}>
            V.2.4.10 • Secure Gateway
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 60 },
  header: { marginBottom: 80 },
  logo: { fontSize: 18, letterSpacing: -0.5 },
  hero: { marginBottom: 60 },
  title: { fontSize: 32, lineHeight: 40, letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 16, lineHeight: 26, opacity: 0.6 },
  features: { marginBottom: 80 },
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    paddingVertical: 20 
  },
  featureLabel: { fontSize: 15 },
  featureSub: { fontSize: 13, opacity: 0.5, marginTop: 2 },
  footer: { gap: 24, alignItems: 'center' },
  btn: {
    height: 56,
    width: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnText: { fontSize: 16 },
  legal: { fontSize: 11, opacity: 0.4 },
})

