import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/db/schema';
import { syncAndroidChrome } from '@/lib/navigation-bar';
import { SettingsProvider, useSettings } from '@/store/settings-context';
// Registers the background task definition unconditionally at startup —
// required so it also runs on a headless background launch, not just
// while the app is open. Side-effect import; keep it, don't remove.
import '@/tasks/reminderTask';

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
        <Stack.Screen name="add" options={{ presentation: 'modal', title: t('add.title') }} />
        <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: t('edit.title') }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: t('about.title') }} />
        <Stack.Screen name="book/[id]" options={{ title: t('book.title') }} />
        <Stack.Screen name="subject/[id]" options={{ title: t('subject.title') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
        <SettingsProvider>
          <Navigator />
        </SettingsProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
