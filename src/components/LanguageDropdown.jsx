import { LANGUAGES, useLanguage } from '../i18n/LanguageContext.jsx';

export default function LanguageDropdown() {
  const { lang, setLang } = useLanguage();
  return (
    <select className="lang-select sg" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
