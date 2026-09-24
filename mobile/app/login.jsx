import { StyleSheet, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'

export default function Login() {
  return <View style={styles.container}>
    <Text style={styles.title}>Welcome back</Text>
    <Text style={styles.description}>Demo navigation for the frontend-only mobile shell.</Text>
    <Pressable style={styles.button} onPress={() => router.replace('/dashboard')}><Text style={styles.buttonText}>Continue to dashboard</Text></Pressable>
  </View>
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'center', backgroundColor: '#F8FBFF' },
  title: { color: '#1F2937', fontSize: 30, fontWeight: '700' },
  description: { color: '#6B7280', fontSize: 14, lineHeight: 22, marginTop: 8 },
  button: { marginTop: 24, height: 48, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' }
})
