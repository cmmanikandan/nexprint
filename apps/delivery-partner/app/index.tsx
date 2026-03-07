import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DeliveryLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single();

      if (profile?.role !== 'delivery_partner') {
        await supabase.auth.signOut();
        throw new Error('This app is for Delivery Partners only.');
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.bg}>
      <View style={s.card}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>NP</Text>
          </View>
          <Text style={s.title}>NexPrint</Text>
          <Text style={s.subtitle}>DELIVERY PARTNER PORTAL</Text>
        </View>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <View style={s.form}>
          <View style={s.inputWrap}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="partner@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <View style={s.inputWrap}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={s.btnText}>{loading ? 'VERIFYING...' : 'LOGIN'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#0F172A', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: '#1E293B' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 72, height: 72, backgroundColor: '#2563EB', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 26, fontWeight: '900', color: 'white', fontStyle: 'italic' },
  title: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -1 },
  subtitle: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 4, marginTop: 4 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 12, fontWeight: '700', color: '#DC2626', textAlign: 'center' },
  form: { gap: 16 },
  inputWrap: { gap: 8 },
  label: { fontSize: 9, fontWeight: '800', color: '#475569', letterSpacing: 3, textTransform: 'uppercase' },
  input: { backgroundColor: '#020617', borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 20, paddingVertical: 16, fontSize: 14, fontWeight: '600', color: 'white' },
  btn: { backgroundColor: '#2563EB', borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  btnText: { fontSize: 12, fontWeight: '900', color: 'white', letterSpacing: 3 },
});
