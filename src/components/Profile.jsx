import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Footer from './Footer.jsx';
import { fetchMonthEntries, fetchRangeEntries, saveDayEntry, deleteDayEntry, dateKey, daysInMonth } from '../data/journal.js';
import { uploadProfilePhoto } from '../data/avatar.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { DollarIcon, TrendUpIcon, StarIcon, CameraIcon } from './ui/CategoryIcons.jsx';

const LOCALE_BY_LANG = { kh: 'km-KH', en: 'en-US' };
const PERIOD_DAYS = { '1w': 7, '1m': 30, '3m': 90 };

function initials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatPnl(pnl) {
  const sign = pnl > 0 ? '+' : '';
  return `${sign}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// One decimal, no thousands separator — used only in the calendar day
// cells, which are too narrow on mobile to reliably fit exact cents
// (e.g. "-112.93") without clipping. Full precision is still shown in the
// day-entry modal and everywhere else.
function formatPnlCompact(pnl) {
  const sign = pnl > 0 ? '+' : '-';
  return `${sign}${Math.abs(pnl).toFixed(1)}`;
}

// Scales a cumulative series into an SVG point list for the given viewBox.
function scaleSeries(series, W, H, pad) {
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const span = max - min || 1;
  const scaleY = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
  const points = series.map((v, i) => [(i / (series.length - 1 || 1)) * W, scaleY(v)]);
  return { points, min, max, span, scaleY };
}

// Every day from `start` to `end` (inclusive), as Date objects at local midnight.
function dayRange(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Catmull-Rom -> cubic-Bezier smoothing (tension 1/6) so the performance
// chart reads as a soft curve instead of jagged day-to-day segments.
function smoothPath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)} L${points[1][0].toFixed(1)},${points[1][1].toFixed(1)}`;
  }
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export default function Profile({ onBack, uid, user }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).profile;
  const tj = getStrings(lang).journal;
  const locale = LOCALE_BY_LANG[lang] || 'en-US';
  const gradientId = useId();

  const isVip = user.tier === 'vip';

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef(null);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    setPhotoError('');
    setUploadingPhoto(true);
    try {
      await uploadProfilePhoto(uid, file);
    } catch {
      setPhotoError(t.photoUploadError);
    }
    setUploadingPhoto(false);
  }

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [entries, setEntries] = useState({});
  const [prevEntries, setPrevEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null); // 1-31, or null when closed
  const [pnlDraft, setPnlDraft] = useState('');
  const [pairDraft, setPairDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [period, setPeriod] = useState('1m');
  const [chartEntries, setChartEntries] = useState({});
  const [chartLoading, setChartLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState(null);
  const chartWrapRef = useRef(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMonthEntries(uid, year, month)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, year, month]);

  // Previous calendar month's total, purely for the "vs last month" stat —
  // independent of the main fetch so a slow/failed lookup never blocks the grid.
  useEffect(() => {
    let cancelled = false;
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    fetchMonthEntries(uid, prevYear, prevMonth)
      .then((data) => {
        if (!cancelled) setPrevEntries(data);
      })
      .catch(() => {
        if (!cancelled) setPrevEntries({});
      });
    return () => {
      cancelled = true;
    };
  }, [uid, year, month]);

  // Performance chart: a rolling window ending today, independent of the
  // calendar month currently shown above.
  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - (PERIOD_DAYS[period] - 1));
    const startKey = dateKey(start.getFullYear(), start.getMonth(), start.getDate());
    const endKey = dateKey(end.getFullYear(), end.getMonth(), end.getDate());
    fetchRangeEntries(uid, startKey, endKey)
      .then((data) => {
        if (!cancelled) setChartEntries(data);
      })
      .catch(() => {
        if (!cancelled) setChartEntries({});
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, period]);

  function goPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (isCurrentMonth) return; // no logging future days
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function openDay(day) {
    const key = dateKey(year, month, day);
    const entry = entries[key];
    setEditingDay(day);
    setPnlDraft(entry ? String(entry.pnl) : '');
    setPairDraft(entry?.pair || '');
    setNoteDraft(entry?.note || '');
    setError('');
  }

  function closeEditor() {
    setEditingDay(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    const pnl = parseFloat(pnlDraft);
    if (Number.isNaN(pnl)) {
      setError(tj.errInvalidPnl);
      return;
    }
    setSaving(true);
    try {
      const key = dateKey(year, month, editingDay);
      const pair = pairDraft.trim();
      const note = noteDraft.trim();
      await saveDayEntry(uid, key, pnl, note, pair);
      setEntries((prev) => ({ ...prev, [key]: { pnl, note, pair } }));
      setEditingDay(null);
    } catch {
      setError(tj.errSaveFailed);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const key = dateKey(year, month, editingDay);
      await deleteDayEntry(uid, key);
      setEntries((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setEditingDay(null);
    } catch {
      setError(tj.errSaveFailed);
    }
    setSaving(false);
  }

  const totalDays = daysInMonth(year, month);
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(1970, 0, 4 + i); // Jan 4 1970 was a Sunday
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
  });
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const dayLabel =
    editingDay != null
      ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
          new Date(year, month, editingDay)
        )
      : '';

  // --- Trading Overview stat cards ---
  const totalPnl = useMemo(() => Object.values(entries).reduce((sum, e) => sum + (e.pnl || 0), 0), [entries]);
  const prevTotal = useMemo(() => Object.values(prevEntries).reduce((sum, e) => sum + (e.pnl || 0), 0), [prevEntries]);
  const changePct = useMemo(() => {
    if (prevTotal === 0) return totalPnl === 0 ? 0 : totalPnl > 0 ? 100 : -100;
    return ((totalPnl - prevTotal) / Math.abs(prevTotal)) * 100;
  }, [totalPnl, prevTotal]);
  const bestPair = useMemo(() => {
    const byPair = {};
    Object.values(entries).forEach((e) => {
      const pair = (e.pair || '').trim();
      if (!pair) return;
      byPair[pair] = (byPair[pair] || 0) + (e.pnl || 0);
    });
    let best = null;
    for (const [pair, pnl] of Object.entries(byPair)) {
      if (pnl > 0 && (!best || pnl > best.pnl)) best = { pair, pnl };
    }
    return best;
  }, [entries]);

  // --- Performance chart ---
  const chartDays = useMemo(() => {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - (PERIOD_DAYS[period] - 1));
    return dayRange(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const chartSeries = useMemo(() => {
    let running = 0;
    return chartDays.map((d) => {
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      running += chartEntries[key]?.pnl || 0;
      return running;
    });
  }, [chartDays, chartEntries]);

  const hasChartData = Object.keys(chartEntries).length > 0;
  const chartUp = chartSeries.length > 0 && chartSeries[chartSeries.length - 1] >= 0;

  const chartPath = useMemo(() => {
    if (chartSeries.length < 2) return { line: '', area: '', yTicks: [], points: [] };
    const W = 600;
    const H = 160;
    const pad = 8;
    const { points, max, span, scaleY } = scaleSeries(chartSeries, W, H, pad);
    const line = smoothPath(points);
    const area = `${line} L${W},${H} L0,${H} Z`;
    const tickCount = 5;
    const yTicks = Array.from({ length: tickCount }, (_, i) => {
      const value = max - (span * i) / (tickCount - 1);
      return { value, y: scaleY(value) };
    });
    return { line, area, yTicks, points };
  }, [chartSeries]);

  useEffect(() => {
    setHoverIdx(null);
  }, [period]);

  function handleChartHover(clientX) {
    const el = chartWrapRef.current;
    if (!el || chartDays.length === 0) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHoverIdx(Math.round(frac * (chartDays.length - 1)));
  }

  const hoverPoint = hoverIdx != null ? chartPath.points[hoverIdx] : null;
  const hoverDay = hoverIdx != null ? chartDays[hoverIdx] : null;
  const hoverTotal = hoverIdx != null ? chartSeries[hoverIdx] : null;
  const hoverPnl = hoverDay ? chartEntries[dateKey(hoverDay.getFullYear(), hoverDay.getMonth(), hoverDay.getDate())]?.pnl : null;

  const chartLabelIdx = useMemo(() => {
    const n = chartDays.length;
    if (n <= 1) return [0];
    const count = Math.min(5, n);
    return Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / (count - 1)));
  }, [chartDays]);

  // Same-shaped mini sparkline (current month's cumulative P&L) shown at the
  // bottom of all three Trading Overview cards, tinted per card.
  const monthSparkPath = useMemo(() => {
    let running = 0;
    const series = dayList.map((d) => {
      running += entries[dateKey(year, month, d)]?.pnl || 0;
      return running;
    });
    if (series.length < 2) return '';
    const { points } = scaleSeries(series, 120, 32, 4);
    return smoothPath(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, year, month]);

  return (
    <div className="view active" id="v-profile">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="pf-header-card">
        <div className="pf-header-cover" />
        <div className="pf-header-body">
          <div className="pf-avatar-wrap">
            <button
              type="button"
              className="pf-avatar"
              onClick={() => photoInputRef.current?.click()}
              aria-label={t.changePhoto}
              disabled={uploadingPhoto}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="pf-avatar-img" />
              ) : (
                initials(user.name, user.email)
              )}
              <span className="pf-avatar-edit">
                {uploadingPhoto ? <span className="pf-avatar-spinner" /> : <CameraIcon width="13" height="13" />}
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="pf-avatar-input"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="pf-header-info">
            <div className="pf-header-top">
              <span className="pf-name">{user.name || '—'}</span>
            </div>
            <div className="pf-email">{user.email}</div>
            <div className="pf-header-badges">
              <span className={`tier-pill${isVip ? ' tier-pill-vip' : ''}`}>{isVip ? t.vip : t.member}</span>
              {user.emailVerified && <span className="pf-verified">{t.verifiedLabel} ✓</span>}
            </div>
          </div>
        </div>
      </div>
      {photoError && <div className="auth-error">{photoError}</div>}

      <h3 className="pf-section-title">{t.overviewTitle}</h3>
      <div className="pf-stats-row">
        <div className="pf-stat-card pf-stat-card-profit">
          <div className="pf-stat-top">
            <div className="pf-stat-icon"><DollarIcon width="15" height="15" /></div>
            <span className="pf-stat-tag">{t.profitLabel}</span>
          </div>
          <div className={`pf-stat-value${totalPnl > 0 ? ' is-up' : totalPnl < 0 ? ' is-down' : ''}`}>
            {formatPnl(totalPnl)}
          </div>
          <div className="pf-stat-sub">{t.profitSub}</div>
          {monthSparkPath && (
            <svg className="pf-stat-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d={monthSparkPath} fill="none" stroke="var(--up)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </div>
        <div className="pf-stat-card pf-stat-card-change">
          <div className="pf-stat-top">
            <div className="pf-stat-icon"><TrendUpIcon width="15" height="15" /></div>
            <span className="pf-stat-tag">{t.changeLabel}</span>
          </div>
          <div className={`pf-stat-value${changePct > 0 ? ' is-up' : changePct < 0 ? ' is-down' : ''}`}>
            {changePct > 0 ? '+' : ''}
            {changePct.toFixed(1)}%
          </div>
          <div className="pf-stat-sub">{t.changeSub}</div>
          {monthSparkPath && (
            <svg className="pf-stat-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d={monthSparkPath} fill="none" stroke="var(--brand2)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </div>
        <div className="pf-stat-card pf-stat-card-pair">
          <div className="pf-stat-top">
            <div className="pf-stat-icon"><StarIcon width="15" height="15" /></div>
            <span className="pf-stat-tag">{t.bestPairLabel}</span>
          </div>
          <div className="pf-stat-value">{bestPair ? bestPair.pair : t.bestPairNone}</div>
          {bestPair && <div className="pf-stat-sub">{formatPnl(bestPair.pnl)}</div>}
          {monthSparkPath && (
            <svg className="pf-stat-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <path d={monthSparkPath} fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </div>
      </div>

      <div className="pf-perf-head">
        <h3 className="pf-section-title">{t.performanceTitle}</h3>
        <div className="pf-period-toggle">
          {Object.keys(PERIOD_DAYS).map((p) => (
            <button
              key={p}
              type="button"
              className={`pf-period-btn${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {t[`period${p}`]}
            </button>
          ))}
        </div>
      </div>

      <div className="pf-chart-card">
        {chartLoading ? (
          <div className="tc-loading">{tj.loading}</div>
        ) : hasChartData ? (
          <>
            <div className="pf-chart-body">
              <div
                className="pf-chart-svg-wrap"
                ref={chartWrapRef}
                onMouseMove={(e) => handleChartHover(e.clientX)}
                onMouseLeave={() => setHoverIdx(null)}
                onTouchMove={(e) => handleChartHover(e.touches[0].clientX)}
                onTouchEnd={() => setHoverIdx(null)}
              >
                <svg className="pf-chart-svg" viewBox="0 0 600 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartUp ? 'var(--up)' : 'var(--dn)'} stopOpacity="0.32" />
                      <stop offset="100%" stopColor={chartUp ? 'var(--up)' : 'var(--dn)'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {chartPath.yTicks.slice(1, 4).map((tk, i) => (
                    <line key={i} className="pf-chart-grid-line" x1="0" x2="600" y1={tk.y} y2={tk.y} />
                  ))}
                  <g key={chartPath.line} className="pf-chart-draw-group">
                    <path className="pf-chart-area" d={chartPath.area} fill={`url(#${gradientId})`} stroke="none" />
                    <path
                      d={chartPath.line}
                      className="pf-chart-line"
                      stroke={chartUp ? 'var(--up)' : 'var(--dn)'}
                      vectorEffect="non-scaling-stroke"
                      style={{ filter: `drop-shadow(0 0 5px ${chartUp ? 'var(--up)' : 'var(--dn)'})` }}
                    />
                  </g>
                  {hoverPoint && (
                    <>
                      <line
                        x1={hoverPoint[0]}
                        x2={hoverPoint[0]}
                        y1="0"
                        y2="160"
                        className="pf-chart-hover-line"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle
                        cx={hoverPoint[0]}
                        cy={hoverPoint[1]}
                        r="4"
                        fill={chartUp ? 'var(--up)' : 'var(--dn)'}
                        stroke="var(--bg2)"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  )}
                </svg>
                {hoverPoint && hoverDay && (
                  <div
                    className="pf-chart-tooltip"
                    style={{ left: `${Math.min(96, Math.max(4, (hoverPoint[0] / 600) * 100))}%` }}
                  >
                    <div className="pf-chart-tooltip-date">
                      {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(hoverDay)}
                    </div>
                    <div
                      className={`pf-chart-tooltip-val${hoverTotal > 0 ? ' is-up' : hoverTotal < 0 ? ' is-down' : ''}`}
                    >
                      {formatPnl(hoverTotal)}
                    </div>
                    <div className="pf-chart-tooltip-sub-label">{tj.totalLabel}</div>
                    <div className="pf-chart-tooltip-sub">
                      {t.dayPnlLabel}:{' '}
                      <span className={hoverPnl > 0 ? 'is-up' : hoverPnl < 0 ? 'is-down' : ''}>
                        {hoverPnl != null ? formatPnl(hoverPnl) : t.noTrade}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pf-chart-labels">
              {chartLabelIdx.map((idx) => (
                <span key={idx}>
                  {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(chartDays[idx])}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="tc-loading">{t.chartNoData}</div>
        )}
      </div>

      <h3 className="pf-section-title">{tj.title}</h3>
      <div className="tc-card">
        <div className="tc-head">
          <button type="button" className="tc-nav-btn" onClick={goPrevMonth} aria-label={tj.prevMonth}>
            ←
          </button>
          <div className="tc-month-label">{monthLabel}</div>
          <button
            type="button"
            className="tc-nav-btn"
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            aria-label={tj.nextMonth}
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="tc-loading">{tj.loading}</div>
        ) : (
          <div className="tc-grid">
            {weekdayLabels.map((w) => (
              <div key={w} className="tc-weekday">
                {w}
              </div>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <div key={`empty-${i}`} className="tc-day tc-day-empty" />
            ))}
            {dayList.map((day) => {
              const key = dateKey(year, month, day);
              const entry = entries[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`tc-day${entry ? (entry.pnl >= 0 ? ' tc-day-up' : ' tc-day-down') : ''}${key === todayKey ? ' tc-day-today' : ''}`}
                  onClick={() => openDay(day)}
                >
                  <span className="tc-day-num">{day}</span>
                  {entry && <span className="tc-day-pnl">{formatPnlCompact(entry.pnl)}</span>}
                  {entry?.pair && <span className="tc-day-pair">{entry.pair}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {editingDay != null && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" aria-label={tj.close} onClick={closeEditor}>
              ×
            </button>
            <h3 className="modal-title">{dayLabel}</h3>

            <form onSubmit={handleSave} noValidate>
              <label className="auth-label" htmlFor="pf-pnl-input" style={{ textAlign: 'left' }}>
                {tj.pnlLabel}
              </label>
              <input
                id="pf-pnl-input"
                type="number"
                step="any"
                className="auth-input"
                placeholder="0"
                value={pnlDraft}
                onChange={(e) => setPnlDraft(e.target.value)}
                autoFocus
                required
              />

              <label className="auth-label" htmlFor="pf-pair-input" style={{ textAlign: 'left' }}>
                {t.pairLabel}
              </label>
              <input
                id="pf-pair-input"
                type="text"
                className="auth-input"
                placeholder={t.pairPlaceholder}
                value={pairDraft}
                onChange={(e) => setPairDraft(e.target.value)}
              />

              <label className="auth-label" htmlFor="pf-note-input" style={{ textAlign: 'left' }}>
                {tj.noteLabel}
              </label>
              <textarea
                id="pf-note-input"
                className="tc-note-textarea"
                rows={3}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />

              {error && <div className="auth-error">{error}</div>}

              <div className="tc-modal-actions">
                {entries[dateKey(year, month, editingDay)] && (
                  <button type="button" className="auth-btn tc-btn-danger" onClick={handleDelete} disabled={saving}>
                    {tj.deleteBtn}
                  </button>
                )}
                <button type="submit" className="auth-btn" disabled={saving}>
                  {saving ? tj.saving : tj.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
