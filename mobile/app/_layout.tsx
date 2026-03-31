import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { useAppTheme } from '@/hooks/useAppTheme'
import * as SplashScreen from 'expo-splash-screen'
import FloatingMic from '@/components/FloatingMic'
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
  const { loadStoredToken, setToken } = useAuthStore()
  const router = useRouter()

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

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade_from_bottom',
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-project" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/[id]/index" />
        <Stack.Screen name="project/[id]/editor" options={{ presentation: 'card' }} />
      </Stack>
    {/*
      Floating Voice Assistant
    */}
      <FloatingMic />
    </View>
  )
}
