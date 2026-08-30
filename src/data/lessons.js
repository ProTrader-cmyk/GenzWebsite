// Single source of truth for lesson order, metadata, and numbering.
// To add a new lesson: add an entry here, create src/pages/LessonN.jsx,
// then register it in src/pages/registry.js. See README.md for the full guide.
export const lessons = [
  {
    id: 'l1',
    title: 'Market Structure',
    subtitle: 'Bullish · Bearish · Sideways · BOS · Swing High-Low · HH HL LH LL',
    pageTitle: {
      kh: 'Market Structure — រចនាសម្ព័ន្ធទីផ្សារ',
      en: 'Market Structure',
      zh: 'Market Structure — 市场结构',
    },
  },
  {
    id: 'l2',
    title: 'BOS vs CHoCH',
    subtitle: 'Break of Structure · Change of Character · Continuation · Reversal',
    pageTitle: {
      kh: 'BOS vs CHoCH — បន្ត Trend ឬ ផ្លាស់ប្តូរទិស?',
      en: 'BOS vs CHoCH — Continuation or Reversal?',
      zh: 'BOS vs CHoCH — 趋势延续还是反转？',
    },
  },
  {
    id: 'l3',
    title: 'Order Block',
    subtitle: 'Bullish OB · Bearish OB · Validity · Retest · Entry Context',
    pageTitle: {
      kh: 'Order Block — តំបន់ដែល Price អាចត្រឡប់មក React',
      en: 'Order Block — Where Price Tends to React',
      zh: 'Order Block — 价格可能回踩反应的区域',
    },
  },
  {
    id: 'l4',
    title: 'FVG',
    subtitle: 'Fair Value Gap · Imbalance · Bullish FVG · Bearish FVG · Fill',
    pageTitle: {
      kh: 'FVG — Fair Value Gap & Imbalance',
      en: 'FVG — Fair Value Gap & Imbalance',
      zh: 'FVG — Fair Value Gap 与 Imbalance',
    },
  },
  {
    id: 'l5',
    title: 'LQ (Liquidity)',
    subtitle: 'Buy-side · Sell-side · Equal High/Low · Liquidity Sweep · Stop Hunt',
    pageTitle: {
      kh: 'LQ — Liquidity & Liquidity Sweep',
      en: 'LQ — Liquidity & Liquidity Sweep',
      zh: 'LQ — Liquidity 与 Liquidity Sweep',
    },
  },
  {
    id: 'l6',
    title: 'EMA',
    subtitle: 'EMA 50/100/200 · SMA 50/100/200 · Momentum Crossover · Bull/Bear Structure',
    pageTitle: {
      kh: 'EMA — EMA & SMA Combo (50/100/200)',
      en: 'EMA — EMA & SMA Combo (50/100/200)',
      zh: 'EMA — EMA 与 SMA 组合 (50/100/200)',
    },
  },
  {
    id: 'l7',
    title: 'Become a Trader',
    subtitle: 'Top-Down Process · Confluence Checklist · Risk Management · Trading Plan',
    pageTitle: {
      kh: 'របៀបប្រើមេរៀនទាំង ៦ ដើម្បីក្លាយជា Trader',
      en: 'How to Use These 6 Lessons and Become a Trader',
      zh: '如何运用这 6 课成为一名交易者',
    },
  },
];

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerNumeral(n) {
  return String(n)
    .split('')
    .map((d) => KHMER_DIGITS[+d] ?? d)
    .join('');
}

export function getLessonIndex(id) {
  return lessons.findIndex((l) => l.id === id);
}

export function getLessonMeta(id) {
  return lessons.find((l) => l.id === id);
}

const EYEBROW_LABEL = { kh: 'មេរៀនទី', en: 'Lesson', zh: '第' };
const EYEBROW_SUFFIX = { kh: '', en: '', zh: '课' };

// "មេរៀនទី ១ · Lesson 01" — derived from position in `lessons`, so lessons
// never need to be renumbered by hand when inserted, reordered, or removed.
export function getLessonEyebrow(id, lang = 'kh') {
  const n = getLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''} · Lesson ${String(n).padStart(2, '0')}`;
}

// "មេរៀនទី ១" — the short form used for the prev-lesson link at the bottom
// of a lesson page.
export function getLessonShortLabel(id, lang = 'kh') {
  const n = getLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
}

// Next lesson's id, or null if `id` is the last lesson.
export function getNextLessonId(id) {
  const next = lessons[getLessonIndex(id) + 1];
  return next ? next.id : null;
}

// Previous lesson's id, or null if `id` is the first lesson.
export function getPrevLessonId(id) {
  const prev = lessons[getLessonIndex(id) - 1];
  return prev ? prev.id : null;
}
