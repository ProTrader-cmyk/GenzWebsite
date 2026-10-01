import { useEffect, useMemo, useState } from 'react';
import { dateKey } from '../data/journal.js';

// Strict local storage key for real user activity only
const STORAGE_PREFIX = 'genz_real_study_hours_';

function getStoredSeconds(uid, key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}_${key}`);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function setStoredSeconds(uid, key, seconds) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${uid}_${key}`, String(seconds));
  } catch {
    // ignore storage errors
  }
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function UserActivityHoursChart({ uid }) {
  const [rangeType, setRangeType] = useState('7d'); // '7d' (default) | '14d' | '30d' | 'custom'
  const [today, setToday] = useState(() => new Date());
  const todayDateStr = useMemo(() => localDateString(today), [today]);
  const [customDate, setCustomDate] = useState(todayDateStr);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Keep the chart on the user's local calendar date, including across midnight.
  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Real heartbeat active time tracking while page is open & focused
  useEffect(() => {
    if (!uid) return;
    const todayK = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    let current = getStoredSeconds(uid, todayK);
    setLiveSeconds(current);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        current += 5;
        setStoredSeconds(uid, todayK, current);
        setLiveSeconds(current);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [uid, today]);

  // Determine end date based on user choice
  const endDate = useMemo(() => {
    if (rangeType === 'custom' && customDate) {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return today;
  }, [rangeType, customDate, today]);

  // Number of days to show (default 7 days)
  const numDays = rangeType === '14d' ? 14 : rangeType === '30d' ? 30 : 7;

  // Build daily data series (Strictly real data — 0 if unrecorded)
  const daysData = useMemo(() => {
    const list = [];
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayK = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      const isToday = k === todayK;

      // Strictly read real stored seconds (returns 0 if no session was logged)
      let seconds = isToday ? Math.max(getStoredSeconds(uid, k), liveSeconds) : getStoredSeconds(uid, k);

      const hours = parseFloat((seconds / 3600).toFixed(2));
      const hoursInt = Math.floor(seconds / 3600);
      const minsInt = Math.floor((seconds % 3600) / 60);

      list.push({
        date: d,
        key: k,
        isToday,
        seconds,
        hours,
        hoursInt,
        minsInt,
        dayName: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
        monthDay: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d),
      });
    }
    return list;
  }, [endDate, numDays, uid, today, liveSeconds]);

  // Statistics: Total hours, Average, Peak Day
  const totalHours = useMemo(() => {
    return parseFloat(daysData.reduce((acc, d) => acc + d.hours, 0).toFixed(2));
  }, [daysData]);

  const avgHours = useMemo(() => {
    return (totalHours / (daysData.length || 1)).toFixed(2);
  }, [totalHours, daysData]);

  // Peak day: Only considered if there is actual activity (> 0 hours)
  const peakDay = useMemo(() => {
    const activeDays = daysData.filter((d) => d.seconds > 0);
    if (!activeDays.length) return null;
    return activeDays.reduce((max, d) => (d.seconds > max.seconds ? d : max), activeDays[0]);
  }, [daysData]);

  // Y-axis scale (default to 2h ceiling if 0, scales up as user accumulates hours)
  const maxHoursInSeries = useMemo(() => {
    const maxVal = Math.max(...daysData.map((d) => d.hours), 0);
    return Math.max(2, Math.ceil(maxVal * 1.25));
  }, [daysData]);

  const yTicks = useMemo(() => {
    const top = maxHoursInSeries;
    const mid = Math.round((top / 2) * 10) / 10;
    return [top, mid, 0];
  }, [maxHoursInSeries]);

  return (
    <div className="activity-hours-panel">
      {/* Header with Title & Date Range Controls */}
      <div className="ah-header">
        <div className="ah-title-group">
          <div className="ah-title-row">
            <span className="ah-icon">⏱️</span>
            <h3 className="ah-title">Website Activity & Study Hours</h3>
            <span className="ah-live-badge">
              <span className="ah-live-dot" /> REAL-TIME LOGGING
            </span>
          </div>
          <p className="ah-subtitle">
            Monitors your genuine active screen time on the platform. All days start at 0 until you study.
          </p>
        </div>

        {/* Date Controls */}
        <div className="ah-controls-row">
          <div className="ah-pill-group">
            <button
              type="button"
              className={`ah-pill-btn${rangeType === '7d' ? ' active' : ''}`}
              onClick={() => {
                setRangeType('7d');
                setCustomDate(todayDateStr);
              }}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`ah-pill-btn${rangeType === '14d' ? ' active' : ''}`}
              onClick={() => {
                setRangeType('14d');
                setCustomDate(todayDateStr);
              }}
            >
              14 Days
            </button>
            <button
              type="button"
              className={`ah-pill-btn${rangeType === '30d' ? ' active' : ''}`}
              onClick={() => {
                setRangeType('30d');
                setCustomDate(todayDateStr);
              }}
            >
              30 Days
            </button>
          </div>

          {/* Custom Date Picker */}
          <div className="ah-datepicker-box">
            <label className="ah-datepicker-label" htmlFor="ah-date-input">
              Choose Date:
            </label>
            <input
              id="ah-date-input"
              type="date"
              className="ah-date-input"
              value={customDate}
              max={todayDateStr}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setRangeType('custom');
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="ah-kpi-row">
        <div className="ah-kpi-card">
          <span className="ah-kpi-label">TOTAL STUDY TIME</span>
          <div className="ah-kpi-val">
            {totalHours} <span className="ah-kpi-unit">hrs</span>
          </div>
          <span className="ah-kpi-sub">
            {totalHours > 0 ? `Logged across ${daysData.length} days` : '0 hours recorded yet'}
          </span>
        </div>

        <div className="ah-kpi-card">
          <span className="ah-kpi-label">DAILY AVERAGE</span>
          <div className="ah-kpi-val">
            {avgHours} <span className="ah-kpi-unit">hrs / day</span>
          </div>
          <span className="ah-kpi-sub">
            {totalHours > 0 ? 'Active average' : '0.0 hrs / day'}
          </span>
        </div>

        <div className={`ah-kpi-card${peakDay ? ' highlight' : ''}`}>
          <span className="ah-kpi-label">PEAK ACTIVE DAY</span>
          <div className={`ah-kpi-val${peakDay ? ' peak' : ''}`}>
            {peakDay ? `${peakDay.hours} hrs` : '0 hrs'}
          </div>
          <span className="ah-kpi-sub">
            {peakDay ? `${peakDay.dayName}, ${peakDay.monthDay} (Most Active)` : 'No active sessions yet'}
          </span>
        </div>
      </div>

      {/* Modern Glowing Bar Chart */}
      <div className="ah-chart-card">
        <div className="ah-chart-box">
          {/* Y-Axis Grid & Labels */}
          <div className="ah-yaxis-wrap">
            {yTicks.map((val, idx) => (
              <div key={idx} className="ah-ytick">
                <span className="ah-ytick-text">{val}h</span>
                <div className="ah-grid-line" />
              </div>
            ))}
          </div>

          {/* Bar Columns Container */}
          <div className="ah-bars-track">
            {daysData.map((d, index) => {
              const heightPct = d.hours > 0 ? Math.min(100, Math.max(6, (d.hours / maxHoursInSeries) * 100)) : 0;
              const isPeak = peakDay && d.key === peakDay.key && d.hours > 0;
              const isHovered = hoveredBarIndex === index;

              return (
                <div
                  key={d.key}
                  className={`ah-bar-col${isPeak ? ' is-peak' : ''}${d.isToday ? ' is-today' : ''}`}
                  onMouseEnter={() => setHoveredBarIndex(index)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="ah-tooltip">
                      <div className="ah-tooltip-date">{d.dayName}, {d.monthDay}</div>
                      <div className="ah-tooltip-hours">
                        {d.hours > 0 ? `${d.hoursInt}h ${d.minsInt}m` : '0h 0m'}
                      </div>
                      <div className="ah-tooltip-badge">
                        {isPeak ? '🔥 Most Active Day' : d.isToday ? '🟢 Today (Active)' : d.hours > 0 ? 'Study Session' : 'No activity logged'}
                      </div>
                    </div>
                  )}

                  {/* Peak Marker Badge */}
                  {isPeak && <div className="ah-peak-tag">PEAK</div>}

                  {/* Bar Body */}
                  <div className="ah-bar-tube">
                    {heightPct > 0 && (
                      <div
                        className="ah-bar-fill"
                        style={{
                          height: `${heightPct}%`,
                          background: isPeak
                            ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
                            : d.isToday
                            ? 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)'
                            : 'linear-gradient(180deg, #00A6F4 0%, #0369A1 100%)',
                          boxShadow: isPeak
                            ? '0 0 14px rgba(245, 158, 11, 0.45)'
                            : d.isToday
                            ? '0 0 14px rgba(56, 189, 248, 0.45)'
                            : '0 0 10px rgba(0, 166, 244, 0.25)',
                        }}
                      >
                        <span className="ah-bar-shine" />
                      </div>
                    )}
                  </div>

                  {/* X-Axis Label */}
                  <div className="ah-xaxis-label">
                    <span className="ah-day-name">{d.dayName}</span>
                    <span className="ah-day-num">{d.monthDay.split(' ')[1] || ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Legend / Footer Insight */}
        <div className="ah-chart-footer">
          <div className="ah-legend-items">
            <span className="ah-legend-dot regular" /> Normal Activity
            <span className="ah-legend-dot today" style={{ marginLeft: 16 }} /> Today (Live)
            <span className="ah-legend-dot peak" style={{ marginLeft: 16 }} /> Peak Stay Time
          </div>
          <div className="ah-footer-insight">
            {peakDay ? (
              <>User stayed the most on <strong>{peakDay.dayName}, {peakDay.monthDay}</strong> with <strong>{peakDay.hours} hours</strong> of platform study.</>
            ) : (
              <>No activity logged yet. Hours will increment automatically as you stay and study on the website.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
