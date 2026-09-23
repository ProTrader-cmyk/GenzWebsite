import { useState } from 'react';
import { advancedLessons } from '../data/advancedLessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// This track is already gated behind VIP at the category-picker level
// (CategoryHome's vipLocked), so every prop here mirrors the
// approved/allowedLessons/isAdmin gating of the other tracks (Technical,
// Apps, Backtest, Psychology) on top of that — same sequential-unlock rule.
export default function AdvancedHome({ doneMap, onSelectLesson, onBack, approved, allowedLessons, isAdmin }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).advanced;
  const tp = getStrings(lang).pending;
  const [modalReason, setModalReason] = useState(null); // 'access' | 'sequence'
  const total = advancedLessons.length;
  const count = Object.keys(doneMap).filter((id) => id.startsWith('adv')).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-advanced">
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

      {advancedLessons.map((lesson, i) => {
        const lockedByAccess = allowedLessons ? !allowedLessons.includes(lesson.id) : !approved;
        const prevLesson = i > 0 ? advancedLessons[i - 1] : null;
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
