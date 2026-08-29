// Single source of truth for lesson order, metadata, and numbering.
// To add a new lesson: add an entry here, create src/pages/LessonN.jsx,
// then register it in src/pages/registry.js. See README.md for the full guide.
export const lessons = [
  {
    id: 'l1',
    title: 'Market Structure',
    subtitle: 'Bullish · Bearish · Sideways · BOS · Swing High-Low · HH HL LH LL',
    pageTitle: 'Market Structure — រចនាសម្ព័ន្ធទីផ្សារ',
  },
  {
    id: 'l2',
    title: 'BOS vs CHoCH',
    subtitle: 'Break of Structure · Change of Character · Continuation · Reversal',
    pageTitle: 'BOS vs CHoCH — បន្ត Trend ឬ ផ្លាស់ប្តូរទិស?',
  },
  {
    id: 'l3',
    title: 'Order Block',
    subtitle: 'Bullish OB · Bearish OB · Validity · Retest · Entry Context',
    pageTitle: 'Order Block — តំបន់ដែល Price អាចត្រឡប់មក React',
  },
  {
    id: 'l4',
    title: 'FVG',
    subtitle: 'Fair Value Gap · Imbalance · Bullish FVG · Bearish FVG · Fill',
    pageTitle: 'FVG — Fair Value Gap & Imbalance',
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

// "មេរៀនទី ១ · Lesson 01" — derived from position in `lessons`, so lessons
// never need to be renumbered by hand when inserted, reordered, or removed.
export function getLessonEyebrow(id) {
  const n = getLessonIndex(id) + 1;
  return `មេរៀនទី ${toKhmerNumeral(n)} · Lesson ${String(n).padStart(2, '0')}`;
}

// "មេរៀនទី ១" — the short form used for the prev-lesson link at the bottom
// of a lesson page.
export function getLessonShortLabel(id) {
  const n = getLessonIndex(id) + 1;
  return `មេរៀនទី ${toKhmerNumeral(n)}`;
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
