import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextInput, IconButton } from 'react-native-paper';
import { useState } from 'react';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} iconColor="#64748B" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join NexPrint to start printing</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          outlineColor="#E2E8F0"
          activeOutlineColor="#2563EB"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
          outlineColor="#E2E8F0"
          activeOutlineColor="#2563EB"
        />
        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
          outlineColor="#E2E8F0"
          activeOutlineColor="#2563EB"
        />

        <Button
          mode="contained"
          onPress={() => router.push('/(auth)/otp')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Create Account
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  header: {
    paddingTop: 48,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  button: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
