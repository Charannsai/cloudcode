import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, FolderGit2, Sparkles, SlidersHorizontal, Plus } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
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
  const { isDark } = useAppTheme()
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
    if (stateIndex === 0) return 5.75
    if (stateIndex === 1) return 63.25
    if (stateIndex === 2) return 230.75
    if (stateIndex === 3) return 288.25
    return 5.75
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
    { type: 'route', routeIndex: 0, key: 'dashboard', name: 'Home', icon: LayoutDashboard },
    { type: 'route', routeIndex: 1, key: 'projects', name: 'Work', icon: FolderGit2 },
    { type: 'fab', key: 'fab' },
    { type: 'route', routeIndex: 2, key: 'ai', name: 'AI', icon: Sparkles },
    { type: 'route', routeIndex: 3, key: 'settings', name: 'System', icon: SlidersHorizontal }
  ]

  const activeColor = isDark ? '#D2A8FF' : '#8250DF'

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <View style={styles.tabBarContainer}>
        <Svg width={340} height={60} viewBox="0 0 340 60" style={styles.svgBg}>
          <Path
            d="M 30,0 L 90,0 C 110,0 120,18 130,18 C 140,18 145,10 153.4,5 A 30 30 0 0 1 186.6,5 C 195,10 200,18 210,18 C 220,18 230,0 250,0 L 310,0 A 30 30 0 0 1 340,30 A 30 30 0 0 1 310,60 L 250,60 C 230,60 220,42 210,42 C 200,42 195,50 186.6,55 A 30 30 0 0 1 153.4,55 C 145,50 140,42 130,42 C 120,42 110,60 90,60 L 30,60 A 30 30 0 0 1 0,30 A 30 30 0 0 1 30,0 Z"
            fill={isDark ? '#151922' : '#0E1116'}
            stroke={isDark ? '#21262D' : 'rgba(255, 255, 255, 0.15)'}
            strokeWidth={1}
          />
        </Svg>

        {/* Active Tab Background Circle Indicator */}
        <Animated.View 
          style={[
            styles.indicatorCircle,
            { backgroundColor: activeColor },
            indicatorStyle
          ]}
        />

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
                <Plus size={22} color={activeColor} strokeWidth={2.5} />
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
          const activeIconColor = isDark ? '#0E1116' : '#FFFFFF'
          const inactiveIconColor = isDark ? '#6E7681' : '#8C959F'

          const getLeftOffset = (colIdx: number) => {
            if (colIdx === 0) return 0
            if (colIdx === 1) return 57.5
            if (colIdx === 3) return 225
            if (colIdx === 4) return 282.5
            return 0
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.tabItem,
                {
                  left: getLeftOffset(index),
                  width: 57.5,
                }
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Icon 
                color={isFocused ? activeIconColor : inactiveIconColor} 
                size={20} 
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
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
    width: 340,
    height: 60,
    position: 'relative',
  },
  svgBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 340,
    height: 60,
    zIndex: 0,
  },
  indicatorCircle: {
    position: 'absolute',
    top: 7,
    width: 46,
    height: 46,
    borderRadius: 23,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tabItem: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    height: 60,
  },
  fabItem: {
    left: 140,
    width: 60,
  },
})

