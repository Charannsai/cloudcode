import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
  Platform,
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
}

export default function PreviewTab({ projectId, port }: Props) {
  const { colors, isDark } = useAppTheme()
  const webViewRef = useRef<WebView>(null)
  const [url, setUrl] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    async function initUrl() {
      try {
        const token = await getToken()
        const initialUrl = `${API_URL}/api/preview/${projectId}?port=${port}${token ? `&token=${encodeURIComponent(token)}` : ''}`
        setUrl(initialUrl)
        setCurrentUrl(initialUrl)
      } catch (err) {
        console.error('Failed to initialize preview URL:', err)
      }
    }
    initUrl()
  }, [projectId, port])

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
        </View>

        <View style={[styles.urlBar, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF', borderColor: colors.border }]}>
          <Globe size={11} color={colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.urlInput, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}
            value={currentUrl}
            onChangeText={setCurrentUrl}
            onSubmitEditing={() => setUrl(currentUrl)}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            selectTextOnFocus
          />
          <TouchableOpacity
            onPress={() => Clipboard.setStringAsync(currentUrl)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Copy size={11} color={colors.textSecondary} strokeWidth={1.5} />
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
              setCurrentUrl(state.url)
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
    gap: 4,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
