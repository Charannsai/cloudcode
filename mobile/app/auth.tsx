import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'

export default function AuthScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { setToken } = useAuthStore()
  const router = useRouter()
  const { colors } = useAppTheme()

  useEffect(() => {
    if (token) {
      console.log('Deep link token received from auth route')
      setToken(token)
      // Redirect to the projects list
      router.replace('/(tabs)/projects')
    } else {
      console.warn('No token found in deep link for auth route')
      router.replace('/')
    }
  }, [token, setToken, router])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
