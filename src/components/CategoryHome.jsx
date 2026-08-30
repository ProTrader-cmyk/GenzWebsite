import { useState } from 'react';
import logo from '../assets/logo.jpg';
import Footer from './Footer.jsx';
import Trans from '../i18n/Trans.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import {
  CandleChartIcon,
  BrainIcon,
  AppWindowIcon,
  BacktestIcon,
  AdvancedChartIcon,
  LockIcon,
} from './ui/CategoryIcons.jsx';

function buildCategories(t) {
  return [
    {
      id: 'apps',
      Icon: AppWindowIcon,
      title: t.appsTitle,
      tag: t.appsLessonsCount,
      locked: false,
    },
    {
      id: 'technical',
      Icon: CandleChartIcon,
      title: t.technicalTitle,
      tag: t.lessonsCount,
      locked: false,
    },
    {
      id: 'psychology',
      Icon: BrainIcon,
      title: t.psychologyTitle,
      tag: t.comingSoon,
      locked: true,
    },
    {
      id: 'backtest',
      Icon: BacktestIcon,
      title: t.backtestTitle,
      tag: t.comingSoon,
      locked: true,
    },
    {
      id: 'advanced',
      Icon: AdvancedChartIcon,
      title: t.advancedTitle,
      tag: t.comingSoon,
      locked: false,
      premium: true,
    },
  ];
}

export default function CategoryHome({ onSelectCategory }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).category;
  const CATEGORIES = buildCategories(t);
  const [unlockPrompt, setUnlockPrompt] = useState(null);

  function handleCardClick(cat) {
    if (cat.premium) {
      setUnlockPrompt(cat);
    } else if (!cat.locked) {
      onSelectCategory(cat.id);
    }
  }

  return (
    <div className="view active" id="v-categories">
      <div className="hero">
        <div className="hero-logo">
          <img src={logo} alt="GenZ Trader — Veng Sophea" />
        </div>
        <div className="hero-tag">
          <span></span>
          {t.heroTag}
          <span></span>
        </div>
        <h1>{t.heroTitle}</h1>
        <div className="hero-tagline">
          {t.heroTagline1} <b>{t.heroTagline2}</b>
        </div>
        <p className="hero-sub">
          {t.heroSubPrefix} <strong style={{ color: 'var(--text)' }}>Veng Sophea</strong> {t.heroSubSuffix}
        </p>
      </div>

      <p className="sec-label sg">{t.chooseSection}</p>

      <div className="cat-grid">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`cat-card${cat.locked ? ' locked' : ''}${cat.premium ? ' premium' : ''}`}
            onClick={() => handleCardClick(cat)}
          >
            {cat.premium && (
              <div className="cat-lock-badge">
                <LockIcon />
              </div>
            )}
            <div className="cat-icon">
              <cat.Icon />
            </div>
            <div className="cat-title">{cat.title}</div>
            <div className={`cat-tag${cat.locked ? ' locked' : ''}${cat.premium ? ' premium' : ''}`}>
              {cat.premium && <LockIcon />}
              {cat.tag}
            </div>
          </div>
        ))}
      </div>

      <Footer />

      {unlockPrompt && (
        <div className="modal-overlay" onClick={() => setUnlockPrompt(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{unlockPrompt.title}</h3>
            <p className="modal-text">
              <Trans text={t.premiumText} />
            </p>
            <button className="modal-btn" onClick={() => setUnlockPrompt(null)}>
              {t.premiumOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
