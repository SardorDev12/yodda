import { supabase } from '@/lib/supabase';
import { defaultLanguage, type Language } from '@/i18n/translations';
import type { ThemeName } from '@/theme/tokens';

export interface ReminderSettings {
  enabled: boolean;
  /** 1–3 reminders per day, each with an hour (0–23). */
  hours: number[];
}

export interface UserSettings {
  language: Language;
  theme: ThemeName;
  reviewOrder: 'question' | 'answer';
  reminder: ReminderSettings;
}

export const defaultSettings: UserSettings = {
  language: defaultLanguage,
  theme: 'light',
  reviewOrder: 'question',
  reminder: { enabled: false, hours: [9] },
};

export function mergeSettings(raw: unknown): UserSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<UserSettings>;
  const hours = Array.isArray(r.reminder?.hours)
    ? r.reminder!.hours.filter((h) => Number.isInteger(h) && h >= 0 && h <= 23).slice(0, 3)
    : [];
  return {
    language: r.language && ['uz', 'ru', 'en'].includes(r.language) ? r.language : defaultSettings.language,
    theme: r.theme === 'dark' ? 'dark' : 'light',
    reviewOrder: r.reviewOrder === 'answer' ? 'answer' : 'question',
    reminder: {
      enabled: Boolean(r.reminder?.enabled),
      hours: hours.length ? hours : defaultSettings.reminder.hours,
    },
  };
}

export async function loadSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return mergeSettings(data?.settings);
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() });
  if (error) throw error;
}
