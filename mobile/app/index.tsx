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
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { OnboardingPage } from '@/components/onboarding/OnboardingPage'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.cerprise.in'
const { width, height } = Dimensions.get('window')

// Exact CloudCode logo path from provided SVG asset
const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"

const AnimatedPath = Animated.createAnimatedComponent(Path)

// The 6 Onboarding Screens matching the Figma build
const ONBOARDING_SCREENS = [
  {
    id: 1,
    image: require('@/assets/onboarding/onboarding_1.png'),
    title: 'Welcome to CloudCode',
    subtitle: 'Your intelligent development environment, anywhere.',
    textPosition: 'center' as const,
    showSkip: true,
    ctaLabel: 'Continue',
  },
  {
    id: 2,
    image: require('@/assets/onboarding/onboarding_2.png'),
    title: 'Get Your True Workspace',
    subtitle: 'CloudCode gives you your actual development workspace.',
    textPosition: 'bottom' as const,
    showSkip: true,
    ctaLabel: 'Continue',
  },
  {
    id: 3,
    image: require('@/assets/onboarding/onboarding_3.png'),
    title: 'Connect Your Agents',
    subtitle:
      'Integrate MCPs, AI agents, and developer tools directly into your workspace. CloudCode brings your agents, tools, and development environments together in one place.',
    textPosition: 'bottom' as const,
    showSkip: true,
    ctaLabel: 'Continue',
  },
  {
    id: 4,
    image: require('@/assets/onboarding/onboarding_4.png'),
    title: 'Everything runs on cloud',
    subtitle:
      'Run your projects in isolated cloud environments without setting up your machine. Access your terminal, runtimes, databases, and tools whenever you need them.',
    textPosition: 'top' as const,
    showSkip: true,
    ctaLabel: 'Continue',
  },
  {
    id: 5,
    image: require('@/assets/onboarding/onboarding_5.png'),
    title: 'Build. Preview. Ship.',
    subtitle:
      'Build and test your projects in a fully connected cloud workspace. Run your code, preview changes instantly, and keep everything you need in one place.',
    textPosition: 'bottom' as const,
    showSkip: true,
    ctaLabel: 'Continue',
  },
  {
    id: 6,
    image: require('@/assets/onboarding/onboarding_6.png'),
    title: 'Be One of the First.',
    subtitle:
      'Be among the first developers to experience a new way of building with CloudCode.',
    textPosition: 'bottom' as const,
    showSkip: false,
    ctaLabel: 'Continue with Github',
    showTerms: true,
  },
]

