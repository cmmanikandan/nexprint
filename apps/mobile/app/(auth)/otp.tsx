import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextInput, IconButton } from 'react-native-paper';

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} iconColor="#64748B" />
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to your device</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="OTP Code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          mode="outlined"
          style={styles.input}
          outlineColor="#E2E8F0"
          activeOutlineColor="#2563EB"
        />

        <Button
          mode="contained"
          onPress={() => router.replace('/(tabs)')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Verify & Continue
        </Button>

        <Text style={styles.resend}>Didn't receive code? <Text style={styles.resendLink}>Resend</Text></Text>
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
    marginTop: 24,
  },
  input: {
    backgroundColor: 'white',
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resend: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 16,
  },
  resendLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
