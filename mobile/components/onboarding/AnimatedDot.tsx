import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  interpolateColor,
  withTiming,
  SharedValue,
} from 'react-native-reanimated'

interface AnimatedDotProps {
  index: number
  currentScreen: number
  bgThemeTransition: SharedValue<number>
}

export const AnimatedDot = ({
  index,
  currentScreen,
  bgThemeTransition,
}: AnimatedDotProps) => {
  const isActive = currentScreen === index

  const style = useAnimatedStyle(() => {
    const activeWidth = isActive ? 16 : 6
    const activeColor = interpolateColor(
      bgThemeTransition.value,
      [0, 1],
      [
        isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
        isActive ? '#05070B' : 'rgba(15, 23, 42, 0.2)',
      ]
    )
    return {
      width: withTiming(activeWidth, { duration: 250 }),
      backgroundColor: activeColor,
    }
  })

  return <Animated.View style={[styles.dot, style]} />
}

const styles = StyleSheet.create({
  dot: {
    height: 6,
    borderRadius: 3,
  },
})