export default function WelcomeScreen() {
  const { user, loading, setToken } = useAuthStore()
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

  // Animation values for the initial splash effect
  const drawingProgress = useSharedValue(0)
  const fillOpacity = useSharedValue(0)
  const logoScale = useSharedValue(1)
  const logoTranslateY = useSharedValue(0)
  const brandOpacity = useSharedValue(0)
  const brandTranslateY = useSharedValue(20)
  const welcomeTransition = useSharedValue(0)
  const outlineGlow = useSharedValue(0)

  // Measure path length dynamically
  const [pathLength, setPathLength] = useState(0)

  // Handle auto redirect if logged in after the splash screen completes (3.6s)
  useEffect(() => {
    if (!loading && user) {
      const redirectTimer = setTimeout(async () => {
        router.replace('/(tabs)/dashboard')
      }, 3600)
      return () => clearTimeout(redirectTimer)
    }
  }, [user, loading, router])

  // Trigger initial tracing animations
  useEffect(() => {
    if (!loading) {
      // 0.0s → 1.6s: Outline drawing
      drawingProgress.value = withTiming(1, {
        duration: 1600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })

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

      // If user is not authenticated, smoothly transition to the Onboarding carousel
      if (!user) {
        welcomeTransition.value = withDelay(
          3600,
          withTiming(1, { duration: 600, easing: Easing.bezier(0.16, 1, 0.3, 1) })
        )

        const timer = setTimeout(() => {
          setIsWelcomePhase(true)
        }, 3600)

        return () => clearTimeout(timer)
      }
    }
  }, [loading, user])

  async function handleLoginSuccess(token: string) {
    setToken(token)
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true')
      router.replace('/(tabs)/dashboard')
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

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url)
        const token = parsed.queryParams?.token as string | undefined
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
      } catch {
        setPathLength(140)
      }
    }
  }

  // Advance to next screen
  const handleContinue = () => {
    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
      setCurrentScreen((prev) => prev + 1)
    } else {
      signInWithGitHub()
    }
  }

  // Skip to final screen
  const handleSkip = () => {
    setCurrentScreen(ONBOARDING_SCREENS.length - 1)
  }

  // Centered Splash Logo animated styles
  const splashLogoStyle = useAnimatedStyle(() => {
    const t = welcomeTransition.value
    const scale = interpolate(t, [0, 1], [logoScale.value, 0.4])
    const opacity = interpolate(t, [0, 1], [1, 0])

    return {
      opacity: opacity,
      transform: [
        { translateY: logoTranslateY.value },
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
      fill: '#FFFFFF',
    }
  })

  const animatedOutlineGlowProps = useAnimatedProps(() => {
    return {
      opacity: outlineGlow.value,
    }
  })

  // Brand Reveal Text styles
  const brandTextStyle = useAnimatedStyle(() => {
    const opacity = brandOpacity.value * (1 - welcomeTransition.value)
    const translateY = brandTranslateY.value - welcomeTransition.value * 20
    return {
      opacity: opacity,
      transform: [{ translateY: translateY }],
    }
  })

  const onboardingContainerStyle = useAnimatedStyle(() => ({
    opacity: welcomeTransition.value,
  }))

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    )
  }

  const staticPathLength = pathLength || 140
  const activeScreenData = ONBOARDING_SCREENS[currentScreen]

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      {/* Initial Splash Tracing Animation Overlay (fades out as onboarding loads) */}
      {!isWelcomePhase && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[styles.logoCenterContainer, splashLogoStyle]}>
            <Svg width={100} height={100} viewBox="0 0 874 552">
              <AnimatedPath
                d={CLOUD_PATH}
                fill="none"
                stroke="rgba(0, 229, 255, 0.15)"
                strokeWidth={1.2}
                animatedProps={animatedBaseOutlineProps}
              />
              <AnimatedPath
                d={CLOUD_PATH}
                fill="none"
                stroke="rgba(0, 229, 255, 0.35)"
                strokeWidth={1.2}
                strokeDasharray={staticPathLength}
                animatedProps={animatedForwardsTrailProps}
              />
              <AnimatedPath
                d={CLOUD_PATH}
                fill="none"
                stroke="rgba(0, 229, 255, 0.35)"
                strokeWidth={1.2}
                strokeDasharray={staticPathLength}
                animatedProps={animatedBackwardsTrailProps}
              />
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
              <AnimatedPath
                d={CLOUD_PATH}
                fill="none"
                stroke="#00E5FF"
                strokeWidth={4}
                animatedProps={animatedOutlineGlowProps}
              />
              <AnimatedPath
                d={CLOUD_PATH}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={1.2}
                animatedProps={animatedOutlineGlowProps}
              />
              <AnimatedPath
                ref={handlePathRef}
                d={CLOUD_PATH}
                fill="#FFFFFF"
                stroke="none"
                animatedProps={animatedPathFillProps}
              />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.brandTextContainer, brandTextStyle]}>
            <Text style={styles.brandTitle}>CloudCode</Text>
          </Animated.View>
        </View>
      )}

      {/* Main Onboarding Carousel Content */}
      <Animated.View style={[styles.onboardingContainer, onboardingContainerStyle]}>
        {/* Top Bar Header */}
        <View style={[styles.headerBar, { top: insets.top + 16 }]}>
          <Image
            source={require('@/assets/cloudcodelogolight.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {currentScreen < ONBOARDING_SCREENS.length - 1 && (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Swipeable Paged Screens */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetX = e.nativeEvent.contentOffset.x
            const index = Math.round(offsetX / width)
            if (
              index !== currentScreen &&
              index >= 0 &&
              index < ONBOARDING_SCREENS.length
            ) {
              setCurrentScreen(index)
            }
          }}
          scrollEnabled={!signingIn}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {ONBOARDING_SCREENS.map((screen, idx) => (
            <OnboardingPage
              key={screen.id}
              index={idx}
              currentScreen={currentScreen}
              backgroundImage={screen.image}
              title={screen.title}
              subtitle={screen.subtitle}
              textPosition={screen.textPosition}
            />
          ))}
        </ScrollView>

        {/* Unified Bottom Action Container */}
        <View
          style={[
            styles.bottomActionContainer,
            { bottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {/* Bottom Title & Subtitle sitting directly on top of the button */}
          {activeScreenData.textPosition === 'bottom' && (
            <View style={styles.bottomTextWrapper}>
              <Text style={styles.bottomTitle}>{activeScreenData.title}</Text>
              <Text style={styles.bottomSubtitle}>{activeScreenData.subtitle}</Text>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={signingIn}
            style={styles.ctaButton}
          >
            {signingIn ? (
              <ActivityIndicator color="#0F0F0F" size="small" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {activeScreenData.ctaLabel}
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms & Privacy text on the last screen */}
          {activeScreenData.showTerms && (
            <Text style={styles.termsText}>
              By Continuing, you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  WebBrowser.openBrowserAsync('https://cloudcode.cerprise.in/terms')
                }
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  WebBrowser.openBrowserAsync('https://cloudcode.cerprise.in/privacy')
                }
              >
                Privacy Policy
              </Text>
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    left: 20,
    right: 20,
    top: height / 2 + 44,
    alignItems: 'center',
    zIndex: 6,
  },
  brandTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
  },
  onboardingContainer: {
    flex: 1,
  },
  headerBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  logoImage: {
    width: 131,
    height: 27,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  bottomActionContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  bottomTextWrapper: {
    width: '100%',
    marginBottom: 10,
    gap: 4,
  },
  bottomTitle: {
    fontSize: 24,
    lineHeight: 29,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  bottomSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.88)',
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.1,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#0F0F0F',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  termsLink: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontFamily: 'Inter_500Medium',
  },
})
