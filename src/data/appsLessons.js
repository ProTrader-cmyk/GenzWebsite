// Lesson order/metadata for the "App & Website for Trading" track — a
// separate course from the Technical lessons in lessons.js (ids 'a1'..'a3'
// vs 'l1'..'l6', so both can share the same doneMap/registry without
// collisions). Mirrors the shape of lessons.js; see that file for the
// original pattern this was copied from.
export const appsLessons = [
  {
    id: 'a1',
    title: 'MT5',
    subtitle: 'Demo/Real Account · Market Execution · SL/TP · Lot Size · Pending Orders',
    pageTitle: {
      kh: 'របៀបប្រើប្រាស់ MT5',
      en: 'How to Use MT5',
      zh: '如何使用 MT5',
    },
  },
  {
    id: 'a2',
    title: 'Forex Factory',
    subtitle: 'Red Folder News · USD Events',
    pageTitle: {
      kh: 'Forex Factory',
      en: 'Forex Factory',
      zh: 'Forex Factory',
    },
  },
  {
    id: 'a3',
    title: 'TradingView',
    subtitle: 'Find a Pair · Candles · Timeframe',
    pageTitle: {
      kh: 'របៀបប្រើប្រាស់ TradingView សម្រាប់វិភាគបច្ចេកទេស',
      en: 'How to Use TradingView for Technical Analysis',
      zh: '如何使用 TradingView 进行技术分析',
    },
  },
];

export function getAppsLessonIndex(id) {
  return appsLessons.findIndex((l) => l.id === id);
}

export function getAppsLessonMeta(id) {
  return appsLessons.find((l) => l.id === id);
}

const EYEBROW_LABEL = { kh: 'មេរៀនទី', en: 'Lesson', zh: '第' };
const EYEBROW_SUFFIX = { kh: '', en: '', zh: '课' };
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

function toKhmerNumeral(n) {
  return String(n)
    .split('')
    .map((d) => KHMER_DIGITS[+d] ?? d)
    .join('');
}

export function getAppsLessonEyebrow(id, lang = 'kh') {
  const n = getAppsLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''} · Lesson ${String(n).padStart(2, '0')}`;
}

export function getAppsLessonShortLabel(id, lang = 'kh') {
  const n = getAppsLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
}

export function getNextAppsLessonId(id) {
  const next = appsLessons[getAppsLessonIndex(id) + 1];
  return next ? next.id : null;
}

export function getPrevAppsLessonId(id) {
  const prev = appsLessons[getAppsLessonIndex(id) - 1];
  return prev ? prev.id : null;
}
