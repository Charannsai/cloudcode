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

export default function PreviewTab({ projectId, port, ports }: Props) {
  const { colors, isDark } = useAppTheme()
  const webViewRef = useRef<WebView>(null)
  const [url, setUrl] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    async function initUrl() {
      try {
        const token = await getToken()
        // Always load via the proxy to guarantee WebSocket HMR proxying and Host header rewriting
        const initialUrl = `${API_URL}/api/preview/${projectId}?port=3000${token ? `&token=${encodeURIComponent(token)}` : ''}`

        setUrl(initialUrl)
        
        // Show virtual localhost URL in the address bar
        const virtualUrl = `http://localhost:3000/`
        setCurrentUrl(virtualUrl)
      } catch (err) {
        console.error('Failed to initialize preview URL:', err)
      }
    }
    initUrl()
  }, [projectId])

  const handleGo = async () => {
    const token = await getToken()
    let realUrl = currentUrl
    if (currentUrl.includes('localhost:3000')) {
      const subpath = currentUrl.split('localhost:3000')[1] || ''
      realUrl = `${API_URL}/api/preview/${projectId}${subpath}${subpath.includes('?') ? '&' : '?'}port=3000${token ? `&token=${encodeURIComponent(token)}` : ''}`
    }
    setUrl(realUrl)
  }

  const handleCopy = () => {
    Clipboard.setStringAsync(url)
  }

  const handleOpenExternal = () => {
    Linking.openURL(url).catch(err => console.error('Failed to open url:', err))
  }

  const renderLoadingPage = () => {
    return (
      <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textSecondary} size="small" />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Loading preview...
        </Text>
      </View>
    )
  }

  const renderErrorPage = () => {
    return (
      <View style={[styles.errorOverlay, { backgroundColor: colors.background }]}>
        <View style={[styles.errorCard, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderColor: colors.border }]}>
          <Text style={styles.errorIcon}>🔌</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Server Not Connected</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            We couldn't reach your project server. Make sure your development server (e.g. <Text style={{ fontFamily: 'JetBrainsMono_400Regular', color: '#3FB950', fontWeight: '600' }}>npm run dev</Text>) is running in the Terminal tab.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.text }]}
            onPress={() => {
              webViewRef.current?.reload()
            }}
          >
            <Text style={[styles.retryBtnText, { color: colors.background }]}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
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
            onPress={() => {
              webViewRef.current?.reload()
            }}
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
        {url ? (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={renderLoadingPage}
            renderError={renderErrorPage}
            onNavigationStateChange={(state) => {
              setCanGoBack(state.canGoBack)
              setCanGoForward(state.canGoForward)
              
              let virtualUrl = state.url
              const previewPath = `/api/preview/${projectId}`
              if (state.url.includes(previewPath)) {
                const parts = state.url.split(previewPath)
                const subpathAndSearch = parts[1] || ''
                const cleanSubpath = subpathAndSearch
                  .replace(/[\?&]port=\d+/, '')
                  .replace(/[\?&]token=[^&]+/, '')
                  .replace(/\?&/, '?')
                
                virtualUrl = `http://localhost:3000${cleanSubpath}`
              }
              setCurrentUrl(virtualUrl)
            }}
            injectedJavaScript={`
              (function() {
                var originalLog = console.log;
                var originalWarn = console.warn;
                var originalError = console.error;
                
                console.log = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', data: Array.from(arguments).join(' ') }));
                  originalLog.apply(console, arguments);
                };
                console.warn = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'warn', data: Array.from(arguments).join(' ') }));
                  originalWarn.apply(console, arguments);
                };
                console.error = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', data: Array.from(arguments).join(' ') }));
                  originalError.apply(console, arguments);
                };
                window.onerror = function(message, source, lineno, colno, error) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'error', 
                    data: message + ' at ' + source + ':' + lineno + ':' + colno 
                  }));
                  return false;
                };
              })();
              true;
            `}
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data)
                console.log(`[WebView Console ${msg.type.toUpperCase()}]`, msg.data)
              } catch (e) {
                // Ignore parsing errors for other messages
              }
            }}
            javaScriptEnabled
            domStorageEnabled
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
  errorDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
})
