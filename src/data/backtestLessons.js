// Lesson order/metadata for the "Backtest Technical Analysis for Beginner"
// track — a separate course from Technical (lessons.js, 'l1'..'l7') and
// Apps (appsLessons.js, 'a1'..'a3'), ids 'bt1'..'bt4', one per practice
// scenario, so all tracks can share the same doneMap/registry without
// collisions. Mirrors the shape of appsLessons.js; see that file for the
// original pattern this was copied from.
export const backtestLessons = [
  {
    id: 'bt1',
    title: 'Scenario 1',
    subtitle: 'Backtest Practice',
    pageTitle: {
      kh: 'អនុវត្តន៍ Backtest — សេណារីយ៉ូទី ១',
      en: 'Backtest Practice — Scenario 1',
      zh: '回测练习 — 场景 1',
    },
  },
  {
    id: 'bt2',
    title: 'Scenario 2',
    subtitle: 'Backtest Practice',
    pageTitle: {
      kh: 'អនុវត្តន៍ Backtest — សេណារីយ៉ូទី ២',
      en: 'Backtest Practice — Scenario 2',
      zh: '回测练习 — 场景 2',
    },
  },
  {
    id: 'bt3',
    title: 'Scenario 3',
    subtitle: 'Backtest Practice',
    pageTitle: {
      kh: 'អនុវត្តន៍ Backtest — សេណារីយ៉ូទី ៣',
      en: 'Backtest Practice — Scenario 3',
      zh: '回测练习 — 场景 3',
    },
  },
  {
    id: 'bt4',
    title: 'Scenario 4',
    subtitle: 'Backtest Practice',
    pageTitle: {
      kh: 'អនុវត្តន៍ Backtest — សេណារីយ៉ូទី ៤',
      en: 'Backtest Practice — Scenario 4',
      zh: '回测练习 — 场景 4',
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
  const base = `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
  return lang === 'en' ? base : `${base} · Lesson ${String(n).padStart(2, '0')}`;
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
