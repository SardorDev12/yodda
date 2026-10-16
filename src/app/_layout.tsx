import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/db/schema';
import { syncAndroidChrome } from '@/lib/navigation-bar';
import { runFullSync, startRealtimeSync, stopRealtimeSync } from '@/lib/sync';
import { AuthProvider, useAuth } from '@/store/auth-context';
import { SettingsProvider, useSettings } from '@/store/settings-context';
// Registers the background task definition unconditionally at startup —
// required so it also runs on a headless background launch, not just
// while the app is open. Side-effect import; keep it, don't remove.
import '@/tasks/reminderTask';

/** Starts/stops cloud sync as the signed-in session appears or goes away. */
function SyncBootstrap() {
  const db = useSQLiteContext();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      stopRealtimeSync();
      return;
    }
    runFullSync(db, user.id)
      .catch(() => {})
      .finally(() => startRealtimeSync(db, user.id));
    return () => stopRealtimeSync();
  }, [db, user]);

  return null;
}

const FRAME_BREAKPOINT = 720;
const FRAME_MAX_WIDTH = 640;

/** On a wide browser window, frames the app in a centered, readable-width
 * column with a backdrop instead of stretching full-bleed. Below the
 * breakpoint (phones, narrow windows) it's a no-op — full width, no frame,
 * so real mobile browsers are never squeezed. No-op on native entirely. */
function WebFrame({ children }: { children: ReactNode }) {
  const { colors, scheme } = useSettings();
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < FRAME_BREAKPOINT) return <>{children}</>;
  return (
    <View style={[styles.webBackdrop, { backgroundColor: scheme === 'dark' ? '#000003' : '#E4E4EA' }]}>
      <View style={[styles.webFrame, { backgroundColor: colors.bg }]}>{children}</View>
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
        <Stack.Screen name="login" options={{ presentation: 'modal', title: t('settings.account') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
        <SettingsProvider>
          <AuthProvider>
            <SyncBootstrap />
            <WebFrame>
              <Navigator />
            </WebFrame>
          </AuthProvider>
        </SettingsProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: { flex: 1, alignItems: 'center' },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: FRAME_MAX_WIDTH,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 40px rgba(0, 0, 0, 0.12)' } as object) : null),
  },
});
