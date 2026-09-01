import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Static placeholder for now — no backend call at all, even though
// GET /api/calendar (genztrader-news-api/server.js) already returns real
// Finnhub-backed data. The date-navigator/filters/event-card UI to consume
// it just hasn't been built yet.
export default function EconomicCalendar() {
  const { lang } = useLanguage();
  const t = getStrings(lang).calendar;

  return (
    <div id="v-calendar">
      <div className="empty-state">
        <div className="empty-icon">📅</div>
        <div className="empty-title">{t.comingSoonTitle}</div>
        <p className="empty-sub">{t.comingSoonBody}</p>
      </div>
    </div>
  );
}
