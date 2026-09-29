// Mock data for the Member Area preview (Dashboard + Signals pages) — see
// MemberArea.jsx. There is no real signals/bot backend yet, so this whole
// area is gated to admin/dev accounts only (App.jsx checks isAdmin before
// rendering it) specifically so a real paying member can never see these
// fabricated numbers presented as real results.
//
// TO CONNECT A REAL API: replace MOCK_SIGNALS with a fetch from your
// signals backend (shape: { id, pair, direction, entry, sl, tp, rr,
// minutesAgo, status, reason }), and MOCK_ACCOUNT with the signed-in user's
// real account balance/risk setting once that's collected during
// onboarding (deferred — see MemberArea.jsx).

// Every plan trades XAU/USD (Gold) only. Plans differ by how much of each
// day's signal feed they unlock: Starter sees 40%, Pro sees 70%, Elite
// sees 100%. See getUnlockedSignalIds() below for how that split is
// applied (simplified for the demo as a share of the whole mock feed,
// rather than literally recomputed per calendar day).
export const PAIR = 'XAUUSD';
export const PLAN_SIGNAL_ACCESS = { starter: 0.4, pro: 0.7, elite: 1 };

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

// Ids of the signals a given plan can see -- the most recent share of the
// feed, sized by PLAN_SIGNAL_ACCESS (40% / 70% / 100%). Everything outside
// that share renders blurred/locked with an "Upgrade" prompt (see
// MemberSignals.jsx / MemberDashboard.jsx).
export function getUnlockedSignalIds(signals, plan) {
  const share = PLAN_SIGNAL_ACCESS[plan] ?? 1;
  const count = Math.ceil(signals.length * share);
  return new Set(
    [...signals]
      .sort((a, b) => a.minutesAgo - b.minutesAgo)
      .slice(0, count)
      .map((s) => s.id)
  );
}
