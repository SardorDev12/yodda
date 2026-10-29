import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface AppConfig {
  minVersion: string;
  latestVersion: string;
  updateUrl: string | null;
  message: string | null;
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  const { data, error } = await supabase.from('app_config').select('*').eq('platform', Platform.OS).maybeSingle();
  if (error || !data) return null;
  return {
    minVersion: data.min_version,
    latestVersion: data.latest_version,
    updateUrl: data.update_url,
    message: data.message,
  };
}
