import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: shops } = await supabase
        .from('print_shops')
        .select('*')
        .limit(5);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentOrders(orders || []);
      }

      setNearbyShops(shops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>NexPrint 2.0 👋</Text>
        <Text style={styles.subGreeting}>Select a terminal to start printing</Text>
      </View>

      <Searchbar
        placeholder="Search print shops..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor="#64748B"
      />

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/upload')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.quickActionEmoji}>📄</Text>
              </View>
              <Text style={styles.quickActionLabel}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FDF2F2' }]}>
                <Text style={styles.quickActionEmoji}>🔄</Text>
              </View>
              <Text style={styles.quickActionLabel}>Reprint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.quickActionEmoji}>📦</Text>
              </View>
              <Text style={styles.quickActionLabel}>Status</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Nearby Print Shops */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Terminals</Text>
          <TouchableOpacity onPress={() => { }}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color="#2563EB" />
        ) : nearbyShops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            onPress={() => router.push(`/shop/${shop.id}`)}
            activeOpacity={0.8}
          >
            <Card style={styles.shopCard}>
              <Card.Content style={styles.shopCardContent}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <View style={styles.shopMeta}>
                    <Text style={styles.shopDistance}>📍 {shop.address.slice(0, 20)}...</Text>
                    <Text style={styles.shopDot}>•</Text>
                    <Text style={styles.shopRating}>⭐ {shop.rating}</Text>
                    <Text style={styles.shopDot}>•</Text>
                    <Text style={[styles.shopStatus, shop.status === 'open' ? styles.statusOpen : styles.statusClosed]}>
                      {shop.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.shopPrice}>
                  <Text style={styles.priceText}>₹{shop.bw_price_per_page}</Text>
                  <Text style={styles.priceLabel}>/page</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Jobs</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => router.push(`/order/${order.id}/track`)}
          >
            <Card style={styles.orderCard}>
              <Card.Content style={styles.orderCardContent}>
                <View>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.orderStatus, styles.status_printing]}>
                  <Text style={styles.orderStatusText}>{order.status.toUpperCase()}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
        {recentOrders.length === 0 && !loading && (
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>No recent print jobs found</Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 0,
  },
  searchInput: {
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionsScroll: {
    paddingHorizontal: 0,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  shopCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  shopCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopInfo: {},
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  shopDistance: {
    fontSize: 13,
    color: '#64748B',
  },
  shopRating: {
    fontSize: 13,
    color: '#64748B',
  },
  shopDot: {
    fontSize: 13,
    color: '#94A3B8',
  },
  shopStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusOpen: {
    color: '#22C55E',
  },
  statusClosed: {
    color: '#94A3B8',
  },
  shopPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  orderCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  status_printing: {
    backgroundColor: '#2563EB',
  },
  status_completed: {
    backgroundColor: '#22C55E',
  },
});
