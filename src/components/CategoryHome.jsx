import { useEffect, useRef, useState } from 'react';
import heroVideo from '../assets/Hero.mp4';
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
  SparkleIcon,
  LockIcon,
} from './ui/CategoryIcons.jsx';

function buildCategories(t, approved) {
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
      // Pending (not-yet-approved) accounts see this card locked like a
      // premium one — clicking asks them to contact the admin instead of
      // entering the section.
      pendingLocked: !approved,
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
    {
      id: 'new-product',
      Icon: SparkleIcon,
      title: t.newProductTitle,
      tag: t.comingSoon,
      locked: true,
    },
  ];
}

export default function CategoryHome({ onSelectCategory, approved }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).category;
  const tp = getStrings(lang).pending;
  const CATEGORIES = buildCategories(t, approved);
  const [unlockPrompt, setUnlockPrompt] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const videoRef = useRef(null);

  // Set `muted` imperatively, once, via a stable ref — not as a JSX
  // attribute. `defaultMuted` isn't a real React DOM prop (silently
  // ignored), and a plain `muted` JSX attribute risks React reasserting it;
  // this `useEffect` with an empty dep array runs exactly once on mount,
  // verified to survive later re-renders without re-muting a user's unmute.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, []);

  // Pause the hero video once it's scrolled out of view (and resume when it
  // scrolls back in) instead of letting it keep looping off-screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function handleCardClick(cat) {
    if (cat.premium) {
      setUnlockPrompt(cat);
    } else if (cat.pendingLocked) {
      setShowPendingModal(true);
    } else if (!cat.locked) {
      onSelectCategory(cat.id);
    }
  }

  return (
    <div className="view active" id="v-categories">
      <div className="hero">
        <div className="hero-tag">
          <span></span>
          {t.heroTag}
          <span></span>
        </div>
        <h1>{t.heroTitle}</h1>
        <div className="hero-tagline">
          {t.heroTagline1} <b>{t.heroTagline2}</b>
        </div>
        <div className="hero-video">
          <video ref={videoRef} autoPlay loop playsInline controls>
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
      </div>

      <p className="sec-label sg">{t.chooseSection}</p>

      <div className="cat-grid">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`cat-card${cat.locked ? ' locked' : ''}${cat.premium || cat.pendingLocked ? ' premium' : ''}`}
            onClick={() => handleCardClick(cat)}
          >
            {(cat.premium || cat.pendingLocked) && (
              <div className="cat-lock-badge">
                <LockIcon />
              </div>
            )}
            <div className="cat-icon">
              <cat.Icon />
            </div>
            <div className="cat-title">{cat.title}</div>
            <div className={`cat-tag${cat.locked ? ' locked' : ''}${cat.premium || cat.pendingLocked ? ' premium' : ''}`}>
              {(cat.premium || cat.pendingLocked) && <LockIcon />}
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

      {showPendingModal && (
        <div className="modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{tp.modalTitle}</h3>
            <p className="modal-text">{tp.modalText}</p>
            <button className="modal-btn" onClick={() => setShowPendingModal(false)}>
              {tp.modalOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
