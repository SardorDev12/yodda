import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OverflowMenu } from '@/components/OverflowMenu';
import { DATABASE_NAME, migrateDatabase } from '@/db/schema';
import { syncNavigationBar } from '@/lib/navigation-bar';
import { SettingsProvider, useSettings } from '@/store/settings-context';

function Navigator() {
  const { colors, scheme, t } = useSettings();

  useEffect(() => {
    syncNavigationBar(scheme);
  }, [scheme]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerRight: () => <OverflowMenu />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: t('add.title') }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: t('about.title') }} />
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
