import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/AuthGate';
import { DEFAULT_LANGUAGE, translate } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';
import { syncAndroidChrome } from '@/lib/navigation-bar';
import { AuthProvider, useAuth } from '@/store/auth-context';
import { DataProvider } from '@/store/data-context';
import { SettingsProvider, useSettings } from '@/store/settings-context';
import { lightColors, spacing } from '@/theme';
// Registers the background task definition unconditionally at startup —
// required so it also runs on a headless background launch, not just
// while the app is open. Side-effect import; keep it, don't remove.
import '@/tasks/reminderTask';

function ConfigRequired() {
  const t = (key: string) => translate(DEFAULT_LANGUAGE, key);
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.configTitle}>{t('config.title')}</Text>
      <Text style={styles.configBody}>{t('config.body')}</Text>
    </SafeAreaView>
  );
}

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={lightColors.primary} />
    </View>
  );
}

function Navigator() {
  const { colors, scheme, t } = useSettings();

  useEffect(() => {
    syncAndroidChrome(scheme, colors);
  }, [scheme, colors]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: t('edit.title') }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: t('about.title') }} />
        <Stack.Screen name="book/[id]" options={{ title: t('book.title') }} />
        <Stack.Screen name="subject/[id]" options={{ title: t('subject.title') }} />
      </Stack>
    </>
  );
}

/** Supabase is the only data store, so everything past this gate assumes
 * a signed-in user: no unconfigured build, no logged-out state. */
function AppGate() {
  const { loading, user } = useAuth();

  if (!isSupabaseConfigured) return <ConfigRequired />;
  if (loading) return <Loading />;
  if (!user) return <AuthGate />;

  return (
    <SettingsProvider>
      <DataProvider userId={user.id}>
        <Navigator />
      </DataProvider>
    </SettingsProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Head>
        <title>Yodda</title>
      </Head>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg, padding: spacing(3) },
  configTitle: { fontSize: 20, fontWeight: '700', color: lightColors.text, marginBottom: spacing(1), textAlign: 'center' },
  configBody: { fontSize: 14, color: lightColors.muted, textAlign: 'center', lineHeight: 20 },
});
