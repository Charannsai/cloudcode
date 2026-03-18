import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'

interface Props {
  projectId: string
  port: number
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function PreviewTab({ projectId, port }: Props) {
  const previewUrl = `${API_URL}/api/preview/${projectId}?port=${port}`

  return (
    <View style={styles.container}>
      <View style={styles.urlBar}>
        <Text style={styles.urlText} numberOfLines={1}>
          🌐 localhost:{port}
        </Text>
      </View>
      <WebView
        source={{ uri: previewUrl }}
        style={styles.webView}
        renderLoading={() => (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading preview...</Text>
            <Text style={styles.loadingHint}>
              Make sure your app is running (npm run dev) in the terminal.
            </Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.loading}>
            <Text style={styles.errorIcon}>🔌</Text>
            <Text style={styles.errorTitle}>Preview not available</Text>
            <Text style={styles.errorHint}>
              Start your server in the Terminal tab first:{'\n'}
              <Text style={styles.code}>npm run dev</Text>
            </Text>
          </View>
        )}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  urlBar: {
    backgroundColor: '#0c0c18',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  urlText: { color: '#5a5a7a', fontSize: 13, fontFamily: 'monospace' },
  webView: { flex: 1, backgroundColor: '#ffffff' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    padding: 40,
    gap: 12,
  },
  loadingText: { color: '#7c6bff', fontSize: 16, fontWeight: '600' },
  loadingHint: { color: '#4a4a6a', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorIcon: { fontSize: 48 },
  errorTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  errorHint: { color: '#5a5a7a', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  code: { fontFamily: 'monospace', color: '#22c55e' },
})
