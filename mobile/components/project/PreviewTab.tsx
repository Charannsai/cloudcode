import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
  Platform, Linking,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { getToken } from '@/lib/auth'
import {
  Globe, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight, Copy,
} from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

interface Props {
  projectId: string
  port: number
  ports?: Record<string, number>
}

function getHostFromApiUrl(apiUrl: string): string {
  try {
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      const withoutProto = apiUrl.split('://')[1]
      return withoutProto.split(':')[0]
    }
  } catch (e) {}
  return 'localhost'
}

export default function PreviewTab({ projectId, port, ports }: Props) {
  const { colors, isDark } = useAppTheme()
  const webViewRef = useRef<WebView>(null)
  const [selectedPort, setSelectedPort] = useState(port)
  const [url, setUrl] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')

  // Determine available ports dynamically
  const availablePorts = Object.keys(ports || {}).map(p => parseInt(p, 10)).sort((a, b) => a - b)
  if (availablePorts.length === 0) {
    availablePorts.push(port || 3000)
  }

  // Ensure selectedPort updates if parent updates it
  useEffect(() => {
    if (port) {
      setSelectedPort(port)
    }
  }, [port])

  useEffect(() => {
    async function initUrl() {
      try {
        const token = await getToken()
        const host = getHostFromApiUrl(API_URL)
        const mappedPort = ports?.[selectedPort.toString()]

        let initialUrl = ''
        if (mappedPort) {
          initialUrl = `http://${host}:${mappedPort}/`
        } else {
          initialUrl = `${API_URL}/api/preview/${projectId}?port=${selectedPort}${token ? `&token=${encodeURIComponent(token)}` : ''}`
        }

        setUrl(initialUrl)
        
        // Show virtual localhost URL in the address bar
        const virtualUrl = `http://localhost:${selectedPort}/`
        setCurrentUrl(virtualUrl)
      } catch (err) {
        console.error('Failed to initialize preview URL:', err)
      }
    }
    initUrl()
  }, [projectId, selectedPort, ports])

  const handleGo = () => {
    const host = getHostFromApiUrl(API_URL)
    const mappedPort = ports?.[selectedPort.toString()]
    const targetHostPort = mappedPort ? `${host}:${mappedPort}` : `${host}:${selectedPort}`

    let realUrl = currentUrl
    if (currentUrl.includes(`localhost:${selectedPort}`)) {
      realUrl = currentUrl.replace(`localhost:${selectedPort}`, targetHostPort)
    }
    setUrl(realUrl)
  }

  const handleCopy = () => {
    // Copy the real URL to clipboard so they can open it externally
    Clipboard.setStringAsync(url)
  }

  const handleOpenExternal = () => {
    Linking.openURL(url).catch(err => console.error('Failed to open url:', err))
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderBottomColor: colors.border }]}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goBack()}
            disabled={!canGoBack}
            style={[styles.navBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={14} color={canGoBack ? colors.text : colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goForward()}
            disabled={!canGoForward}
            style={[styles.navBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <ChevronRight size={14} color={canGoForward ? colors.text : colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            style={[styles.navBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>

          {/* Dynamic Port Selector badge (cycles through available ports on tap) */}
          <TouchableOpacity
            onPress={() => {
              if (availablePorts.length > 1) {
                const currentIndex = availablePorts.indexOf(selectedPort)
                const nextIndex = (currentIndex + 1) % availablePorts.length
                setSelectedPort(availablePorts[nextIndex])
              }
            }}
            style={[styles.portBadge, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.portBadgeText, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular', fontWeight: 'bold' }]}>
              {selectedPort}
            </Text>
            {availablePorts.length > 1 && (
              <Text style={{ fontSize: 9, color: colors.textSecondary, marginLeft: 3 }}>▾</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.urlBar, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF', borderColor: colors.border }]}>
          <Globe size={11} color={colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.urlInput, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}
            value={currentUrl}
            onChangeText={setCurrentUrl}
            onSubmitEditing={handleGo}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            selectTextOnFocus
          />
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Copy size={11} color={colors.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenExternal}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{ marginLeft: 6 }}
          >
            <ArrowUpRight size={12} color={colors.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {(loading || !url) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.textSecondary} size="small" />
            <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Loading preview...
            </Text>
          </View>
        )}
        {url ? (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={(state) => {
              setCanGoBack(state.canGoBack)
              setCanGoForward(state.canGoForward)
              
              const host = getHostFromApiUrl(API_URL)
              const mappedPort = ports?.[selectedPort.toString()]
              const targetHostPort = mappedPort ? `${host}:${mappedPort}` : `${host}:${selectedPort}`

              let virtualUrl = state.url
              if (state.url.includes(targetHostPort)) {
                virtualUrl = state.url.replace(targetHostPort, `localhost:${selectedPort}`)
              }
              setCurrentUrl(virtualUrl)
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            originWhitelist={['*']}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portBadge: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  portBadgeText: {
    fontSize: 10,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
  },
  urlInput: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 0,
  },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 12, opacity: 0.5 },
})
