import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Shield, RefreshCw, AlertCircle, Globe, Terminal, Play } from 'lucide-react-native'
import { getToken } from '@/lib/auth'

interface Props {
  projectId: string
  port: number
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function PreviewTab({ projectId, port: initialPort }: Props) {
  const { colors, isDark } = useAppTheme()
  const [port, setPort] = useState(initialPort.toString())
  const [activePort, setActivePort] = useState(initialPort.toString())
  const [hasConnected, setHasConnected] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getToken().then(setToken)
  }, [])

  const baseUrl = `${API_URL}/api/preview/${projectId}/`
  const previewUrl = `${baseUrl}?port=${activePort}&token=${token}`

  const handleConnect = () => {
    setActivePort(port)
    setHasConnected(true)
    setKey(k => k + 1)
    Keyboard.dismiss()
  }

  const handleRefresh = () => {
    setActivePort(port)
    setKey(k => k + 1)
    Keyboard.dismiss()
  }

  const handleDisconnect = () => {
    setHasConnected(false)
  }

  if (!token) return null

  const injectedJS = `
    (function() {
      // 1. Force set cookies on the client side for sub-resources
      var cookieBase = 'Path=/; Max-Age=3600; SameSite=Lax';
      document.cookie = 'preview_token=${token}; ' + cookieBase;
      document.cookie = 'preview_project_id=${projectId}; ' + cookieBase;
      document.cookie = 'preview_port=${activePort}; ' + cookieBase;

      // 2. Set base href for relative URLs
      var base = document.querySelector('base');
      if (!base) {
        base = document.createElement('base');
        document.head.prepend(base);
      }
      base.href = '${baseUrl}?port=${activePort}&token=${token}&_=';
      true;
    })();
  `

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

      <View style={styles.webContainer}>
        <WebView
          key={key}
          source={{
            uri: previewUrl,
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }}
          injectedJavaScriptBeforeContentLoaded={injectedJS}
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
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.text} size="small" />
            <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Connecting to :<Text style={{ color: colors.text }}>{activePort}</Text>
            </Text>
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  addressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  hostText: { fontSize: 13 },
  portInput: {
    fontSize: 14,
    flex: 1,
    paddingVertical: 0,
    height: '100%',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: { flex: 1 },
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
})
