"use client";

import { useCallback, useEffect, useState } from "react";
import { type Locale, type Translations, getTranslations, isRTL } from "@/lib/i18n";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lendlog-locale") as Locale | null;
    if (stored) {
      setLocaleState(stored);
      document.documentElement.dir = isRTL(stored) ? "rtl" : "ltr";
      document.documentElement.lang = stored === "darija" ? "ar" : stored;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lendlog-locale", l);
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
    document.documentElement.lang = l === "darija" ? "ar" : l;
  }, []);

  const t: Translations = getTranslations(locale);

  return { locale, setLocale, t, isRTL: isRTL(locale) };
}
