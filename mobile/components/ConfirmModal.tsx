import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { useAppTheme } from '@/hooks/useAppTheme'
import { AlertTriangle, Info, Trash2, LogOut, Check, AlertCircle } from 'lucide-react-native'

export interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'logout' | 'success' | 'error'
  isLoading?: boolean
  singleButton?: boolean
}

const TYPE_CONFIG = {
  danger: {
    icon: Trash2,
    color: '#F85149',
    bgLight: '#FFEBE9',
    bgDark: '#4A1C1B',
  },
  warning: {
    icon: AlertTriangle,
    color: '#D29922',
    bgLight: '#FFF8C5',
    bgDark: '#4D3C10',
  },
  info: {
    icon: Info,
    color: '#58A6FF',
    bgLight: '#DDEDFF',
    bgDark: '#1E3A5F',
  },
  logout: {
    icon: LogOut,
    color: '#F85149',
    bgLight: '#FFEBE9',
    bgDark: '#4A1C1B',
  },
  success: {
    icon: Check,
    color: '#3FB950',
    bgLight: 'rgba(63, 185, 80, 0.15)',
    bgDark: 'rgba(63, 185, 80, 0.08)',
  },
  error: {
    icon: AlertCircle,
    color: '#F85149',
    bgLight: 'rgba(248, 81, 73, 0.15)',
    bgDark: 'rgba(248, 81, 73, 0.08)',
  },
}

export function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  singleButton = false,
}: ConfirmModalProps) {
  const { colors, isDark } = useAppTheme()
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.96)
  const translateY = useSharedValue(10)
  const [renderModal, setRenderModal] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setRenderModal(true)
      opacity.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) })
      scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) })
      translateY.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) })
    } else {
      opacity.value = withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      })
      scale.value = withTiming(0.96, { duration: 80, easing: Easing.in(Easing.quad) })
      translateY.value = withTiming(4, { duration: 80, easing: Easing.in(Easing.quad) })
    }
  }, [visible])

  const config = TYPE_CONFIG[type]
  const Icon = config.icon
  const showCancel = !singleButton && !!onCancel

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }))

  if (!renderModal) return null

  const handleDismiss = onCancel || onConfirm

  return (
    <Modal transparent visible={renderModal} animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <BlurView
          intensity={isDark ? 20 : 15}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleDismiss}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
              borderColor: colors.border,
            },
            modalStyle,
          ]}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? config.bgDark : config.bgLight },
              ]}
            >
              <Icon size={24} color={config.color} strokeWidth={2} />
            </View>

            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.message,
                { color: colors.textSecondary, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {message}
            </Text>
          </View>

          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            {showCancel && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.text, fontFamily: 'Inter_500Medium' },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: type === 'success' ? '#3FB950' : config.color, fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                {isLoading ? 'Processing...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 42,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    // optional styling
  },
  confirmButton: {
    // optional styling
  },
  buttonText: {
    fontSize: 13,
  },
  separator: {
    width: 1,
    height: '100%',
  },
})
