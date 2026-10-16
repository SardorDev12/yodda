import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_LANGUAGE, translate } from '@/i18n';
import { useAuth } from '@/store/auth-context';
import { lightColors, radius, shadow, spacing } from '@/theme';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (!email.trim() || !password || busy) return;
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
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <View style={styles.card}>
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
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && !busy && styles.pressedDim]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => pressed && styles.pressedDim}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={styles.switchText}>{mode === 'signin' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(3) },
  pressedDim: { opacity: 0.7 },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: spacing(1.5),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
    ...shadow.raised,
  },
  logo: { width: 56, height: 56, borderRadius: radius.md, marginBottom: spacing(2) },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: { flex: 1, padding: spacing(1.5), fontSize: 16, color: colors.text },
  eyeButton: { paddingHorizontal: spacing(1.5) },
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
