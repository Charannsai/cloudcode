import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, ActivityIndicator, Dimensions, ScrollView } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Shield, RefreshCw, AlertCircle, Globe, Terminal, Play, Smartphone, Tablet, Monitor, Maximize } from 'lucide-react-native'
import { getToken } from '@/lib/auth'

interface Props {
  projectId: string
  port: number
}

interface ConsoleLog {
  id: string
  method: 'log' | 'error' | 'warn'
  data: string
  time: string
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const SCREEN_WIDTH = Dimensions.get('window').width

const DEVICES = [
  { id: 'responsive', label: 'Auto', icon: Maximize, width: 0 },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 390 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 1440 },
] as const

type DeviceId = typeof DEVICES[number]['id']

export default function PreviewTab({ projectId, port: initialPort }: Props) {
  const { colors, isDark } = useAppTheme()
  const [port, setPort] = useState(initialPort.toString())
  const [activePort, setActivePort] = useState(initialPort.toString())
  const [hasConnected, setHasConnected] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<DeviceId>('responsive')
  
  // Console logging state
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [showConsole, setShowConsole] = useState(false)
  
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    getToken().then(setToken)
  }, [])

  const baseUrl = `${API_URL}/api/preview/${projectId}/`
  const previewUrl = `${baseUrl}?port=${activePort}&token=${token}`

  const handleConnect = () => {
    setActivePort(port)
    setHasConnected(true)
    setKey(k => k + 1)
    setConsoleLogs([]) // Reset console logs on reconnect
    Keyboard.dismiss()
  }

  const handleRefresh = () => {
    setActivePort(port)
    setKey(k => k + 1)
    setConsoleLogs([]) // Reset logs on refresh
    Keyboard.dismiss()
  }

  const handleDisconnect = () => {
    setHasConnected(false)
    setShowConsole(false)
  }

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.type === 'console') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setConsoleLogs(prev => [
          ...prev, 
          { id: Math.random().toString(), method: msg.method, data: msg.data, time }
        ].slice(-100))
      }
    } catch {}
  }

  if (!token) return null

  const deviceConfig = DEVICES.find(d => d.id === selectedDevice)!
  const targetWidth = deviceConfig.width || SCREEN_WIDTH
  const containerWidth = SCREEN_WIDTH - 32
  const scale = targetWidth > containerWidth ? containerWidth / targetWidth : 1

  const viewportJS = `
    (function() {
      // Set cookies for sub-resources
      var cookieBase = 'Path=/; Max-Age=3600; SameSite=Lax';
      document.cookie = 'preview_token=${token}; ' + cookieBase;
      document.cookie = 'preview_project_id=${projectId}; ' + cookieBase;
      document.cookie = 'preview_port=${activePort}; ' + cookieBase;

      // Set base href for relative URLs
      var base = document.querySelector('base');
      if (!base) {
        base = document.createElement('base');
        document.head.prepend(base);
      }
      base.href = '${baseUrl}?port=${activePort}&token=${token}&_=';

      ${deviceConfig.width > 0 ? `
      // Set viewport meta for device simulation
      var meta = document.querySelector('meta[name=viewport]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
      meta.content = 'width=${deviceConfig.width}';
      ` : ''}

      // Intercept and redirect console logs to react native webview channel
      try {
        var _log = console.log;
        var _error = console.error;
        var _warn = console.warn;

        function sendToRN(method, args) {
          try {
            var cleanArgs = Array.prototype.slice.call(args).map(function(arg) {
              if (arg instanceof Error) return arg.message + '\\n' + arg.stack;
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'console',
              method: method,
              data: cleanArgs.join(' ')
            }));
          } catch(e) {}
        }

        console.log = function() { sendToRN('log', arguments); _log.apply(console, arguments); };
        console.error = function() { sendToRN('error', arguments); _error.apply(console, arguments); };
        console.warn = function() { sendToRN('warn', arguments); _warn.apply(console, arguments); };

        window.addEventListener('error', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'console',
            method: 'error',
            data: e.message + ' (' + e.filename + ':' + e.lineno + ')'
          }));
        });
      } catch(e) {}

      true;
    })();
  `

  const errorLogsCount = consoleLogs.filter(l => l.method === 'error').length

  if (!hasConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <View style={[styles.svgContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Globe size={64} color={isDark ? '#3b82f6' : '#2563eb'} opacity={0.6} />
            <View style={styles.badgeContainer}>
              <Play size={20} color={colors.background} fill={colors.text} />
            </View>
          </View>
          
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>
            Preview Ready
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            Start your development server in the terminal to see changes live.
          </Text>

          <View style={[styles.portCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.portLabelRow}>
              <Terminal size={14} color={colors.textSecondary} />
              <Text style={[styles.portLabel, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Target Port
              </Text>
            </View>
            
            <View style={styles.portInputRow}>
              <Text style={[styles.localhostText, { color: colors.text, opacity: 0.5, fontFamily: 'Inter_600SemiBold' }]}>
                localhost:
              </Text>
              <TextInput
                style={[styles.portTextInput, { color: colors.text, fontFamily: 'Inter_700Bold' }]}
                value={port}
                onChangeText={setPort}
                keyboardType="number-pad"
                placeholder="3000"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity 
              style={[styles.connectBtn, { backgroundColor: '#3b82f6' }]} 
              onPress={handleConnect}
              activeOpacity={0.8}
            >
              <Text style={[styles.connectBtnText, { color: '#fff', fontFamily: 'Inter_700Bold' }]}>
                View Preview
              </Text>
              <Play size={16} color="#fff" fill="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.hintContainer}>
            <Shield size={12} color={colors.textSecondary} opacity={0.5} />
            <Text style={[styles.hintText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              Secure preview via Docker bridge
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* URL Bar */}
      <View style={[styles.urlBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.addressBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Shield size={14} color="#10b981" strokeWidth={2.5} />
          <Text style={[styles.hostText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>localhost:</Text>
          <TextInput
            style={[styles.portInput, { color: colors.text, fontFamily: 'Inter_700Bold' }]}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
            maxLength={5}
            onSubmitEditing={handleRefresh}
            selectionColor={colors.accent}
          />
        </View>
        
        {/* Toggle Web Console Button */}
        <TouchableOpacity 
          style={[styles.refreshBtn, { backgroundColor: showConsole ? colors.primary : colors.background }]} 
          onPress={() => setShowConsole(c => !c)}
          activeOpacity={0.7}
        >
          <Terminal size={18} color={showConsole ? colors.background : colors.textSecondary} strokeWidth={2} />
          {errorLogsCount > 0 && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>{errorLogsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.refreshBtn, { backgroundColor: colors.background }]} 
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.closeBtn, { backgroundColor: colors.background }]} 
          onPress={handleDisconnect}
          activeOpacity={0.7}
        >
          <AlertCircle size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Device Switcher */}
      <View style={[styles.deviceBar, { backgroundColor: isDark ? '#0a0a0a' : '#f8f9fa', borderBottomColor: colors.border }]}>
        {DEVICES.map((device) => {
          const isActive = selectedDevice === device.id
          const Icon = device.icon
          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceBtn,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#1e40af' : '#3b82f6')
                    : 'transparent',
                  borderColor: isActive
                    ? (isDark ? '#2563eb' : '#60a5fa')
                    : 'transparent',
                }
              ]}
              onPress={() => {
                setSelectedDevice(device.id)
                setKey(k => k + 1)
              }}
              activeOpacity={0.7}
            >
              <Icon
                size={14}
                color={isActive ? '#fff' : (isDark ? '#888' : '#666')}
                strokeWidth={2}
              />
              <Text style={[
                styles.deviceLabel,
                { color: isActive ? '#fff' : (isDark ? '#888' : '#666') }
              ]}>
                {device.label}
              </Text>
              {device.width > 0 && (
                <Text style={[
                  styles.deviceSize,
                  { color: isActive ? 'rgba(255,255,255,0.7)' : (isDark ? '#555' : '#999') }
                ]}>
                  {device.width}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Preview Container */}
      <View style={styles.webContainer}>
        {selectedDevice !== 'responsive' && (
          <View style={[styles.deviceFrame, { borderColor: isDark ? '#222' : '#ddd' }]}>
            <Text style={[styles.deviceFrameText, { color: colors.textSecondary }]}>
              {deviceConfig.width}px × viewport
            </Text>
          </View>
        )}

        <View style={[
          styles.webViewWrapper,
          selectedDevice !== 'responsive' && {
            width: targetWidth,
            transform: [{ scale }],
            transformOrigin: 'top left',
          }
        ]}>
          <WebView
            ref={webViewRef}
            key={key}
            source={{
              uri: previewUrl,
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }}
            injectedJavaScriptBeforeContentLoaded={viewportJS}
            onMessage={handleMessage}
            originWhitelist={['*']}
            style={[styles.webView, { opacity: loading ? 0 : 1 }]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            renderError={() => (
              <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
                <Text style={[styles.errorTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>Connection Refused</Text>
                <Text style={[styles.errorHint, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                  Port <Text style={{ color: colors.text }}>{activePort}</Text> is not responding. Make sure your server is running in the terminal.
                </Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.card }]} onPress={handleRefresh}>
                   <Text style={[styles.retryText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            )}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
          />
        </View>

        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.text} size="small" />
            <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Connecting to :<Text style={{ color: colors.text }}>{activePort}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Slide-Up Web Console Overlay */}
      {showConsole && (
        <View style={[styles.consolePanel, { backgroundColor: isDark ? '#0d1117' : '#f8f9fa', borderTopColor: colors.border }]}>
          <View style={[styles.consoleHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.consoleTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Web Developer Console
            </Text>
            <View style={styles.consoleHeaderButtons}>
              <TouchableOpacity onPress={() => setConsoleLogs([])} style={styles.consoleHeaderBtn}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConsole(false)} style={styles.consoleHeaderBtn}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.consoleLogsScroll} contentContainerStyle={{ paddingBottom: 24 }}>
            {consoleLogs.length === 0 ? (
              <Text style={[styles.consoleLogPlaceholder, { color: colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' }]}>
                No console logs recorded.
              </Text>
            ) : (
              consoleLogs.map((log) => {
                let logColor = isDark ? '#c9d1d9' : '#24292f'
                if (log.method === 'error') logColor = '#ef4444'
                else if (log.method === 'warn') logColor = '#f59e0b'

                return (
                  <View key={log.id} style={[styles.consoleLogRow, { borderBottomColor: colors.border + '30' }]}>
                    <Text style={[styles.logTime, { color: colors.textSecondary + '70' }]}>{log.time}</Text>
                    <Text style={[styles.logText, { color: logColor }]}>[{log.method.toUpperCase()}] {log.data}</Text>
                  </View>
                )
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  svgContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderStyle: 'dashed',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  emptyTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 32,
  },
  portCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  portLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
  },
  localhostText: {
    fontSize: 16,
  },
  portTextInput: {
    fontSize: 16,
    flex: 1,
    marginLeft: 4,
  },
  connectBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  connectBtnText: {
    fontSize: 16,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    opacity: 0.6,
  },
  hintText: {
    fontSize: 11,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  addressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 4,
  },
  hostText: { fontSize: 12 },
  portInput: {
    fontSize: 13,
    flex: 1,
    paddingVertical: 0,
    height: '100%',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderBottomWidth: 1,
  },
  deviceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  deviceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  deviceSize: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  deviceFrame: {
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  deviceFrameText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  webContainer: { flex: 1, overflow: 'hidden' },
  webViewWrapper: { flex: 1 },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { fontSize: 13, opacity: 0.8 },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: { fontSize: 18, textAlign: 'center' },
  errorHint: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.7 },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: { fontSize: 14 },
  
  // Console Overlay Panel Styles
  consolePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopWidth: 1.5,
    zIndex: 999,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  consoleTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consoleHeaderButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  consoleHeaderBtn: {
    paddingVertical: 2,
  },
  consoleLogsScroll: {
    flex: 1,
    padding: 12,
  },
  consoleLogRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    alignItems: 'flex-start',
    gap: 8,
  },
  logTime: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_400Regular',
    width: 68,
  },
  logText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    lineHeight: 16,
  },
  consoleLogPlaceholder: {
    fontSize: 11,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 24,
  },
  errorBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },
})
