import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const MAX_REMINDERS = 3;
const REMINDER_ID = (index: number) => `yodda-reminder-${index}`;

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
 * Replaces all scheduled daily reminders with one per hour in `hours`
 * (each at minute 0). Pass an empty array to just cancel everything.
 */
export async function scheduleReminders(hours: number[]): Promise<void> {
  await cancelAllReminders();
  if (hours.length === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Promise.all(
    hours.slice(0, MAX_REMINDERS).map((hour, index) =>
      Notifications.scheduleNotificationAsync({
        identifier: REMINDER_ID(index),
        content: {
          title: 'Ready to recall',
          body: 'Take a few minutes to keep them fresh.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      })
    )
  );
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all(
    Array.from({ length: MAX_REMINDERS }, (_, index) =>
      Notifications.cancelScheduledNotificationAsync(REMINDER_ID(index)).catch(() => {})
    )
  );
}

export const isWeb = Platform.OS === 'web';
