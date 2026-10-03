import { StyleSheet, Text, View } from 'react-native'

export default function Dashboard() {
  return <View style={styles.container}><Text style={styles.eyebrow}>MOBILE PREVIEW</Text><Text style={styles.title}>Emergency Response</Text><Text style={styles.subtitle}>This dashboard is a visual shell. Mobile account and incident workflows are not connected.</Text><View style={styles.card}><Text style={styles.label}>Sample area</Text><Text style={styles.value}>Sector 12, Chandigarh</Text><Text style={styles.note}>Illustrative location only. No device location is being read.</Text></View><View style={styles.emergency}><Text style={styles.emergencyTitle}>Incident reporting coming soon</Text><Text style={styles.emergencyText}>This preview cannot submit a report or contact emergency services. In a life-threatening emergency, contact official services such as 112 or 108.</Text></View></View>
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, backgroundColor: '#F8FBFF' },
  eyebrow: { marginTop: 38, color: '#3B82F6', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { marginTop: 10, color: '#1F2937', fontSize: 26, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#6B7280', lineHeight: 21 },
  card: { marginTop: 22, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8F7' },
  label: { color: '#6B7280', fontSize: 12 },
  value: { marginTop: 5, color: '#1F2937', fontWeight: '700' },
  note: { marginTop: 8, color: '#6B7280', fontSize: 12, lineHeight: 18 },
  emergency: { marginTop: 14, padding: 18, borderRadius: 16, backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F5D38B' },
  emergencyTitle: { color: '#8A5A00', fontSize: 17, fontWeight: '700' },
  emergencyText: { marginTop: 5, color: '#6B7280', fontSize: 12, lineHeight: 18 }
})
