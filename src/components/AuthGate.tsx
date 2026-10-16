import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_LANGUAGE, translate } from '@/i18n';
import { useAuth } from '@/store/auth-context';
import { lightColors, radius, spacing } from '@/theme';

const t = (key: string, params?: Record<string, string | number>) => translate(DEFAULT_LANGUAGE, key, params);
const colors = lightColors;

/**
 * Yodda has no offline/local mode — every screen past this one assumes a
 * signed-in user id to read and write Supabase. Rendered directly by the
 * root layout (not a route) whenever there's no session, with no way to
 * dismiss it without signing in.
 */
export function AuthGate() {
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
      if (err) setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.form} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          <Text style={styles.switchText}>{mode === 'signin' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  form: { flex: 1, justifyContent: 'center', padding: spacing(3), gap: spacing(1.5) },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing(1), textAlign: 'center' },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
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
