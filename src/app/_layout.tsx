import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/db/schema';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
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
          <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Add knowledge' }} />
          <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About Yodda' }} />
          <Stack.Screen name="subject/[id]" options={{ title: 'Subject' }} />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
