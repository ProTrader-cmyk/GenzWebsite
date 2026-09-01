import { useEffect, useRef, useState } from 'react';
import Footer from './Footer.jsx';
import { auth } from '../firebase.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL;
const WAIT_SECONDS = 20;

// Static ABA PayWay checkout link — same URL for every user, since it's not
// generated per-transaction via the PayWay API. There's no way to verify a
// payment actually happened through it, so clicking "Pay" grants access
// immediately (honor system) via POST /api/payment/claim — a deliberate,
// known trade-off accepted in place of building real ABA API verification.
const PAYWAY_LINK = 'https://link.payway.com.kh/ABAPAYD0512524C';
// Same Telegram contact as ContactPage.jsx — repeated here (not reachable
// via nav on this locked-down gate) so an account that can't/won't pay
// still has a way to reach an admin for manual access.
const TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';

export default function PricingPage({ onBack, onPay }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).pricing;
  const [waiting, setWaiting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const tickRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // Fires the (currently unconfigured — needs FIREBASE_SERVICE_ACCOUNT_JSON
  // on the backend) real access grant in the background. Regardless of
  // that outcome, after a WAIT_SECONDS pause (giving them time to actually
  // pay in the ABA tab that opened), onPay() takes them into the site —
  // everything still stays locked, since `approved` itself is untouched by
  // this — see App.jsx. Sends the caller's own Firebase ID token rather
  // than a plain uid — the backend verifies it server-side so this can
  // only ever grant access to the signed-in account making the request.
  async function handlePayClick() {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        fetch(`${NEWS_API_URL}/api/payment/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        }).catch(() => {});
      }
    } catch {
      // fire-and-forget either way — the wait below still proceeds
    }

    setWaiting(true);
    setSecondsLeft(WAIT_SECONDS);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    timeoutRef.current = setTimeout(() => {
      clearInterval(tickRef.current);
      onPay?.();
    }, WAIT_SECONDS * 1000);
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

        {!waiting && (
          <a
            className="price-pay-btn"
            href={PAYWAY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePayClick}
          >
            {t.payBtn}
          </a>
        )}

        {waiting && (
          <div className="price-waiting">
            <span className="price-spinner"></span>
            {t.granting} ({secondsLeft}s)
          </div>
        )}
      </div>

      <p className="price-note" style={{ textAlign: 'center', marginTop: 16 }}>
        {t.contactNote}{' '}
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold2)', fontWeight: 600 }}
        >
          {t.contactLink} →
        </a>
      </p>

      <Footer />
    </div>
  );
}
