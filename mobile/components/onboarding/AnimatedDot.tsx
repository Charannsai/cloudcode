import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'

interface AnimatedDotProps {
  index: number
  currentScreen: number
}

export const AnimatedDot = ({
  index,
  currentScreen,
}: AnimatedDotProps) => {
  const isActive = currentScreen === index

  const animatedStyle = useAnimatedStyle(() => {
    const targetWidth = isActive ? 20 : 6
    const targetOpacity = isActive ? 0.9 : 0.35

    return {
      width: withTiming(targetWidth, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      opacity: withTiming(targetOpacity, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    }
  }, [isActive])

  return <Animated.View style={[styles.dot, animatedStyle]} />
}

const styles = StyleSheet.create({
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 3,
  },
})
