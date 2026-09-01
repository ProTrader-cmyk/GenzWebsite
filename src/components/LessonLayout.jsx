import { getLessonEyebrow, getPrevLessonId, getLessonShortLabel } from '../data/lessons.js';
import { getAppsLessonEyebrow, getPrevAppsLessonId, getAppsLessonShortLabel } from '../data/appsLessons.js';
import {
  getBacktestLessonEyebrow,
  getPrevBacktestLessonId,
  getBacktestLessonShortLabel,
} from '../data/backtestLessons.js';
import {
  getPsychologyLessonEyebrow,
  getPrevPsychologyLessonId,
  getPsychologyLessonShortLabel,
} from '../data/psychologyLessons.js';
import LessonNav from './ui/LessonNav.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLessonChrome } from '../i18n/lessonStrings.js';

// Shared chrome for every lesson page: back link, header (auto-numbered
// eyebrow + title), body container, and the bottom prev/next nav. The prev
// link and its label are derived automatically from lesson order in
// src/data/lessons.js (`track="technical"`, the default),
// src/data/appsLessons.js (`track="apps"`), src/data/backtestLessons.js
// (`track="backtest"`), or src/data/psychologyLessons.js
// (`track="psychology"`) — individual lesson files only supply their
// content via `children`. See src/pages/Lesson1.jsx.
export default function LessonLayout({
  id,
  track = 'technical',
  title,
  onNavigate,
  onDone,
  nextLabel,
  nextDisabled = false,
  children,
}) {
  const { lang } = useLanguage();
  const c = getLessonChrome(lang);

  let prevId, eyebrow, prevShortLabel;
  if (track === 'apps') {
    prevId = getPrevAppsLessonId(id);
    eyebrow = getAppsLessonEyebrow(id, lang);
    prevShortLabel = getAppsLessonShortLabel;
  } else if (track === 'backtest') {
    prevId = getPrevBacktestLessonId(id);
    eyebrow = getBacktestLessonEyebrow(id, lang);
    prevShortLabel = getBacktestLessonShortLabel;
  } else if (track === 'psychology') {
    prevId = getPrevPsychologyLessonId(id);
    eyebrow = getPsychologyLessonEyebrow(id, lang);
    prevShortLabel = getPsychologyLessonShortLabel;
  } else {
    prevId = getPrevLessonId(id);
    eyebrow = getLessonEyebrow(id, lang);
    prevShortLabel = getLessonShortLabel;
  }

  return (
    <div className="view active" id={`v-${id}`}>
      <button className="back" onClick={() => onNavigate('home')}>
        {c.backToList}
      </button>
      <div className="lpage">
        <div className="lpage-top">
          <div className="lpage-ey sg">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        <div className="lpage-body">
          {children}
          <LessonNav
            prevLabel={prevId ? `← ${prevShortLabel(prevId, lang)}` : c.start}
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
