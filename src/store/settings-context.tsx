import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSetting, setSetting } from '@/db/queries';
import { DEFAULT_LANGUAGE, translate, type Language, type TranslationKey } from '@/i18n';
import { useUserId } from '@/store/auth-context';
import { darkColors, lightColors, type Scheme, type ThemeColors } from '@/theme';

const LANGUAGE_KEY = 'language';
const SCHEME_KEY = 'theme';
const REVIEW_ORDER_KEY = 'reviewOrder';
const DEFAULT_SCHEME: Scheme = 'light';
const DEFAULT_REVIEW_ORDER: ReviewOrder = 'question';

export type ReviewOrder = 'question' | 'answer';

interface SettingsContextValue {
  language: Language;
  scheme: Scheme;
  reviewOrder: ReviewOrder;
  colors: ThemeColors;
  loaded: boolean;
  setLanguage: (language: Language) => void;
  setScheme: (scheme: Scheme) => void;
  setReviewOrder: (order: ReviewOrder) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Rendered only once signed in — settings live in Supabase (user_settings
 * table) keyed by user id, same as every other piece of app data. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [scheme, setSchemeState] = useState<Scheme>(DEFAULT_SCHEME);
  const [reviewOrder, setReviewOrderState] = useState<ReviewOrder>(DEFAULT_REVIEW_ORDER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getSetting(userId, LANGUAGE_KEY), getSetting(userId, SCHEME_KEY), getSetting(userId, REVIEW_ORDER_KEY)])
      .then(([lang, sch, order]) => {
        if (!active) return;
        if (lang === 'uz' || lang === 'ru' || lang === 'en') setLanguageState(lang);
        if (sch === 'light' || sch === 'dark') setSchemeState(sch);
        if (order === 'question' || order === 'answer') setReviewOrderState(order);
      })
      .catch(() => {
        // Falls back to defaults already set in state — a settings-load
        // failure shouldn't block the rest of the app from rendering.
      })
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [userId]);

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      setSetting(userId, LANGUAGE_KEY, next).catch(() => {});
    },
    [userId]
  );

  const setScheme = useCallback(
    (next: Scheme) => {
      setSchemeState(next);
      setSetting(userId, SCHEME_KEY, next).catch(() => {});
    },
    [userId]
  );

  const setReviewOrder = useCallback(
    (next: ReviewOrder) => {
      setReviewOrderState(next);
      setSetting(userId, REVIEW_ORDER_KEY, next).catch(() => {});
    },
    [userId]
  );

  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );

  const value: SettingsContextValue = {
    language,
    scheme,
    reviewOrder,
    colors: scheme === 'dark' ? darkColors : lightColors,
    loaded,
    setLanguage,
    setScheme,
    setReviewOrder,
    t,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
