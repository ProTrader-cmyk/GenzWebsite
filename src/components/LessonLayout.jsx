import { getLessonEyebrow, getPrevLessonId, getLessonShortLabel } from '../data/lessons.js';
import LessonNav from './ui/LessonNav.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLessonChrome } from '../i18n/lessonStrings.js';

// Shared chrome for every lesson page: back link, header (auto-numbered
// eyebrow + title), body container, and the bottom prev/next nav. The
// prev link and its label are derived automatically from lesson order in
// src/data/lessons.js — individual lesson files only supply their content
// via `children`. See src/pages/Lesson1.jsx.
export default function LessonLayout({ id, title, onNavigate, onDone, nextLabel, nextDisabled = false, children }) {
  const { lang } = useLanguage();
  const c = getLessonChrome(lang);
  const prevId = getPrevLessonId(id);

  return (
    <div className="view active" id={`v-${id}`}>
      <button className="back" onClick={() => onNavigate('home')}>
        {c.backToList}
      </button>
      <div className="lpage">
        <div className="lpage-top">
          <div className="lpage-ey sg">{getLessonEyebrow(id, lang)}</div>
          <h2>{title}</h2>
        </div>
        <div className="lpage-body">
          {children}
          <LessonNav
            prevLabel={prevId ? `← ${getLessonShortLabel(prevId, lang)}` : c.start}
            onPrev={prevId ? () => onNavigate(prevId) : undefined}
            nextLabel={nextLabel ?? c.finishLesson}
            onNext={onDone}
            nextDisabled={nextDisabled}
          />
        </div>
      </div>
    </div>
  );
}
