import { InputField } from '@/components/input-field';
import { PrimaryButton } from '@/components/primary-button';
import { TabSwitcher } from '@/components/tab-switcher';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!username.trim() || !password || !password2) {
      setError('All fields are required.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(username.trim(), password, password2);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>D&D Character Manager</Text>
            <Text style={styles.subtitle}>Manage your characters, spells, and inventory</Text>
          </View>

          <View style={styles.card}>
            <TabSwitcher
              tabs={['Login', 'Register']}
              activeIndex={1}
              onChange={(i) => { if (i === 0) router.back(); }}
            />

            <View style={styles.form}>
              <Text style={styles.formTitle}>Register</Text>
              <Text style={styles.formSubtitle}>Create a new account to get started</Text>

              <InputField
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                autoCapitalize="none"
              />
              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Choose a password"
                secureTextEntry
              />
              <InputField
                label="Confirm Password"
                value={password2}
                onChangeText={setPassword2}
                placeholder="Confirm your password"
                secureTextEntry
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <PrimaryButton label="Register" onPress={handleRegister} loading={loading} style={styles.btn} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DnDColors.background,
  },
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: DnDColors.accent,
    opacity: 0.12,
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: DnDColors.accentLight,
    opacity: 0.08,
    bottom: -50,
    left: -80,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: DnDColors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: DnDColors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: DnDColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DnDColors.border,
    overflow: 'hidden',
    marginBottom: 40,
  },
  form: {
    padding: 20,
  },
  formTitle: {
    color: DnDColors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    color: DnDColors.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  error: {
    color: DnDColors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    marginTop: 4,
  },
});
