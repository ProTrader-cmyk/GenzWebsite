import { appsLessons } from '../data/appsLessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Unlike the Technical track, App & Website for Trading has no approval gate
// and no progressive unlocking — every lesson is open to any logged-in user
// (pending or approved) as soon as they click into this category.
export default function AppsHome({ doneMap, onSelectLesson, onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).apps;
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

      {appsLessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          index={i + 1}
          lesson={lesson}
          done={!!doneMap[lesson.id]}
          locked={false}
          onClick={() => onSelectLesson(lesson.id)}
        />
      ))}

      <Footer />
    </div>
  );
}
