import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
  SharedValue,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import Svg, { Path, Defs, RadialGradient, Rect, Stop, Line, Circle, G, Ellipse, LinearGradient } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const { width, height } = Dimensions.get('window')

// Exact CloudCode logo path from provided SVG asset
const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"

const AnimatedPath = Animated.createAnimatedComponent(Path)

import { GridBackground } from '@/components/onboarding/GridBackground'
import { AnimatedDot } from '@/components/onboarding/AnimatedDot'
import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import {
  Screen0Illustration,
  Screen1Illustration,
  Screen2Illustration,
  Screen3Illustration,
  Screen4Illustration,
  Screen5Illustration,
} from '@/components/onboarding/ScreenIllustrations'

const ONBOARDING_DATA = [
  {
    title: "Welcome to\nCloudCode",
    description: "Your secure hub for code, collaboration, and cloud automation. Build. Deploy. Scale — all in one place.",
    illustration: Screen0Illustration,
  },
  {
    title: "Create Development\nEnvironments Instantly",
    description: "Instantly spin up isolated cloud containers from your repositories. Run full desktop workspaces right from your phone.",
    illustration: Screen1Illustration,
  },
  {
    title: "Describe It.\nLet AI Build It.",
    description: "Collaborative AI developer agents work in sync to turn your descriptions into functional components, APIs, and databases.",
    illustration: Screen2Illustration,
  },
  {
    title: "Professional Development\nWorkflows Anywhere",
    description: "Access a multi-shell remote terminal alongside a visual branching manager. Commit, merge, and pull requests effortlessly.",
    illustration: Screen3Illustration,
  },
  {
    title: "Run, Preview,\nand Deploy Securely",
    description: "Interact with live browser previews connected via encrypted TLS tunnels to compliant, isolated cloud infrastructure.",
    illustration: Screen4Illustration,
  },
  {
    title: "Everything You Need.\nAnywhere.",
    description: "Log in with your GitHub account to access your repositories and spin up remote dev boxes on the go.",
    illustration: Screen5Illustration,
  },
]

