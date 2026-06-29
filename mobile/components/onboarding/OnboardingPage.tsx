import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

interface OnboardingPageProps {
  index: number
  currentScreen: number
  illustration: React.ComponentType
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
      <View style={styles.pageIllustrationContainer}>
        <Illustration />
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
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIllustrationContainer: {
    width: '100%',
    height: height * 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  textWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
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
