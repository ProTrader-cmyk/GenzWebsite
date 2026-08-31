import Footer from './Footer.jsx';
import { TelegramIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';
const MENTORSHIP_URL = 'https://t.me/veng_sophea';

export default function ContactPage({ onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).contact;
  const tn = getStrings(lang).nav;

  return (
    <div className="view active" id="v-contact">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="contact-card">
        <div className="contact-icon">
          <TelegramIcon />
        </div>
        <div className="contact-info">
          <div className="contact-label">{t.telegramLabel}</div>
          <div className="contact-value">GenZ Trader</div>
        </div>
        <div className="contact-go">→</div>
      </a>

      <a href={MENTORSHIP_URL} target="_blank" rel="noopener noreferrer" className="contact-card">
        <div className="contact-icon">
          <TelegramIcon />
        </div>
        <div className="contact-info">
          <div className="contact-label">{t.telegramLabel}</div>
          <div className="contact-value">{tn.mentorship}</div>
        </div>
        <div className="contact-go">→</div>
      </a>

      <Footer />
    </div>
  );
}
