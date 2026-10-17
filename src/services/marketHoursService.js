/**
 * Institutional Market Hours & Trading Schedule Service
 * Accurately tracks Forex, Metals, Indices, and Crypto trading sessions and weekend closures.
 *
 * Market Schedule (Global Interbank Standard):
 * - Forex & Gold (XAUUSD, EURUSD, GBPUSD, USDJPY, US30):
 *   - Opens: Sunday 5:00 PM EST / 22:00 UTC (Monday 05:00 AM UTC+7)
 *   - Closes: Friday 5:00 PM EST / 22:00 UTC (Saturday 05:00 AM UTC+7)
 *   - Weekend: CLOSED from Friday 22:00 UTC through Sunday 22:00 UTC.
 *   - Weekday Gold Daily Break: Monday–Thursday 21:00 UTC to 22:00 UTC (1 hour).
 * - Crypto (BTCUSD, ETHUSD):
 *   - 24/7/365 Continuous Trading.
 */

export function getMarketHoursStatus(pair = 'XAUUSD') {
  const norm = (pair || 'XAUUSD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isCrypto = norm.includes('BTC') || norm.includes('ETH');

  if (isCrypto) {
    return {
      isOpen: true,
      status: 'OPEN',
      badge: 'LIVE 24/7',
      label: 'Crypto 24/7 Live',
      sessionName: 'Continuous Crypto Session',
      sessionShort: '24/7 Crypto (Active)',
      color: '#10B981',
      isClosed: false,
      isWeekend: false,
      isBreak: false,
      reason: 'Cryptocurrency markets trade 24 hours a day, 7 days a week, 365 days a year.',
      reopensText: 'Continuous Trading',
      reopenCountdown: 'Always Live',
    };
  }

  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const totalMins = hour * 60 + minute;

  // Friday post-close: 22:00 UTC (5:00 PM EST / Saturday 05:00 AM UTC+7)
  const isFridayClosed = day === 5 && totalMins >= 22 * 60;
  // Saturday all day
  const isSaturdayClosed = day === 6;
  // Sunday pre-open: before 22:00 UTC (5:00 PM EST / Monday 05:00 AM UTC+7)
  const isSundayClosed = day === 0 && totalMins < 22 * 60;

  const isWeekendClosed = isFridayClosed || isSaturdayClosed || isSundayClosed;

  if (isWeekendClosed) {
    // Calculate minutes until Sunday 22:00 UTC
    let minsUntilOpen = 0;
    if (day === 5) {
      minsUntilOpen = (24 * 60 - totalMins) + (24 * 60) + (22 * 60);
    } else if (day === 6) {
      minsUntilOpen = (24 * 60 - totalMins) + (22 * 60);
    } else if (day === 0) {
      minsUntilOpen = 22 * 60 - totalMins;
    }
    const hoursLeft = Math.floor(minsUntilOpen / 60);
    const minsLeft = minsUntilOpen % 60;
    const countdownStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;

    return {
      isOpen: false,
      status: 'CLOSED',
      badge: 'MARKET CLOSED',
      label: 'Market Closed (Weekend)',
      sessionName: 'Weekend Interbank Break',
      sessionShort: 'Closed (Weekend)',
      color: '#EF4444',
      isClosed: true,
      isWeekend: true,
      isBreak: false,
      reason: 'Global Forex & Commodities markets are closed over the weekend. Institutional interbank liquidity is offline as markets do not trade 24/7.',
      reopensText: 'Sunday 5:00 PM EST (Monday 05:00 AM UTC+7)',
      reopenCountdown: countdownStr,
    };
  }

  // Weekday daily maintenance break for Metals/Gold: 21:00 to 22:00 UTC (Mon - Thu)
  const isGold = norm.includes('XAU') || norm.includes('GOLD') || norm.includes('XAG');
  if (isGold && day >= 1 && day <= 4 && totalMins >= 21 * 60 && totalMins < 22 * 60) {
    const minsLeft = 60 - minute;
    return {
      isOpen: false,
      status: 'MAINTENANCE',
      badge: 'DAILY BREAK',
      label: 'Settlement Break (1h)',
      sessionName: 'Daily Maintenance Break',
      sessionShort: 'Daily Break (1h)',
      color: '#F59E0B',
      isClosed: true,
      isWeekend: false,
      isBreak: true,
      reason: 'Daily institutional interbank rollover & settlement break for precious metals.',
      reopensText: `22:00 UTC (resumes in ${minsLeft}m)`,
      reopenCountdown: `${minsLeft}m`,
    };
  }

  // Active Sessions during normal trading week:
  let sessionName = 'Asian Session';
  let sessionStatus = 'Active (Accumulation)';
  let sessionColor = '#00F2FE';
  let sessionShort = 'Asian (Active)';

  if (totalMins >= 750 && totalMins < 900) {
    sessionName = 'New York AM Killzone';
    sessionStatus = 'Active (Peak Volume)';
    sessionColor = '#10B981';
    sessionShort = 'New York (Active)';
  } else if (totalMins >= 420 && totalMins < 600) {
    sessionName = 'London Open Killzone';
    sessionStatus = 'Active (High Volume)';
    sessionColor = '#10B981';
    sessionShort = 'London (Active)';
  } else if (totalMins >= 900 && totalMins < 1020) {
    sessionName = 'London Close Session';
    sessionStatus = 'Active (Retracement)';
    sessionColor = '#F59E0B';
    sessionShort = 'London Close (Active)';
  } else if (totalMins >= 0 && totalMins < 360) {
    sessionName = 'Asian Session';
    sessionStatus = 'Active (Accumulation)';
    sessionColor = '#00F2FE';
    sessionShort = 'Asian (Active)';
  } else {
    sessionName = 'Inter-Bank Session';
    sessionStatus = 'Active (Consolidation)';
    sessionColor = '#94A3B8';
    sessionShort = 'Inter-Bank (Active)';
  }

  return {
    isOpen: true,
    status: 'OPEN',
    badge: 'LIVE MARKET',
    label: `${sessionName} (Active)`,
    sessionName,
    sessionStatus,
    sessionShort,
    color: sessionColor,
    isClosed: false,
    isWeekend: false,
    isBreak: false,
    reason: 'Active Institutional Trading Hours',
    reopensText: 'Currently Open',
    reopenCountdown: 'Active',
  };
}
