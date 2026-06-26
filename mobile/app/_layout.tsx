import { useEffect } from 'react'
import { View } from 'react-native'
import { useSegments, useRouter, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import { recordAppSession } from '@/lib/appAudit'
import * as SplashScreen from 'expo-splash-screen'
import FloatingMic from '@/components/FloatingMic'
import LimitExceededModal from '@/components/LimitExceededModal'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold, 
  Inter_800ExtraBold, 
  Inter_900Black 
} from '@expo-google-fonts/inter'
import { 
  JetBrainsMono_400Regular, 
  JetBrainsMono_600SemiBold 
} from '@expo-google-fonts/jetbrains-mono'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { colors, isDark } = useAppTheme()
  const { loadStoredToken, setToken, user, loading } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  })

  useEffect(() => {
    loadStoredToken()
  }, [loadStoredToken])

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    function handleUrl(event: { url: string }) {
      const parsed = Linking.parse(event.url)
      if (parsed.path === 'auth' && parsed.queryParams?.token) {
        const token = parsed.queryParams.token as string
        setToken(token)
        router.replace('/(tabs)/dashboard')
      }
    }

    const sub = Linking.addEventListener('url', handleUrl)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url })
    })

    return () => sub.remove()
  }, [setToken, router])

  // Auth Guard
  useEffect(() => {
    if (loading || !fontsLoaded) return

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'project' || segments[0] === 'new-project' || segments[0] === 'billing'

    if (!user && inAuthGroup) {
      router.replace('/')
    }
  }, [user, loading, fontsLoaded, segments, router])

  // Record session audit log when user authenticates
  useEffect(() => {
    if (user) {
      recordAppSession()
    }
  }, [user])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <KeyboardProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent />
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-project" options={{ presentation: 'modal' }} />
          <Stack.Screen name="project/[id]/index" />
          <Stack.Screen name="project/[id]/editor" options={{ presentation: 'card' }} />
          <Stack.Screen name="billing/success" />
        </Stack>
      {/*
        Floating Voice Assistant
      */}
        <FloatingMic />
        <LimitExceededModal />
      </View>
    </KeyboardProvider>
  )
}
