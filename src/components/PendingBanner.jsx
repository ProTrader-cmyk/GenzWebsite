import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function PendingBanner({ name }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).pending;
  return <div className="pending-banner sg">{t.banner(name)}</div>;
}
