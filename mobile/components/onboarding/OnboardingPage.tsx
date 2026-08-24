import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

const { width, height } = Dimensions.get('window')

export interface OnboardingPageProps {
  index: number
  currentScreen: number
  backgroundImage: ImageSourcePropType
  title: string
  subtitle: string
  textPosition?: 'center' | 'top' | 'bottom'
}

function getGradientStops(index: number) {
  if (index === 0) {
    // Screen 1: Welcome to CloudCode
    return [
      <Stop key="0" offset="0%" stopColor="#000000" stopOpacity={0.4} />,
      <Stop key="1" offset="40%" stopColor="#000000" stopOpacity={0.3} />,
      <Stop key="2" offset="75%" stopColor="#000000" stopOpacity={0.8} />,
      <Stop key="3" offset="100%" stopColor="#000000" stopOpacity={0.95} />,
    ]
  }
  if (index === 3) {
    // Screen 4: Everything runs on cloud
    return [
      <Stop key="0" offset="0%" stopColor="#000000" stopOpacity={0.85} />,
      <Stop key="1" offset="35%" stopColor="#000000" stopOpacity={0.65} />,
      <Stop key="2" offset="55%" stopColor="#000000" stopOpacity={0.3} />,
      <Stop key="3" offset="75%" stopColor="#000000" stopOpacity={0.2} />,
      <Stop key="4" offset="100%" stopColor="#000000" stopOpacity={0.85} />,
    ]
  }
  if (index === 5) {
    // Screen 6: Be One of the First (dark bottom for text + button + terms)
    return [
      <Stop key="0" offset="0%" stopColor="#1A1A1A" stopOpacity={0.3} />,
      <Stop key="1" offset="45%" stopColor="#000000" stopOpacity={0.2} />,
      <Stop key="2" offset="65%" stopColor="#000000" stopOpacity={0.7} />,
      <Stop key="3" offset="85%" stopColor="#000000" stopOpacity={0.9} />,
      <Stop key="4" offset="100%" stopColor="#000000" stopOpacity={0.98} />,
    ]
  }
  // Standard screens (2, 3, 5) - rich bottom gradient covering text right above button
  return [
    <Stop key="0" offset="0%" stopColor="#000000" stopOpacity={0.3} />,
    <Stop key="1" offset="45%" stopColor="#000000" stopOpacity={0.15} />,
    <Stop key="2" offset="65%" stopColor="#000000" stopOpacity={0.65} />,
    <Stop key="3" offset="85%" stopColor="#000000" stopOpacity={0.88} />,
    <Stop key="4" offset="100%" stopColor="#000000" stopOpacity={0.96} />,
  ]
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  index,
  backgroundImage,
  title,
  subtitle,
  textPosition,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.pageContainer}>
      {/* Background Artwork */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* Scrim Overlay Gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`scrim-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              {getGradientStops(index)}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#scrim-${index})`} />
        </Svg>
      </View>

      {/* Center text block for Screen 1 */}
      {textPosition === 'center' && (
        <View style={[styles.centerTextBlock, { bottom: height * 0.44 }]}>
          <Text style={[styles.title, styles.textCenter]}>{title}</Text>
          <Text style={[styles.subtitle14, styles.textCenter]}>{subtitle}</Text>
        </View>
      )}

      {/* Top text block for Screen 4 */}
      {textPosition === 'top' && (
        <View style={[styles.topTextBlock, { top: insets.top + 180 }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle12}>{subtitle}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  pageContainer: {
    width: width,
    height: height,
    overflow: 'hidden',
    backgroundColor: '#05070B',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  centerTextBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 6,
    alignItems: 'center',
    zIndex: 10,
  },
  topTextBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 6,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  subtitle14: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  subtitle12: {
    fontSize: 12,
    lineHeight: 18,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  textCenter: {
    textAlign: 'center',
  },
})