export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
  const { isDark } = useAppTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [signingIn, setSigningIn] = useState(false)
  const [isWelcomePhase, setIsWelcomePhase] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  // Scroll to current page when currentScreen changes programmatically
  useEffect(() => {
    if (isWelcomePhase) {
      scrollViewRef.current?.scrollTo({
        x: currentScreen * width,
        animated: true,
      })
    }
  }, [currentScreen, isWelcomePhase])

  // Animation values
  const drawingProgress = useSharedValue(0)
  const fillOpacity = useSharedValue(0)
  const logoScale = useSharedValue(1)
  const logoTranslateY = useSharedValue(0)
  const brandOpacity = useSharedValue(0)
  const brandTranslateY = useSharedValue(20)
  const welcomeTransition = useSharedValue(0)
  const outlineGlow = useSharedValue(0)
  
  // Theme and page transitions
  const bgThemeTransition = useSharedValue(0)

  // Measure path length dynamically
  const [pathLength, setPathLength] = useState(0)

  // Handle auto redirect if logged in after the splash screen completes (4.1s)
  useEffect(() => {
    if (!loading && user) {
      const redirectTimer = setTimeout(async () => {
        try {
          const completed = await AsyncStorage.getItem('onboarding_completed')
          if (completed === 'true') {
            router.replace('/(tabs)/dashboard')
          } else {
            router.replace('/onboarding-wizard')
          }
        } catch {
          router.replace('/(tabs)/dashboard')
        }
      }, 4100)
      return () => clearTimeout(redirectTimer)
    }
  }, [user, loading, router])

  // Trigger initial tracing animations
  useEffect(() => {
    if (!loading) {
      // 0.0s → 1.6s: Outline drawing
      drawingProgress.value = withTiming(1, { duration: 1600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })

      // 1.2s → 1.6s: Final fill fade in
      fillOpacity.value = withDelay(
        1200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      )

      // 1.2s → 1.6s: Outline shine flash
      outlineGlow.value = withDelay(
        1200,
        withSequence(
          withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
        )
      )

      // 1.6s → 1.9s: Scale pulse
      logoScale.value = withDelay(
        1600,
        withSequence(
          withTiming(1.03, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 150, easing: Easing.in(Easing.ease) })
        )
      )

      // 1.9s → 2.6s: Brand reveal (Logo moves up, text fades in)
      logoTranslateY.value = withDelay(
        1900,
        withTiming(-20, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      )
      brandOpacity.value = withDelay(
        1900,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) })
      )
      brandTranslateY.value = withDelay(
        1900,
        withTiming(0, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) })
      )

      // If user is a guest, transition to the Welcome Screen after the branding text has been visible
      if (!user) {
        welcomeTransition.value = withDelay(
          4100,
          withTiming(1, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) })
        )

        // Sync status bar style change with start of Welcome Transition at 4.1s
        const timer = setTimeout(() => {
          setIsWelcomePhase(true)
        }, 4100)

        return () => clearTimeout(timer)
      }
    }
  }, [loading, user])

  // Handles theme transition when changing screens
  useEffect(() => {
    if (currentScreen === 5) {
      bgThemeTransition.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      bgThemeTransition.value = withTiming(0, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    }
  }, [currentScreen])

  // Auto-advance onboarding timer
  useEffect(() => {
    if (isWelcomePhase && currentScreen < 5 && !signingIn) {
      const timer = setInterval(() => {
        setCurrentScreen((prev) => (prev < 5 ? prev + 1 : prev))
      }, 6000)
      return () => clearInterval(timer)
    }
  }, [isWelcomePhase, currentScreen, signingIn])

  async function handleLoginSuccess(token: string) {
    setToken(token)
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed')
      if (completed === 'true') {
        router.replace('/(tabs)/dashboard')
      } else {
        router.replace('/onboarding-wizard')
      }
    } catch {
      router.replace('/(tabs)/dashboard')
    }
  }

  // GitHub Auth Flow
  async function signInWithGitHub() {
    setSigningIn(true)
    try {
      const redirectUri = Linking.createURL('/auth')
      const authUrl = `${API_URL}/cc-api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          await handleLoginSuccess(token)
        }
      }
    } catch (err) {
      console.error('Auth Error:', err)
    } finally {
      setSigningIn(false)
    }
  }

  // Ref callback to measure length of path
  const handlePathRef = (ref: any) => {
    if (ref) {
      try {
        const length = ref.getTotalLength()
        if (length && length > 0) {
          setPathLength(length)
        }
      } catch (e) {
        setPathLength(140)
      }
    }
  }

  // Handle Manual Continue
  const handleContinue = () => {
    if (currentScreen < 5) {
      setCurrentScreen(currentScreen + 1)
    }
  }

  // Interpolated Styles for Theme Shifts
  const containerStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#05070B', '#FAFAFA']
    )
    return {
      backgroundColor: bgColor,
    }
  })

  const skipButtonStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.45)', 'rgba(15, 23, 42, 0.45)']
    )
    return {
      color,
    }
  })

  const ctaButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#FFFFFF', '#05070B']
    )
    return {
      backgroundColor,
    }
  })

  const ctaButtonTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      ['#000000', '#FFFFFF']
    )
    return {
      color,
    }
  })

  const lightLogoStyle = useAnimatedStyle(() => ({
    opacity: 1 - bgThemeTransition.value,
  }))

  const darkLogoStyle = useAnimatedStyle(() => ({
    opacity: bgThemeTransition.value,
  }))

  // Centered Splash Logo animated styles
  const splashLogoStyle = useAnimatedStyle(() => {
    const t = welcomeTransition.value
    const targetCenterX = 24 + 16
    const targetCenterY = insets.top + 16 + 16

    const initialCenterX = width / 2
    const initialCenterY = height / 2

    const transX = interpolate(t, [0, 1], [0, targetCenterX - initialCenterX])
    const transY = interpolate(t, [0, 1], [logoTranslateY.value, targetCenterY - initialCenterY])
    const scale = interpolate(t, [0, 1], [logoScale.value, 0.32])
    const opacity = interpolate(t, [0, 1], [1, 0])

    return {
      opacity: opacity,
      transform: [
        { translateX: transX },
        { translateY: transY },
        { scale: scale },
      ],
    }
  })

  // SVG drawing paths animations
  const animatedBaseOutlineProps = useAnimatedProps(() => {
    return {
      opacity: interpolate(drawingProgress.value, [0, 1], [0.12, 0.4]),
    }
  })

  const animatedForwardsTrailProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: (1 - drawingProgress.value) * len,
    }
  })

  const animatedBackwardsTrailProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: -(1 - drawingProgress.value) * len,
    }
  })

  // Glow points traveling along the path
  const animatedForwardsGlowProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: -drawingProgress.value * len,
    }
  })

  const animatedBackwardsGlowProps = useAnimatedProps(() => {
    const len = pathLength || 140
    return {
      strokeDashoffset: drawingProgress.value * len,
    }
  })

  const animatedPathFillProps = useAnimatedProps(() => {
    return {
      fillOpacity: fillOpacity.value,
      fill: '#0F172A',
    }
  })

  // Full outline flash glow animation props
  const animatedOutlineGlowProps = useAnimatedProps(() => {
    return {
      opacity: outlineGlow.value,
    }
  })

  // Brand Reveal Text styles
  const brandTextStyle = useAnimatedStyle(() => {
    const opacity = brandOpacity.value * (1 - welcomeTransition.value)
    const translateY = brandTranslateY.value - (welcomeTransition.value * 20)
    return {
      opacity: opacity,
      transform: [{ translateY: translateY }],
    }
  })

  // Iris-closing white background overlay style
  const whiteOverlayStyle = useAnimatedStyle(() => {
    const t = welcomeTransition.value
    const maxDim = Math.max(width, height)
    const startSize = maxDim * 2.5
    const endSize = 32
    const size = interpolate(t, [0, 1], [startSize, endSize])

    const initialCenterX = width / 2
    const initialCenterY = height / 2
    const targetCenterX = 24 + 16
    const targetCenterY = insets.top + 16 + 16

    const centerX = interpolate(t, [0, 1], [initialCenterX, targetCenterX])
    const centerY = interpolate(t, [0, 1], [initialCenterY, targetCenterY])
    const opacity = interpolate(t, [0, 0.85, 1], [1, 1, 0])

    return {
      width: size,
      height: size,
      left: centerX - size / 2,
      top: centerY - size / 2,
      borderRadius: size / 2,
      opacity: opacity,
    }
  })


  const watermarkStyle = useAnimatedStyle(() => {
    const targetOpacity = 0.08
    const finalOpacity = targetOpacity * (1 - bgThemeTransition.value)
    const screenHide = currentScreen === 1 ? 0 : 1
    return { opacity: interpolate(welcomeTransition.value, [0, 1], [0, finalOpacity]) * screenHide }
  })

  const welcomeContentStyle = useAnimatedStyle(() => ({
    opacity: welcomeTransition.value,
    transform: [{ translateY: interpolate(welcomeTransition.value, [0, 1], [40, 0]) }],
  }))

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: welcomeTransition.value * (1 - bgThemeTransition.value),
  }))

  const ctaButtonStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(bgThemeTransition.value, [0, 1], ['#00E5FF', '#0F172A'])
    return { backgroundColor: bgColor }
  })

  const ctaButtonTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(bgThemeTransition.value, [0, 1], ['#05070B', '#FFFFFF']),
  }))

  const headerTextStyle = useAnimatedStyle(() => ({ opacity: welcomeTransition.value }))

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#05070B', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    )
  }

  const staticPathLength = pathLength || 140



  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Dynamic StatusBar style based on current screen's theme */}
      <StatusBar style={currentScreen === 5 ? "dark" : "light"} />

      {/* Welcome Screen Ambient Glow (Hidden in light theme Screen 5) */}
      <Animated.View style={[StyleSheet.absoluteFill, ambientGlowStyle]}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="ambientGlow"
              cx="50%"
              cy="0%"
              rx="60%"
              ry="60%"
              fx="50%"
              fy="0%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#05070B" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>

      {/* Welcome Screen Tech Grid Background */}
      <GridBackground isDark={true} opacity={welcomeTransition} themeTransition={bgThemeTransition} />

      {/* Welcome Screen Giant Watermark Logo */}
      <Animated.View style={[styles.watermarkContainer, watermarkStyle]}>
        <Svg width={550} height={550} viewBox="0 0 874 552">
          <Path
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        </Svg>
      </Animated.View>

      {/* Header Branding Logo Images (Cross-fading between light and dark versions) */}
      <Animated.View style={[styles.headerContainer, { top: insets.top + 16, left: 24 }, headerTextStyle]}>
        <Animated.Image
          source={require('@/assets/cloudcodelogolight.png')}
          style={[{ width: 132.8, height: 32, position: 'absolute' }, lightLogoStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require('@/assets/cloudcodelogo.png')}
          style={[{ width: 132.8, height: 32 }, darkLogoStyle]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Skip Button (Low opacity skip in top right corner for Screens 0-4) */}
      {isWelcomePhase && currentScreen < 5 && (
        <TouchableOpacity
          activeOpacity={0.6}
          style={[styles.skipButton, { top: insets.top + 16 }]}
          onPress={() => setCurrentScreen(5)}
        >
          <Animated.Text style={[styles.skipText, { fontFamily: 'Inter_500Medium' }, skipButtonStyle]}>
            Skip
          </Animated.Text>
        </TouchableOpacity>
      )}

      {/* Iris-closing White Background Overlay */}
      <Animated.View style={[styles.whiteOverlay, whiteOverlayStyle]} />

      {/* Centered Splash Logo (Translates to header in Phase 5) */}
      <Animated.View style={[styles.logoCenterContainer, splashLogoStyle]}>
        <Svg width={100} height={100} viewBox="0 0 874 552">
          {/* Phase 1 — Sleeping outline */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.15)"
            strokeWidth={1.2}
            animatedProps={animatedBaseOutlineProps}
          />

          {/* Phase 2 — Forwards trail */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth={1.2}
            strokeDasharray={staticPathLength}
            animatedProps={animatedForwardsTrailProps}
          />

          {/* Phase 2 — Backwards trail */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth={1.2}
            strokeDasharray={staticPathLength}
            animatedProps={animatedBackwardsTrailProps}
          />

          {/* Phase 2 — Forwards laser shine (Aura, Glow, and White Core) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#4F9DFF"
            strokeWidth={6}
            strokeDasharray={[40, 3000]}
            opacity={0.2}
            animatedProps={animatedForwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={2.2}
            strokeDasharray={[20, 3000]}
            opacity={0.7}
            animatedProps={animatedForwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.0}
            strokeDasharray={[10, 3000]}
            animatedProps={animatedForwardsGlowProps}
          />

          {/* Phase 2 — Backwards laser shine (Aura, Glow, and White Core) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#4F9DFF"
            strokeWidth={6}
            strokeDasharray={[40, 3000]}
            opacity={0.2}
            animatedProps={animatedBackwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={2.2}
            strokeDasharray={[20, 3000]}
            opacity={0.7}
            animatedProps={animatedBackwardsGlowProps}
          />
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.0}
            strokeDasharray={[10, 3000]}
            animatedProps={animatedBackwardsGlowProps}
          />

          {/* Phase 2.5 — Full Outline Shine Glow (Neon blue) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={4}
            animatedProps={animatedOutlineGlowProps}
          />

          {/* Phase 2.5 — Full Outline Shine Core (White-hot) */}
          <AnimatedPath
            d={CLOUD_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.2}
            animatedProps={animatedOutlineGlowProps}
          />

          {/* Phase 3 & Transition — Fill of the Cloud logo */}
          <AnimatedPath
            ref={handlePathRef}
            d={CLOUD_PATH}
            fill="#0F172A"
            stroke="none"
            animatedProps={animatedPathFillProps}
          />
        </Svg>
      </Animated.View>

      {/* Phase 4 — Splash Brand Reveal Text */}
      <Animated.View style={[styles.brandTextContainer, brandTextStyle]}>
        <Text style={[styles.brandTitle, { color: '#0F172A', fontFamily: 'Inter_800ExtraBold' }]}>
          CloudCode
        </Text>
      </Animated.View>

      {/* Onboarding Pages (Horizontally Swipeable & Paged) */}
      {isWelcomePhase && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x
            const index = Math.round(offsetX / width)
            if (index !== currentScreen && index >= 0 && index <= 5) {
              setCurrentScreen(index)
            }
          }}
          scrollEnabled={!signingIn}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {ONBOARDING_DATA.map((page, index) => (
            <OnboardingPage
              key={index}
              index={index}
              currentScreen={currentScreen}
              illustration={page.illustration}
              title={page.title}
              description={page.description}
            />
          ))}
        </ScrollView>
      )}

      {/* Fixed Bottom Indicators and Primary CTA Button */}
      {isWelcomePhase && (
        <Animated.View style={[styles.welcomeContentFixed, welcomeContentStyle]}>
          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
              <AnimatedDot 
                key={i} 
                index={i} 
                currentScreen={currentScreen} 
                bgThemeTransition={bgThemeTransition} 
              />
            ))}
          </View>

          {/* Primary Action CTA Buttons */}
          {currentScreen === 5 ? (
            <View style={{ gap: 10, width: '100%' }}>
              {/* Continue with GitHub */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={signInWithGitHub}
                disabled={signingIn}
              >
                <Animated.View style={[styles.ctaButton, ctaButtonStyle]}>
                  {signingIn ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.ctaButtonContent}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }}>
                        <Path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </Svg>
                      <Text style={[styles.ctaText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                        Continue with GitHub
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>

            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleContinue}
              disabled={signingIn}
            >
              <Animated.View style={[styles.ctaButton, ctaButtonStyle]}>
                <Animated.Text style={[
                  styles.ctaText, 
                  ctaButtonTextStyle,
                  { fontFamily: 'Inter_600SemiBold' }
                ]}>
                  Continue
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  )
}

// -------------------------------------------------------------
// Stylesheet Definitions
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoCenterContainer: {
    position: 'absolute',
    left: width / 2 - 50,
    top: height / 2 - 40,
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  brandTextContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: height / 2 + 44,
    alignItems: 'center',
    zIndex: 6,
  },
  brandTitle: {
    fontSize: 32,
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  whiteOverlay: {
    position: 'absolute',
    backgroundColor: '#FAFAFA',
    zIndex: 5,
  },
  headerContainer: {
    position: 'absolute',
    left: 24,
    zIndex: 2,
  },
  watermarkContainer: {
    position: 'absolute',
    left: '-45%',
    top: '12%',
    transform: [{ rotate: '-15deg' }],
    zIndex: 1,
  },
  welcomeContent: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    zIndex: 3,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
    maxWidth: '90%',
  },
  ctaButton: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  // Showcase Illustrations & Layout Styles
  showcaseIllustrationContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: height * 0.14,
    height: height * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  showcaseWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceCard: {
    width: width - 80,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  workspaceBlur: {
    flex: 1,
    padding: 16,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  windowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  windowTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontFamily: 'Inter_500Medium',
  },
  workspaceBody: {
    flex: 1,
  },
  codeText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 14,
  },
  floatingBadge: {
    position: 'absolute',
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
  aiPromptCardBack: {
    position: 'absolute',
    width: width - 120,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    justifyContent: 'center',
    opacity: 0.15,
  },
  aiPromptBackText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  aiPromptCardActive: {
    width: width - 80,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  aiPromptBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  aiPromptText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  cursor: {
    color: '#00E5FF',
    fontFamily: 'Inter_700Bold',
  },
  aiPromptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiPromptBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  aiPromptBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Inter_500Medium',
  },
  aiSendCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconBadge: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiIconBlur: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalContainer: {
    width: width - 80,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  terminalBlur: {
    flex: 1,
    padding: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  terminalTitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4,
    fontFamily: 'Inter_500Medium',
  },
  terminalBody: {
    flex: 1,
  },
  terminalLine: {
    fontSize: 10,
    color: '#E2E8F0',
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 15,
  },
  gitDiagram: {
    marginTop: 16,
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.4)',
  },
  gitActiveDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  previewWindow: {
    width: width - 110,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 2,
  },
  previewBlur: {
    flex: 1,
    padding: 12,
  },
  previewHeader: {
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 12,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  previewAddressBar: {
    alignItems: 'center',
  },
  previewUrl: {
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  previewBody: {
    flex: 1,
    gap: 8,
  },
  previewBoxSmall: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewLineWide: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewLineMedium: {
    width: '70%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cloudNodesContainer: {
    position: 'absolute',
    left: 10,
    bottom: 20,
    zIndex: 1,
  },
  shieldContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 3,
  },
  shieldBlur: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOuterContainer: {
    width: width,
    height: height * 0.40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  gridColumn: {
    width: (width - 64) / 3,
    gap: 12,
  },
  gridItemCard: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gridItemHeader: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridItemBody: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
    color: '#0F172A',
    lineHeight: 12,
  },
  welcomeTextWrapper: {
    marginBottom: 24,
  },
  textWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
  },
  showcaseTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
    textAlign: 'left',
  },
  showcaseDescription: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: '95%',
    textAlign: 'left',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 100,
  },
  skipText: {
    fontSize: 14,
  },
  scrollView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.12,
    height: height * 0.65,
    zIndex: 4,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  pageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIllustrationContainer: {
    width: '100%',
    height: height * 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  glassCard3d: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  welcomeContentFixed: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    zIndex: 3,
  },
  checkListContainer: {
    marginTop: 8,
    gap: 2,
  },
  checkListItem: {
    fontSize: 9,
    color: '#34D399',
    fontFamily: 'Inter_500Medium',
  },
  gitDiagramCard: {
    width: width - 130,
    height: 98,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gitDiagramBlur: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  gitStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 2,
  },
  gitStatusText: {
    fontSize: 8,
    color: '#60A5FA',
    fontFamily: 'Inter_500Medium',
  },
  infraContainer: {
    position: 'absolute',
    width: 260,
    height: 180,
    zIndex: 1,
  },
  browserAppContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  browserSidebar: {
    width: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    gap: 6,
  },
  sidebarItem: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  browserMainContent: {
    flex: 1,
    paddingLeft: 8,
    paddingVertical: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  metricCard: {
    flex: 1,
    height: 12,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  aiIconBlurMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
