import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { loadSettings } from '@/data/settings';
import { translate, translatePlural } from '@/i18n/translations';
import { supabase } from './supabase';

const TASK = 'yodda-reminder-check';
const LAST_SENT_KEY = 'yodda.reminder.lastSent';
const isNative = Platform.OS !== 'web';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Sends a reminder if a configured hour has passed today, cards are due, and none was sent yet for that slot. */
export async function checkReminders(): Promise<void> {
  if (!isNative) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const settings = await loadSettings(userId);
  if (!settings.reminder.enabled) return;

  const now = new Date();
  const today = now.toDateString();
  const passed = settings.reminder.hours.filter((h) => h <= now.getHours()).sort((a, b) => a - b);
  const slot = passed[passed.length - 1];
  if (slot === undefined) return;

  const stamp = `${today}#${slot}`;
  if ((await AsyncStorage.getItem(LAST_SENT_KEY)) === stamp) return;

  const { count } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .eq('deleted', false)
    .lte('due_at', now.toISOString());
  if (!count) return;

  await AsyncStorage.setItem(LAST_SENT_KEY, stamp);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(settings.language, 'reminderTitle'),
      body: translatePlural(settings.language, 'reminderBody', count),
    },
    trigger: null,
  });
}

if (isNative) {
  TaskManager.defineTask(TASK, async () => {
    try {
      await checkReminders();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Registers (or removes) the ~15 minute background check to match the reminder setting. */
export async function syncReminderTask(enabled: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (enabled && !registered) await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
    if (!enabled && registered) await BackgroundTask.unregisterTaskAsync(TASK);
  } catch {
    // Background tasks are unavailable in some runtimes (e.g. Expo Go); reminders then fire on app open.
  }
}
