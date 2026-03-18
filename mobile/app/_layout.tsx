import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'

export default function RootLayout() {
  const { loadStoredToken, setToken } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Restore token from SecureStore on app start
    loadStoredToken()
  }, [loadStoredToken])

  useEffect(() => {
    // Handle deep link: cloudcode://auth?token=<jwt>
    function handleUrl(event: { url: string }) {
      const parsed = Linking.parse(event.url)
      if (parsed.path === 'auth' && parsed.queryParams?.token) {
        const token = parsed.queryParams.token as string
        setToken(token)
        router.replace('/(tabs)/projects')
      }
    }

    // Handle link if app was already open
    const sub = Linking.addEventListener('url', handleUrl)

    // Handle link if app was launched from deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url })
    })

    return () => sub.remove()
  }, [setToken, router])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0f' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-project" options={{ presentation: 'modal' }} />
        <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/[id]/index" />
        <Stack.Screen name="project/[id]/editor" options={{ presentation: 'card' }} />
      </Stack>
    </>
  )
}
