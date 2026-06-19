import { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Platform, LayoutChangeEvent, Keyboard } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, FolderGit2, Sparkles, SlidersHorizontal, Plus } from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  FadeIn,
  FadeOut,
  interpolate,
} from 'react-native-reanimated'
import { useState, useCallback, memo } from 'react'
import { useUIStore } from '@/store/ui'

const TAB_BAR_HEIGHT = 56
const SPRING_CONFIG = {
  damping: 24,
  stiffness: 200,
  mass: 0.8,
}

const TabItem = memo(({ route, options, isFocused, index, onPress, onLayout, isDark }: any) => {
  const Icon = options.tabBarIcon
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.05 : 1, SPRING_CONFIG)
  }, [isFocused])

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    }
  })

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLayout={(e) => onLayout(index, e)}
      style={styles.tabItem}
    >
      <Animated.View style={iconStyle}>
        <Icon 
          color={isFocused 
            ? (isDark ? '#0E1116' : '#FFFFFF') 
            : (isDark ? '#6E7681' : '#656D76')
          } 
          size={18} 
          strokeWidth={isFocused ? 2.2 : 1.8}
        />
      </Animated.View>
      {isFocused && (
        <Animated.Text 
          entering={FadeIn.springify()}
          exiting={FadeOut.duration(80)}
          style={[
            styles.tabLabel, 
            { color: isDark ? '#0E1116' : '#FFFFFF' }
          ]}
        >
          {options.title || route.name}
        </Animated.Text>
      )}
    </TouchableOpacity>
  )
})

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark } = useAppTheme()
  const router = useRouter()
  const [tabWidths, setTabWidths] = useState<number[]>(new Array(state.routes.length).fill(0))
  const [tabPositions, setTabPositions] = useState<number[]>(new Array(state.routes.length).fill(0))
  
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

  const handleLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setTabWidths(prev => {
      if (prev[index] === width) return prev
      const next = [...prev]
      next[index] = width
      return next
    })
    setTabPositions(prev => {
      if (prev[index] === x) return prev
      const next = [...prev]
      next[index] = x
      return next
    })
  }, [])

  const indicatorStyle = useAnimatedStyle(() => {
    const width = tabWidths[state.index] || 0
    const x = tabPositions[state.index] || 0
    
    return {
      width: withSpring(width, SPRING_CONFIG),
      transform: [
        { translateX: withSpring(x, SPRING_CONFIG) },
      ],
    }
  }, [state.index, tabWidths, tabPositions])

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible.value,
      transform: [
        { translateY: interpolate(isVisible.value, [0, 1], [120, 0]) }
      ],
    }
  })

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <BlurView
        intensity={isDark ? 30 : 70}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarContainer,
          { 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? 'rgba(21, 25, 34, 0.75)' : 'rgba(255, 255, 255, 0.8)',
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: isDark ? '#F3F4F6' : '#0E1116',
            },
            indicatorStyle
          ]} 
        />
        
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

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

          const itemComponent = (
            <TabItem 
              key={route.key}
              route={route}
              options={options}
              isFocused={isFocused}
              index={index}
              onPress={onPress}
              onLayout={handleLayout}
              isDark={isDark}
            />
          )

          if (index === 2) {
            return [
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
                <Plus size={20} color={isDark ? '#0E1116' : '#FFFFFF'} strokeWidth={2.5} />
              </TouchableOpacity>,
              itemComponent
            ]
          }

          return itemComponent
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
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  indicator: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    left: 0,
    zIndex: -1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    gap: 7,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
})
