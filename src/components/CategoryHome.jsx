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
  TelegramIcon,
} from './ui/CategoryIcons.jsx';

// Same Telegram contact as ContactPage.jsx/PricingPage.jsx — repeated here
// so a pending user can reach an admin straight from the lock modals below.
const TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';

function buildCategories(t, approved, isVip) {
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
      tag: t.vipTag,
      locked: false,
      pendingLocked: !approved,
      // On top of the normal approved-gate, this track also needs VIP tier —
      // only relevant once the account is already approved.
      vipLocked: approved && !isVip,
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

export default function CategoryHome({ onSelectCategory, approved, isVip, noticeTick }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).category;
  const tp = getStrings(lang).pending;
  const CATEGORIES = buildCategories(t, approved, isVip);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
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

  // Pending (not-yet-approved) accounts see the "contact admin" modal right
  // away, every time they land on the category picker — not just when they
  // click a locked card — since there's no other automatic gate anymore
  // (the old forced Pricing-page redirect on first sign-up was removed).
  // `noticeTick` also re-opens it when a blocked nav item (e.g. News) is
  // clicked while already sitting on this screen, where switching `section`
  // back to 'categories' is otherwise a no-op that wouldn't re-trigger this.
  useEffect(() => {
    if (!approved) setShowPendingModal(true);
  }, [approved, noticeTick]);

  function handleCardClick(cat) {
    if (cat.pendingLocked) {
      setShowPendingModal(true);
    } else if (cat.vipLocked) {
      setShowVipModal(true);
    } else if (!cat.locked) {
      onSelectCategory(cat.id);
    }
  }

  // While pending, only the section label and track cards are blurred —
  // the hero video and footer stay visible as normal.
  const blurPending = !approved ? ' pending-blur' : '';

  return (
    <div className="view active" id="v-categories">
      <div className="hero">
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

      <p className={`sec-label sg${blurPending}`}>{t.chooseSection}</p>

      <div className={`cat-grid${blurPending}`}>
        {CATEGORIES.map((cat) => {
          const showLock = cat.pendingLocked || cat.vipLocked;
          return (
            <div
              key={cat.id}
              className={`cat-card${cat.locked ? ' locked' : ''}${showLock ? ' premium' : ''}`}
              onClick={() => handleCardClick(cat)}
            >
              {showLock && (
                <div className="cat-lock-badge">
                  <LockIcon />
                </div>
              )}
              <div className="cat-icon">
                <cat.Icon />
              </div>
              <div className="cat-title">{cat.title}</div>
              <div className={`cat-tag${cat.locked ? ' locked' : ''}${showLock ? ' premium' : ''}`}>
                {showLock && <LockIcon />}
                {cat.tag}
              </div>
            </div>
          );
        })}
      </div>

      <Footer />

      {showPendingModal && (
        <div className="modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              aria-label={tp.close}
              onClick={() => setShowPendingModal(false)}
            >
              ×
            </button>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{tp.modalTitle}</h3>
            <p className="modal-text">{tp.modalText}</p>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="modal-telegram-link">
              <TelegramIcon width="16" height="16" />
              {tp.telegramLinkLabel}
            </a>
          </div>
        </div>
      )}

      {showVipModal && (
        <div className="modal-overlay" onClick={() => setShowVipModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              aria-label={tp.close}
              onClick={() => setShowVipModal(false)}
            >
              ×
            </button>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{tp.vipModalTitle}</h3>
            <p className="modal-text">{tp.vipModalText}</p>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="modal-telegram-link">
              <TelegramIcon width="16" height="16" />
              {tp.telegramLinkLabel}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
