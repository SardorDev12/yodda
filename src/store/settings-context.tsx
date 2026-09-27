import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSetting, setSetting } from '@/db/queries';
import { DEFAULT_LANGUAGE, translate, type Language, type TranslationKey } from '@/i18n';
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [scheme, setSchemeState] = useState<Scheme>(DEFAULT_SCHEME);
  const [reviewOrder, setReviewOrderState] = useState<ReviewOrder>(DEFAULT_REVIEW_ORDER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getSetting(db, LANGUAGE_KEY), getSetting(db, SCHEME_KEY), getSetting(db, REVIEW_ORDER_KEY)]).then(
      ([lang, sch, order]) => {
        if (!active) return;
        if (lang === 'uz' || lang === 'ru' || lang === 'en') setLanguageState(lang);
        if (sch === 'light' || sch === 'dark') setSchemeState(sch);
        if (order === 'question' || order === 'answer') setReviewOrderState(order);
        setLoaded(true);
      }
    );
    return () => {
      active = false;
    };
  }, [db]);

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      setSetting(db, LANGUAGE_KEY, next).catch(() => {});
    },
    [db]
  );

  const setScheme = useCallback(
    (next: Scheme) => {
      setSchemeState(next);
      setSetting(db, SCHEME_KEY, next).catch(() => {});
    },
    [db]
  );

  const setReviewOrder = useCallback(
    (next: ReviewOrder) => {
      setReviewOrderState(next);
      setSetting(db, REVIEW_ORDER_KEY, next).catch(() => {});
    },
    [db]
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
