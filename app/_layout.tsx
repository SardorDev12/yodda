import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/AuthGate';
import { UpdatePrompt, VersionGate } from '@/components/VersionGate';
import { WebSidebar } from '@/components/WebSidebar';
import { checkReminders, syncReminderTask } from '@/lib/reminders';
import { AuthProvider } from '@/providers/AuthProvider';
import { DataVersionProvider } from '@/providers/DataVersionProvider';
import { SettingsProvider, useSettings } from '@/providers/SettingsProvider';
import { ToastProvider } from '@/providers/ToastProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <AuthGate>
              <DataVersionProvider>
                <VersionGate>
                  <Shell />
                </VersionGate>
              </DataVersionProvider>
            </AuthGate>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { colors, theme, t, settings, loaded } = useSettings();

  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;
    syncReminderTask(settings.reminder.enabled);
    if (settings.reminder.enabled) checkReminders().catch(() => undefined);
  }, [loaded, settings.reminder.enabled]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {/* Web only: renders outside the tabs navigator, so the tab bar is hidden on web. */}
      <WebSidebar />
      <View style={styles.content}>
        <UpdatePrompt />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="book/[id]" options={{ title: t('books') }} />
          <Stack.Screen name="subject/[id]" options={{ title: t('library') }} />
          <Stack.Screen name="edit-card/[id]" options={{ title: t('editCard') }} />
          <Stack.Screen name="review" options={{ title: t('review') }} />
          <Stack.Screen name="about" options={{ title: t('about') }} />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
});
