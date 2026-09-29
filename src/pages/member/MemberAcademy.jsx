import { lessons } from '../../data/lessons.js';
import { advancedLessons } from '../../data/advancedLessons.js';
import { backtestLessons } from '../../data/backtestLessons.js';
import { psychologyLessons } from '../../data/psychologyLessons.js';

export default function MemberAcademy({ doneMap, onExit, onSelectCategory }) {
  const tracks = [
    {
      id: 'advanced',
      title: 'Advanced ICT Institutional Track',
      desc: 'Dealing Ranges, Liquidity Pools, PD Arrays, Time & Price Killzones, and A+ Setup Architecture.',
      lessons: advancedLessons,
      badge: 'Core Program',
    },
    {
      id: 'technical',
      title: 'Technical Market Structure Foundations',
      desc: 'Candlestick mechanics, Bullish/Bearish Trends, Swing Highs & Lows, BOS, and CHoCH.',
      lessons: lessons,
      badge: 'Foundations',
    },
    {
      id: 'backtest',
      title: 'Institutional Backtesting Laboratory',
      desc: 'Interactive scenarios testing real execution discipline under live market conditions.',
      lessons: backtestLessons,
      badge: 'Practical',
    },
    {
      id: 'psychology',
      title: 'Trading Psychology & Discipline',
      desc: 'Emotional control, managing drawdowns, overcoming FOMO, and peak trader performance.',
      lessons: psychologyLessons,
      badge: 'Mastery',
    },
  ];

  return (
    <div className="member-academy-page">
      <div className="academy-head-card">
        <div>
          <h2 className="academy-main-title">GenZ Trader Curriculum Tracker</h2>
          <p className="academy-main-sub">
            Track your mastery across all 4 institutional training modules. Every lesson is designed to stack directly into your A+ trading execution.
          </p>
        </div>
        <button
          type="button"
          className="plan-cta-btn plan-cta-primary"
          style={{ width: 'auto', whiteSpace: 'nowrap', padding: '10px 20px' }}
          onClick={onExit}
        >
          Open Main Academy →
        </button>
      </div>

      <div className="academy-tracks-grid">
        {tracks.map((track) => {
          const completedCount = track.lessons.filter((l) => doneMap?.[l.id]).length;
          const totalCount = track.lessons.length;
          const pct = Math.round((completedCount / totalCount) * 100);

          return (
            <div
              key={track.id}
              className={`academy-track-card${onSelectCategory ? ' clickable' : ''}`}
              onClick={() => onSelectCategory?.(track.id)}
            >
              <div className="track-card-top">
                <span className="track-badge">{track.badge}</span>
                <span className="track-count">
                  {completedCount} / {totalCount} completed ({pct}%)
                </span>
              </div>
              <div className="track-title">{track.title}</div>
              <p className="track-desc">{track.desc}</p>

              <div className="track-progress-bar">
                <div className="track-progress-fill" style={{ width: `${pct}%` }} />
              </div>

              <div className="track-lessons-list">
                {track.lessons.map((les, index) => {
                  const isDone = !!doneMap?.[les.id];
                  return (
                    <div key={les.id} className={`track-lesson-item${isDone ? ' done' : ''}`}>
                      <span className="lesson-check">{isDone ? '✓' : index + 1}</span>
                      <span className="lesson-name">{les.title?.en || les.title || `Lesson ${index + 1}`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
