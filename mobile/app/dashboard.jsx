import { StyleSheet, Text, View } from 'react-native'

export default function Dashboard() {
  return <View style={styles.container}><Text style={styles.title}>Emergency Response</Text><Text style={styles.subtitle}>Mobile dashboard shell — next phases will add the citizen workflow.</Text><View style={styles.card}><Text style={styles.label}>Current location</Text><Text style={styles.value}>Sector 12, Chandigarh</Text></View><View style={styles.emergency}><Text style={styles.emergencyTitle}>Report Accident</Text><Text style={styles.emergencyText}>Accident reporting will be implemented in Phase 8.</Text></View></View>
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, backgroundColor: '#F8FBFF' },
  title: { marginTop: 38, color: '#1F2937', fontSize: 26, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#6B7280', lineHeight: 21 },
  card: { marginTop: 22, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8F7' },
  label: { color: '#6B7280', fontSize: 12 },
  value: { marginTop: 5, color: '#1F2937', fontWeight: '700' },
  emergency: { marginTop: 14, padding: 18, borderRadius: 16, backgroundColor: '#EAF3FF' },
  emergencyTitle: { color: '#3B82F6', fontSize: 17, fontWeight: '700' },
  emergencyText: { marginTop: 5, color: '#6B7280', fontSize: 12 }
})
