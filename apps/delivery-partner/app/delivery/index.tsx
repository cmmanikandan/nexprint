import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF7ED', text: '#C2410C' },
    out_for_delivery: { bg: '#EFF6FF', text: '#1D4ED8' },
    delivered: { bg: '#F0FDF4', text: '#15803D' },
    failed: { bg: '#FFF1F2', text: '#BE123C' },
};

export default function DeliveryDashboard() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState<'active' | 'completed'>('active');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/'); return; }

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(prof);
        setPartnerId(session.user.id);
        await fetchDeliveries(session.user.id);
    };

    const fetchDeliveries = async (pid?: string) => {
        const id = pid || partnerId;
        if (!id) return;
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, profiles!user_id(full_name, phone), print_shops(name, address, phone)')
                .eq('delivery_partner_id', id)
                .order('created_at', { ascending: false });
            setDeliveries(data || []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            await fetchDeliveries();
        } finally {
            setUpdating(null);
        }
    };

    const confirmAction = (orderId: string, status: string, label: string) => {
        Alert.alert('Confirm', `Mark this order as "${label}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => updateDeliveryStatus(orderId, status) },
        ]);
    };

    const activeOrders = deliveries.filter(d => !['delivered', 'completed'].includes(d.status));
    const completedOrders = deliveries.filter(d => ['delivered', 'completed'].includes(d.status));
    const shown = tab === 'active' ? activeOrders : completedOrders;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/');
    };

    if (loading) {
        return (
            <View style={[s.bg, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#64748B', fontWeight: '800', letterSpacing: 3, fontSize: 10 }}>LOADING SHIFT...</Text>
            </View>
        );
    }

    return (
        <View style={s.bg}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Hey, {profile?.full_name?.split(' ')[0] || 'Partner'} 👋</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                        <Text style={s.subGreeting}>SHIFT ACTIVE • {activeOrders.length} PENDING</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
                    <Text style={s.logoutText}>END SHIFT</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
                {[
                    { label: 'Active', value: activeOrders.length, color: '#2563EB' },
                    { label: 'Done Today', value: completedOrders.length, color: '#22C55E' },
                    { label: 'Total', value: deliveries.length, color: '#8B5CF6' },
                ].map(stat => (
                    <View key={stat.label} style={s.statCard}>
                        <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                        <Text style={s.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* Tabs */}
            <View style={s.tabs}>
                {(['active', 'completed'] as const).map(t => (
                    <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
                        <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                            {t === 'active' ? `ACTIVE (${activeOrders.length})` : `DONE (${completedOrders.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Delivery List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDeliveries(); }} tintColor="#2563EB" />}
            >
                {shown.length === 0 && (
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>{tab === 'active' ? '📦' : '✅'}</Text>
                        <Text style={s.emptyText}>{tab === 'active' ? 'No active deliveries' : 'No completed deliveries'}</Text>
                    </View>
                )}

                {shown.map(order => {
                    const colors = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
                    const isUpdating = updating === order.id;

                    return (
                        <View key={order.id} style={s.card}>
                            {/* Order Header */}
                            <View style={s.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.orderNum}>#{order.order_number?.slice(-8)}</Text>
                                    <Text style={s.customerName}>{order.profiles?.full_name || 'Customer'}</Text>
                                </View>
                                <View style={[s.badge, { backgroundColor: colors.bg }]}>
                                    <Text style={[s.badgeText, { color: colors.text }]}>
                                        {order.status?.replace(/_/g, ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Shop Info */}
                            <View style={s.infoBlock}>
                                <Text style={s.infoLabel}>PICKUP FROM</Text>
                                <Text style={s.infoValue}>{order.print_shops?.name || '—'}</Text>
                                <Text style={s.infoSub}>{order.print_shops?.address || ''}</Text>
                                {order.print_shops?.phone && (
                                    <Text style={s.phone}>📞 {order.print_shops.phone}</Text>
                                )}
                            </View>

                            <View style={[s.infoBlock, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }]}>
                                <Text style={s.infoLabel}>DELIVER TO</Text>
                                <Text style={s.infoValue}>{order.profiles?.full_name}</Text>
                                {order.profiles?.phone && (
                                    <Text style={s.phone}>📞 {order.profiles.phone}</Text>
                                )}
                                {order.delivery_address && (
                                    <Text style={s.infoSub}>{order.delivery_address}</Text>
                                )}
                            </View>

                            {/* Amount */}
                            <View style={s.amountRow}>
                                <Text style={s.amountLabel}>AMOUNT {order.payment_status === 'paid' ? '(PAID)' : '(COLLECT)'}</Text>
                                <Text style={[s.amount, { color: order.payment_status === 'paid' ? '#22C55E' : '#F59E0B' }]}>
                                    ₹{order.total_amount}
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            {tab === 'active' && (
                                <View style={s.actionRow}>
                                    {order.status === 'ready_for_pickup' && (
                                        <TouchableOpacity
                                            style={[s.actionBtn, { backgroundColor: '#2563EB' }]}
                                            onPress={() => confirmAction(order.id, 'out_for_delivery', 'Out for Delivery')}
                                            disabled={isUpdating}
                                        >
                                            <Text style={s.actionBtnText}>🚴 PICKED UP</Text>
                                        </TouchableOpacity>
                                    )}
                                    {order.status === 'out_for_delivery' && (
                                        <>
                                            <TouchableOpacity
                                                style={[s.actionBtn, { backgroundColor: '#22C55E', flex: 1 }]}
                                                onPress={() => confirmAction(order.id, 'delivered', 'Delivered')}
                                                disabled={isUpdating}
                                            >
                                                <Text style={s.actionBtnText}>✅ DELIVERED</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[s.actionBtn, { backgroundColor: '#EF4444', flex: 0.5 }]}
                                                onPress={() => confirmAction(order.id, 'failed', 'Failed')}
                                                disabled={isUpdating}
                                            >
                                                <Text style={s.actionBtnText}>✕ FAILED</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {isUpdating && (
                                        <View style={s.updatingOverlay}>
                                            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>UPDATING...</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingTop: 60, backgroundColor: '#0F172A' },
    greeting: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
    subGreeting: { fontSize: 9, fontWeight: '800', color: '#475569', letterSpacing: 3 },
    logoutBtn: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    logoutText: { fontSize: 9, fontWeight: '900', color: 'white', letterSpacing: 2 },
    statsRow: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#0F172A' },
    statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    statLabel: { fontSize: 8, fontWeight: '800', color: '#475569', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
    tabs: { flexDirection: 'row', padding: 12, paddingBottom: 0, gap: 8 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' },
    tabActive: { backgroundColor: '#0F172A' },
    tabText: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
    tabTextActive: { color: 'white' },
    empty: { alignItems: 'center', paddingVertical: 64 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontSize: 12, fontWeight: '800', color: '#CBD5E1', letterSpacing: 2, textTransform: 'uppercase' },
    card: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
    orderNum: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    customerName: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
    infoBlock: { paddingHorizontal: 20, paddingBottom: 12, gap: 3 },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 3, textTransform: 'uppercase' },
    infoValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    infoSub: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    phone: { fontSize: 11, fontWeight: '700', color: '#2563EB', marginTop: 2 },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
    amountLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
    amount: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    actionRow: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 12 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    actionBtnText: { fontSize: 10, fontWeight: '900', color: 'white', letterSpacing: 2 },
    updatingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
});
