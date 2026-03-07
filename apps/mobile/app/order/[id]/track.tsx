import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from 'react-native-paper';

const statuses = [
  { key: 'pending', label: 'Order Received', done: true },
  { key: 'shop_accepted', label: 'Shop Accepted', done: true },
  { key: 'printing', label: 'Printing', done: true, current: true },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', done: false },
  { key: 'completed', label: 'Completed', done: false },
];

export default function OrderTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.orderNo}>NP20240228-A1B2C3</Text>
        <Text style={styles.shopName}>QuickPrint Center</Text>
      </View>

      <Card style={styles.timelineCard}>
        <Card.Content>
          {statuses.map((s, i) => (
            <View key={s.key} style={styles.timelineRow}>
              <View style={[
                styles.timelineDot,
                s.done && styles.timelineDotDone,
                s.current && styles.timelineDotCurrent,
              ]} />
              {i < statuses.length - 1 && <View style={[styles.timelineLine, s.done && styles.timelineLineDone]} />}
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, s.current && styles.timelineLabelCurrent]}>
                  {s.label}
                </Text>
                {s.current && <Text style={styles.timelineNote}>In progress...</Text>}
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.detailCard}>
        <Card.Content>
          <Text style={styles.detailTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>₹45.00</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>123 Main St</Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => router.push(`/order/${id}/qr`)}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Show QR for Pickup
      </Button>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  orderNo: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  shopName: { fontSize: 14, color: '#64748B', marginTop: 4 },
  timelineCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineDotDone: { backgroundColor: '#22C55E' },
  timelineDotCurrent: { backgroundColor: '#2563EB', borderWidth: 4, borderColor: '#93C5FD', width: 20, height: 20, borderRadius: 10, marginTop: 2 },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginLeft: 7,
  },
  timelineLineDone: { backgroundColor: '#22C55E' },
  timelineContent: { marginLeft: 16, flex: 1 },
  timelineLabel: { fontSize: 15, fontWeight: '500', color: '#64748B' },
  timelineLabelCurrent: { color: '#0F172A', fontWeight: '700' },
  timelineNote: { fontSize: 13, color: '#2563EB', marginTop: 2 },
  detailCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16 },
  detailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { color: '#64748B' },
  detailValue: { fontWeight: '600', color: '#0F172A' },
  button: { marginHorizontal: 20, borderRadius: 16, backgroundColor: '#2563EB' },
  buttonContent: { paddingVertical: 8 },
});
