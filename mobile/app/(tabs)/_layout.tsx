import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { BlurView } from 'expo-blur'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  interpolate,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { useUIStore } from '@/store/ui'
import { SvgIcon } from '@/components/SvgIcon'

const TAB_ANIM_CONFIG = {
  duration: 150,
  easing: Easing.out(Easing.quad),
}

const TabIconWrapper = ({ isFocused, children }: { isFocused: boolean; children: React.ReactNode }) => {
  const scale = useSharedValue(isFocused ? 1.1 : 1)

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.18 : 1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    })
  }, [isFocused])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  )
}

const HomeTabIcon = ({ color, size }: any) => {
  return <SvgIcon name="home" size={size || 26} color={color} />
}

const WorkspaceTabIcon = ({ color, size }: any) => {
  return <SvgIcon name="workspace" size={size || 26} color={color} />
}

const AiTabIcon = ({ color, size }: any) => {
  return <SvgIcon name="ai" size={size || 26} color={color} />
}

const SettingsTabIcon = ({ color, size }: any) => {
  return <SvgIcon name="settings" size={size || 26} color={color} />
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark, colors } = useAppTheme()
  const router = useRouter()
  const { tabBarVisible } = useUIStore()
  const isVisible = useSharedValue(1)

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

  const getIndicatorPosition = (stateIndex: number) => {
    if (stateIndex === 0) return 7
    if (stateIndex === 1) return 69
    if (stateIndex === 2) return 193
    if (stateIndex === 3) return 255
    return 7
  }

  const indicatorX = useSharedValue(getIndicatorPosition(state.index))

  useEffect(() => {
    indicatorX.value = withTiming(getIndicatorPosition(state.index), TAB_ANIM_CONFIG)
  }, [state.index])

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }]
    }
  })

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible.value,
      transform: [
        { translateY: interpolate(isVisible.value, [0, 1], [80, 0]) }
      ],
    }
  })

  const columns = [
    { type: 'route', routeIndex: 0, key: 'dashboard', icon: HomeTabIcon },
    { type: 'route', routeIndex: 1, key: 'projects', icon: WorkspaceTabIcon },
    { type: 'fab', key: 'fab' },
    { type: 'route', routeIndex: 2, key: 'ai', icon: AiTabIcon },
    { type: 'route', routeIndex: 3, key: 'settings', icon: SettingsTabIcon }
  ]

  const activeColor = colors.tabBarActive
  const inactiveColor = colors.tabBarInactive

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <BlurView
        intensity={isDark ? 35 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarContainer,
          { 
            borderColor: isDark ? 'rgba(255, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(21, 25, 34, 0.72)' : 'rgba(255, 255, 255, 0.85)',
          }
        ]}
      >
        {/* Animated Slide Pill Behind active tab + Glowing active Dot */}
        <Animated.View 
          style={[
            styles.indicatorCircle,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
            indicatorStyle
          ]}
        >
          <View style={[styles.indicatorDot, { backgroundColor: activeColor }]} />
        </Animated.View>

        {columns.map((col, index) => {
          if (col.type === 'fab') {
            return (
              <TouchableOpacity
                key="fab"
                style={[styles.tabItem, styles.fabItem]}
                onPress={() => {
                  router.push('/new-project')
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.fabButton, { backgroundColor: activeColor }]}>
                  <SvgIcon name="create" size={24} color={isDark ? '#0E1116' : '#FFFFFF'} />
                </View>
              </TouchableOpacity>
            )
          }

          const route = state.routes[col.routeIndex!]
          const isFocused = state.index === col.routeIndex!

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const Icon = col.icon as any

          const getLeftOffset = (colIdx: number) => {
            if (colIdx === 0) return 0
            if (colIdx === 1) return 62
            if (colIdx === 3) return 186
            if (colIdx === 4) return 248
            return 0
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.tabItem,
                {
                  left: getLeftOffset(index),
                  width: 62,
                }
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <TabIconWrapper isFocused={isFocused}>
                <Icon 
                  color={isFocused ? activeColor : inactiveColor} 
                  size={32} 
                />
              </TabIconWrapper>
            </TouchableOpacity>
          )
        })}
      </BlurView>
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
          title: 'Work',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'System',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  tabBarContainer: {
    flexDirection: 'row',
    width: 310,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    alignItems: 'center',
  },
  indicatorCircle: {
    position: 'absolute',
    top: 9,
    width: 48,
    height: 38,
    borderRadius: 19,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabItem: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    height: 56,
  },
  fabItem: {
    left: 124,
    width: 62,
  },
  fabButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
})

