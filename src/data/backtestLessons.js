// Lesson order/metadata for the "Backtest Technical Analysis for Beginner"
// track — a separate course from Technical (lessons.js, 'l1'..'l7') and
// Apps (appsLessons.js, 'a1'..'a3'), ids 'bt1'.. so all three can share the
// same doneMap/registry without collisions. Mirrors the shape of
// appsLessons.js; see that file for the original pattern this was copied
// from. Currently just one lesson (4 practice scenarios within it) — add
// more entries here the same way if this grows into a multi-lesson track.
export const backtestLessons = [
  {
    id: 'bt1',
    title: 'Backtest Practice',
    subtitle: 'Scenario 1 · Scenario 2 · Scenario 3 · Scenario 4',
    pageTitle: {
      kh: 'អនុវត្តន៍ Backtest សម្រាប់អ្នកចាប់ផ្តើម',
      en: 'Backtest Practice for Beginners',
      zh: '初学者回测练习',
    },
  },
];

export function getBacktestLessonIndex(id) {
  return backtestLessons.findIndex((l) => l.id === id);
}

export function getBacktestLessonMeta(id) {
  return backtestLessons.find((l) => l.id === id);
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

export function getBacktestLessonEyebrow(id, lang = 'kh') {
  const n = getBacktestLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''} · Lesson ${String(n).padStart(2, '0')}`;
}

export function getBacktestLessonShortLabel(id, lang = 'kh') {
  const n = getBacktestLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
}

export function getNextBacktestLessonId(id) {
  const next = backtestLessons[getBacktestLessonIndex(id) + 1];
  return next ? next.id : null;
}

export function getPrevBacktestLessonId(id) {
  const prev = backtestLessons[getBacktestLessonIndex(id) - 1];
  return prev ? prev.id : null;
}
