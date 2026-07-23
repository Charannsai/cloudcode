import { Platform } from 'react-native'

let HapticsModule: any = null
try {
  HapticsModule = require('expo-haptics')
} catch (_e) {
  // Fallback when expo-haptics package is missing in web/test environment
}

/**
 * Native Haptic Engine Feedback Wrappers
 * Delivers immediate tactile physical confirmation ($\le 8ms$) on touch interactions.
 */

export function hapticLight(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Light ?? 'light')
  } catch (_e) {}
}

export function hapticMedium(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Medium ?? 'medium')
  } catch (_e) {}
}

export function hapticHeavy(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Heavy ?? 'heavy')
  } catch (_e) {}
}

export function hapticSelection(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.selectionAsync()
  } catch (_e) {}
}

export function hapticSuccess(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.notificationAsync(
      HapticsModule.NotificationFeedbackType?.Success ?? 'success'
    )
  } catch (_e) {}
}

export function hapticError(): void {
  if (Platform.OS === 'web' || !HapticsModule) return
  try {
    HapticsModule.notificationAsync(
      HapticsModule.NotificationFeedbackType?.Error ?? 'error'
    )
  } catch (_e) {}
}
