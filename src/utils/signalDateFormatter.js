/**
 * Signal Date Formatter for GenZ Trader
 * Strictly formats timestamps into Cambodia Time (Asia/Phnom_Penh, GMT+7 / UTC+7).
 */

/**
 * Safely parses any date/timestamp input (Firestore Timestamp, ISO, serialized string, ms, seconds)
 */
export function parseDateInput(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // Firestore Timestamp object methods
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch (e) {}
  }
  if (typeof val.toMillis === 'function') {
    try {
      const d = new Date(val.toMillis());
      if (!isNaN(d.getTime())) return d;
    } catch (e) {}
  }

  // Firestore Timestamp object fields { seconds, nanoseconds }
  if (typeof val === 'object' && val !== null && typeof val.seconds === 'number') {
    const ms = val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  // Number: seconds vs ms
  if (typeof val === 'number') {
    const ms = val < 10000000000 ? val * 1000 : val;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  // String parsing
  if (typeof val === 'string') {
    // Matches: Timestamp(seconds=1792136425, nanoseconds=186000000)
    const match = val.match(/seconds\s*=\s*(\d+)/i);
    if (match) {
      const d = new Date(parseInt(match[1], 10) * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    // Numeric string
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const ms = num < 10000000000 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    // String with middle dot (·) or UTC notation
    if (val.includes('·')) {
      const cleaned = val.replace('·', '').replace(/\s+/g, ' ').trim();
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return d;
    }
    // ISO or Date string
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Formats a timestamp into Cambodia Time (GMT+7 / Asia/Phnom_Penh):
 * e.g., "Oct 19, 2026 · 17:55 GMT+7"
 */
export function formatSignalDate(val) {
  if (!val) return 'Today · Active';

  // If already formatted in Cambodia Time (GMT+7) and contains separator
  if (typeof val === 'string' && val.includes('GMT+7') && val.includes('·')) {
    return val;
  }

  const d = parseDateInput(val);
  if (!d) {
    if (typeof val === 'string' && val.trim()) return val;
    return 'Today · Active';
  }

  // Strictly format in Cambodia Time (Asia/Phnom_Penh, UTC+7 / GMT+7)
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Phnom_Penh',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Phnom_Penh',
  });

  return `${datePart} · ${timePart} GMT+7`;
}

