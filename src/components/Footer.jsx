import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Footer() {
  const { lang } = useLanguage();
  const t = getStrings(lang).footer;
  return (
    <footer>
      {t.line1}
      <br />
      {t.line2}
    </footer>
  );
}
