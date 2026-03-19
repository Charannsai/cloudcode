import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native'
import { WebView } from 'react-native-webview'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Ionicons } from '@expo/vector-icons'
import { getToken } from '@/lib/auth'

interface Props {
  projectId: string
  port: number
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function PreviewTab({ projectId, port: initialPort }: Props) {
  const { colors } = useAppTheme()
  const [port, setPort] = useState(initialPort.toString())
  const [activePort, setActivePort] = useState(initialPort.toString())
  const [token, setToken] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  useEffect(() => {
    getToken().then(setToken)
  }, [])

  // The catch-all route: /api/preview/[id]/ will serve root HTML,
  // and /api/preview/[id]/style.css will serve CSS, etc.
  const baseUrl = `${API_URL}/api/preview/${projectId}/`
  const previewUrl = `${baseUrl}?port=${activePort}&token=${token}`

  const handleRefresh = () => {
    setActivePort(port)
    setKey(k => k + 1)
    Keyboard.dismiss()
  }

  if (!token) return null

  // Inject a <base> tag so all relative URLs (./style.css, ./script.js)
  // resolve through our catch-all proxy route with the token
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
          <Ionicons name="lock-closed" size={14} color={colors.success} />
          <Text style={[styles.hostText, { color: colors.textSecondary }]}>localhost:</Text>
          <TextInput
            style={[styles.portInput, { color: colors.text }]}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
            maxLength={5}
            onSubmitEditing={handleRefresh}
          />
        </View>
        <TouchableOpacity 
          style={[styles.refreshBtn, { backgroundColor: colors.primary + '20' }]} 
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

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
        style={[styles.webView, { backgroundColor: '#fff' }]}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: colors.background }]}>
            <Text style={[styles.loadingText, { color: colors.primary }]}>Connecting to port {activePort}...</Text>
          </View>
        )}
        renderError={() => (
          <View style={[styles.loading, { backgroundColor: colors.background }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Service not responding</Text>
            <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
              Nothing is serving on port <Text style={{ color: colors.primary, fontWeight: '700' }}>{activePort}</Text> yet.
            </Text>
          </View>
        )}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  addressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  hostText: { fontSize: 13, fontWeight: '500' },
  portInput: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingVertical: 0,
    height: '100%',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: { fontSize: 16, fontWeight: '700' },
  errorTitle: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  errorHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
})
