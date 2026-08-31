import { useState } from 'react';
import Footer from './Footer.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL;

// Static ABA PayWay checkout link — same URL for every user, since it's not
// generated per-transaction via the PayWay API. There's no way to verify a
// payment actually happened through it, so clicking "Pay" grants access
// immediately (honor system) via POST /api/payment/claim — a deliberate,
// known trade-off accepted in place of building real ABA API verification.
const PAYWAY_LINK = 'https://link.payway.com.kh/ABAPAYD0512524C';

export default function PricingPage({ onBack, user }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).pricing;
  // idle | granting | granted | error
  const [status, setStatus] = useState('idle');

  async function handlePayClick() {
    setStatus('granting');
    try {
      const res = await fetch(`${NEWS_API_URL}/api/payment/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="view active" id="v-pricing">
      {onBack && (
        <button className="back" onClick={onBack}>
          {t.back}
        </button>
      )}

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="price-card">
        <div className="price-badge">{t.priceBadge}</div>
        <div className="price-amount">
          {t.priceAmount}
          <span className="price-period">{t.pricePeriod}</span>
        </div>
        <p className="price-note">{t.priceNote}</p>

        <div className="price-features">
          <div className="price-features-title">{t.featuresTitle}</div>
          <ul className="price-features-list">
            <li>{t.feature1}</li>
            <li>{t.feature2}</li>
            <li>{t.feature3}</li>
            <li>{t.feature4}</li>
          </ul>
        </div>

        <a
          className="price-pay-btn"
          href={PAYWAY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handlePayClick}
        >
          {t.payBtn}
        </a>

        {status === 'granting' && <p className="price-note">{t.granting}</p>}

        {status === 'granted' && (
          <>
            <p className="price-note">{t.successBody}</p>
            <button className="price-pay-btn" onClick={() => window.location.reload()}>
              {t.refresh}
            </button>
          </>
        )}

        {status === 'error' && <p className="price-note price-note-warn">{t.errorGeneric}</p>}
      </div>

      <Footer />
    </div>
  );
}
