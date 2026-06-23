import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
  Platform, Linking, LayoutAnimation, ScrollView, Animated, TouchableWithoutFeedback,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { getToken } from '@/lib/auth'
import {
  Globe, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight, Copy,
  ExternalLink, ChevronDown, ChevronUp, Info, Home, AlertTriangle, Sparkles, X, Terminal,
  MoreVertical,
} from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { BlurView } from 'expo-blur'
import { useAIStore } from '@/store/ai'
import { useRouter } from 'expo-router'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

interface Props {
  projectId: string
  port: number
  ports?: Record<string, number>
}

function getInternalPort(publicPort: number, portsMap?: Record<string, number>): number {
  if (portsMap) {
    for (const [internal, pub] of Object.entries(portsMap)) {
      if (pub === publicPort) {
        return parseInt(internal, 10)
      }
    }
  }
  // Fallback: If it's a high mapped port, default to 3000
  if (publicPort > 1024) {
    return 3000
  }
  return publicPort
}

function DOMInspectorNode({ node, depth = 0 }: { node: any; depth: number }) {
  const { colors } = useAppTheme()
  const [collapsed, setCollapsed] = useState(false)

  if (!node) return null

  if (node.type === 'text') {
    return (
      <View style={{ paddingLeft: depth * 12, paddingVertical: 2 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: colors.textSecondary }}>
          "{node.text}"
        </Text>
      </View>
    )
  }

  const hasChildren = node.children && node.children.length > 0
  const classText = node.className ? ` class="${node.className}"` : ''
  const idText = node.id ? ` id="${node.id}"` : ''

  return (
    <View style={{ paddingLeft: depth * 12 }}>
      <TouchableOpacity 
        onPress={() => setCollapsed(c => !c)} 
        disabled={!hasChildren}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: '#F47067' }}>
          &lt;{node.tagName}
          <Text style={{ color: '#F2C078' }}>{idText}</Text>
          <Text style={{ color: '#58A6FF' }}>{classText}</Text>
          &gt;
        </Text>
        {hasChildren && (
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginLeft: 4 }}>
            {collapsed ? `[+${node.children.length}]` : '[-]'}
          </Text>
        )}
      </TouchableOpacity>
      
      {!collapsed && hasChildren && node.children.map((child: any, idx: number) => (
        <DOMInspectorNode key={idx} node={child} depth={depth + 1} />
      ))}
      
      {hasChildren && !collapsed && (
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: '#F47067', paddingLeft: depth * 12 }}>
          &lt;/{node.tagName}&gt;
        </Text>
      )}
    </View>
  )
}

