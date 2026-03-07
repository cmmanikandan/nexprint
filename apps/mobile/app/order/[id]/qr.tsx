import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

export default function QRPickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pickupCode = 'NP-' + (id || '1').toUpperCase() + '-PICKUP';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Show at Pickup</Text>
        <Text style={styles.subtitle}>Present this QR code to the print shop</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.qrContainer}>
            <QRCode value={pickupCode} size={200} />
          </View>
          <Text style={styles.pickupCode}>{pickupCode}</Text>
          <Text style={styles.instruction}>Staff will scan this to confirm pickup</Text>
        </Card.Content>
      </Card>

      <View style={styles.info}>
        <Text style={styles.infoText}>📍 QuickPrint Center</Text>
        <Text style={styles.infoText}>123 Main St</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 24 },
  header: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 8 },
  card: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  cardContent: { alignItems: 'center' },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  pickupCode: { fontSize: 18, fontWeight: '700', color: '#0F172A', letterSpacing: 2 },
  instruction: { fontSize: 14, color: '#64748B', marginTop: 8 },
  info: { alignItems: 'center' },
  infoText: { fontSize: 14, color: '#64748B' },
});
