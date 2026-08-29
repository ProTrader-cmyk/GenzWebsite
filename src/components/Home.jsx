import mentor from '../assets/mentor.jpg';
import { lessons } from '../data/lessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';

export default function Home({ doneMap, onSelectLesson }) {
  const total = lessons.length;
  const count = Object.keys(doneMap).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-home">
      <div className="hero">
        <div className="hero-logo">
          <img src={mentor} alt="GenZ Trader — Veng Sophea" />
        </div>
        <div className="hero-tag">
          <span></span>Private Mentorship Class<span></span>
        </div>
        <h1>GenZ Trader</h1>
        <div className="hero-tagline">
          LEARN. TRADE. <b>GROW.</b>
        </div>
        <p className="hero-sub">
          វគ្គសិក្សា Smart Money ដឹកនាំដោយ <strong style={{ color: 'var(--text)' }}>Veng Sophea</strong> — ងាយ ច្បាស់
          ពេញលេញ ជាជំហានៗ
        </p>
      </div>

      <div id="prog-outer" style={{ display: showProgress ? 'block' : 'none' }}>
        <div className="prog-info">
          <span>វឌ្ឍនភាព</span>
          <span>
            {count} / {total}
          </span>
        </div>
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: pct + '%' }}></div>
        </div>
      </div>

      <p className="sec-label sg" style={{ marginTop: 8 }}>
        មេរៀន
      </p>

      {lessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          index={i + 1}
          lesson={lesson}
          done={!!doneMap[lesson.id]}
          onClick={() => onSelectLesson(lesson.id)}
        />
      ))}

      <Footer />
    </div>
  );
}
