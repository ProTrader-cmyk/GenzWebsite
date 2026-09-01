import { useState } from 'react';
import { psychologyLessons } from '../data/psychologyLessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';
import BookCard from './ui/BookCard.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Every lesson stays locked until the account is approved (by an admin, or
// by paying on the Pricing page) — same rule as Technical/Apps/Backtest.
// Once approved, lessons unlock one at a time in order. An admin-set
// permissions list (allowedLessons) overrides both rules entirely for a
// specific account.
export default function PsychologyHome({ doneMap, onSelectLesson, onBack, approved, allowedLessons, isAdmin }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).psychology;
  const tp = getStrings(lang).pending;
  const [modalReason, setModalReason] = useState(null); // 'access' | 'sequence'
  const total = psychologyLessons.length;
  const count = Object.keys(doneMap).filter((id) => id.startsWith('psy')).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-psychology-home">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <BookCard title={t.bookTitle} author={t.bookAuthor} style={{ margin: '14px 0' }} />

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

      {psychologyLessons.map((lesson, i) => {
        const lockedByAccess = allowedLessons ? !allowedLessons.includes(lesson.id) : !approved;
        const prevLesson = i > 0 ? psychologyLessons[i - 1] : null;
        const lockedBySequence = !isAdmin && !allowedLessons && !lockedByAccess && prevLesson && !doneMap[prevLesson.id];
        const locked = lockedByAccess || lockedBySequence;
        return (
          <LessonCard
            key={lesson.id}
            index={i + 1}
            lesson={lesson}
            done={!!doneMap[lesson.id]}
            locked={locked}
            lockedTitle={tp.lessonLockedTitle}
            lockedReason={lockedBySequence ? tp.sequentialLockedReason : tp.lessonLockedReason}
            onClick={() => {
              if (locked) {
                setModalReason(lockedBySequence ? 'sequence' : 'access');
                return;
              }
              onSelectLesson(lesson.id);
            }}
          />
        );
      })}

      <Footer />

      {modalReason && (
        <div className="modal-overlay" onClick={() => setModalReason(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{tp.modalTitle}</h3>
            <p className="modal-text">{modalReason === 'sequence' ? tp.sequentialModalText : tp.modalText}</p>
            <button className="modal-btn" onClick={() => setModalReason(null)}>
              {tp.modalOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
