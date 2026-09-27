import { BackgroundTaskResult } from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { getDatabase } from '@/db/client';
import { getDueCards, getSetting, setSetting } from '@/db/queries';

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
 * a headless background launch.
 */
TaskManager.defineTask(REMINDER_TASK_NAME, async () => {
  try {
    const db = await getDatabase();
    const [onValue, hoursValue] = await Promise.all([getSetting(db, 'notifOn'), getSetting(db, 'notifHours')]);
    if (onValue !== '1') return BackgroundTaskResult.Success;

    const hours: number[] = hoursValue ? JSON.parse(hoursValue) : [];
    if (hours.length === 0) return BackgroundTaskResult.Success;

    const now = new Date();
    const currentHour = now.getHours();
    if (!hours.includes(currentHour)) return BackgroundTaskResult.Success;

    const fireKey = `${now.toISOString().slice(0, 10)}-${currentHour}`;
    const lastFired = await getSetting(db, 'notifLastFired');
    if (lastFired === fireKey) return BackgroundTaskResult.Success;

    const due = await getDueCards(db, 1);
    if (due.length === 0) return BackgroundTaskResult.Success;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ready to recall',
        body: 'Take a few minutes to keep them fresh.',
      },
      trigger: null,
    });
    await setSetting(db, 'notifLastFired', fireKey);

    return BackgroundTaskResult.Success;
  } catch {
    return BackgroundTaskResult.Failed;
  }
});
