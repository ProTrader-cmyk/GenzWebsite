import { createContext, useContext, useEffect, useState } from 'react';

const LANG_KEY = 'gzt_lang';
export const LANGUAGES = [
  { code: 'kh', label: 'KH' },
  { code: 'zh', label: 'CH' },
  { code: 'en', label: 'EN' },
];

const LanguageContext = createContext(null);

function loadLang() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  return LANGUAGES.some((l) => l.code === saved) ? saved : 'kh';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(loadLang);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
