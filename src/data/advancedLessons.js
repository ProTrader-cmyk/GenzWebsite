// Lesson order/metadata for the "Advanced" (VIP-only) track — a separate
// course from Technical (lessons.js, 'l1'..'l7'), Apps (appsLessons.js,
// 'a1'..'a3'), Backtest (backtestLessons.js, 'bt1'..), and Psychology
// (psychologyLessons.js, 'psy1'..), ids 'adv1'..'adv5' so all tracks can
// share the same doneMap/registry without collisions. Mirrors the shape of
// psychologyLessons.js. ICT (Inner Circle Trader) concept track — add more
// entries here as more lessons get built out.
export const advancedLessons = [
  {
    id: 'adv1',
    title: 'Dealing Range (ICT)',
    subtitle: 'How to Identify Dealing Range · OTE Fibo · Premium and Discount (Fibo Only)',
    pageTitle: {
      kh: 'Dealing Range (ICT) — តំបន់ Dealing Range, OTE Fibo, Premium & Discount',
      en: 'Dealing Range (ICT)',
      zh: 'Dealing Range（ICT）— Dealing Range 区间、OTE Fibo、溢价与折价',
    },
  },
  {
    id: 'adv2',
    title: 'Advanced Liquidity (LQ)',
    subtitle:
      'LQ Pool (Swing High/Low) · EQH & EQL · PDH & PDL · PWH & PWL · Session Liquidity · Psychology Number (CME Data) · Internal & External Range Liquidity',
    pageTitle: {
      kh: 'Advanced Liquidity (LQ) — LQ Pool, EQH/EQL, PDH/PDL, PWH/PWL, Session LQ, Psychology Number, IRL & ERL',
      en: 'Advanced Liquidity (LQ)',
      zh: 'Advanced Liquidity（LQ）— LQ Pool、EQH/EQL、PDH/PDL、PWH/PWL、Session 流动性、心理数字、内外部流动性',
    },
  },
  {
    id: 'adv3',
    title: 'PD Array',
    subtitle:
      'LQ Pool · FVG · BPR · OB · IFVG · Rejection Block · Mitigation Block · Breaker Block · Volume Imbalances · Gap Variations · Mean Threshold & Consequence Encroachment (MT and CE)',
    pageTitle: {
      kh: 'PD Array — LQ Pool, FVG, BPR, OB, IFVG, Rejection/Mitigation/Breaker Block, Volume Imbalance, Gap, MT & CE',
      en: 'PD Array',
      zh: 'PD Array — LQ Pool、FVG、BPR、OB、IFVG、拒绝/缓解/破坏块、成交量失衡、缺口变化、MT 与 CE',
    },
  },
  {
    id: 'adv4',
    title: 'Time and Price',
    subtitle: 'Session · Killzone · AMD',
    pageTitle: {
      kh: 'Time and Price — Session, Killzone, AMD',
      en: 'Time and Price',
      zh: 'Time and Price — 时段、Killzone、AMD',
    },
  },
  {
    id: 'adv5',
    title: 'How to Set Up an A+ Trade',
    subtitle: 'Combining Dealing Range, Liquidity, PD Arrays, and Time & Price into One Trade Setup',
    pageTitle: {
      kh: 'របៀបរៀបចំ A+ Trade ដោយប្រើគំនិតទាំងអស់នេះ',
      en: 'How to Set Up an A+ Trade',
      zh: '如何运用这些概念搭建 A+ 级交易',
    },
  },
];

export function getAdvancedLessonIndex(id) {
  return advancedLessons.findIndex((l) => l.id === id);
}

export function getAdvancedLessonMeta(id) {
  return advancedLessons.find((l) => l.id === id);
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

export function getAdvancedLessonEyebrow(id, lang = 'kh') {
  const n = getAdvancedLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  const base = `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
  return lang === 'en' ? base : `${base} · Lesson ${String(n).padStart(2, '0')}`;
}

export function getAdvancedLessonShortLabel(id, lang = 'kh') {
  const n = getAdvancedLessonIndex(id) + 1;
  const num = lang === 'kh' ? toKhmerNumeral(n) : n;
  return `${EYEBROW_LABEL[lang] ?? EYEBROW_LABEL.kh} ${num}${EYEBROW_SUFFIX[lang] ?? ''}`;
}

export function getNextAdvancedLessonId(id) {
  const next = advancedLessons[getAdvancedLessonIndex(id) + 1];
  return next ? next.id : null;
}

export function getPrevAdvancedLessonId(id) {
  const prev = advancedLessons[getAdvancedLessonIndex(id) - 1];
  return prev ? prev.id : null;
}
