import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Searchbar, SegmentedButtons } from 'react-native-paper';

const orders = [
  { id: '1', orderNo: 'NP20240228-A1B2C3', shop: 'QuickPrint Center', status: 'printing', total: 45, date: 'Today, 10:30 AM' },
  { id: '2', orderNo: 'NP20240228-B4C5D6', shop: 'Copy Express', status: 'ready_for_pickup', total: 120, date: 'Today, 9:15 AM' },
  { id: '3', orderNo: 'NP20240227-X9Y8Z7', shop: 'Print Hub', status: 'completed', total: 85, date: 'Yesterday, 4:20 PM' },
  { id: '4', orderNo: 'NP20240226-M3N4O5', shop: 'QuickPrint Center', status: 'cancelled', total: 30, date: 'Feb 26' },
];

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  shop_accepted: 'Accepted',
  printing: 'Printing',
  ready_for_pickup: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusBadgeStyles: Record<string, ViewStyle> = {
  printing: { backgroundColor: '#2563EB' },
  ready_for_pickup: { backgroundColor: '#22C55E' },
  completed: { backgroundColor: '#64748B' },
  cancelled: { backgroundColor: '#EF4444' },
  pending: { backgroundColor: '#F59E0B' },
  shop_accepted: { backgroundColor: '#2563EB' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.orderNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track and manage your print orders</Text>
      </View>

      <Searchbar
        placeholder="Search by order number..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      <SegmentedButtons
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'printing', label: 'Active' },
          { value: 'completed', label: 'Completed' },
        ]}
        value={filter}
        onValueChange={setFilter}
        style={styles.segmented}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              item.status === 'completed' || item.status === 'cancelled'
                ? undefined
                : router.push(`/order/${item.id}/track`)
            }
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNo}>{item.orderNo}</Text>
                  <View style={[styles.statusBadge, statusBadgeStyles[item.status] || statusBadgeStyles.pending]}>
                    <Text style={styles.statusText}>{statusLabels[item.status] || item.status}</Text>
                  </View>
                </View>
                <Text style={styles.shopName}>{item.shop}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>{item.date}</Text>
                  <Text style={styles.total}>₹{item.total}</Text>
                </View>
                {item.status === 'ready_for_pickup' && (
                  <TouchableOpacity
                    style={styles.qrButton}
                    onPress={() => router.push(`/order/${item.id}/qr`)}
                  >
                    <Text style={styles.qrButtonText}>Show QR for Pickup</Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  searchbar: { marginHorizontal: 20, marginBottom: 12, backgroundColor: 'white', borderRadius: 12 },
  segmented: { marginHorizontal: 20, marginBottom: 16 },
  list: { padding: 20, paddingTop: 0 },
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: 'white' },
  shopName: { fontSize: 14, color: '#64748B', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  date: { fontSize: 13, color: '#94A3B8' },
  total: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  qrButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
