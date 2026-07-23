import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, Text, Dimensions } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { useUIStore } from '@/store/ui'
import { SvgIcon } from '@/components/SvgIcon'
import Svg, { Circle, Rect, Defs, LinearGradient, Stop, RadialGradient, Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const TAB_ANIM_CONFIG = {
  duration: 180,
  easing: Easing.out(Easing.quad),
}

// Iridescent Color Palette adhering to app aesthetics (Indigo, Violet, Pink, Cyan)
const IRIDESCENT_DARK = {
  stop1: '#6366F1', // Indigo
  stop2: '#8B5CF6', // Violet
  stop3: '#EC4899', // Pink
  stop4: '#06B6D4', // Cyan
  primary: '#A78BFA',
}

const IRIDESCENT_LIGHT = {
  stop1: '#4F46E5', // Deep Indigo
  stop2: '#7C3AED', // Deep Violet
  stop3: '#DB2777', // Vibrant Pink
  stop4: '#0284C7', // Sky Blue
  primary: '#6366F1',
}

/**
 * Stylish Animated Google AI / Gemini inspired Sparkle Button.
 * Features:
 * 1. Continuous flowing rotation of multi-color iridescent border gradient.
 * 2. Soft pulsing ambient radial glow backdrop.
 * 3. Glossy light sweep / shimmer reflection moving across the button.
 * 4. Elevated floating popped-up design.
 */
function AnimatedSparkleButton({ isFocused, isDark, onPress }: { isFocused: boolean; isDark: boolean; onPress: () => void }) {
  const rotation = useSharedValue(0)
  const glowScale = useSharedValue(1)
  const shimmerTranslate = useSharedValue(-60)
  const pressScale = useSharedValue(1)

  const palette = isDark ? IRIDESCENT_DARK : IRIDESCENT_LIGHT

  useEffect(() => {
    // 1. Continuous smooth rotation for flowing gradient border
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    )

    // 2. Subtle breathing / pulse effect for the ambient glow
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )

    // 3. Shimmer reflection light sweep across the surface
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(60, { duration: 2200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(-60, { duration: 0 })
      ),
      -1,
      false
    )
  }, [])

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: isFocused ? 0.85 : 0.45,
  }))

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerTranslate.value },
      { rotate: '25deg' }
    ],
  }))

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressScale.value, { damping: 15, stiffness: 200 }) }],
  }))

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => { pressScale.value = 0.92 }}
      onPressOut={() => { pressScale.value = 1.0 }}
      onPress={onPress}
      style={styles.centerTabItem}
    >
      <Animated.View style={[styles.sparkleContainer, containerAnimatedStyle]}>
        {/* Soft Ambient Radial Glow Backdrop */}
        <Animated.View style={[styles.sparkleAmbientGlow, glowStyle]}>
          <Svg width={64} height={64} viewBox="0 0 64 64">
            <Defs>
              <RadialGradient id="ambientGlowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={palette.stop2} stopOpacity="0.6" />
                <Stop offset="50%" stopColor={palette.stop3} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={palette.stop1} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="32" cy="32" r="32" fill="url(#ambientGlowGrad)" />
          </Svg>
        </Animated.View>

        {/* Flowing Iridescent Animated Border Ring */}
        <Animated.View style={[styles.sparkleBorderRing, rotateStyle]}>
          <Svg width={56} height={56} viewBox="0 0 56 56">
            <Defs>
              <LinearGradient id="iridescentBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={palette.stop1} />
                <Stop offset="33%" stopColor={palette.stop2} />
                <Stop offset="66%" stopColor={palette.stop3} />
                <Stop offset="100%" stopColor={palette.stop4} />
              </LinearGradient>
            </Defs>
            <Circle
              cx="28"
              cy="28"
              r="26"
              stroke="url(#iridescentBorder)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={isFocused ? '160 0' : '40 12'}
            />
          </Svg>
        </Animated.View>

        {/* Glassmorphic Inner Button Surface */}
        <View style={[styles.sparkleInnerSurface, {
          backgroundColor: isDark ? 'rgba(15, 17, 26, 0.92)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)',
        }]}>
          {/* Shiny Gloss / Light Sweep reflection overlay */}
          <Animated.View style={[styles.sparkleShimmerOverlay, shimmerStyle]}>
            <LinearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.35 : 0.6} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <Svg width={24} height={60} viewBox="0 0 24 60">
              <Rect width="24" height="60" fill="url(#shimmerGrad)" />
            </Svg>
          </Animated.View>

          {/* Sparkle Icon */}
          <SvgIcon
            name="sparkles"
            size={24}
            color={isFocused ? palette.stop3 : palette.primary}
            filled={isFocused}
            strokeWidth={2.2}
          />
        </View>
      </Animated.View>
      <Text style={[
        styles.tabLabel,
        {
          color: isFocused ? palette.stop3 : (isDark ? '#9CA3AF' : '#6B7280'),
          fontFamily: isFocused ? 'Inter_700Bold' : 'Inter_500Medium',
          marginTop: 2,
        }
      ]}>
        AI
      </Text>
    </TouchableOpacity>
  )
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark, colors } = useAppTheme()
  const router = useRouter()
  const { tabBarVisible, setTabIndex } = useUIStore()
  const isVisible = useSharedValue(1)
  const insets = useSafeAreaInsets()

  const palette = isDark ? IRIDESCENT_DARK : IRIDESCENT_LIGHT

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isVisible.value = withTiming(0, TAB_ANIM_CONFIG)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      if (tabBarVisible) {
        isVisible.value = withTiming(1, TAB_ANIM_CONFIG)
      }
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [tabBarVisible])

  useEffect(() => {
    isVisible.value = withTiming(tabBarVisible ? 1 : 0, TAB_ANIM_CONFIG)
  }, [tabBarVisible])

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible.value,
      transform: [
        { translateY: interpolate(isVisible.value, [0, 1], [100, 0]) }
      ],
    }
  })

  // 5 Tabs: Home, Projects, AI (center sparkle), Usage, Settings
  const tabs = [
    { key: 'dashboard', routeIndex: 0, icon: 'home' as const, label: 'Home' },
    { key: 'projects', routeIndex: 1, icon: 'workspace' as const, label: 'Projects' },
    { key: 'ai', routeIndex: 2, icon: 'sparkles' as const, label: 'AI', isCenter: true },
    { key: 'usage', routeIndex: 3, icon: 'usage' as const, label: 'Usage' },
    { key: 'settings', routeIndex: 4, icon: 'settings' as const, label: 'Settings' },
  ]

  const inactiveColor = isDark ? '#8E939E' : '#6B7280'

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 4, 20) : 16 },
        wrapperStyle,
      ]}
      pointerEvents={tabBarVisible ? 'box-none' : 'none'}
    >
      {/* Floating Rounded Elevated Tab Bar Container */}
      <View style={[
        styles.floatingCard,
        {
          backgroundColor: isDark ? 'rgba(11, 13, 20, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: isDark ? '#7C3AED' : '#000000',
          shadowOpacity: isDark ? 0.35 : 0.12,
        }
      ]}>
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurFill}
        >
          <View style={styles.tabItemsRow}>
            {tabs.map((tab) => {
              const route = state.routes[tab.routeIndex]
              const isFocused = state.index === tab.routeIndex

              const onPress = () => {
                setTabIndex(tab.routeIndex)
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name)
                }
              }

              // Center AI Sparkle Tab with Gemini flow animation
              if (tab.isCenter) {
                return (
                  <AnimatedSparkleButton
                    key={tab.key}
                    isFocused={isFocused}
                    isDark={isDark}
                    onPress={onPress}
                  />
                )
              }

              // Regular Tab Items
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconWrapper}>
                    {/* Active Iridescent Pill Backdrop */}
                    {isFocused && (
                      <Animated.View style={[
                        styles.activePillBackdrop,
                        { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(99, 102, 241, 0.1)' }
                      ]} />
                    )}
                    <SvgIcon
                      name={tab.icon}
                      size={22}
                      color={isFocused ? palette.primary : inactiveColor}
                      filled={isFocused}
                      strokeWidth={isFocused ? 2.4 : 1.8}
                    />
                  </View>

                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? palette.primary : inactiveColor,
                        fontFamily: isFocused ? 'Inter_700Bold' : 'Inter_500Medium',
                      }
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </BlurView>
      </View>
    </Animated.View>
  )
}

export default function TabsLayout() {
  const { colors } = useAppTheme()

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      // @ts-ignore - sceneContainerStyle is supported but may not be in the typing for the wrapper
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
        }}
      />
      <Tabs.Screen
        name="usage"
        options={{
          title: 'Usage',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  floatingCard: {
    width: '100%',
    maxWidth: 420,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 12,
  },
  blurFill: {
    flex: 1,
    justifyContent: 'center',
  },
  tabItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  activePillBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 14,
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14, // Popped up effect above floating bar
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
  // Google AI / Gemini Sparkle button styles
  sparkleContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleAmbientGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBorderRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleInnerSurface: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  sparkleShimmerOverlay: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 24,
    zIndex: 3,
  },
})
