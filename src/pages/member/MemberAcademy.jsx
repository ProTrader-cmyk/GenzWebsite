import { useState, useMemo } from 'react';
import { lessons } from '../../data/lessons.js';
import { advancedLessons } from '../../data/advancedLessons.js';
import { backtestLessons } from '../../data/backtestLessons.js';
import { psychologyLessons } from '../../data/psychologyLessons.js';

export default function MemberAcademy({ doneMap, onExit, onSelectCategory }) {
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  const tracks = useMemo(
    () => [
      {
        id: 'advanced',
        title: 'Advanced ICT Institutional Track',
        cardTitle: 'Advanced ICT Track',
        shortTitle: 'Advanced ICT',
        desc: 'Dealing Ranges, Liquidity Pools, PD Arrays, Time & Price Killzones, and A+ Setup Architecture.',
        lessons: advancedLessons,
        badge: 'Core Program',
        color: '#00A6F4',
        gradient: ['#00A6F4', '#38BDF8'],
        radius: 136,
        circumference: 2 * Math.PI * 136,
        icon: '🏛️',
      },
      {
        id: 'technical',
        title: 'Technical Market Structure Foundations',
        cardTitle: 'Market Structure',
        shortTitle: 'Market Structure',
        desc: 'Candlestick mechanics, Bullish/Bearish Trends, Swing Highs & Lows, BOS, and CHoCH.',
        lessons: lessons,
        badge: 'Foundations',
        color: '#10B981',
        gradient: ['#10B981', '#34D399'],
        radius: 118,
        circumference: 2 * Math.PI * 118,
        icon: '📈',
      },
      {
        id: 'backtest',
        title: 'Institutional Backtesting Laboratory',
        cardTitle: 'Backtesting Lab',
        shortTitle: 'Backtest Lab',
        desc: 'Interactive scenarios testing real execution discipline under live market conditions.',
        lessons: backtestLessons,
        badge: 'Practical',
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#A78BFA'],
        radius: 100,
        circumference: 2 * Math.PI * 100,
        icon: '⚡',
      },
      {
        id: 'psychology',
        title: 'Trading Psychology & Discipline',
        cardTitle: 'Trading Psychology',
        shortTitle: 'Psychology',
        desc: 'Emotional control, managing drawdowns, overcoming FOMO, and peak trader performance.',
        lessons: psychologyLessons,
        badge: 'Mastery',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#FBBF24'],
        radius: 82,
        circumference: 2 * Math.PI * 82,
        icon: '🧠',
      },
    ],
    []
  );

  const trackStats = useMemo(() => {
    return tracks.map((track) => {
      const completedCount = track.lessons.filter((l) => !!doneMap?.[l.id]).length;
      const totalCount = track.lessons.length;
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const offset = track.circumference - (track.circumference * pct) / 100;
      return {
        ...track,
        completedCount,
        totalCount,
        pct,
        offset,
      };
    });
  }, [tracks, doneMap]);

  const totalLessons = useMemo(() => trackStats.reduce((sum, t) => sum + t.totalCount, 0), [trackStats]);
  const totalCompleted = useMemo(() => trackStats.reduce((sum, t) => sum + t.completedCount, 0), [trackStats]);
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const activeTrack = hoveredTrackId ? trackStats.find((t) => t.id === hoveredTrackId) : null;

  const tierBadge = useMemo(() => {
    if (overallPct >= 80) return { label: 'INSTITUTIONAL MASTER', color: '#10B981' };
    if (overallPct >= 50) return { label: 'FUNDED CANDIDATE', color: '#00A6F4' };
    if (overallPct >= 20) return { label: 'APPRENTICE TRADER', color: '#8B5CF6' };
    return { label: 'FOUNDATIONS TIER', color: '#F59E0B' };
  }, [overallPct]);

  return (
    <div className="member-academy-page">
      {/* Premium Curriculum Mastery Radial Panel */}
      <div className="curriculum-mastery-panel">
        <div className="cmp-header">
          <div className="cmp-header-left">
            <span className="cmp-eyebrow">INSTITUTIONAL CURRICULUM</span>
            <h2 className="cmp-title">Curriculum Mastery Multi-Ring Tracker</h2>
            <p className="cmp-sub">
              Real-time progress telemetry across all 4 core curriculum tracks. Stacking daily edge into funded execution.
            </p>
          </div>
          <button
            type="button"
            className="plan-cta-btn plan-cta-primary cmp-academy-btn"
            onClick={onExit}
          >
            Open Main Academy →
          </button>
        </div>

        <div className="cmp-body">
          {/* Left Column: 4-Ring Radial Gauge */}
          <div className="cmp-chart-wrap">
            <svg className="cmp-radial-svg" viewBox="0 0 320 320">
              <defs>
                <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {trackStats.map((track) => (
                  <linearGradient key={`grad-${track.id}`} id={`grad-${track.id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={track.gradient[0]} />
                    <stop offset="100%" stopColor={track.gradient[1]} />
                  </linearGradient>
                ))}
              </defs>

              {/* Background Tracks */}
              {trackStats.map((track) => (
                <circle
                  key={`bg-${track.id}`}
                  cx="160"
                  cy="160"
                  r={track.radius}
                  className="cmp-ring-bg"
                  strokeWidth="7"
                  style={{ stroke: `${track.color}20` }}
                  fill="none"
                />
              ))}

              {/* Foreground Animated Rings */}
              {trackStats.map((track) => {
                const isHovered = hoveredTrackId === track.id;
                const isFaint = hoveredTrackId && !isHovered;
                if (track.pct === 0) return null; // do not render single round-cap dot when 0%
                return (
                  <circle
                    key={`fill-${track.id}`}
                    cx="160"
                    cy="160"
                    r={track.radius}
                    className="cmp-ring-fill"
                    strokeWidth={isHovered ? 11 : 8.5}
                    stroke={`url(#grad-${track.id})`}
                    fill="none"
                    strokeDasharray={track.circumference}
                    strokeDashoffset={track.offset}
                    strokeLinecap="round"
                    filter={isHovered ? 'url(#ring-glow)' : 'none'}
                    opacity={isFaint ? 0.35 : 1}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    style={{
                      transformOrigin: 'center',
                      transform: 'rotate(-90deg)',
                      transition: 'all 0.3s ease, stroke-dashoffset 0.8s ease',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Info Overlay - Sits comfortably inside radius 82 circle (diameter 164px) with no clipping */}
            <div className="cmp-center-stats">
              <span className="cmp-center-pct" style={{ color: activeTrack ? activeTrack.color : 'var(--text)' }}>
                {activeTrack ? `${activeTrack.pct}%` : `${overallPct}%`}
              </span>
              <span className="cmp-center-label">
                {activeTrack ? activeTrack.shortTitle : 'TOTAL MASTERY'}
              </span>
              <span
                className="cmp-center-tier"
                style={{
                  color: activeTrack ? activeTrack.color : tierBadge.color,
                  borderColor: `${activeTrack ? activeTrack.color : tierBadge.color}50`,
                  background: `${activeTrack ? activeTrack.color : tierBadge.color}18`,
                }}
              >
                {activeTrack ? `${activeTrack.completedCount}/${activeTrack.totalCount} Lessons` : tierBadge.label}
              </span>
            </div>
          </div>

          {/* Right Column: 4 Track Telemetry Cards */}
          <div className="cmp-tracks-list">
            <div className="cmp-summary-bar">
              <div className="cmp-summary-item">
                <span className="cmp-sum-label">COMPLETED LESSONS</span>
                <span className="cmp-sum-val">
                  {totalCompleted} <small>/ {totalLessons}</small>
                </span>
              </div>
              <div className="cmp-summary-item">
                <span className="cmp-sum-label">EXECUTION READINESS</span>
                <span className="cmp-sum-val" style={{ color: tierBadge.color }}>
                  {overallPct >= 75 ? 'A+ Institutional' : overallPct >= 40 ? 'B+ Developing' : 'Early Phase'}
                </span>
              </div>
            </div>

            <div className="cmp-modules-grid">
              {trackStats.map((track) => {
                const isHovered = hoveredTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`cmp-module-card${isHovered ? ' active' : ''}`}
                    style={{
                      borderLeftColor: track.color,
                      boxShadow: isHovered ? `0 8px 24px ${track.color}25` : undefined,
                    }}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onClick={() => onSelectCategory?.(track.id)}
                  >
                    <div className="cmp-mod-head">
                      <div className="cmp-mod-left">
                        <span className="cmp-mod-icon">{track.icon}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="cmp-mod-title">{track.cardTitle}</div>
                          <div className="cmp-mod-badge">{track.badge}</div>
                        </div>
                      </div>
                      <div className="cmp-mod-right">
                        <span className="cmp-mod-pct" style={{ color: track.color }}>
                          {track.pct}%
                        </span>
                        <span className="cmp-mod-count">
                          {track.completedCount}/{track.totalCount}
                        </span>
                      </div>
                    </div>

                    <div className="cmp-mod-bar">
                      <div
                        className="cmp-mod-fill"
                        style={{
                          width: `${track.pct}%`,
                          background: `linear-gradient(90deg, ${track.gradient[0]}, ${track.gradient[1]})`,
                          boxShadow: track.pct > 0 ? `0 0 10px ${track.color}60` : 'none',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Track Modules List Cards */}
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
              style={{
                borderTop: `3px solid ${track.color}`,
              }}
            >
              <div className="track-card-top">
                <span className="track-badge" style={{ color: track.color, background: `${track.color}18` }}>
                  {track.badge}
                </span>
                <span className="track-count">
                  {completedCount} / {totalCount} completed ({pct}%)
                </span>
              </div>
              <div className="track-title">{track.title}</div>
              <p className="track-desc">{track.desc}</p>

              <div className="track-progress-bar">
                <div
                  className="track-progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${track.gradient[0]}, ${track.gradient[1]})`,
                  }}
                />
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
