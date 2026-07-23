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
import Svg, { Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAB_ANIM_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.quad),
}

/**
 * Premium Google AI / Gemini style Sparkle Action Button.
 * Key Specs:
 * - Protrudes ~45% outside the top edge of the floating tab bar.
 * - Inherits system theme accent colors (no hardcoded purple/blue).
 * - Subtle, refined animated light sweep shimmer effect (no spinning revolving ring).
 * - Soft ambient glow breathing gently in the background.
 */
function FloatingSparkleButton({
  isFocused,
  activeColor,
  inactiveColor,
  colors,
  isDark,
  onPress
}: {
  isFocused: boolean
  activeColor: string
  inactiveColor: string
  colors: any
  isDark: boolean
  onPress: () => void
}) {
  const glowOpacity = useSharedValue(0.2)
  const shimmerPos = useSharedValue(-60)
  const pressScale = useSharedValue(1)

  useEffect(() => {
    // 1. Subtle, slow breathing glow opacity (no flashy noise)
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.18, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    )

    // 2. Elegant, periodic soft light sweep across the button border & surface
    shimmerPos.value = withRepeat(
      withSequence(
        withTiming(70, { duration: 2400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(-60, { duration: 0 }),
        withTiming(-60, { duration: 1200 }) // pause between sweeps for elegance
      ),
      -1,
      false
    )
  }, [])

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isFocused ? glowOpacity.value * 1.4 : glowOpacity.value,
  }))

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerPos.value },
      { rotate: '30deg' }
    ],
  }))

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressScale.value, { damping: 18, stiffness: 220 }) }],
  }))

  const surfaceBg = isDark ? '#141722' : '#FFFFFF'
  const shimmerHighlight = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.7)'

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => { pressScale.value = 0.92 }}
      onPressOut={() => { pressScale.value = 1.0 }}
      onPress={onPress}
      style={styles.centerTabContainer}
    >
      <Animated.View style={[styles.sparkleButtonOuter, containerAnimatedStyle]}>
        {/* Soft Ambient Refined Glow */}
        <Animated.View
          style={[
            styles.sparkleAmbientGlow,
            { backgroundColor: isFocused ? activeColor : colors.border },
            glowAnimatedStyle,
          ]}
        />

        {/* Integrated Circular Button Body with Border Shimmer */}
        <View
          style={[
            styles.sparkleButtonBody,
            {
              backgroundColor: surfaceBg,
              borderColor: isFocused ? activeColor : (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)'),
              shadowColor: isFocused ? activeColor : '#000000',
              shadowOpacity: isDark ? 0.3 : 0.1,
            }
          ]}
        >
          {/* Subtle Light Sweep Reflection Overlay */}
          <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
            <LinearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={shimmerHighlight} stopOpacity="0" />
              <Stop offset="50%" stopColor={shimmerHighlight} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={shimmerHighlight} stopOpacity="0" />
            </LinearGradient>
            <Svg width={28} height={64} viewBox="0 0 28 64">
              <Rect width="28" height="64" fill="url(#sweepGrad)" />
            </Svg>
          </Animated.View>

          {/* Sparkle Icon - Filled when active, outlined when inactive */}
          <SvgIcon
            name="sparkles"
            size={24}
            color={isFocused ? activeColor : inactiveColor}
            filled={isFocused}
            strokeWidth={isFocused ? 2.4 : 1.8}
          />
        </View>
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontFamily: isFocused ? 'Inter_700Bold' : 'Inter_500Medium',
            marginTop: 3,
          }
        ]}
      >
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

  // Inherit system device theme colors
  const activeColor = colors.tabBarActive || colors.primary
  const inactiveColor = colors.tabBarInactive || colors.textSecondary

  // 5 Tabs: Home, Projects, AI (center sparkle), Usage, Settings
  const tabs = [
    { key: 'dashboard', routeIndex: 0, icon: 'home' as const, label: 'Home' },
    { key: 'projects', routeIndex: 1, icon: 'workspace' as const, label: 'Projects' },
    { key: 'ai', routeIndex: 2, icon: 'sparkles' as const, label: 'AI', isCenter: true },
    { key: 'usage', routeIndex: 3, icon: 'usage' as const, label: 'Usage' },
    { key: 'settings', routeIndex: 4, icon: 'settings' as const, label: 'Settings' },
  ]

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 6, 20) : 20 },
        wrapperStyle,
      ]}
      pointerEvents={tabBarVisible ? 'box-none' : 'none'}
    >
      {/* Floating Card Base Container */}
      <View
        style={[
          styles.floatingCard,
          {
            backgroundColor: isDark ? 'rgba(15, 17, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.18)',
            shadowOpacity: isDark ? 0.45 : 0.12,
          }
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 80}
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

              // Center AI Protruding Sparkle Button
              if (tab.isCenter) {
                return (
                  <FloatingSparkleButton
                    key={tab.key}
                    isFocused={isFocused}
                    activeColor={activeColor}
                    inactiveColor={inactiveColor}
                    colors={colors}
                    isDark={isDark}
                    onPress={onPress}
                  />
                )
              }

              // Material Design Icon Items: Filled when active, Outlined when inactive (no background pill)
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <SvgIcon
                    name={tab.icon}
                    size={22}
                    color={isFocused ? activeColor : inactiveColor}
                    filled={isFocused}
                    strokeWidth={isFocused ? 2.4 : 1.8}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? activeColor : inactiveColor,
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
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  floatingCard: {
    width: '100%',
    maxWidth: 400,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
  },
  blurFill: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tabItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24, // Protrudes ~45% above the top edge of the floating tab bar
    zIndex: 10,
  },
  sparkleButtonOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleAmbientGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sparkleButtonBody: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 28,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
})
