// Lesson order/metadata for the "Psychology" track — a separate course from
// Technical (lessons.js, 'l1'..'l7'), Apps (appsLessons.js, 'a1'..'a3'), and
// Backtest (backtestLessons.js, 'bt1'..), ids 'psy1'.. so all tracks can
// share the same doneMap/registry without collisions. Mirrors the shape of
// backtestLessons.js. Content is drawn from "Trading in the Zone" by Mark
// Douglas, one chapter per lesson — add more entries here as more chapters
// get built out.
export const psychologyLessons = [
  {
    id: 'psy1',
    title: 'Trading in the Zone — Chapter 1',
    subtitle: 'Road to Success · Mark Douglas',
    pageTitle: {
      kh: 'Trading in the Zone — ជំពូកទី ១៖ ផ្លូវទៅកាន់ជោគជ័យ',
      en: 'Trading in the Zone — Chapter 1: Road to Success',
      zh: '《交易心理分析》— 第一章：通往成功之路',
    },
  },
];

export function getPsychologyLessonIndex(id) {
  return psychologyLessons.findIndex((l) => l.id === id);
}

export function getPsychologyLessonMeta(id) {
  return psychologyLessons.find((l) => l.id === id);
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

export function getPsychologyLessonEyebrow(id, lang = 'kh') {
  const n = getPsychologyLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''} · Lesson ${String(n).padStart(2, '0')}`;
}

export function getPsychologyLessonShortLabel(id, lang = 'kh') {
  const n = getPsychologyLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
}

export function getNextPsychologyLessonId(id) {
  const next = psychologyLessons[getPsychologyLessonIndex(id) + 1];
  return next ? next.id : null;
}

export function getPrevPsychologyLessonId(id) {
  const prev = psychologyLessons[getPsychologyLessonIndex(id) - 1];
  return prev ? prev.id : null;
}
