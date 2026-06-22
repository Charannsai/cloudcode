import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, FolderGit2, Sparkles, SlidersHorizontal, Plus } from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate,
} from 'react-native-reanimated'
import { useUIStore } from '@/store/ui'

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 200,
  mass: 0.8,
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark, colors } = useAppTheme()
  const router = useRouter()
  const { tabBarVisible } = useUIStore()
  const isVisible = useSharedValue(1)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isVisible.value = withSpring(0, SPRING_CONFIG)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      if (tabBarVisible) {
        isVisible.value = withSpring(1, SPRING_CONFIG)
      }
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [tabBarVisible])

  useEffect(() => {
    isVisible.value = withSpring(tabBarVisible ? 1 : 0, SPRING_CONFIG)
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
    indicatorX.value = withSpring(getIndicatorPosition(state.index), SPRING_CONFIG)
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
        { translateY: interpolate(isVisible.value, [0, 1], [120, 0]) }
      ],
    }
  })

  const columns = [
    { type: 'route', routeIndex: 0, key: 'dashboard', icon: LayoutDashboard },
    { type: 'route', routeIndex: 1, key: 'projects', icon: FolderGit2 },
    { type: 'fab', key: 'fab' },
    { type: 'route', routeIndex: 2, key: 'ai', icon: Sparkles },
    { type: 'route', routeIndex: 3, key: 'settings', icon: SlidersHorizontal }
  ]

  const activeColor = colors.tabBarActive
  const inactiveColor = colors.tabBarInactive

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <BlurView
        intensity={isDark ? 35 : 75}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarContainer,
          { 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
                  <Plus size={18} color={isDark ? '#0E1116' : '#FFFFFF'} strokeWidth={2.5} />
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
              <Icon 
                color={isFocused ? activeColor : inactiveColor} 
                size={20} 
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
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

