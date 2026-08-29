import { lessons } from '../data/lessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';

export default function Home({ doneMap, onSelectLesson, onBack }) {
  const total = lessons.length;
  const count = Object.keys(doneMap).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-home">
      <button className="back" onClick={onBack}>
        ← ផ្នែកសិក្សា
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">Technical for Beginner</div>
        <h2>មូលដ្ឋាន Smart Money សម្រាប់អ្នកចាប់ផ្តើម</h2>
        <p>Market Structure · BOS/CHoCH · Order Block · FVG · Liquidity · EMA — រៀនតាមលំដាប់ ជាជំហានៗ</p>
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

      {lessons.map((lesson, i) => {
        const unlocked = i === 0 || !!doneMap[lessons[i - 1].id];
        return (
          <LessonCard
            key={lesson.id}
            index={i + 1}
            lesson={lesson}
            done={!!doneMap[lesson.id]}
            locked={!unlocked}
            onClick={() => onSelectLesson(lesson.id)}
          />
        );
      })}

      <Footer />
    </div>
  );
}
