import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { User, Phone, Mail, Award, CheckCircle, ShieldCheck, LogOut, ChevronRight, Star, Clock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_completed: 0 });

    useEffect(() => {
        fetchProfile();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile({ ...prof, email: prof?.email || user.email });

            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('delivery_partner_id', user.id)
                .eq('delivery_status', 'delivered');

            setStats({ total_completed: count || 0 });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of your partner portal?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    if (loading) return (
        <View style={[styles.container, styles.centered]}>
            <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Premium Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || 'D'}</Text>
                    </View>
                    <View style={styles.statusDot}>
                        <ShieldCheck size={12} color="white" />
                    </View>
                </View>
                <Text style={styles.name}>{profile?.full_name || 'Delivery Partner'}</Text>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>Senior Partner • Active</Text>
                </View>
            </View>

            {/* Performance Stats */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <CheckCircle size={20} color="#2563EB" />
                    <Text style={styles.statValue}>{stats.total_completed}</Text>
                    <Text style={styles.statLabel}>Deliveries</Text>
                </View>
                <View style={styles.statCard}>
                    <Star size={20} color="#F59E0B" />
                    <Text style={styles.statValue}>4.9</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statCard}>
                    <Clock size={20} color="#10B981" />
                    <Text style={styles.statValue}>99%</Text>
                    <Text style={styles.statLabel}>On-time</Text>
                </View>
            </View>

            {/* Information Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Identification & Contact</Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Phone size={18} color="#64748B" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                            <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
                        </View>
                    </View>

                    <View style={[styles.infoRow, styles.noBorder]}>
                        <View style={styles.infoIcon}>
                            <Mail size={18} color="#64748B" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                            <Text style={styles.infoValue}>{profile?.email || 'Not provided'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Account Sector */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/profile/edit')}>
                    <View style={styles.actionIcon}>
                        <User size={20} color="#CBD5E1" />
                    </View>
                    <Text style={styles.actionText}>Edit Profile</Text>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionItem, { marginTop: 12 }]} onPress={() => Alert.alert('Coming soon', 'Security settings will be available soon.')}>
                    <View style={styles.actionIcon}>
                        <ShieldCheck size={20} color="#CBD5E1" />
                    </View>
                    <Text style={styles.actionText}>Security & Privacy</Text>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#475569', fontWeight: '800', letterSpacing: 4, textTransform: 'uppercase', fontSize: 10 },
    header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
    avatarContainer: { position: 'relative', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 32, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    avatarText: { fontSize: 40, fontWeight: '900', color: 'white', fontStyle: 'italic' },
    statusDot: { position: 'absolute', bottom: -5, right: -5, width: 32, height: 32, borderRadius: 16, backgroundColor: '#22C55E', borderWidth: 4, borderColor: '#020617', justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: -1 },
    rankBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#1E293B', borderRadius: 8 },
    rankText: { fontSize: 8, color: '#3B82F6', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
    statsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#0F172A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1E293B', alignItems: 'center' },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 },
    statValue: { fontSize: 22, fontWeight: '900', color: 'white', marginTop: 8 },
    section: { marginHorizontal: 24, marginBottom: 32 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16 },
    infoCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 16, marginBottom: 16 },
    noBorder: { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
    infoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 7, fontWeight: '800', color: '#475569', letterSpacing: 2 },
    infoValue: { fontSize: 13, fontWeight: '700', color: '#CBD5E1', marginTop: 2 },
    actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#1E293B' },
    actionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    actionText: { flex: 1, fontSize: 13, fontWeight: '800', color: '#CBD5E1', letterSpacing: 1 },
    logoutBtn: { marginHorizontal: 24, marginBottom: 60, height: 70, borderRadius: 24, backgroundColor: '#450A0A50', borderWidth: 1, borderColor: '#7F1D1D50', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    logoutText: { color: '#EF4444', fontWeight: '900', fontSize: 11, letterSpacing: 4 },
});
