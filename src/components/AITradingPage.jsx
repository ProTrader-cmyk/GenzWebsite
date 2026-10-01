import { useEffect, useState } from 'react';
import Footer from './Footer.jsx';
import BakongPaymentModal from './BakongPaymentModal.jsx';
import { TelegramIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { getPackages } from '../data/payments.js';

const TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';

// PLACEHOLDER — replace with the real, public Myfxbook (or equivalent)
// verified track-record link before launch.
const MYFXBOOK_URL = 'https://www.myfxbook.com/';

const PAYMENT_LOGOS = ['Bakong KHQR', 'ABA Mobile', 'ACLEDA', 'Wing Bank', 'Canadia'];

// Hidden for now -- the track record link, testimonials, and payment logos
// are still all placeholders (see the "Placeholders to replace" list).
// Flip back to true once real data is in.
const SHOW_PROOF_STRIP = false;

// Feature lists intentionally don't repeat across tiers — Pro/Elite each
// start with an "Everything in [plan]" line instead, so VIP Signal Group
// access (only spelled out once, under Starter) still applies to every
// tier without the same line being printed three times.
function buildPlans(t) {
  return [
    {
      id: 'starter',
      name: t.starterName,
      tag: t.starterTag,
      audience: t.starterAudience,
      monthlyPrice: t.starterMonthlyPrice,
      yearlyPrice: t.starterYearlyPrice,
      features: [
        t.vipSignalGroup,
        t.starterFeature1,
        t.starterFeature2,
        t.starterFeature3,
        t.starterFeature4,
        t.starterFeature5,
      ],
      cta: t.starterCta,
      popular: false,
    },
    {
      id: 'pro',
      name: t.proName,
      tag: t.proTag,
      audience: t.proAudience,
      monthlyPrice: t.proMonthlyPrice,
      yearlyPrice: t.proYearlyPrice,
      features: [t.proFeature1, t.proFeature2, t.proFeature3, t.proFeature4, t.proFeature5, t.proFeature6],
      cta: t.proCta,
      popular: true,
    },
    {
      id: 'elite',
      name: t.eliteName,
      tag: t.eliteTag,
      audience: t.eliteAudience,
      monthlyPrice: t.eliteMonthlyPrice,
      yearlyPrice: t.eliteYearlyPrice,
      features: [t.eliteFeature1, t.eliteFeature2, t.eliteFeature3, t.eliteFeature4, t.eliteFeature5],
      cta: t.eliteCta,
      popular: false,
    },
  ];
}

function buildFaqItems(t) {
  return [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 },
    { q: t.faqQ6, a: t.faqA6 },
  ];
}

function buildTestimonials(t) {
  return [
    { name: t.testimonial1Name, text: t.testimonial1Text },
    { name: t.testimonial2Name, text: t.testimonial2Text },
    { name: t.testimonial3Name, text: t.testimonial3Text },
  ];
}

