import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { AmbientGlow } from './ScreenIllustrations'

const { width, height } = Dimensions.get('window')

const GLOW_COLORS = ['#8B5CF6', '#0D9488', '#6366F1', '#2563EB', '#059669', '#64748B']

interface OnboardingPageProps {
  index: number
  currentScreen: number
  illustration: React.ComponentType<{ active: boolean }>
  title: string
  description: string
}

// Inner fade overlay — rendered INSIDE the illustration container
// so it shares the same stacking context as the phone frame
const InnerBottomFade = ({ isDark = true }: { isDark?: boolean }) => {
  const bg = isDark ? '#05070B' : '#FAFAFA'
  return (
    <View style={styles.innerFadeOverlay} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="innerFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={bg} stopOpacity={0} />
            <Stop offset="35%" stopColor={bg} stopOpacity={0.5} />
            <Stop offset="65%" stopColor={bg} stopOpacity={0.92} />
            <Stop offset="100%" stopColor={bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#innerFade)" />
      </Svg>
    </View>
  )
}

export const OnboardingPage = ({
  index,
  currentScreen,
  illustration: Illustration,
  title,
  description,
}: OnboardingPageProps) => {
  const isWelcomePage = index === 0
  const isLastPage = index === 5

  const textColor = isLastPage ? '#0F172A' : '#FFFFFF'
  const subTextColor = isLastPage ? '#475569' : '#8B929A'

  return (
    <View style={styles.pageContainer}>
      <AmbientGlow color={GLOW_COLORS[index]} isDark={!isLastPage} />
      <View style={styles.pageIllustrationContainer}>
        <Illustration active={currentScreen === index} />
        {/* Inner fade — same stacking context as the phone, higher zIndex */}
        <InnerBottomFade isDark={!isLastPage} />
      </View>
      <View style={styles.textWrapper}>
        <Text
          style={[
            isWelcomePage ? styles.title : styles.showcaseTitle,
            { color: textColor, fontFamily: 'Inter_700Bold' },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            isWelcomePage ? styles.description : styles.showcaseDescription,
            { color: subTextColor, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pageContainer: {
    width: width,
    height: height,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIllustrationContainer: {
    position: 'absolute',
    top: height * 0.08,
    left: 0,
    right: 0,
    bottom: height * 0.22,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Inside the illustration container, covering the bottom 55%
  // zIndex 20 ensures it paints OVER the phone (zIndex 5)
  innerFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    zIndex: 20,
  },
  textWrapper: {
    position: 'absolute',
    bottom: 165,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
    maxWidth: '90%',
  },
  showcaseTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
    textAlign: 'left',
  },
  showcaseDescription: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: '95%',
    textAlign: 'left',
  },
})
