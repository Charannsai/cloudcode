import React from 'react'

/**
 * FloatingMic — Voice assistant overlay (currently disabled).
 *
 * The @react-native-voice/voice native module is incompatible with
 * React Native's New Architecture and causes a fatal crash on Android
 * at app launch.  Since this feature is disabled (returns null), all
 * Voice-related imports and logic have been removed to prevent the
 * native module from being loaded at runtime.
 *
 * When re-enabling this feature, ensure @react-native-voice/voice
 * supports Fabric / TurboModules, or disable newArchEnabled first.
 */

interface FloatingMicProps {
  onTranscript?: (text: string) => void
}

export default function FloatingMic(_props: FloatingMicProps) {
  return null
}
