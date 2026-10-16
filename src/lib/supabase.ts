import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * `expo export -p web`'s static rendering pass runs each route through
 * Node (no `window`) to pre-render HTML, before any client hydration.
 * GoTrueClient reads session storage synchronously as soon as the client
 * is constructed, so an unguarded AsyncStorage (its web implementation
 * reaches into `window.localStorage`) crashes that entire export step.
 * Short-circuit to a no-op outside a real browser instead.
 */
const ssrSafeStorage = {
  getItem: (key: string) => (typeof window === 'undefined' ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) => (typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.setItem(key, value)),
  removeItem: (key: string) => (typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.removeItem(key)),
};

/**
 * Supabase is the app's only data store — there is no local/offline mode.
 * A build without these env vars set can't do anything; the root layout
 * shows a configuration-required screen instead of rendering the app.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: ssrSafeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
