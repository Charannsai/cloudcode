import React, { useEffect } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface TabGenieWrapperProps {
  children: React.ReactNode
  index: number
  style?: any
}

export function TabGenieWrapper({ children, index, style }: TabGenieWrapperProps) {
  const isFocused = useIsFocused()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (isFocused) {
      // Snappy, highly responsive Apple-style ease-out curve (200ms) for high performance
      progress.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    } else {
      progress.value = 0
    }
  }, [isFocused])

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value
    const opacity = p
    const translateY = (1 - p) * 10
    const scale = 0.98 + 0.02 * p

    return {
      opacity,
      transform: [
        { translateY },
        { scale }
      ]
    }
  })

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
