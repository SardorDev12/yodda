import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { EdgeSwipeZones } from '@/components/EdgeSwipeZones';
import { OverflowMenu } from '@/components/OverflowMenu';
import { useSettings } from '@/store/settings-context';

export default function TabsLayout() {
  const { colors, t } = useSettings();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerRight: () => <OverflowMenu />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: t('tabs.library'),
            tabBarIcon: ({ color, size }) => <Ionicons name="library" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
          }}
        />
      </Tabs>
      <EdgeSwipeZones />
    </View>
  );
}
