import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useShowSidebar } from '@/lib/useLayout';
import { useSettings } from '@/providers/SettingsProvider';

export default function TabsLayout() {
  const { colors, t } = useSettings();
  const showSidebar = useShowSidebar();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // The WebSidebar replaces the bottom tab bar on wide web; phones keep the bottom bar.
          display: showSidebar ? 'none' : 'flex',
          ...(Platform.OS === 'web' ? { height: 76 } : null),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarItemStyle: Platform.OS === 'web' ? { paddingVertical: 6 } : undefined,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabLibrary'),
          headerTitle: t('library'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          headerTitle: t('settings'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
