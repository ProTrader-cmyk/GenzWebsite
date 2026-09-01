import { useState } from 'react';
import { backtestLessons } from '../data/backtestLessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Every lesson stays locked until the account is approved (by an admin, or
// by paying on the Pricing page) — same rule as Technical/Apps. An
// admin-set permissions list (allowedLessons) overrides this entirely for
// a specific account.
export default function BacktestHome({ doneMap, onSelectLesson, onBack, approved, allowedLessons }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).backtest;
  const tp = getStrings(lang).pending;
  const [showAccessModal, setShowAccessModal] = useState(false);
  const total = backtestLessons.length;
  const count = Object.keys(doneMap).filter((id) => id.startsWith('bt')).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-backtest-home">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <div id="prog-outer" style={{ display: showProgress ? 'block' : 'none' }}>
        <div className="prog-info">
          <span>{t.progress}</span>
          <span>
            {count} / {total}
          </span>
        </div>
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: pct + '%' }}></div>
        </div>
      </div>

      <p className="sec-label sg" style={{ marginTop: 8 }}>
        {t.lessonsLabel}
      </p>

      {backtestLessons.map((lesson, i) => {
        const locked = allowedLessons ? !allowedLessons.includes(lesson.id) : !approved;
        return (
          <LessonCard
            key={lesson.id}
            index={i + 1}
            lesson={lesson}
            done={!!doneMap[lesson.id]}
            locked={locked}
            lockedTitle={tp.lessonLockedTitle}
            lockedReason={tp.lessonLockedReason}
            onClick={() => {
              if (locked) {
                setShowAccessModal(true);
                return;
              }
              onSelectLesson(lesson.id);
            }}
          />
        );
      })}

      <Footer />

      {showAccessModal && (
        <div className="modal-overlay" onClick={() => setShowAccessModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{tp.modalTitle}</h3>
            <p className="modal-text">{tp.modalText}</p>
            <button className="modal-btn" onClick={() => setShowAccessModal(false)}>
              {tp.modalOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
