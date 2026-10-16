import { BackgroundTaskResult } from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { getDueCards, getSetting, setSetting } from '@/db/queries';
import { supabase } from '@/lib/supabase';

export const REMINDER_TASK_NAME = 'yodda-reminder-check';

/**
 * Runs roughly every `minimumInterval` (Android/iOS both treat it as a
 * loose minimum, not a schedule) and only shows a notification when the
 * current hour matches one the user configured, nothing has already
 * fired for that hour today, and there's actually something due — so a
 * reminder never claims there's something to recall when there isn't.
 *
 * Must be defined at module scope (not inside a component) and imported
 * unconditionally from the app's entry point, so it's registered even on
 * a headless background launch. Reads the signed-in user straight from
 * the Supabase client's persisted session — there's no React tree (and
 * no local database) running in this context.
 */
TaskManager.defineTask(REMINDER_TASK_NAME, async () => {
  try {
    if (!supabase) return BackgroundTaskResult.Success;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return BackgroundTaskResult.Success;
    const userId = session.user.id;

    const [onValue, hoursValue] = await Promise.all([getSetting(userId, 'notifOn'), getSetting(userId, 'notifHours')]);
    if (onValue !== '1') return BackgroundTaskResult.Success;

    const hours: number[] = hoursValue ? JSON.parse(hoursValue) : [];
    if (hours.length === 0) return BackgroundTaskResult.Success;

    const now = new Date();
    const currentHour = now.getHours();
    if (!hours.includes(currentHour)) return BackgroundTaskResult.Success;

    const fireKey = `${now.toISOString().slice(0, 10)}-${currentHour}`;
    const lastFired = await getSetting(userId, 'notifLastFired');
    if (lastFired === fireKey) return BackgroundTaskResult.Success;

    const due = await getDueCards(userId, 1);
    if (due.length === 0) return BackgroundTaskResult.Success;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ready to recall',
        body: 'Take a few minutes to keep them fresh.',
      },
      trigger: null,
    });
    await setSetting(userId, 'notifLastFired', fireKey);

    return BackgroundTaskResult.Success;
  } catch {
    return BackgroundTaskResult.Failed;
  }
});
