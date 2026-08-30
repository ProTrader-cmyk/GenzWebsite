import { useState } from 'react';
import { lessons } from '../data/lessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Home({ doneMap, onSelectLesson, onBack, approved }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).home;
  const tp = getStrings(lang).pending;
  const [showAccessModal, setShowAccessModal] = useState(false);
  const total = lessons.length;
  const count = Object.keys(doneMap).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-home">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p className={approved ? '' : 'blur-locked'}>{t.subtitle}</p>
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

      {lessons.map((lesson, i) => {
        // A pending (not-yet-approved) account can freely take Lesson 1 as a
        // preview, but every other lesson stays locked until an admin
        // approves them. Once approved, all lessons are open immediately —
        // no progressive one-at-a-time unlocking.
        const locked = !approved && lesson.id !== 'l1';
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
