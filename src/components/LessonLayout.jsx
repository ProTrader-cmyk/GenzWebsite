import { getLessonEyebrow, getPrevLessonId, getLessonShortLabel } from '../data/lessons.js';
import LessonNav from './ui/LessonNav.jsx';

// Shared chrome for every lesson page: back link, header (auto-numbered
// eyebrow + title), body container, and the bottom prev/next nav. The
// prev link and its label are derived automatically from lesson order in
// src/data/lessons.js — individual lesson files only supply their content
// via `children`. See src/pages/Lesson1.jsx.
export default function LessonLayout({
  id,
  title,
  onNavigate,
  onDone,
  nextLabel = '✓ បញ្ចប់មេរៀន',
  nextDisabled = false,
  children,
}) {
  const prevId = getPrevLessonId(id);

  return (
    <div className="view active" id={`v-${id}`}>
      <button className="back" onClick={() => onNavigate('home')}>
        ← បញ្ជីមេរៀន
      </button>
      <div className="lpage">
        <div className="lpage-top">
          <div className="lpage-ey sg">{getLessonEyebrow(id)}</div>
          <h2>{title}</h2>
        </div>
        <div className="lpage-body">
          {children}
          <LessonNav
            prevLabel={prevId ? `← ${getLessonShortLabel(prevId)}` : '← ដើម'}
            onPrev={prevId ? () => onNavigate(prevId) : undefined}
            nextLabel={nextLabel}
            onNext={onDone}
            nextDisabled={nextDisabled}
          />
        </div>
      </div>
    </div>
  );
}
