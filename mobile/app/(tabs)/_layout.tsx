import { useEffect, useRef } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform, Text, Dimensions } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated'
import { useUIStore } from '@/store/ui'
import { SvgIcon } from '@/components/SvgIcon'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const TAB_ANIM_CONFIG = {
  duration: 150,
  easing: Easing.out(Easing.quad),
}

// Animated sparkle icon with rotating gradient border glow
function AnimatedSparkleIcon({ isFocused, isDark, activeColor }: { isFocused: boolean; isDark: boolean; activeColor: string }) {
  const rotation = useSharedValue(0)
  const glowPulse = useSharedValue(0.3)

  useEffect(() => {
    // Continuous rotation for border glow effect
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    )
    // Pulsing glow
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    )
  }, [])

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }))

  const sparkleColor1 = isDark ? '#818CF8' : '#6366F1' // indigo
  const sparkleColor2 = isDark ? '#C084FC' : '#A855F7' // purple
  const sparkleColor3 = isDark ? '#F472B6' : '#EC4899' // pink

  return (
    <View style={styles.sparkleWrapper}>
      {/* Rotating gradient glow ring */}
      <Animated.View style={[styles.sparkleGlowRing, rotationStyle]}>
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Defs>
            <LinearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={sparkleColor1} stopOpacity="1" />
              <Stop offset="50%" stopColor={sparkleColor2} stopOpacity="1" />
              <Stop offset="100%" stopColor={sparkleColor3} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Circle cx="26" cy="26" r="24" stroke="url(#sparkleGrad)" strokeWidth="2" fill="none" strokeDasharray="8 4" />
        </Svg>
      </Animated.View>

      {/* Outer glow pulse */}
      <Animated.View style={[styles.sparkleOuterGlow, glowStyle, {
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(99, 102, 241, 0.08)',
      }]} />

      {/* Inner sparkle icon */}
      <View style={[styles.sparkleIconInner, {
        backgroundColor: isDark ? 'rgba(15, 15, 20, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      }]}>
        <SvgIcon
          name="ai"
          size={22}
          color={isFocused ? sparkleColor2 : (isDark ? '#A78BFA' : '#7C3AED')}
          filled={isFocused}
          strokeWidth={isFocused ? 2.5 : 1.8}
        />
      </View>
    </View>
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
        { translateY: isVisible.value === 0 ? 100 : 0 }
      ],
    }
  })

  // Tab definitions: 5 tabs, center is the special sparkle AI tab
  const tabs = [
    { key: 'dashboard', routeIndex: 0, icon: 'home' as const, label: 'Home' },
    { key: 'projects', routeIndex: 1, icon: 'workspace' as const, label: 'Projects' },
    { key: 'ai', routeIndex: 2, icon: 'ai' as const, label: 'AI', isCenter: true },
    { key: 'usage', routeIndex: 3, icon: 'usage' as const, label: 'Usage' },
    { key: 'settings', routeIndex: 4, icon: 'settings' as const, label: 'Settings' },
  ]

  const activeColor = isDark ? '#A78BFA' : '#6366F1'
  const inactiveColor = isDark ? '#6B7280' : '#9CA3AF'
  const tabBarBg = isDark ? 'rgba(11, 12, 16, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const borderTopColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)'

  return (
    <Animated.View
      style={[
        styles.tabBarWrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
        wrapperStyle,
      ]}
      pointerEvents={tabBarVisible ? 'box-none' : 'none'}
    >
      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: tabBarBg,
            borderTopColor: borderTopColor,
          }
        ]}
      >
        {tabs.map((tab, index) => {
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

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.centerTabItem}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <AnimatedSparkleIcon
                  isFocused={isFocused}
                  isDark={isDark}
                  activeColor={activeColor}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? activeColor : inactiveColor,
                      fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_500Medium',
                    }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          }

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
                    fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
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
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabBarContainer: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 0.5,
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -18, // Pop up above the tab bar
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  // Sparkle icon styles
  sparkleWrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleGlowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOuterGlow: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  sparkleIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
})
