import { useState } from 'react';
import { appsLessons } from '../data/appsLessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// The Apps track has no approval gate by default — every lesson is open to
// any logged-in user as soon as they click into this category. An
// admin-set permissions list (allowedLessons) can still restrict specific
// lessons for a specific account, same as the Technical track.
export default function AppsHome({ doneMap, onSelectLesson, onBack, allowedLessons }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).apps;
  const tp = getStrings(lang).pending;
  const [showAccessModal, setShowAccessModal] = useState(false);
  const total = appsLessons.length;
  const count = Object.keys(doneMap).filter((id) => id.startsWith('a')).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-apps-home">
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

      {appsLessons.map((lesson, i) => {
        const locked = allowedLessons ? !allowedLessons.includes(lesson.id) : false;
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
