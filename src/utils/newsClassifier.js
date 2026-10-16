/**
 * News Classifier & Multi-Asset Impact Matrix Utility for GenZ Trader
 * Automatically categorizes financial headlines, determines impact tier (HIGH, MEDIUM, LOW),
 * and computes multi-asset directional bias (Gold, USD, Equities, Oil, Crypto).
 */

export function classifyNewsArticle(article) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();

  // 1. Determine Category
  let category = 'MARKETS';
  if (/fed\b|powell|fomc|central bank|ecb\b|boe\b|boj\b|interest rate|rate cut|rate hike|monetary policy/i.test(text)) {
    category = 'CENTRAL BANK';
  } else if (/gold\b|xau|silver\b|xag|crude|brent|oil\b|bullion|precious metal|metals/i.test(text)) {
    category = 'COMMODITIES';
  } else if (/cpi\b|inflation|gdp\b|payrolls|nfp\b|jobs report|unemployment|treasury|yields?|pmi\b|ppi\b/i.test(text)) {
    category = 'MACRO';
  } else if (/dollar\b|dxy|usd|eur|gbp|jpy|cny|cnh|forex|currency|exchange rate/i.test(text)) {
    category = 'FOREX';
  } else if (/bitcoin\b|btc|ethereum\b|eth|crypto|solana|binance|blockchain/i.test(text)) {
    category = 'CRYPTO';
  } else if (/war\b|missile|attack|military|iran\b|israel\b|mideast|sanctions?|tariffs?|hormuz|russia|ukraine/i.test(text)) {
    category = 'GEOPOLITICS';
  }

  // 2. Determine Impact Level: HIGH, MEDIUM, LOW
  let impactLevel = 'LOW';
  const isHighKeywords = /crash|plunge|surge|spike|soar|all-time high|record high|rate cut|rate hike|cpi|inflation data|fomc|war|attack|missile|emergency|crisis|breaking/i.test(text);
  const isMedKeywords = /recover|gain|drop|fall|retreat|yields|treasury|fed official|forecast|speaks|meeting|stimulus|pmi|oil price|gold price/i.test(text);

  if (isHighKeywords || category === 'CENTRAL BANK' || category === 'GEOPOLITICS') {
    impactLevel = 'HIGH';
  } else if (isMedKeywords || category === 'COMMODITIES' || category === 'MACRO') {
    impactLevel = 'MEDIUM';
  } else {
    impactLevel = 'LOW';
  }

  // 3. Multi-Asset Impact Matrix
  const assetPills = [];

  // Gold Impact
  const goldBullish = /softer dollar|weaker dollar|dollar drops|yields retreat|yields fall|rate cut|safe[- ]haven|war|geopolitical|dip buy|bargain hunting|prices rise|prices gain|surge/i.test(text);
  const goldBearish = /stronger dollar|firm dollar|dollar gains|yields rise|rising yields|rate hike|hawkish|profit[- ]taking|prices fall|prices drop|plunge/i.test(text);
  if (goldBullish && !goldBearish) {
    assetPills.push({ symbol: 'Gold', status: 'bullish', label: 'Gold Bullish (+XAU)' });
  } else if (goldBearish && !goldBullish) {
    assetPills.push({ symbol: 'Gold', status: 'bearish', label: 'Gold Bearish (-XAU)' });
  } else if (/gold|silver|bullion/i.test(text)) {
    assetPills.push({ symbol: 'Gold', status: 'neutral', label: 'Gold - neutral' });
  }

  // USD / Dollar Impact
  const usdBullish = /stronger dollar|firm dollar|dollar gains|hawkish|hot inflation|cpi rises|rate hike/i.test(text);
  const usdBearish = /weaker dollar|softer dollar|dollar falls|dovish|rate cut|cool inflation/i.test(text);
  if (usdBullish) {
    assetPills.push({ symbol: 'USD', status: 'bullish', label: 'USD - bullish' });
  } else if (usdBearish) {
    assetPills.push({ symbol: 'USD', status: 'bearish', label: 'USD - bearish' });
  } else {
    assetPills.push({ symbol: 'USD', status: 'neutral', label: 'USD - neutral' });
  }

  // Equities / S&P 500 Impact
  const riskOn = /stocks rise|equities gain|rally|rate cuts?|bullish|optimism|easing/i.test(text);
  const riskOff = /sell-off|stocks fall|recession|crash|war|escalation|tightening/i.test(text);
  if (riskOn && !riskOff) {
    assetPills.push({ symbol: 'S&P 500', status: 'bullish', label: 'S&P 500 - bullish' });
  } else if (riskOff && !riskOn) {
    assetPills.push({ symbol: 'S&P 500', status: 'bearish', label: 'S&P 500 - risk-off' });
  } else {
    assetPills.push({ symbol: 'S&P 500', status: 'neutral', label: 'S&P 500 - neutral' });
  }

  // Oil / Commodities if mentioned
  if (/oil|crude|brent|energy|opec|hormuz/i.test(text)) {
    const oilBullish = /oil jumps|oil gains|supply cut|tensions|hormuz/i.test(text);
    const oilBearish = /oil drops|oil plunges|demand fears/i.test(text);
    if (oilBullish) assetPills.push({ symbol: 'Oil', status: 'bullish', label: 'Oil - bullish' });
    else if (oilBearish) assetPills.push({ symbol: 'Oil', status: 'bearish', label: 'Oil - bearish' });
    else assetPills.push({ symbol: 'Oil', status: 'neutral', label: 'Oil - neutral' });
  }

  // Crypto if mentioned
  if (/crypto|bitcoin|btc|eth/i.test(text)) {
    const btcBullish = /bitcoin surge|crypto rally|btc breaks|bullish/i.test(text);
    const btcBearish = /crypto drops|bitcoin falls|crash|selloff/i.test(text);
    if (btcBullish) assetPills.push({ symbol: 'Crypto', status: 'bullish', label: 'Crypto - bullish' });
    else if (btcBearish) assetPills.push({ symbol: 'Crypto', status: 'bearish', label: 'Crypto - bearish' });
    else assetPills.push({ symbol: 'Crypto', status: 'neutral', label: 'Crypto - neutral' });
  }

  return {
    category,
    impactLevel,
    assetPills: assetPills.slice(0, 4), // max 4 pills per card
  };
}

/**
 * Formats a timestamp into a clean relative time and absolute string.
 * Example: "16 Oct • 10:48 GMT+7 • 1h ago"
 */
export function formatNewsTime(isoString) {
  if (!isoString) return { dateStr: 'Today', relativeStr: 'Recently' };
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.max(1, Math.round(diffMs / (60 * 1000)));

    let relativeStr = '';
    if (diffMins < 60) {
      relativeStr = `${diffMins}m ago`;
    } else {
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) {
        relativeStr = `${diffHours}h ago`;
      } else {
        const diffDays = Math.round(diffHours / 24);
        relativeStr = `${diffDays}d ago`;
      }
    }

    const dayMonth = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return {
      dateStr: `${dayMonth} • ${timeStr} GMT+7`,
      relativeStr,
      fullDisplay: `${dayMonth} • ${timeStr} GMT+7 • ${relativeStr}`,
    };
  } catch {
    return { dateStr: 'Today', relativeStr: 'Recently', fullDisplay: 'Today' };
  }
}

