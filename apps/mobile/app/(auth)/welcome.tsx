import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>NP</Text>
          </View>
        </View>

        <Text style={styles.title}>NexPrint 2.0</Text>
        <Text style={styles.subtitle}>Premium Print Experience</Text>
        <Text style={styles.description}>
          The fastest way to get your documents printed.{'\n'}
          Upload from your device and collect from nearby stations.
        </Text>

        {/* Feature badges */}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>⚡</Text>
            <Text style={styles.badgeText}>Instant</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🔒</Text>
            <Text style={styles.badgeText}>Secure</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>📍</Text>
            <Text style={styles.badgeText}>Nearby</Text>
          </View>
        </View>
      </View>

      {/* Single CTA */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.primaryBtnText}>Get Started →</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Admin, Shop Admin &amp; Users in one app
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#2563EB',
    opacity: 0.06,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#22C55E',
    opacity: 0.06,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 18,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  buttons: {
    paddingBottom: 40,
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
