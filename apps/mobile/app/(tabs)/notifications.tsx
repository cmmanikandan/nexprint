import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

const notifications = [
  { id: '1', title: 'Order Ready for Pickup', body: 'Your order NP20240228-B4C5D6 is ready at Copy Express', time: '10 min ago', read: false },
  { id: '2', title: 'Printing in Progress', body: 'QuickPrint Center has started printing your documents', time: '45 min ago', read: true },
  { id: '3', title: '20% Off This Weekend', body: 'Get 20% off on color prints at Print Hub. Use code WEEKEND20', time: '2 hours ago', read: true },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Order updates and offers</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={[styles.card, !item.read && styles.cardUnread]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </Card.Content>
          </Card>
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
  list: { padding: 20, paddingTop: 8 },
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 12,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  cardBody: { fontSize: 14, color: '#64748B', marginTop: 4 },
  cardTime: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
});
