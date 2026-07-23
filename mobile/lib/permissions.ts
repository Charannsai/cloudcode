import { PermissionsAndroid, Platform, Alert } from 'react-native'

/**
 * Ensures that the microphone permission is granted.
 */
export async function ensureMicrophonePermission(
  onGranted: () => void,
  onDenied?: () => void
): Promise<void> {
  if (Platform.OS !== 'android') {
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

    Alert.alert(
      'Microphone Access Required',
      "CloudCode requires access to your microphone to listen for voice commands ('Hey Cloud') and translate them into code actions.",
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
    onGranted()
  }
}

/**
 * Ensures that the camera permission is granted.
 */
export async function ensureCameraPermission(
  onGranted: () => void,
  onDenied?: () => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    onGranted()
    return
  }

  try {
    const isGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    )

    if (isGranted) {
      onGranted()
      return
    }

    Alert.alert(
      'Camera Access Required',
      'CloudCode requires access to your camera to take photos and attach screenshots directly into AI prompts.',
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
              PermissionsAndroid.PERMISSIONS.CAMERA
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
    console.error('[Permissions] Failed to check/request camera permission:', err)
    onGranted()
  }
}

/**
 * Ensures that media library / photo gallery permission is granted.
 */
export async function ensureMediaLibraryPermission(
  onGranted: () => void,
  onDenied?: () => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    onGranted()
    return
  }

  try {
    const isGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    )

    if (isGranted) {
      onGranted()
      return
    }

    Alert.alert(
      'Photo Library Access Required',
      'CloudCode requires access to your photo library to attach images and design mockups to AI prompts.',
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
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
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
    console.error('[Permissions] Failed to check/request media library permission:', err)
    onGranted()
  }
}
