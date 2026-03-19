import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Shield, RefreshCw, AlertCircle, Globe } from 'lucide-react-native'
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
  const [token, setToken] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getToken().then(setToken)
  }, [])

  const baseUrl = `${API_URL}/api/preview/${projectId}/`
  const previewUrl = `${baseUrl}?port=${activePort}&token=${token}`

  const handleRefresh = () => {
    setActivePort(port)
    setKey(k => k + 1)
    Keyboard.dismiss()
  }

  if (!token) return null

  const injectedJS = `
    (function() {
      var base = document.querySelector('base');
      if (!base) {
        base = document.createElement('base');
        document.head.prepend(base);
      }
      base.href = '${baseUrl}?port=${activePort}&token=${token}&_=';
      true;
    })();
  `

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
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
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
