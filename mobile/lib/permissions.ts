import { PermissionsAndroid, Platform, Alert } from 'react-native'

/**
 * Ensures that the microphone permission is granted.
 * If not granted, shows a prominent disclosure explaining why the permission is needed.
 * If the user agrees, requests the permission from the system.
 * 
 * @param onGranted Callback when permission is granted
 * @param onDenied Callback when permission is denied or dismissed
 */
export async function ensureMicrophonePermission(
  onGranted: () => void,
  onDenied?: () => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    // On iOS, permission is handled by the OS and configured via Info.plist (app.json).
    // We can just proceed and let the OS show the prompt.
    onGranted()
    return
  }

  try {
    const isGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    )

    if (isGranted) {
      onGranted()
      return
    }

    // Show Prominent Disclosure before requesting permission
    Alert.alert(
      'Microphone Access Required',
      "CloudCode requires access to your microphone to listen for voice commands ('Hey Cloud') and translate them into code actions. Your audio is processed securely and is never stored or shared.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            if (onDenied) onDenied()
          },
        },
        {
          text: 'Continue',
          onPress: async () => {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            )
            if (result === PermissionsAndroid.RESULTS.GRANTED) {
              onGranted()
            } else {
              if (onDenied) onDenied()
            }
          },
        },
      ],
      { cancelable: false }
    )
  } catch (err) {
    console.error('[Permissions] Failed to check/request microphone permission:', err)
    // Fallback to calling onGranted to let the Voice module try and throw its own error
    onGranted()
  }
}
