import React from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated'
import Svg, { Line } from 'react-native-svg'

const { width, height } = Dimensions.get('window')

interface GridBackgroundProps {
  isDark: boolean
  opacity: SharedValue<number>
  themeTransition: SharedValue<number>
}

export const GridBackground = ({
  isDark,
  opacity,
  themeTransition,
}: GridBackgroundProps) => {
  const spacing = 70
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
  
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * (1 - themeTransition.value),
  }))

  const vLinesCount = Math.ceil(width / spacing)
  const hLinesCount = Math.ceil(height / spacing)

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style, { pointerEvents: 'none' }]}>
      <Svg style={StyleSheet.absoluteFill}>
        {Array.from({ length: vLinesCount }).map((_, i) => (
          <Line
            key={`v-${i}`}
            x1={i * spacing}
            y1={0}
            x2={i * spacing}
            y2={height}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: hLinesCount }).map((_, i) => (
          <Line
            key={`h-${i}`}
            x1={0}
            y1={i * spacing}
            x2={width}
            y2={i * spacing}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </Animated.View>
  )
}
