import { ImpactBadge, default as MarketImpactBadge } from './MarketImpactBadge.jsx';

const LOCALE_BY_LANG = { kh: 'km-KH', en: 'en-US', zh: 'zh-CN' };
const DIRECTION_ICON = { bullish: '▲', bearish: '▼', neutral: '■' };

function formatEventDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatEventTime(iso, lang) {
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] || 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function EconomicEventCard({ event, lang, t }) {
  const markets = ['gold', 'silver', 'oil', 'usd'];
  const impactLabel = { low: t.impactLow, medium: t.impactMedium, high: t.impactHigh }[event.impact];
  const levelLabel = { low: t.levelLow, medium: t.levelMedium, high: t.levelHigh, veryhigh: t.levelVeryHigh };

  return (
    <div className={`econ-card ${event.impact === 'high' ? 'econ-card-high' : ''}`}>
      <div className="econ-when">
        <div className="econ-date">{formatEventDate(event.time, lang)}</div>
        <div className="econ-time">{formatEventTime(event.time, lang)}</div>
      </div>

      <div className="econ-main">
        <div className="econ-top-row">
          <span className="econ-currency">{event.currency}</span>
          <ImpactBadge level={event.impact} label={impactLabel} />
        </div>
        <div className="econ-event-name">{event.event}</div>

        <div className="econ-values">
          <div className="econ-val">
            <span className="econ-val-label">{t.previous}</span>
            <span className="econ-val-num">{event.previous ?? '—'}</span>
          </div>
          <div className="econ-val">
            <span className="econ-val-label">{t.forecast}</span>
            <span className="econ-val-num">{event.estimate ?? '—'}</span>
          </div>
          <div className="econ-val">
            <span className="econ-val-label">{t.actual}</span>
            <span className="econ-val-num econ-val-actual">{event.actual ?? '—'}</span>
          </div>
        </div>

        <div className="econ-markets">
          {markets.map((m) => (
            <MarketImpactBadge
              key={m}
              market={m}
              level={event.marketImpact?.[m]}
              marketLabel={t[m]}
              levelLabel={levelLabel[event.marketImpact?.[m]]}
            />
          ))}
        </div>

        {event.aiAnalysis?.shortExplanation && <p className="econ-explanation">{event.aiAnalysis.shortExplanation}</p>}

        {event.aiAnalysis && (
          <div className="econ-ai">
            <div className="econ-ai-title">🤖 {t.aiAnalysisTitle}</div>
            <div className="econ-ai-grid">
              {['gold', 'silver', 'oil'].map((m) => {
                const dir = event.aiAnalysis[`${m}Impact`];
                return (
                  <div key={m} className="econ-ai-item">
                    <span className="econ-ai-market">{t[m]}</span>
                    <span className={`econ-ai-dir econ-ai-${dir}`}>
                      {DIRECTION_ICON[dir]} {t[dir]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="econ-ai-reason">{event.aiAnalysis.reason}</p>
            <div className="econ-ai-disclaimer">{t.notFinancialAdvice}</div>
          </div>
        )}
      </div>
    </div>
  );
}