export default function PreviewTab({ projectId, port, ports }: Props) {
  const { colors, isDark } = useAppTheme()
  const webViewRef = useRef<WebView>(null)
  const router = useRouter()
  const { setActiveProject, setPendingPrompt } = useAIStore()
  
  const [url, setUrl] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [showBrowserInfo, setShowBrowserInfo] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [latestError, setLatestError] = useState<string | null>(null)
  const [showErrorOverlay, setShowErrorOverlay] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'warn' | 'error'; data: string; timestamp: number }[]>([])
  const [networkLogs, setNetworkLogs] = useState<{ url: string; method: string; status: string | number; duration: number; timestamp: number }[]>([])
  const [domTree, setDomTree] = useState<any>(null)
  const [activeDevTab, setActiveDevTab] = useState<'console' | 'network' | 'dom'>('console')
  const [showDevTools, setShowDevTools] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuAnim = useRef(new Animated.Value(0)).current

  const toggleMenu = (open: boolean) => {
    if (open) {
      setShowMenu(true)
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => setShowMenu(false))
    }
  }

  const handleSetError = (error: boolean) => {
    setHasError(error)
    if (error) {
      setCurrentUrl('')
    } else {
      setLatestError(null)
      setShowErrorOverlay(false)
      setNetworkLogs([])
      setDomTree(null)
      setShowDevTools(false)
      setConsoleLogs([])
    }
  }

  // Clear preview URL and error state on project change (back to homepage)
  useEffect(() => {
    setUrl('')
    setCurrentUrl('')
    setHasError(false)
    setLatestError(null)
    setShowErrorOverlay(false)
    setConsoleLogs([])
    setNetworkLogs([])
    setDomTree(null)
    setShowDevTools(false)
    setShowMenu(false)
    menuAnim.setValue(0)
  }, [projectId])

  const handleNavigateToPort = async (targetPort: number) => {
    const virtualStr = `localhost:${targetPort}`
    setCurrentUrl(virtualStr)
    handleSetError(false)
    const token = await getToken()
    
    // Send the internal port directly via iport= so the proxy doesn't need to reverse-map host ports
    const realUrl = `${API_URL}/api/preview/${projectId}?iport=${targetPort}${token ? `&token=${encodeURIComponent(token)}` : ''}`
    setUrl(realUrl)
  }

  const handleGo = async () => {
    let input = currentUrl.trim()
    if (!input) return
    
    handleSetError(false)
    const token = await getToken()

    // 1. If it's a raw port number (e.g. "3000" or ":3000")
    if (/^:?\d+$/.test(input)) {
      const cleanPort = input.replace(':', '')
      const typedPort = parseInt(cleanPort, 10)
      
      // Send internal port directly — no host port mapping needed
      const realUrl = `${API_URL}/api/preview/${projectId}?iport=${typedPort}${token ? `&token=${encodeURIComponent(token)}` : ''}`
      setUrl(realUrl)
      setCurrentUrl(`http://localhost:${typedPort}`)
      return
    }

    // 2. Check if it's a localhost / 127.0.0.1 url
    const localhostRegex = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i
    const localMatch = input.match(localhostRegex)
    if (localMatch) {
      const portPart = localMatch[3]
      const subpath = localMatch[4] || ''
      const typedPort = portPart ? parseInt(portPart.replace(':', ''), 10) : (port || 3000)
      
      // Send internal port directly
      const realUrl = `${API_URL}/api/preview/${projectId}${subpath}${subpath.includes('?') ? '&' : '?'}iport=${typedPort}${token ? `&token=${encodeURIComponent(token)}` : ''}`
      setUrl(realUrl)
      setCurrentUrl(`http://localhost:${typedPort}${subpath}`)
      return
    }

    // 3. Check if it starts with http:// or https:// (and is not localhost)
    if (/^https?:\/\//i.test(input)) {
      setUrl(input)
      setCurrentUrl(input)
      return
    }

    // 4. Check if it is a domain name (contains a dot, no spaces, e.g. "google.com" or "dev.to/about")
    const domainRegex = /^(?:[a-z0-9\-]+\.)+[a-z]{2,}(\/.*)?$/i
    if (domainRegex.test(input) && !/\s/.test(input)) {
      const realUrl = `https://${input}`
      setUrl(realUrl)
      setCurrentUrl(realUrl)
      return
    }

    // 5. Treat as search query
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`
    setUrl(searchUrl)
    setCurrentUrl(input)
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
              handleSetError(false)
              webViewRef.current?.reload()
            }}
          >
            <Text style={[styles.retryBtnText, { color: colors.background }]}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderHomePage = () => {
    return (
      <View style={[styles.homePage, { backgroundColor: colors.background }]}>
        <View style={[styles.homeIconBg, { backgroundColor: isDark ? '#1C2128' : '#F6F8FA', borderColor: colors.border }]}>
          <Globe size={40} color={colors.primary || '#58A6FF'} strokeWidth={1.5} />
        </View>
        <Text style={[styles.homeTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>CloudCode Browser</Text>
        <Text style={[styles.homeSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Search or enter a port (e.g. :5173) to preview your server in real-time.
        </Text>

        <View style={[styles.homeSearchBar, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF', borderColor: colors.border }]}>
          <Globe size={14} color={colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.homeSearchInput, { color: colors.text, fontFamily: 'JetBrainsMono_400Regular' }]}
            value={currentUrl}
            onChangeText={setCurrentUrl}
            onSubmitEditing={handleGo}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter port (e.g. 5173) or URL"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity onPress={handleGo} style={[styles.homeGoBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: isDark ? '#151922' : '#F6F8FA', borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            setUrl('')
            setCurrentUrl('')
            setHasError(false)
          }}
          style={[styles.navBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <Home size={12} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>

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
            placeholder="Search or enter port (e.g. 3000)"
            placeholderTextColor={colors.textSecondary}
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

        <TouchableOpacity
          onPress={() => toggleMenu(!showMenu)}
          style={[styles.navBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
          activeOpacity={0.7}
        >
          <MoreVertical size={14} color={colors.text} strokeWidth={1.8} />
        </TouchableOpacity>
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
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              // Only trigger the "Server Not Connected" error page if it's the preview proxy
              if (url.startsWith(API_URL + '/api/preview/')) {
                handleSetError(true)
              } else {
                console.warn('[Browser] Navigation error on external page:', nativeEvent.description)
              }
            }}
            onHttpError={(syntheticEvent) => {
              const { statusCode } = syntheticEvent.nativeEvent
              if ((statusCode === 502 || statusCode === 503) && url.startsWith(API_URL + '/api/preview/')) {
                handleSetError(true)
              }
            }}
            onNavigationStateChange={(state) => {
              setCanGoBack(state.canGoBack)
              setCanGoForward(state.canGoForward)
              
              let virtualUrl = state.url
              const previewPath = `/api/preview/${projectId}`
              if (state.url.includes(previewPath)) {
                const parts = state.url.split(previewPath)
                const subpathAndSearch = parts[1] || ''
                
                const iportMatch = state.url.match(/[\?&]iport=(\d+)/)
                const portMatch = state.url.match(/[\?&]port=(\d+)/)
                
                let displayPort = 3000
                if (iportMatch) {
                  displayPort = parseInt(iportMatch[1], 10)
                } else if (portMatch) {
                  displayPort = getInternalPort(parseInt(portMatch[1], 10), ports)
                } else {
                  displayPort = getInternalPort(port, ports)
                }

                const cleanSubpath = subpathAndSearch
                  .replace(/[\?&](?:iport|port)=\d+/, '')
                  .replace(/[\?&]token=[^&]+/, '')
                  .replace(/\?&/, '?')
                  .replace(/\?$/, '')
                
                virtualUrl = `localhost:${displayPort}${cleanSubpath}`
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

                // Fetch intercept
                var originalFetch = window.fetch;
                window.fetch = function(input, init) {
                  var url = (typeof input === 'string') ? input : input.url;
                  var method = (init && init.method) || 'GET';
                  var startTime = performance.now();
                  return originalFetch.apply(this, arguments).then(function(response) {
                    var duration = performance.now() - startTime;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'network',
                      data: { url: url, method: method, status: response.status, duration: Math.round(duration) }
                    }));
                    return response;
                  }).catch(function(error) {
                    var duration = performance.now() - startTime;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'network',
                      data: { url: url, method: method, status: 'Failed', duration: Math.round(duration) }
                    }));
                    throw error;
                  });
                };

                // XHR Intercept
                var originalOpen = XMLHttpRequest.prototype.open;
                var originalSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.open = function(method, url) {
                  this._method = method;
                  this._url = url;
                  this._startTime = performance.now();
                  return originalOpen.apply(this, arguments);
                };
                XMLHttpRequest.prototype.send = function() {
                  var self = this;
                  this.addEventListener('load', function() {
                    var duration = performance.now() - self._startTime;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'network',
                      data: { url: self._url, method: self._method, status: self.status, duration: Math.round(duration) }
                    }));
                  });
                  this.addEventListener('error', function() {
                    var duration = performance.now() - self._startTime;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'network',
                      data: { url: self._url, method: self._method, status: 'Failed', duration: Math.round(duration) }
                    }));
                  });
                  return originalSend.apply(this, arguments);
                };

                // DOM Tree Builder
                function buildDomTree(node) {
                  if (!node) return null;
                  if (node.nodeType === 3) {
                    const text = node.nodeValue.trim();
                    if (!text) return null;
                    return { type: 'text', text: text };
                  }
                  if (node.nodeType !== 1) return null;
                  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(node.tagName)) return null;
                  
                  const children = [];
                  for (var i = 0; i < node.childNodes.length; i++) {
                    var childTree = buildDomTree(node.childNodes[i]);
                    if (childTree) children.push(childTree);
                  }
                  
                  return {
                    type: 'element',
                    tagName: node.tagName.toLowerCase(),
                    id: node.id || '',
                    className: (typeof node.className === 'string') ? node.className : '',
                    children: children
                  };
                }

                window.sendDomTree = function() {
                  var tree = buildDomTree(document.body);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'dom',
                    data: tree
                  }));
                };

                // Set up MutationObserver to auto-post DOM changes
                var observer = new MutationObserver(function() {
                  window.sendDomTree();
                });
                observer.observe(document.body, { subtree: true, childList: true, attributes: true });
                
                // Send initial DOM tree when loaded
                setTimeout(window.sendDomTree, 1000);
              })();
              true;
            `}
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data)
                if (msg.type === 'proxy_error') {
                  handleSetError(true)
                  return
                }
                if (msg.type === 'log' || msg.type === 'warn' || msg.type === 'error') {
                  setConsoleLogs(prev => [...prev.slice(-199), { type: msg.type, data: msg.data, timestamp: Date.now() }])
                }
                if (msg.type === 'error') {
                  setLatestError(msg.data)
                  setShowErrorOverlay(true)
                }
                if (msg.type === 'network') {
                  setNetworkLogs(prev => [...prev.slice(-99), { ...msg.data, timestamp: Date.now() }])
                }
                if (msg.type === 'dom') {
                  setDomTree(msg.data)
                }
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
            // Performance: Hardware-accelerated rendering for smooth animations
            androidLayerType="hardware"
            // Enable caching so subsequent loads don't re-download heavy bundles
            cacheEnabled={true}
            // Handle WebView crashes (usually OOM from heavy JS like Framer/GSAP)
            // Auto-reload instead of showing a blank white screen
            onContentProcessDidTerminate={() => {
              console.warn('[Preview] WebView process terminated (likely OOM), reloading...')
              webViewRef.current?.reload()
            }}
          />
        ) : renderHomePage()}
        {hasError && renderErrorPage()}
      </View>

      {/* Open in Browser Banner */}
      {url ? (
        <View style={[styles.browserBanner, { 
          backgroundColor: isDark ? '#151922' : '#F6F8FA', 
          borderTopColor: colors.border,
        }]}>
          <View style={styles.browserBannerRow}>
            <TouchableOpacity
              style={[styles.openBrowserBtn, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}
              onPress={handleOpenExternal}
              activeOpacity={0.7}
            >
              <ExternalLink size={12} color={colors.text} strokeWidth={1.8} />
              <Text style={[styles.openBrowserText, { color: colors.text }]}>
                Open in real browser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                setShowBrowserInfo(!showBrowserInfo)
              }}
              style={styles.readMoreBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Info size={11} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.readMoreText, { color: colors.textSecondary }]}>
                {showBrowserInfo ? 'Less' : 'Why?'}
              </Text>
              {showBrowserInfo 
                ? <ChevronUp size={11} color={colors.textSecondary} strokeWidth={1.5} />
                : <ChevronDown size={11} color={colors.textSecondary} strokeWidth={1.5} />
              }
            </TouchableOpacity>
          </View>

          {showBrowserInfo && (
            <View style={[styles.browserInfoBox, { backgroundColor: isDark ? '#0E1116' : '#FFFFFF', borderColor: colors.border }]}>
              <Text style={[styles.browserInfoTitle, { color: colors.text }]}>Why use the real browser?</Text>
              <Text style={[styles.browserInfoDesc, { color: colors.textSecondary }]}>
                This preview uses an embedded WebView which has limitations compared to a full browser:
              </Text>
              <View style={styles.browserInfoList}>
                <Text style={[styles.browserInfoItem, { color: colors.textSecondary }]}>
                  <Text style={{ color: '#3FB950' }}>•</Text>  Heavy animations (Framer Motion, GSAP) may lag or crash due to WebView memory limits
                </Text>
                <Text style={[styles.browserInfoItem, { color: colors.textSecondary }]}>
                  <Text style={{ color: '#3FB950' }}>•</Text>  OAuth sign-in (Google, GitHub) is blocked inside WebViews
                </Text>
                <Text style={[styles.browserInfoItem, { color: colors.textSecondary }]}>
                  <Text style={{ color: '#3FB950' }}>•</Text>  Service Workers and PWA features are not supported
                </Text>
                <Text style={[styles.browserInfoItem, { color: colors.textSecondary }]}>
                  <Text style={{ color: '#3FB950' }}>•</Text>  The real browser gives full GPU acceleration and native performance
                </Text>
              </View>
              <Text style={[styles.browserInfoFooter, { color: colors.textTertiary }]}>
                For a quick glance, the embedded preview works great. For full testing, use the real browser.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* DevTools Bottom Drawer (Always present in hierarchy when url is active, height-toggled for smooth layout updates) */}
      {url ? (
        <View style={[styles.devToolsContainer, { borderTopColor: colors.border, height: showDevTools ? 260 : 0, borderTopWidth: showDevTools ? 1 : 0 }]}>
          {showDevTools && (
            <>
              <View style={[styles.devToolsHeader, { backgroundColor: isDark ? '#1C2128' : '#EAEEF2' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Terminal size={13} color={colors.text} />
                  <Text style={[styles.devToolsTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                    Developer Tools
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'Inter_500Medium' }}>
                    Logs: {consoleLogs.length} | Net: {networkLogs.length}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                      setShowDevTools(false)
                    }} 
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: isDark ? '#0E1116' : '#FFFFFF' }}>
                {/* Tab Bar */}
                <View style={[styles.devTabBar, { borderBottomColor: colors.border }]}>
                  {(['console', 'network', 'dom'] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => {
                        setActiveDevTab(tab)
                        if (tab === 'dom' && webViewRef.current) {
                          webViewRef.current.injectJavaScript('window.sendDomTree && window.sendDomTree(); true;')
                        }
                      }}
                      style={[
                        styles.devTabItem,
                        activeDevTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                      ]}
                    >
                      <Text style={[
                        styles.devTabText,
                        { 
                          color: activeDevTab === tab ? colors.primary : colors.textSecondary,
                          fontFamily: activeDevTab === tab ? 'Inter_600SemiBold' : 'Inter_500Medium'
                        }
                      ]}>
                        {tab.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tab Content */}
                <View style={{ flex: 1 }}>
                  {activeDevTab === 'console' && (
                    <ScrollView contentContainerStyle={{ padding: 10, gap: 6 }}>
                      {consoleLogs.length === 0 ? (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                          No console logs captured yet.
                        </Text>
                      ) : (
                        consoleLogs.map((log, idx) => (
                          <Text 
                            key={idx} 
                            style={{
                              fontFamily: 'JetBrainsMono_400Regular',
                              fontSize: 10.5,
                              color: log.type === 'error' ? '#FF7B72' : log.type === 'warn' ? '#F2C078' : colors.text,
                              borderBottomWidth: 0.5,
                              borderBottomColor: colors.border + '30',
                              paddingVertical: 3
                            }}
                          >
                            [{log.type.toUpperCase()}] {log.data}
                          </Text>
                        ))
                      )}
                    </ScrollView>
                  )}

                  {activeDevTab === 'network' && (
                    <ScrollView contentContainerStyle={{ padding: 10, gap: 6 }}>
                      {networkLogs.length === 0 ? (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                          No network requests intercepted.
                        </Text>
                      ) : (
                        networkLogs.map((log, idx) => (
                          <View 
                            key={idx} 
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              borderBottomWidth: 0.5,
                              borderBottomColor: colors.border + '30',
                              paddingVertical: 4,
                            }}
                          >
                            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                              {log.method} {log.url}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: log.status === 'Failed' || Number(log.status) >= 400 ? '#FF7B72' : '#3FB950' }}>
                                Status: {log.status}
                              </Text>
                              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: colors.textSecondary }}>
                                {log.duration}ms
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  )}

                  {activeDevTab === 'dom' && (
                    <ScrollView contentContainerStyle={{ padding: 10 }}>
                      {domTree ? (
                        <DOMInspectorNode node={domTree} depth={0} />
                      ) : (
                        <View style={{ alignItems: 'center', marginTop: 20, gap: 8 }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                            Reading DOM structure...
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      ) : null}

      {/* Chrome-Style Three-Dots Dropdown Menu Overlay */}
      {showMenu && (
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop to close menu when clicking outside */}
          <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
                borderColor: colors.border,
                opacity: menuAnim,
                transform: [
                  {
                    scale: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Navigation row (Back, Forward, Refresh, Home) */}
            <View style={styles.menuNavRow}>
              <TouchableOpacity
                onPress={() => {
                  webViewRef.current?.goBack()
                  toggleMenu(false)
                }}
                disabled={!canGoBack}
                style={[styles.menuNavBtn, !canGoBack && { opacity: 0.4 }]}
              >
                <ChevronLeft size={16} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  webViewRef.current?.goForward()
                  toggleMenu(false)
                }}
                disabled={!canGoForward}
                style={[styles.menuNavBtn, !canGoForward && { opacity: 0.4 }]}
              >
                <ChevronRight size={16} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleSetError(false)
                  webViewRef.current?.reload()
                  toggleMenu(false)
                }}
                disabled={!url}
                style={[styles.menuNavBtn, !url && { opacity: 0.4 }]}
              >
                <RefreshCw size={14} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setUrl('')
                  setCurrentUrl('')
                  setHasError(false)
                  toggleMenu(false)
                }}
                style={styles.menuNavBtn}
              >
                <Home size={14} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* General Actions */}
            <TouchableOpacity
              style={styles.menuItem}
              disabled={!url}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                setShowDevTools(d => !d)
                toggleMenu(false)
              }}
            >
              <Terminal size={14} color={url ? colors.textSecondary : colors.textTertiary} />
              <Text style={[styles.menuItemText, { color: url ? colors.text : colors.textTertiary }]}>
                {showDevTools ? 'Hide Developer Tools' : 'Open Developer Tools'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              disabled={!url}
              onPress={() => {
                handleOpenExternal()
                toggleMenu(false)
              }}
            >
              <ExternalLink size={14} color={url ? colors.textSecondary : colors.textTertiary} />
              <Text style={[styles.menuItemText, { color: url ? colors.text : colors.textTertiary }]}>
                Open in Browser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              disabled={!url}
              onPress={() => {
                handleCopy()
                toggleMenu(false)
              }}
            >
              <Copy size={14} color={url ? colors.textSecondary : colors.textTertiary} />
              <Text style={[styles.menuItemText, { color: url ? colors.text : colors.textTertiary }]}>
                Copy Link
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* Quick Connect Ports */}
            <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
              QUICK CONNECT PORTS
            </Text>
            <View style={styles.menuPortsContainer}>
              {[
                { label: 'React/Next', port: 3000 },
                { label: 'Python', port: 5000 },
                { label: 'Vite Dev', port: 5173 },
                { label: 'Java/Go', port: 8080 },
              ].map((shortcut) => (
                <TouchableOpacity
                  key={shortcut.port}
                  style={[styles.menuPortBtn, { backgroundColor: isDark ? '#2D333B' : '#F6F8FA', borderColor: colors.border }]}
                  onPress={() => {
                    handleNavigateToPort(shortcut.port)
                    toggleMenu(false)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuPortText, { color: colors.text }]}>
                    :{shortcut.port}
                  </Text>
                  <Text style={[styles.menuPortLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {shortcut.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Error Overlay with Auto-Fix Agent */}
      {showErrorOverlay && latestError && (
        <View style={styles.errorOverlayContainer}>
          <BlurView
            intensity={isDark ? 30 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.errorOverlayBlur,
              {
                borderColor: isDark ? 'rgba(248, 81, 73, 0.3)' : 'rgba(248, 81, 73, 0.2)',
                backgroundColor: isDark ? 'rgba(30, 20, 20, 0.85)' : 'rgba(255, 245, 245, 0.95)',
              }
            ]}
          >
            <View style={styles.errorOverlayHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color="#F85149" strokeWidth={2} />
                <Text style={[styles.errorOverlayTitle, { color: isDark ? '#FF7B72' : '#C9D1D9', fontFamily: 'Inter_700Bold' }]}>
                  Runtime/Compilation Error
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowErrorOverlay(false)}
                style={styles.errorOverlayClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[styles.errorTraceContainer, { maxHeight: 120 }]} showsVerticalScrollIndicator={true}>
              <Text style={[styles.errorTraceText, { color: isDark ? '#E6EDF3' : '#1F2328', fontFamily: 'JetBrainsMono_400Regular' }]}>
                {latestError}
              </Text>
            </ScrollView>

            <View style={styles.errorOverlayActions}>
              <TouchableOpacity
                style={[styles.autoFixBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveProject(projectId)
                  setPendingPrompt(
                    `My app is encountering a preview runtime/compilation error:\n\n\`\`\`\n${latestError}\n\`\`\`\n\nCan you inspect the project codebase and explain why this happens, and then propose or make a code change to fix this error?`
                  )
                  setShowErrorOverlay(false)
                  router.push('/(tabs)/ai')
                }}
              >
                <Sparkles size={13} color="#FFFFFF" strokeWidth={2} />
                <Text style={[styles.autoFixBtnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>
                  Ask AI to Fix
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}
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
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    borderRadius: 4,
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
    borderRadius: 8,
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
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
  browserBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  browserBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
  },
  openBrowserText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  browserInfoBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
  },
  browserInfoTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  browserInfoDesc: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    opacity: 0.85,
  },
  browserInfoList: {
    gap: 5,
    paddingLeft: 4,
  },
  browserInfoItem: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  browserInfoFooter: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: 2,
  },
  homePage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  homeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  homeTitle: {
    fontSize: 22,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  homeSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
    marginBottom: 32,
    maxWidth: 280,
  },
  homeSearchBar: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
  },
  homeSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  homeGoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 12,
    width: 250,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  menuNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  menuNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    marginVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  menuSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  menuPortsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  menuPortBtn: {
    width: '47%',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  menuPortText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  menuPortLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
  },
  errorOverlayContainer: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    right: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  errorOverlayBlur: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  errorOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorOverlayTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  errorOverlayClose: {
    padding: 2,
  },
  errorTraceContainer: {
    maxHeight: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  errorTraceText: {
    fontSize: 11,
    lineHeight: 16,
  },
  errorOverlayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  autoFixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  autoFixBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  devToolsContainer: {
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  devToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 38,
  },
  devToolsTitle: {
    fontSize: 12,
  },
  devTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 34,
  },
  devTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devTabText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
})
