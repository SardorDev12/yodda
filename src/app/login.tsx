import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { supabase } from '@/lib/supabase';
import { runFullSync, startRealtimeSync } from '@/lib/sync';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { signInWithPassword, signUp } = useAuth();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      if (data.user) {
        await runFullSync(db, data.user.id).catch(() => {});
        startRealtimeSync(db, data.user.id);
      }
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>{mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? t('auth.pleaseWait') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.switchText}>{mode === 'signin' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing(1.5),
      alignItems: 'center',
      marginTop: spacing(1),
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    switchText: { color: colors.primary, textAlign: 'center', marginTop: spacing(1), fontWeight: '600' },
  });
}
