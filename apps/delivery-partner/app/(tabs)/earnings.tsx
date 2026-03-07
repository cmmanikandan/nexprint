import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { Wallet, TrendingUp, Calendar, CheckCircle } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [history, setHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: delivered } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', user.id)
        .eq('delivery_status', 'delivered')
        .order('created_at', { ascending: false });

      if (delivered) {
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(); lastMonth.setDate(lastMonth.getDate() - 30);

        const dToday = delivered.filter(o => o.created_at.startsWith(today))
          .reduce((acc, curr) => acc + (curr.delivery_fee || 20), 0);

        const dWeek = delivered.filter(o => new Date(o.created_at) > lastWeek)
          .reduce((acc, curr) => acc + (curr.delivery_fee || 20), 0);

        const dMonth = delivered.filter(o => new Date(o.created_at) > lastMonth)
          .reduce((acc, curr) => acc + (curr.delivery_fee || 20), 0);

        setStats({ today: dToday, week: dWeek, month: dMonth });
        setHistory(delivered.slice(0, 10)); // Top 10 recent
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wallet size={24} color="white" />
        </View>
        <Text style={styles.title}>Finance HUB</Text>
        <Text style={styles.subtitle}>Payout Velocity & Settlement History</Text>
      </View>

      <Card style={styles.totalCard}>
        <Card.Content>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Settled This Month</Text>
              <Text style={styles.totalValue}>₹{stats.week.toLocaleString()}</Text>
            </View>
            <View style={styles.growthBadge}>
              <TrendingUp size={12} color="#22C55E" />
              <Text style={styles.growthText}>+12%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statLabelRow}>
              <Calendar size={12} color="#64748B" />
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <Text style={styles.statValue}>₹{stats.today}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statLabelRow}>
              <TrendingUp size={12} color="#64748B" />
              <Text style={styles.statLabel}>Monthly</Text>
            </View>
            <Text style={styles.statValue}>₹{stats.month}</Text>
          </Card.Content>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Settlements</Text>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No confirmed payouts detected.</Text>
        </View>
      ) : (
        history.map((h, i) => (
          <View key={h.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <View style={styles.historyIcon}><CheckCircle size={14} color="#22C55E" /></View>
              <View>
                <Text style={styles.historyTarget}>#{h.order_number?.slice(-6).toUpperCase()}</Text>
                <Text style={styles.historyDate}>{new Date(h.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.historyAmount}>+₹{h.delivery_fee || 20}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  header: { marginBottom: 32 },
  headerIcon: { width: 48, height: 48, backgroundColor: '#2563EB', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: -1 },
  subtitle: { fontSize: 10, fontWeight: '800', color: '#475569', marginTop: 4, textTransform: 'uppercase', letterSpacing: 3 },
  totalCard: { borderRadius: 32, marginBottom: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', elevation: 0 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 10, color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  totalValue: { fontSize: 32, fontWeight: '900', color: 'white', marginTop: 8 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064E3B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  growthText: { color: '#22C55E', fontWeight: '900', fontSize: 10 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, borderRadius: 24, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', elevation: 0 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: 'white' },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 20 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155/50' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center' },
  historyTarget: { fontSize: 14, fontWeight: '800', color: 'white' },
  historyDate: { fontSize: 10, color: '#475569', fontWeight: '700' },
  historyAmount: { color: '#22C55E', fontWeight: '900', fontSize: 15 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
