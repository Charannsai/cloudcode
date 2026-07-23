import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, Text } from 'react-native'
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
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAB_ANIM_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.quad),
}

/**
 * Clean Floating Sparkle Button (using create.svg sparkle icon).
 * Features:
 * - Positioned downside closer to tab bar (~30% protrusion, top: -14).
 * - Increased icon size (28px).
 * - Ultra-light translucent sheen sweep.
 * - Flat circular button surface without background glow/shadow.
 */
function FloatingCenterSparkleButton({
  isFocused,
  activeColor,
  inactiveColor,
  colors,
  isDark,
  onPress,
}: {
  isFocused: boolean
  activeColor: string
  inactiveColor: string
  colors: any
  isDark: boolean
  onPress: () => void
}) {
  const shimmerPos = useSharedValue(-60)
  const pressScale = useSharedValue(1)

  useEffect(() => {
    // Ultra-light & clean translucent sheen sweep
    shimmerPos.value = withRepeat(
      withSequence(
        withTiming(80, { duration: 2400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(-60, { duration: 0 }),
        withTiming(-60, { duration: 1800 }) // graceful pause between sweeps
      ),
      -1,
      false
    )
  }, [])

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerPos.value },
      { rotate: '25deg' }
    ],
  }))

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressScale.value, { damping: 18, stiffness: 220 }) }],
  }))

  const surfaceBg = isDark ? '#141722' : '#FFFFFF'
  const iconColor = isFocused ? activeColor : (isDark ? '#E2E8F0' : '#334155')

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => { pressScale.value = 0.92 }}
      onPressOut={() => { pressScale.value = 1.0 }}
      onPress={onPress}
      style={styles.centerSparkleTouchable}
    >
      <Animated.View style={[styles.sparkleButtonOuter, containerAnimatedStyle]}>
        {/* Clean Circular Button Body (54px) - NO background glow/shadow */}
        <View
          style={[
            styles.sparkleButtonBody,
            {
              backgroundColor: surfaceBg,
              borderColor: isFocused ? activeColor : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
            }
          ]}
        >
          {/* Ultra-Light Sheen Sweep Overlay */}
          <Animated.View style={[styles.cleanShimmerOverlay, shimmerAnimatedStyle]}>
            <LinearGradient id="ultraLightSweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.15 : 0.35} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <Svg width={24} height={64} viewBox="0 0 24 64">
              <Rect width="24" height="64" fill="url(#ultraLightSweep)" />
            </Svg>
          </Animated.View>

          {/* Sparkle Icon (create.svg) - Increased size to 28 */}
          <SvgIcon
            name="sparkles"
            size={28}
            color={iconColor}
            filled={isFocused}
            isDark={isDark}
            strokeWidth={2.0}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark, colors } = useAppTheme()
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

  const aiIsFocused = state.index === 2
  const onAiPress = () => {
    setTabIndex(2)
    const route = state.routes[2]
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })
    if (!aiIsFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
    }
  }

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 4, 18) : 18 },
        wrapperStyle,
      ]}
      pointerEvents={tabBarVisible ? 'box-none' : 'none'}
    >
      {/* 1. Base Floating Tab Bar Card */}
      <View
        style={[
          styles.floatingCard,
          {
            backgroundColor: isDark ? 'rgba(15, 17, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.16)',
            shadowOpacity: isDark ? 0.4 : 0.12,
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

              // Center slot spacer so AI label aligns nicely
              if (tab.isCenter) {
                return (
                  <View key={tab.key} style={styles.tabItemSpacer} />
                )
              }

              // Navigation Tab Items: Solid filled when active, Line outlined when inactive
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
                    isDark={isDark}
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

      {/* 2. Absolute Center Sparkle Button (positioned downside closer to tab bar, top: -14) */}
      <View style={styles.absoluteCenterSparkleOverlay} pointerEvents="box-none">
        <FloatingCenterSparkleButton
          isFocused={aiIsFocused}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          colors={colors}
          isDark={isDark}
          onPress={onAiPress}
        />
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
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
  },
  blurFill: {
    flex: 1,
    borderRadius: 32,
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
  tabItemSpacer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Positioned downside closer to tab bar (top: -14)
  absoluteCenterSparkleOverlay: {
    position: 'absolute',
    top: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  centerSparkleTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleButtonOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleButtonBody: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cleanShimmerOverlay: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 24,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
})
