import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Platform, LayoutChangeEvent, Keyboard } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, FolderGit2, Sparkles, SlidersHorizontal, Plus, Terminal } from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing,
  useSharedValue,
  FadeIn,
  FadeOut,
  interpolate,
} from 'react-native-reanimated'
import { useState, useCallback, memo } from 'react'
import { useUIStore } from '@/store/ui'

const TAB_BAR_HEIGHT = 64
const SPRING_CONFIG = {
  damping: 24,
  stiffness: 200,
  mass: 0.8,
}

const TabItem = memo(({ col, isFocused, activeColor, inactiveColor, isDark, onPress }: any) => {
  const scale = useSharedValue(isFocused ? 1.05 : 1)

  useEffect(() => {
    scale.value = withTiming(isFocused ? 1.08 : 1, {
      duration: 100,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    })
  }, [isFocused])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const Icon = col.icon as any

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabItemContent, animStyle]}>
        <Icon 
          color={isFocused ? activeColor : inactiveColor} 
          size={16} 
          strokeWidth={isFocused ? 2.0 : 1.6}
        />
        <Text style={[
          styles.tabLabel,
          { 
            color: isFocused ? (isDark ? '#FFFFFF' : '#0E1116') : inactiveColor,
            marginTop: 2
          }
        ]}>
          {col.name}
        </Text>
        {isFocused && (
          <Animated.View
            entering={FadeIn.duration(120)}
            exiting={FadeOut.duration(80)}
            style={[styles.activeDot, { backgroundColor: activeColor }]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  )
})

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

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible.value,
      transform: [
        { translateY: interpolate(isVisible.value, [0, 1], [120, 0]) }
      ],
    }
  })

  // Symmetrical 5-column layout: Home, Work, FAB, AI, System
  const columns = [
    { type: 'route', routeIndex: 0, key: 'dashboard', name: 'Home', icon: LayoutDashboard },
    { type: 'route', routeIndex: 1, key: 'projects', name: 'Work', icon: FolderGit2 },
    { type: 'fab', key: 'fab' },
    { type: 'route', routeIndex: 2, key: 'ai', name: 'AI', icon: Sparkles },
    { type: 'route', routeIndex: 3, key: 'settings', name: 'System', icon: SlidersHorizontal }
  ]

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <BlurView
        intensity={isDark ? 35 : 75}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarContainer,
          { 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(21, 25, 34, 0.78)' : 'rgba(255, 255, 255, 0.85)',
          }
        ]}
      >
        {columns.map((col) => {
          if (col.type === 'fab') {
            return (
              <TouchableOpacity
                key="fab"
                style={[
                  styles.fabButton,
                  { backgroundColor: isDark ? '#FFFFFF' : '#0E1116' }
                ]}
                onPress={() => {
                  router.push('/new-project')
                }}
                activeOpacity={0.8}
              >
                <Plus size={18} color={isDark ? '#0E1116' : '#FFFFFF'} strokeWidth={2.5} />
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

          const activeColor = isDark ? '#D2A8FF' : '#8250DF'
          const inactiveColor = isDark ? '#6E7681' : '#8C959F'

          return (
            <TabItem
              key={route.key}
              col={col}
              isFocused={isFocused}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              isDark={isDark}
              onPress={onPress}
            />
          )
        })}
      </BlurView>
    </Animated.View>
  )
}

export default function TabsLayout() {
  const { isDark, colors } = useAppTheme()

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
          tabBarIcon: ({ color, size }: any) => (
            <LayoutDashboard size={size || 18} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, size }: any) => (
            <FolderGit2 size={size || 18} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }: any) => (
            <Sparkles size={size || 18} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'System',
          tabBarIcon: ({ color, size }: any) => (
            <SlidersHorizontal size={size || 18} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    bottom: 1,
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
})
