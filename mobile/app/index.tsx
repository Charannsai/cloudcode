import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Image, Dimensions,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Github, Terminal, Box, Shield, Zap, Cpu, Globe } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  useSharedValue
} from 'react-native-reanimated'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const { width } = Dimensions.get('window')

export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  
  const floatAnim = useSharedValue(0)

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatAnim.value, [0, 1], [0, -15]) }]
  }))

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/dashboard')
    }
  }, [user, loading, router])

  async function signInWithGitHub() {
    setSigningIn(true)
    try {
      const redirectUri = Linking.createURL('/auth')
      const authUrl = `${API_URL}/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          setToken(token)
          router.replace('/(tabs)/dashboard')
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
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background Decorative Element */}
      <View style={[styles.bgGlow, { backgroundColor: colors.accent + '10' }]} />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.text }]}>
              <Zap size={14} color={colors.background} fill={colors.background} />
            </View>
            <Text style={[styles.logo, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>CloudCode</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: colors.border }]}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>v.2.4 Node Stable</Text>
          </View>
        </Animated.View>

        <View style={styles.heroSection}>
          <Animated.View style={[styles.illustrationContainer, floatStyle]} entering={FadeInUp.delay(400).duration(1000)}>
            <Image 
              source={require('../assets/hero.png')} 
              style={styles.heroImage}
              resizeMode="contain"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.background + '20' }]} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.heroText}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              The Future of{'\n'}
              <Text style={{ color: colors.accent || '#8a6eff' }}>Cloud Native</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Instant provision high-performance virtual nodes for modern engineering teams. Zero configuration required.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.features}>
          {[
            { icon: Terminal, label: 'Instant Shell', sub: 'Low-latency TTY protocol', color: '#3b82f6' },
            { icon: Cpu, label: 'Virtual Nodes', sub: 'Isolated container stacks', color: '#10b981' },
            { icon: Globe, label: 'Edge Ready', sub: 'Military-grade encryption', color: '#f59e0b' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureCard, { backgroundColor: isDark ? '#12121e' : '#f8f9fa' }]}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <item.icon size={20} color={item.color} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.featureLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{item.label}</Text>
                <Text style={[styles.featureSub, { color: colors.textSecondary }]}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.footer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.btn, { backgroundColor: colors.text }]} 
            onPress={signInWithGitHub}
            disabled={signingIn}
          >
            {signingIn ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Github size={20} color={colors.background} strokeWidth={2} />
                <Text style={[styles.btnText, { color: colors.background, fontFamily: 'Inter_600SemiBold' }]}>
                  Establish Identity
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.legalRow}>
            <Shield size={12} color={colors.textSecondary} />
            <Text style={[styles.legal, { color: colors.textSecondary }]}>
              Secured with End-to-End Encryption
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2, // increased opacity slightly since blur is gone
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 40 
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { 
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logo: { fontSize: 20, letterSpacing: -0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusText: { fontSize: 11, fontWeight: '500' },
  heroSection: { marginBottom: 40 },
  illustrationContainer: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  heroText: { paddingHorizontal: 4 },
  title: { fontSize: 36, lineHeight: 44, letterSpacing: -1.5 },
  subtitle: { fontSize: 16, marginTop: 16, lineHeight: 26, opacity: 0.7 },
  features: { gap: 12, marginBottom: 48 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 16 },
  featureSub: { fontSize: 13, opacity: 0.5, marginTop: 2 },
  footer: { gap: 16, alignItems: 'center' },
  btn: {
    height: 64,
    width: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { fontSize: 18, letterSpacing: -0.2 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.5 },
  legal: { fontSize: 12 },
})

