import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { defaultSettings, loadSettings, saveSettings, type UserSettings } from '@/data/settings';
import {
  translate,
  translatePlural,
  type Language,
  type TranslationKey,
} from '@/i18n/translations';
import { palettes, type Palette, type ThemeName } from '@/theme/tokens';
import { useAuth } from './AuthProvider';

type Params = Record<string, string | number>;

interface SettingsValue {
  settings: UserSettings;
  loaded: boolean;
  update(patch: Partial<UserSettings>): void;
  language: Language;
  t(key: TranslationKey, params?: Params): string;
  plural(base: 'cardsDue' | 'units' | 'cards' | 'reviewedCount' | 'reminderBody', n: number): string;
  theme: ThemeName;
  colors: Palette;
  /** Language used before sign-in (not persisted). */
  setPreAuthLanguage(lang: Language): void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(settings);
  latest.current = settings;

  useEffect(() => {
    if (!userId) {
      setLoaded(false);
      return;
    }
    let alive = true;
    // A load failure falls back to in-memory defaults instead of blocking render.
    loadSettings(userId)
      .then((s) => alive && setSettings(s))
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [userId]);

  const update = useCallback(
    (patch: Partial<UserSettings>) => {
      const next = { ...latest.current, ...patch };
      setSettings(next);
      if (userId) saveSettings(userId, next).catch(() => undefined);
    },
    [userId],
  );

  const setPreAuthLanguage = useCallback((language: Language) => {
    setSettings((s) => ({ ...s, language }));
  }, []);

  const value = useMemo<SettingsValue>(() => {
    const language = settings.language;
    return {
      settings,
      loaded,
      update,
      language,
      t: (key, params) => translate(language, key, params),
      plural: (base, n) => translatePlural(language, base, n),
      theme: settings.theme,
      colors: palettes[settings.theme],
      setPreAuthLanguage,
    };
  }, [settings, loaded, update, setPreAuthLanguage]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
