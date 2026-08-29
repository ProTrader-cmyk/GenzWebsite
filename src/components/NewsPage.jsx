import Footer from './Footer.jsx';
import Trans from '../i18n/Trans.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function NewsPage({ onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).news;

  return (
    <div className="view active" id="v-news">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">📰</div>
        <div className="empty-title">{t.comingSoonTitle}</div>
        <p className="empty-sub">
          <Trans text={t.comingSoonBody} />
        </p>
      </div>

      <Footer />
    </div>
  );
}
