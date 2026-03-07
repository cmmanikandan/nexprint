import { View, Text, StyleSheet, Linking, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, RefreshControl, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { Phone, MapPin, Navigation, Package, CheckCircle, ChevronRight, ArrowLeft, ShieldCheck, Key } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, print_shops(*), profiles!user_id(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrder();
  }, [id]);

  const openMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const callNumber = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === 'delivered') {
      const orderOtp = order.otp_code;
      if (orderOtp && otp !== orderOtp) {
        Alert.alert('Security Breach', 'Invalid OTP provided by customer. Handoff remains locked.');
        return;
      }
    }

    setVerifying(true);
    try {
      let updateObj: any = { delivery_status: newStatus };
      if (newStatus === 'delivered') {
        updateObj.status = 'completed';
      }

      const { error } = await supabase
        .from('orders')
        .update(updateObj)
        .eq('id', id);

      if (error) throw error;
      if (newStatus === 'delivered') {
        Alert.alert('Mission Successful', 'Payload delivered. Credit synced.');
        router.back();
      } else {
        fetchOrder();
      }
    } catch (e: any) {
      Alert.alert('Sync Error', e.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: 'white', fontWeight: '900', letterSpacing: 2 }}>ESTABLISHING LINK...</Text>
    </View>
  );

  if (!order) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: 'white' }}>Mission data not found.</Text>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#2563EB', marginTop: 10 }}>Return to base</Text></TouchableOpacity>
    </View>
  );

  const pickupAddr = order.print_shops?.address || 'Terminal Hub';
  const dropAddr = order.delivery_address || 'Target Location';
  const currentStatus = order.delivery_status || 'accepted';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View>
            <Text style={styles.orderNo}>Target #{order.order_number?.slice(-8).toUpperCase()}</Text>
            <Text style={styles.dateText}>Payload Assigned • {new Date(order.created_at).toLocaleTimeString()}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>{currentStatus.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.doneStep]} />
            <View style={styles.stepLine} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Accepted</Text>
              <Text style={styles.stepDesc}>Dispatch confirmed assignment</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, (currentStatus === 'picked_up' || currentStatus === 'delivered') ? styles.doneStep : styles.activeStep]} />
            <View style={styles.stepLine} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Payload Pickup</Text>
              <Text style={styles.stepDesc}>{(currentStatus === 'picked_up' || currentStatus === 'delivered') ? 'Payload Secured' : 'Proceed to Hub for Pickup'}</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, currentStatus === 'delivered' ? styles.doneStep : {}]} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Final Dropoff</Text>
              <Text style={styles.stepDesc}>Destination handoff sequence</Text>
            </View>
          </View>
        </View>

        {currentStatus === 'picked_up' && (
          <View style={styles.otpBox}>
            <View style={styles.otpHeader}>
              <ShieldCheck size={16} color="#22C55E" />
              <Text style={styles.otpTitle}>Security Verification</Text>
            </View>
            <Text style={styles.otpDesc}>Ask customer for the 4-6 digit handoff code to unlock final status.</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="ENTER OTP"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Package size={16} color="#475569" />
              <Text style={styles.cardLabel}>Pickup Point (HUB)</Text>
            </View>
            <Text style={styles.shopName}>{order.print_shops?.name}</Text>
            <Text style={styles.address}>{pickupAddr}</Text>
            <TouchableOpacity
              onPress={() => openMaps(pickupAddr)}
              style={styles.navBtn}
            >
              <Navigation size={16} color="white" />
              <Text style={styles.navText}>Sync Hub Route</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MapPin size={16} color="#475569" />
              <Text style={styles.cardLabel}>Drop Point (TARGET)</Text>
            </View>
            <Text style={styles.shopName}>{order.profiles?.full_name || 'Customer'}</Text>
            <Text style={styles.address}>{dropAddr}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => openMaps(dropAddr)}
                style={[styles.navBtn, { flex: 1, marginTop: 0 }]}
              >
                <MapPin size={16} color="white" />
                <Text style={styles.navText}>Target Route</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => callNumber(order.profiles?.phone)}
                style={styles.callBtn}
              >
                <Phone size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {currentStatus !== 'delivered' && (
          <TouchableOpacity
            style={[styles.confirmButton, (currentStatus === 'picked_up' ? (otp.length > 2 ? { backgroundColor: '#22C55E' } : { backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155' }) : { backgroundColor: '#2563EB' })]}
            onPress={() => handleUpdateStatus(currentStatus === 'picked_up' ? 'delivered' : 'picked_up')}
            disabled={currentStatus === 'picked_up' && otp.length < 2 || verifying}
          >
            <View style={styles.confirmInner}>
              <Text style={[styles.confirmText, currentStatus === 'picked_up' && otp.length < 2 && { color: '#475569' }]}>
                {verifying ? 'SYNCING...' : currentStatus === 'picked_up' ? 'VERIFY & DELIVERED' : 'SECURE PICKUP'}
              </Text>
              {!verifying && <ChevronRight size={16} color={currentStatus === 'picked_up' && otp.length < 2 ? "#475569" : "white"} />}
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  backBtn: { padding: 10, marginBottom: 10 },
  content: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  orderNo: { fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: -1 },
  dateText: { fontSize: 11, color: '#475569', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB' },
  statusText: { color: '#0F172A', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },

  stepContainer: { marginLeft: 8, marginBottom: 32 },
  step: { flexDirection: 'row', position: 'relative', paddingBottom: 24 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#334155', borderWidth: 3, borderColor: '#0F172A', zIndex: 10 },
  doneStep: { backgroundColor: '#22C55E' },
  activeStep: { backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowRadius: 10, elevation: 5 },
  stepLine: { position: 'absolute', left: 6, top: 14, bottom: -6, width: 2, backgroundColor: '#334155' },
  stepContent: { marginLeft: 20, top: -2 },
  stepTitle: { fontSize: 13, fontWeight: '900', color: 'white' },
  stepDesc: { fontSize: 10, color: '#475569', fontWeight: '600', marginTop: 2 },

  card: { marginBottom: 16, borderRadius: 32, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', overflow: 'hidden', elevation: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 3 },
  shopName: { fontSize: 20, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  address: { fontSize: 13, color: '#94A3B8', marginTop: 6, fontWeight: '600', lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  navBtn: { marginTop: 16, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 24, gap: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  navText: { color: 'white', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  callBtn: { backgroundColor: 'white', padding: 18, borderRadius: 24, width: 64, alignItems: 'center', justifyContent: 'center' },

  otpBox: { backgroundColor: '#064E3B', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#059669' },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  otpTitle: { color: '#22C55E', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  otpDesc: { fontSize: 11, color: '#A7F3D0', fontWeight: '600', lineHeight: 16, marginBottom: 16 },
  otpInput: { backgroundColor: '#062016', borderRadius: 20, padding: 20, fontSize: 24, fontWeight: '900', color: 'white', textAlign: 'center', letterSpacing: 8 },

  confirmButton: { marginTop: 20, borderRadius: 32, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  confirmInner: { paddingVertical: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
  confirmText: { color: 'white', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 4 },
});
