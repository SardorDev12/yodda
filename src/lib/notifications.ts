import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_TASK_NAME } from '@/tasks/reminderTask';

export const MAX_REMINDERS = 3;
export const isWeb = Platform.OS === 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Starts the background check (src/tasks/reminderTask.ts) that decides,
 * roughly every 15 minutes, whether it's time to show a reminder — it
 * reads the configured hours/count straight from settings each run, so
 * changing them doesn't require re-registering anything here.
 */
export async function startReminderChecks(): Promise<void> {
  if (isWeb) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await BackgroundTask.registerTaskAsync(REMINDER_TASK_NAME, { minimumInterval: 15 });
}

export async function stopReminderChecks(): Promise<void> {
  if (isWeb) return;
  await BackgroundTask.unregisterTaskAsync(REMINDER_TASK_NAME).catch(() => {});
}
