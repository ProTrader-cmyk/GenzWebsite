import { useEffect, useRef, useState } from 'react';
import { useVideos } from '../data/useVideos.js';
import Footer from './Footer.jsx';
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
      // Pending (not-yet-approved/paid) accounts see this card locked like a
      // premium one — clicking asks them to contact the admin or pay
      // instead of entering the section.
      pendingLocked: !approved,
    },
    {
      id: 'technical',
      Icon: CandleChartIcon,
      title: t.technicalTitle,
      tag: t.lessonsCount,
      locked: false,
      pendingLocked: !approved,
    },
    {
      id: 'psychology',
      Icon: BrainIcon,
      title: t.psychologyTitle,
      tag: t.psychologyLessonsCount,
      locked: false,
      pendingLocked: !approved,
    },
    {
      id: 'backtest',
      Icon: BacktestIcon,
      title: t.backtestTitle,
      tag: t.backtestLessonsCount,
      locked: false,
      pendingLocked: !approved,
    },
    {
      id: 'advanced',
      Icon: AdvancedChartIcon,
      title: t.advancedTitle,
      tag: t.comingSoon,
      locked: false,
      pendingLocked: !approved,
    },
    {
      id: 'new-product',
      Icon: SparkleIcon,
      title: t.newProductTitle,
      tag: t.newProductTag,
      locked: false,
      pendingLocked: !approved,
    },
  ];
}

export default function CategoryHome({ onSelectCategory, approved }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).category;
  const tp = getStrings(lang).pending;
  const CATEGORIES = buildCategories(t, approved);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const videoRef = useRef(null);
  const { videos } = useVideos();
  const heroVideo = videos.hero?.url;

  // Set `muted` imperatively, once per video element, via a stable ref —
  // not as a JSX attribute. `defaultMuted` isn't a real React DOM prop
  // (silently ignored), and a plain `muted` JSX attribute risks React
  // reasserting it. Depends on `heroVideo` because the <video> only mounts
  // once the URL has loaded from Firestore — without that, this effect (an
  // empty-deps version, verified to survive later re-renders without
  // re-muting a user's unmute) would run before the element exists.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, [heroVideo]);

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
  }, [heroVideo]);

  function handleCardClick(cat) {
    if (cat.pendingLocked) {
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
        {heroVideo && (
          <div className="hero-video">
            <video
              ref={videoRef}
              autoPlay
              loop
              playsInline
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          </div>
        )}
      </div>

      <p className="sec-label sg">{t.chooseSection}</p>

      <div className="cat-grid">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`cat-card${cat.locked ? ' locked' : ''}${cat.pendingLocked ? ' premium' : ''}`}
            onClick={() => handleCardClick(cat)}
          >
            {cat.pendingLocked && (
              <div className="cat-lock-badge">
                <LockIcon />
              </div>
            )}
            <div className="cat-icon">
              <cat.Icon />
            </div>
            <div className="cat-title">{cat.title}</div>
            <div className={`cat-tag${cat.locked ? ' locked' : ''}${cat.pendingLocked ? ' premium' : ''}`}>
              {cat.pendingLocked && <LockIcon />}
              {cat.tag}
            </div>
          </div>
        ))}
      </div>

      <Footer />

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
