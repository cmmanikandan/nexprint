import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button, RadioButton } from 'react-native-paper';
import { useState } from 'react';

export default function OrderConfirmationScreen() {
  const { shop } = useLocalSearchParams<{ shop: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<'online' | 'cash_pickup'>('online');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Confirmation</Text>
        <Text style={styles.subtitle}>Review and pay for your print job</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Selected Shop</Text>
          <Text style={styles.shopName}>QuickPrint Center</Text>
          <Text style={styles.address}>123 Main St • 0.5 km away</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Print Settings</Text>
          <Text style={styles.detail}>Black & White • Single Side • A4</Text>
          <Text style={styles.detail}>30 pages × 1 copy</Text>
        </Card.Content>
      </Card>

      <Card style={styles.priceCard}>
        <Card.Content>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹15.00</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.totalValue}>₹15.00</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Option</Text>
        <RadioButton.Group onValueChange={(v) => setPayment(v as 'online' | 'cash_pickup')} value={payment}>
          <RadioButton.Item label="Pay Online (Razorpay)" value="online" color="#2563EB" />
          <RadioButton.Item label="Cash on Pickup" value="cash_pickup" color="#2563EB" />
        </RadioButton.Group>
      </View>

      <Button
        mode="contained"
        onPress={() => router.replace('/(tabs)/orders')}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {payment === 'online' ? 'Pay ₹15.00' : 'Confirm Order'}
      </Button>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  card: { marginHorizontal: 20, marginBottom: 12, borderRadius: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  shopName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  address: { fontSize: 13, color: '#64748B', marginTop: 2 },
  detail: { fontSize: 14, color: '#64748B', marginTop: 2 },
  priceCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, backgroundColor: '#2563EB' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  priceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  priceValue: { fontSize: 16, color: 'white' },
  totalValue: { fontSize: 20, fontWeight: '800', color: 'white' },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#0F172A' },
  button: { marginHorizontal: 20, borderRadius: 16, backgroundColor: '#22C55E' },
  buttonContent: { paddingVertical: 12 },
});
