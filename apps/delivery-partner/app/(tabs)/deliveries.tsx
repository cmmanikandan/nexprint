import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  accepted: { bg: '#1E3A8A', text: '#DBEAFE', label: 'ACCEPTED' },
  picked_up: { bg: '#075985', text: '#BAE6FD', label: 'PICKED UP' },
  delivered: { bg: '#166534', text: '#DCFCE7', label: 'DELIVERED' },
  failed: { bg: '#7F1D1D', text: '#FECACA', label: 'FAILED' },
  pending: { bg: '#78350F', text: '#FDE68A', label: 'PENDING' },
  none: { bg: '#334155', text: '#E2E8F0', label: 'PENDING' },
};

export default function DeliveriesScreen() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, delivery_status, delivery_address, created_at, print_shops(name, address)')
        .eq('delivery_partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeliveries();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Deliveries</Text>
        <Text style={styles.subtitle}>Active and completed assignments</Text>
      </View>
      <FlatList
        data={deliveries}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No deliveries assigned yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/delivery/${item.id}`)}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNo}>#{item.order_number?.slice(-8)?.toUpperCase()}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: STATUS_STYLES[item.delivery_status || 'pending']?.bg || '#334155',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: STATUS_STYLES[item.delivery_status || 'pending']?.text || 'white',
                        },
                      ]}
                    >
                      {STATUS_STYLES[item.delivery_status || 'pending']?.label || (item.delivery_status || 'pending').replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.shop}>{item.print_shops?.name || 'Print Shop'}</Text>
                <Text style={styles.address} numberOfLines={1}>{item.delivery_address || item.print_shops?.address || 'Address not available'}</Text>
                <Text style={styles.meta}>Tap to view delivery details</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  list: { padding: 20, paddingBottom: 30 },
  card: { marginBottom: 16, borderRadius: 24, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', elevation: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNo: { fontSize: 14, fontWeight: '800', color: '#F1F5F9', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  shop: { fontSize: 14, color: '#E2E8F0', fontWeight: '700' },
  address: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  meta: { fontSize: 10, color: '#2563EB', fontWeight: '800', marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
});