export default function AITradingPage({ onBack, user, onActivated }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).aiTrading;
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlan, setSelectedPlan] = useState(null); // plan object while its modal is open
  const [openFaq, setOpenFaq] = useState(null); // index of the open FAQ item, or null
  const [packageCatalog, setPackageCatalog] = useState({});
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  async function loadPackageCatalog() {
    setCatalogLoaded(false);
    setCatalogError('');
    try {
      const { packages } = await getPackages();
      setPackageCatalog(Object.fromEntries(packages.map((item) => [item.id, item])));
    } catch (error) {
      setPackageCatalog({});
      setCatalogError(error.message || 'Could not load packages.');
    } finally {
      setCatalogLoaded(true);
    }
  }
  useEffect(() => {
    loadPackageCatalog();
  }, []);
  const plans = buildPlans(t);
  const faqItems = buildFaqItems(t);
  const testimonials = buildTestimonials(t);
  const period = billing === 'yearly' ? t.periodYearly : t.periodMonthly;

  return (
    <div className="view active" id="v-ai-trading">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="billing-toggle" role="group" aria-label="Billing period">
        <button
          type="button"
          className={`billing-toggle-btn${billing === 'monthly' ? ' active' : ''}`}
          aria-pressed={billing === 'monthly'}
          onClick={() => setBilling('monthly')}
        >
          {t.billingMonthly}
        </button>
        <button
          type="button"
          className={`billing-toggle-btn${billing === 'yearly' ? ' active' : ''}`}
          aria-pressed={billing === 'yearly'}
          onClick={() => setBilling('yearly')}
        >
          {t.billingYearly}
          <span className="billing-yearly-badge">{t.billingYearlyBadge}</span>
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card${plan.popular ? ' plan-popular' : ''}`}>
            {plan.popular && <div className="plan-popular-badge">{t.popularBadge}</div>}
            <div className="plan-tag">{plan.tag}</div>
            <div className="plan-name">{plan.name}</div>
            <div className="plan-audience">{plan.audience}</div>
            <div className="plan-price">
              {packageCatalog[plan.id]
                ? `$${Number(packageCatalog[plan.id].billing[billing].amount).toFixed(2)}`
                : (billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice)}
              <span className="plan-period">{period}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`plan-cta-btn${plan.popular ? ' plan-cta-primary' : ''}`}
              disabled={!catalogLoaded || !packageCatalog[plan.id]?.billing?.[billing]}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
      {catalogError && (
        <div className="bakong-error-text" role="alert" style={{ textAlign: 'center', marginTop: 16 }}>
          <p>Packages could not load: {catalogError}</p>
          <button type="button" className="plan-cta-btn" onClick={loadPackageCatalog}>Retry</button>
        </div>
      )}
      <p className="plan-cancel-note">{t.cancelNote}</p>

      {/* ===== BAKONG KHQR ACCEPTANCE STRIP ===== */}
      <div className="payment-logos-row" style={{ marginTop: 20, marginBottom: 16 }}>
        <span className="payment-logos-label">{t.paymentLogosLabel || 'We accept:'}</span>
        {PAYMENT_LOGOS.map((logo) => (
          <span key={logo} className="payment-badge">
            {logo}
          </span>
        ))}
      </div>

      {/* ===== PROOF STRIP ===== */}
      {SHOW_PROOF_STRIP && (
        <div className="proof-strip">
          <a href={MYFXBOOK_URL} target="_blank" rel="noopener noreferrer" className="proof-track-btn">
            {t.proofTrackBtn}
          </a>

          <p className="sec-label sg" style={{ marginTop: 28 }}>
            {t.testimonialsHeading}
          </p>
          <div className="testimonials-grid">
            {testimonials.map((tm, i) => (
              <div key={i} className="testimonial-card">
                <p className="testimonial-text">{tm.text}</p>
                <div className="testimonial-name">{tm.name}</div>
              </div>
            ))}
          </div>

          <div className="payment-logos-row">
            <span className="payment-logos-label">{t.paymentLogosLabel}</span>
            {PAYMENT_LOGOS.map((logo) => (
              <span key={logo} className="payment-badge">
                {logo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <h3 style={{ marginTop: 32 }}>
        <span className="bar"></span>
        {t.faqHeading}
      </h3>
      <div className="faq-list">
        {faqItems.map((item, i) => {
          const isOpen = openFaq === i;
          return (
            <div key={i} className={`faq-item${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => setOpenFaq(isOpen ? null : i)}
              >
                {item.q}
                <span className="faq-chevron">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="faq-answer">{item.a}</p>}
            </div>
          );
        })}
      </div>

      <p className="ait-disclaimer">{t.disclaimer}</p>

      <Footer />

      {selectedPlan && (
        <BakongPaymentModal
          plan={selectedPlan}
          billing={billing}
          user={user}
          onClose={() => setSelectedPlan(null)}
          onActivated={(plan) => {
            if (onActivated) onActivated(plan);
          }}
        />
      )}
    </div>
  );
}
