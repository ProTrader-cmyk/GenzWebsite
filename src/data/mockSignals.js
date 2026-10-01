// Shared helpers for the member trading dashboard and live signal feed.
// Signals themselves are published to Firestore by the admin dashboard.

// Plans differ by how much of each day's live signal feed they unlock:
// Starter sees 50%, Pro sees 75%, and Elite sees 100%. The member signal
// stream applies this share separately to each Phnom Penh calendar day.
export const PAIR = 'XAUUSD';
export const PLAN_SIGNAL_ACCESS = { starter: 0.5, pro: 0.75, elite: 1 };

// A single example account used only to demo the lot-size calculator —
// real account size/risk % will come from the onboarding wizard once built.
export const MOCK_ACCOUNT = { balance: 1000, riskPercent: 1 };

// Signals are published live from the Admin Dashboard or Gemini AI Signal Generator.
export const MOCK_SIGNALS = [];


// pip size for gold -- simplified for demo purposes, not broker-accurate
// (contract sizes/pip conventions vary by broker).
const GOLD_PIP_SIZE = 0.1;

// Simplified lot-size formula for demo purposes only: assumes a flat
// $10/pip-per-standard-lot. Good enough to show the feature; swap for a
// real broker-aware calculation once accounts are real.
export function calculateLotSize(signal, account = MOCK_ACCOUNT) {
  const riskAmount = account.balance * (account.riskPercent / 100);
  const slPips = Math.abs(signal.entry - signal.sl) / GOLD_PIP_SIZE;
  const lots = riskAmount / (slPips * 10);
  return Math.max(0.01, Math.round(lots * 100) / 100);
}

export function formatRelativeTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// { signalsToday, winRate, avgRR, activeCount }
export function deriveSignalStats(signals) {
  const today = signals.filter((s) => s.minutesAgo < 1440);
  const closed = signals.filter((s) => s.status === 'tp' || s.status === 'sl');
  const wins = closed.filter((s) => s.status === 'tp');
  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : 0;
  const avgRR = closed.length ? closed.reduce((sum, s) => sum + s.rr, 0) / closed.length : 0;
  const activeCount = signals.filter((s) => s.status === 'active').length;
  return {
    signalsToday: today.length,
    winRate,
    avgRR: Math.round(avgRR * 10) / 10,
    activeCount,
  };
}

// Ids of the signals a given plan can see: the most recent share of each
// day's feed, sized by PLAN_SIGNAL_ACCESS.
export function getUnlockedSignalIds(signals, plan) {
  const share = PLAN_SIGNAL_ACCESS[plan] ?? 1;
  const byDay = new Map();
  const getPublishedTime = (signal) => signal.createdAt?.toMillis?.()
    ?? signal.createdAt?.toDate?.()?.getTime?.()
    ?? signal.publishedAt
    ?? (Date.now() - (signal.minutesAgo || 0) * 60_000);
  for (const signal of signals) {
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(getPublishedTime(signal)));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(signal);
  }

  const unlocked = new Set();
  for (const daySignals of byDay.values()) {
    daySignals.sort((a, b) => getPublishedTime(b) - getPublishedTime(a));
    const count = Math.ceil(daySignals.length * share);
    daySignals.slice(0, count).forEach((signal) => unlocked.add(signal.id));
  }
  return unlocked;
}
