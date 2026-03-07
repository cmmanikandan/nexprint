import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from 'react-native-paper';

// Mock shop data
const shopData: Record<string, { name: string; address: string; distance: number; rating: number; colorPrice: number; bwPrice: number; status: string }> = {
  '1': { name: 'QuickPrint Center', address: '123 Main St', distance: 0.5, rating: 4.8, colorPrice: 2, bwPrice: 0.5, status: 'open' },
  '2': { name: 'Copy Express', address: '456 Oak Ave', distance: 1.2, rating: 4.5, colorPrice: 1.5, bwPrice: 0.4, status: 'open' },
};

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const shop = id ? shopData[id] || shopData['1'] : shopData['1'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={[styles.statusBadge, shop.status === 'open' ? styles.open : styles.closed]}>
            <Text style={styles.statusText}>{shop.status === 'open' ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
        <Text style={styles.address}>📍 {shop.address}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>⭐ {shop.rating}</Text>
          <Text style={styles.metaText}>📍 {shop.distance} km away</Text>
        </View>
      </View>

      <Card style={styles.priceCard}>
        <Card.Content>
          <Text style={styles.priceTitle}>Printing Prices</Text>
          <View style={styles.priceRow}>
            <Text>Black & White</Text>
            <Text style={styles.price}>₹{shop.bwPrice}/page</Text>
          </View>
          <View style={styles.priceRow}>
            <Text>Color</Text>
            <Text style={styles.price}>₹{shop.colorPrice}/page</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => router.push({ pathname: '/order/new', params: { shop: id || '1' } })}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          Print Here
        </Button>
        <Button
          mode="outlined"
          onPress={() => {}}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
          icon="bookmark-outline"
        >
          Save Shop
        </Button>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  open: { backgroundColor: '#DCFCE7' },
  closed: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 13, fontWeight: '600' },
  address: { fontSize: 14, color: '#64748B', marginTop: 8 },
  meta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaText: { fontSize: 14, color: '#64748B' },
  priceCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16 },
  priceTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  price: { fontWeight: '700', color: '#2563EB' },
  buttons: { paddingHorizontal: 20, gap: 12 },
  primaryButton: { borderRadius: 16, backgroundColor: '#2563EB' },
  secondaryButton: { borderRadius: 16, borderColor: '#2563EB' },
  buttonContent: { paddingVertical: 8 },
});
