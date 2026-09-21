import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/db/schema';
import { AuthProvider } from '@/store/auth-context';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
        <AuthProvider>
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
            <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Sign in' }} />
            <Stack.Screen name="subject/[id]" options={{ title: 'Subject' }} />
          </Stack>
        </AuthProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
