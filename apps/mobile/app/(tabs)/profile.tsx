import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, List, Avatar, Divider, Switch } from 'react-native-paper';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Avatar.Text size={80} label="JD" style={styles.avatar} />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john@example.com</Text>
      </View>

      <Card style={styles.card}>
        <List.Item
          title="Order History"
          left={(props) => <List.Icon {...props} icon="history" color="#2563EB" />}
          onPress={() => {}}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Saved Shops"
          left={(props) => <List.Icon {...props} icon="bookmark" color="#2563EB" />}
          onPress={() => {}}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Payment Methods"
          left={(props) => <List.Icon {...props} icon="credit-card" color="#2563EB" />}
          onPress={() => {}}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Addresses"
          left={(props) => <List.Icon {...props} icon="map-marker" color="#2563EB" />}
          onPress={() => {}}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Dark Mode</Text>
          <Switch value={false} color="#2563EB" />
        </View>
      </Card>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: { backgroundColor: '#2563EB' },
  name: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  email: { fontSize: 14, color: '#64748B', marginTop: 4 },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  settingsLabel: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
