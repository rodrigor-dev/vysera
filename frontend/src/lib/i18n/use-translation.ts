import { useSyncExternalStore, useCallback } from "react";
import { translations, getLocale, type Locale } from "./translations";

let currentLocale: Locale = "en";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return currentLocale;
}

function emitChange() {
  listeners.forEach((l) => l());
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    localStorage.setItem("vysera-locale", locale);
  } catch {}
  emitChange();
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => "en") as Locale;

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations.en?.[key] ?? key;
    },
    [locale],
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
  }, []);

  return { t, locale, changeLocale, setLocale: changeLocale };
}

export { getLocale, type Locale };
