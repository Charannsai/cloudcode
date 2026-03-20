import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Platform, LayoutChangeEvent, Keyboard } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, Database, Sparkles, Settings } from 'lucide-react-native'
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

const TAB_BAR_HEIGHT = 64
const SPRING_CONFIG = {
  damping: 28,
  stiffness: 180,
  mass: 1,
}

const TabItem = memo(({ route, options, isFocused, index, onPress, onLayout, isDark }: any) => {
  const Icon = options.tabBarIcon
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.2 : 1, SPRING_CONFIG)
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
            ? (isDark ? '#000000' : '#ffffff') 
            : (isDark ? '#999999' : '#666666')
          } 
          size={20} 
          strokeWidth={isFocused ? 2.5 : 2}
        />
      </Animated.View>
      {isFocused && (
        <Animated.Text 
          entering={FadeIn.springify()}
          exiting={FadeOut.duration(100)}
          style={[
            styles.tabLabel, 
            { color: isDark ? '#000000' : '#ffffff' }
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
  const [tabWidths, setTabWidths] = useState<number[]>(new Array(state.routes.length).fill(0))
  const [tabPositions, setTabPositions] = useState<number[]>(new Array(state.routes.length).fill(0))
  
  const { tabBarVisible } = useUIStore()
  const isVisible = useSharedValue(1)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isVisible.value = withSpring(0, SPRING_CONFIG)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      isVisible.value = withSpring(1, SPRING_CONFIG)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

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
        { scaleY: withSpring(1, { ...SPRING_CONFIG, damping: 10 }) },
      ],
    }
  }, [state.index, tabWidths, tabPositions])

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible.value,
      transform: [
        { translateY: interpolate(isVisible.value, [0, 1], [150, 0]) }
      ],
    }
  })

  return (
    <Animated.View style={[styles.tabBarWrapper, wrapperStyle]} pointerEvents={tabBarVisible ? "box-none" : "none"}>
      <View
        style={[
          styles.tabBarContainer,
          { 
            backgroundColor: isDark ? '#050505' : '#ffffff',
            borderColor: isDark ? '#1a1a1a' : '#eeeeee',
            shadowOpacity: isDark ? 0.6 : 0.08,
            borderWidth: 1,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: isDark ? '#ffffffff' : '#1b1b1bff',
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

          return (
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
        })}
      </View>
    </Animated.View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: any) => (
            <LayoutDashboard size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, size }: any) => (
            <Database size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }: any) => (
            <Sparkles size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'System',
          tabBarIcon: ({ color, size }: any) => (
            <Settings size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 34,
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
    shadowRadius: 20,
    elevation: 8,
  },
  indicator: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    left: 0,
    zIndex: -1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
})

