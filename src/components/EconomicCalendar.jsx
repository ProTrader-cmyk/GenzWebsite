import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Static placeholder for now — no backend call at all. The real data-fetching
// version (date navigator, filters, event cards) is on hold; EconomicEventCard,
// EconomicFilters, and MarketImpactBadge are kept around unused for whenever
// that gets wired back up.
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
