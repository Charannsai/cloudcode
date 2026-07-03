import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
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

export const OnboardingPage = ({
  index,
  currentScreen,
  illustration: Illustration,
  title,
  description,
}: OnboardingPageProps) => {
  const isWelcomePage = index === 0
  const isLastPage = index === 5

  // Screen 5 (index 5) has a light background, so we use dark text.
  // Other screens have a dark background, so we use light text.
  const textColor = isLastPage ? '#0F172A' : '#FFFFFF'
  const subTextColor = isLastPage ? '#475569' : '#8B929A'

  return (
    <View style={styles.pageContainer}>
      <AmbientGlow color={GLOW_COLORS[index]} isDark={!isLastPage} />
      <View style={styles.pageIllustrationContainer}>
        <Illustration active={currentScreen === index} />
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
    bottom: height * 0.32,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
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
