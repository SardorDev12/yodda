import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import { languageNames, type Language } from '@/i18n/translations';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { radius, space } from '@/theme/tokens';
import { AppText, Button, Loading, SegmentedControl, TextField } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Rendered at the root layout (not a route). With no active session it replaces the whole app
 * and cannot be dismissed.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth();
  if (initializing) return <FullScreen><Loading /></FullScreen>;
  if (!session) return <FullScreen><AuthForm /></FullScreen>;
  return <>{children}</>;
}

function FullScreen({ children }: { children: ReactNode }) {
  const { colors } = useSettings();
  return <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]}>{children}</SafeAreaView>;
}

function AuthForm() {
  const { signIn, signUp } = useAuth();
  const { t, colors, language, setPreAuthLanguage } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setInfo(null);
    if (!isSupabaseConfigured) return setError(t('notConfigured'));
    if (!EMAIL_RE.test(email.trim())) return setError(t('invalidEmail'));
    if (password.length < 6) return setError(t('passwordShort'));
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        const res = await signUp(email.trim(), password);
        if (res.error) setError(res.error);
        else if (res.needsConfirmation) {
          setInfo(t('checkEmail'));
          setMode('signin');
        }
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setInfo(null);
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Ionicons name="albums" size={30} color={colors.onPrimary} />
            </View>
            <AppText variant="title" accessibilityRole="header">
              {t('authWelcome')}
            </AppText>
            <AppText muted style={styles.center}>
              {t('authSub')}
            </AppText>
          </View>

          <View style={styles.form}>
            <TextField
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signin' ? 'password' : 'newPassword'}
              returnKeyType="go"
              onSubmitEditing={submit}
              right={
                <Pressable
                  onPress={() => setShowPw((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPw ? t('hidePassword') : t('showPassword')}
                  hitSlop={8}
                  style={styles.eye}
                >
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
                </Pressable>
              }
            />
            {error ? (
              <View style={[styles.notice, { backgroundColor: colors.dangerSoft }]} accessibilityLiveRegion="polite">
                <AppText variant="caption" color={colors.danger}>
                  {error}
                </AppText>
              </View>
            ) : null}
            {info ? (
              <View style={[styles.notice, { backgroundColor: colors.successSoft }]} accessibilityLiveRegion="polite">
                <AppText variant="caption" color={colors.success}>
                  {info}
                </AppText>
              </View>
            ) : null}
            <Button label={mode === 'signin' ? t('signIn') : t('signUp')} onPress={submit} loading={busy} />
          </View>

          <View style={styles.footer}>
            <AppText muted style={styles.center}>
              {mode === 'signin' ? t('noAccount') : t('haveAccount')}
            </AppText>
            <Button label={mode === 'signin' ? t('signUp') : t('signIn')} variant="ghost" onPress={toggle} />
            <SegmentedControl<Language>
              label="Language"
              value={language}
              onChange={setPreAuthLanguage}
              options={(Object.keys(languageNames) as Language[]).map((l) => ({ value: l, label: languageNames[l] }))}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { width: '100%', maxWidth: 420, gap: space.xl },
  header: { alignItems: 'center', gap: space.md },
  logo: { width: 64, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  form: { gap: space.md },
  eye: { padding: space.xs },
  notice: { padding: space.md, borderRadius: radius.md },
  footer: { gap: space.xs },
});
