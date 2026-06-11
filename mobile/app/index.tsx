import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, ScrollView, Image,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Github, Terminal, Cpu, Globe, Zap, Code2, Sparkles, ChevronRight, Shield } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  FadeIn,
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  interpolate,
  useSharedValue,
  Easing,
} from 'react-native-reanimated'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const { width, height } = Dimensions.get('window')

const SLIDES = [
  {
    icon: Cpu,
    accent: '#3FB950',
    title: 'Instant\nCloud Nodes',
    subtitle: 'Provision isolated development environments in seconds. Zero configuration, full-stack ready.',
    features: ['Container Isolation', 'Low-Latency TTY', 'Edge Encryption'],
  },
  {
    icon: Code2,
    accent: '#58A6FF',
    title: 'Professional\nDev Tools',
    subtitle: 'Monaco editor, terminal sessions, git management, and live preview — all from your phone.',
    features: ['Monaco IDE', 'Multi-Shell', 'Live Preview'],
  },
  {
    icon: Sparkles,
    accent: '#D2A8FF',
    title: 'CloudCode\nAI Copilot',
    subtitle: 'An intelligent coding assistant deeply integrated into your development workflow.',
    features: ['Code Generation', 'Bug Diagnosis', 'File Operations'],
  },
]

export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
  const { colors, isDark } = useAppTheme()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  
  const floatAnim = useSharedValue(0)
  const glowAnim = useSharedValue(0)

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatAnim.value, [0, 1], [0, -12]) }]
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.08, 0.2])
  }))

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/dashboard')
    }
  }, [user, loading, router])

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % SLIDES.length
        scrollRef.current?.scrollTo({ x: next * width, animated: true })
        return next
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [])

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
        <ActivityIndicator color={colors.text} size="small" />
      </View>
    )
  }

  const currentSlide = SLIDES[activeSlide]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Ambient glow */}
      <Animated.View style={[styles.ambientGlow, { backgroundColor: currentSlide.accent }, glowStyle]} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
        <Image
          source={require('../assets/cloudcodelogo.png')}
          style={[styles.logoImage, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <View style={[styles.versionBadge, { borderColor: colors.border }]}>
          <View style={[styles.statusDot, { backgroundColor: '#3FB950' }]} />
          <Text style={[styles.versionText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>v1.0.0</Text>
        </View>
      </Animated.View>

      {/* Slides */}
      <View style={styles.slideSection}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width)
            setActiveSlide(index)
          }}
        >
          {SLIDES.map((slide, idx) => {
            const SlideIcon = slide.icon
            return (
              <View key={idx} style={[styles.slide, { width }]}>
                <View style={styles.slideContent}>
                  {/* Icon Container */}
                  <Animated.View style={[styles.iconContainer, floatStyle]}>
                    <View style={[styles.iconRing, { borderColor: slide.accent + '20' }]}>
                      <View style={[styles.iconInner, { backgroundColor: slide.accent + '10' }]}>
                        <SlideIcon size={32} color={slide.accent} strokeWidth={1.5} />
                      </View>
                    </View>
                  </Animated.View>

                  {/* Text */}
                  <Text style={[styles.slideTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                    {slide.title}
                  </Text>
                  <Text style={[styles.slideSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {slide.subtitle}
                  </Text>

                  {/* Feature chips */}
                  <View style={styles.chipRow}>
                    {slide.features.map((feat, fi) => (
                      <View key={fi} style={[styles.chip, { backgroundColor: isDark ? '#1C2128' : '#F3F4F6', borderColor: colors.border }]}>
                        <Text style={[styles.chipText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setActiveSlide(idx)
                scrollRef.current?.scrollTo({ x: idx * width, animated: true })
              }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === activeSlide ? SLIDES[idx].accent : colors.border,
                    width: idx === activeSlide ? 24 : 6,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.footer}>
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
              <Github size={18} color={colors.background} strokeWidth={2} />
              <Text style={[styles.btnText, { color: colors.background, fontFamily: 'Inter_600SemiBold' }]}>
                Continue with GitHub
              </Text>
              <ChevronRight size={16} color={colors.background} strokeWidth={2} />
            </>
          )}
        </TouchableOpacity>
        <View style={styles.legalRow}>
          <Shield size={11} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.legal, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            End-to-end encrypted  ·  SOC 2 compliant
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoImage: {
    height: 24,
    width: 100,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { 
    width: 26, 
    height: 26, 
    borderRadius: 7, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logo: { fontSize: 18, letterSpacing: -0.5 },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  versionText: { fontSize: 11 },
  slideSection: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    maxWidth: 300,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: { 
    paddingHorizontal: 24, 
    paddingBottom: 48,
    gap: 16, 
    alignItems: 'center' 
  },
  btn: {
    height: 56,
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: { fontSize: 16, letterSpacing: -0.2 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 5, opacity: 0.5 },
  legal: { fontSize: 11 },
})
