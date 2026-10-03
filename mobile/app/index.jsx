import { StyleSheet, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'

export default function Home() {
  return <View style={styles.container}>
    <View style={styles.icon}><Text style={styles.iconText}>+</Text></View>
    <Text style={styles.eyebrow}>EMERGENCY RESPONSE PLATFORM</Text>
    <Text style={styles.title}>Faster response.{"\n"}<Text style={styles.blue}>Safer communities.</Text></Text>
    <Text style={styles.description}>A preview of the Emergency Response Platform mobile experience.</Text>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Preview only</Text><Text style={styles.noticeText}>Mobile sign-in and emergency reporting are not connected yet. This app does not contact emergency services.</Text></View>
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/login')}><Text style={styles.buttonText}>Explore mobile preview</Text></Pressable>
  </View>
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'center', backgroundColor: '#F8FBFF' },
  icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconText: { color: '#3B82F6', fontSize: 28, fontWeight: '700' },
  eyebrow: { color: '#3B82F6', fontSize: 11, fontWeight: '700', letterSpacing: .7 },
  title: { marginTop: 12, color: '#1F2937', fontSize: 38, lineHeight: 43, fontWeight: '700' },
  blue: { color: '#3B82F6' },
  description: { marginTop: 14, color: '#6B7280', fontSize: 15, lineHeight: 23 },
  notice: { marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F5D38B' },
  noticeTitle: { color: '#8A5A00', fontSize: 14, fontWeight: '700' },
  noticeText: { marginTop: 5, color: '#6B7280', fontSize: 13, lineHeight: 19 },
  button: { marginTop: 26, height: 48, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
})
