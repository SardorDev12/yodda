import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { supabase } from '@/lib/supabase';
import { runFullSync } from '@/lib/sync';
import { useAuth } from '@/store/auth-context';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { signInWithPassword, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      const fn = mode === 'signin' ? signInWithPassword : signUp;
      const err = await fn(email.trim(), password);
      if (err) {
        setError(err);
        return;
      }
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (data.user) await runFullSync(db, data.user.id).catch(() => {});
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
      <Text style={styles.subtitle}>Sync your knowledge across devices.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.switchText}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing(3), gap: spacing(1.5) },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing(1) },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(1.5), alignItems: 'center', marginTop: spacing(1) },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { color: colors.primary, textAlign: 'center', marginTop: spacing(1), fontWeight: '600' },
});
