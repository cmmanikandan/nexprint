import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, MapPin, ChevronRight, Zap, LogOut, Radio } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DeliveryDashboard() {
  const router = useRouter();
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: available } = await supabase
        .from('orders')
        .select('*, print_shops(name, address)')
        .eq('delivery_needed', true)
        .eq('status', 'ready_for_pickup')
        .or('delivery_status.eq.pending,delivery_status.eq.none,delivery_status.is.null')
        .is('delivery_partner_id', null)
        .order('is_emergency', { ascending: false });

      const { data: mine } = await supabase
        .from('orders')
        .select('*, print_shops(name, address)')
        .eq('delivery_partner_id', user.id)
        .neq('delivery_status', 'delivered');

      setAvailableDeliveries(available || []);
      setMyTasks(mine || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleAccept = async (orderId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('orders')
        .update({
          delivery_partner_id: user.id,
          delivery_status: 'accepted'
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Deliveries</Text>
          <Text style={styles.subGreeting}>{profile?.full_name || 'PARTNER'} • ONLINE</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Radio size={16} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Available Orders</Text>
          <Text style={styles.cardValue}>{availableDeliveries.length}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#1E293B' }]}>
          <Text style={styles.cardLabel}>My Deliveries</Text>
          <Text style={styles.cardValue}>{myTasks.length}</Text>
        </View>
      </View>

      {myTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Deliveries</Text>
          {myTasks.map((d) => (
            <TouchableOpacity key={d.id} onPress={() => router.push(`/delivery/${d.id}`)}>
              <Card style={[styles.deliveryCard, { borderLeftWidth: 4, borderLeftColor: '#2563EB' }]}>
                <Card.Content>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.orderNo}>#{d.order_number?.slice(-8).toUpperCase()}</Text>
                      {d.is_emergency && <View style={styles.nitroBadge}><Zap size={10} color="#EF4444" fill="#EF4444" /><Text style={styles.nitroText}>URGENT DELIVERY</Text></View>}
                    </View>
                    <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{d.delivery_status?.toUpperCase() || 'ACCEPTED'}</Text></View>
                  </View>
                  <View style={styles.locationGroup}>
                    <View style={styles.locItem}>
                      <Package size={14} color="#475569" />
                      <Text style={styles.shopName} numberOfLines={1}>{d.print_shops?.name}</Text>
                    </View>
                    <View style={styles.locItem}>
                      <MapPin size={14} color="#475569" />
                      <Text style={styles.address} numberOfLines={1}>{d.delivery_address}</Text>
                    </View>
                  </View>
                  <View style={styles.navButton}>
                    <Text style={styles.navButtonText}>VIEW DETAILS</Text>
                    <ChevronRight size={14} color="white" />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Orders Nearby</Text>
        {availableDeliveries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No available orders at this time.</Text>
          </View>
        ) : (
          availableDeliveries.map((d) => (
            <Card key={d.id} style={styles.deliveryCard}>
              <Card.Content>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.orderNo}>#{d.order_number?.slice(-8).toUpperCase()}</Text>
                    {d.is_emergency && <View style={styles.nitroBadge}><Zap size={10} color="#EF4444" fill="#EF4444" /><Text style={styles.nitroText}>URGENT</Text></View>}
                  </View>
                  <Text style={styles.feeText}>+₹{d.delivery_fee || 20}</Text>
                </View>
                <View style={styles.locationGroup}>
                  <Text style={styles.locLabel}>PICKUP FROM: <Text style={styles.locVal}>{d.print_shops?.name}</Text></Text>
                  <Text style={styles.locLabel}>DELIVER TO: <Text style={styles.locVal}>{d.delivery_address}</Text></Text>
                </View>
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(d.id)}>
                  <Text style={styles.acceptButtonText}>ACCEPT ORDER</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 24, paddingTop: 60, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1.5 },
  subGreeting: { fontSize: 10, color: '#475569', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  refreshBtn: { backgroundColor: '#1E293B', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  logoutBtn: { backgroundColor: '#450A0A', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#7F1D1D' },
  cards: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 32 },
  card: { flex: 1, borderRadius: 32, backgroundColor: '#2563EB', padding: 24, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2 },
  cardValue: { fontSize: 32, fontWeight: '900', color: 'white', marginTop: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '900', paddingHorizontal: 24, marginBottom: 20, color: '#475569', textTransform: 'uppercase', letterSpacing: 4 },
  deliveryCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 32, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', elevation: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderNo: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  nitroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: '#450A0A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  nitroText: { color: '#EF4444', fontSize: 8, fontWeight: '900' },
  statusBadge: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  statusBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },
  feeText: { color: '#22C55E', fontWeight: '900', fontSize: 20 },
  locationGroup: { gap: 10, marginBottom: 20 },
  locItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locLabel: { fontSize: 10, color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  locVal: { color: '#CBD5E1', fontWeight: '900' },
  shopName: { fontSize: 14, fontWeight: '900', color: '#CBD5E1' },
  address: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  navButton: { backgroundColor: '#2563EB', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  navButtonText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  acceptButton: { backgroundColor: '#22C55E', padding: 20, borderRadius: 24, alignItems: 'center' },
  acceptButtonText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 3 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
