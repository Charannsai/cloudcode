import { Tabs } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Platform, LayoutChangeEvent } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LayoutDashboard, Database, Sparkles, Settings } from 'lucide-react-native'
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { useState, useCallback } from 'react'

const TAB_BAR_HEIGHT = 64
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useAppTheme()
  const [tabWidths, setTabWidths] = useState<number[]>([])
  const [tabPositions, setTabPositions] = useState<number[]>([])
  
  const indicatorWidth = useSharedValue(0)
  const indicatorX = useSharedValue(0)

  const handleLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setTabWidths(prev => {
      const next = [...prev]
      next[index] = width
      return next
    })
    setTabPositions(prev => {
      const next = [...prev]
      next[index] = x
      return next
    })
    
    // Initial position
    if (index === state.index) {
      indicatorWidth.value = width
      indicatorX.value = x
    }
  }, [state.index, indicatorWidth, indicatorX])

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(tabWidths[state.index] || 0, SPRING_CONFIG),
      transform: [{ translateX: withSpring(tabPositions[state.index] || 0, SPRING_CONFIG) }],
    }
  })

  return (
    <View style={styles.tabBarWrapper}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarContainer,
          { 
            backgroundColor: isDark ? 'rgba(15, 15, 15, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.indicator, 
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
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

          const Icon = options.tabBarIcon

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              onLayout={(e) => handleLayout(index, e)}
              style={[
                styles.tabItem,
                isFocused && styles.activeTabItem
              ]}
            >
              <Icon 
                color={isFocused ? colors.text : colors.textSecondary} 
                size={20} 
                strokeWidth={isFocused ? 2.5 : 2}
              />
              {isFocused && (
                <Text style={[styles.tabLabel, { color: colors.text }]}>
                  {options.title || route.name}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </BlurView>
    </View>
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
          title: 'Sys',
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
  activeTabItem: {},
  tabLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
})

