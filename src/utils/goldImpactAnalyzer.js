/**
 * Gold Market (XAU/USD) Impact Analyzer
 * Evaluates financial news headlines and summaries to determine macroeconomic
 * transmission mechanisms and directional impact on Gold (XAU/USD).
 */

export function analyzeGoldImpact(article, lang = 'en') {
  const isKhmer = lang === 'km' || lang === 'kh';
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();

  // 1. Explicit Bearish Drivers for Gold (XAU/USD)
  const isBearishDollar =
    /\bfirm dollar\b|\bstronger dollar\b|\bdollar gains\b|\bdollar rally\b|\bdollar strengthens\b|\bdollar surge\b|\brising dollar\b|\bstrong dollar\b|\bdxy rises\b|\bdxy jumps\b/.test(text);
  const isBearishYields =
    /\bhigher yields\b|\brising yields\b|\byields rise\b|\byields surge\b|\bhawkish\b|\brate hikes?\b|\braise rates\b|\btightening\b/.test(text);
  const isDirectBearishPrice =
    /\btrade lower\b|\bprices? fall\b|\bprices? drop\b|\bprices? retreat\b|\bprices? sink\b|\bprices? slip\b|\bweighs on bullion\b|\bweighed on bullion\b|\btime to sell\b|\bfall further\b|\brecent dip\b|\bsell-off\b|\bprofit-taking\b|\blosing appeal\b/.test(text);

  // 2. Explicit Bullish Drivers for Gold (XAU/USD)
  const isBullishDollar =
    /\bsoft dollar\b|\bsofter dollar\b|\bweaker dollar\b|\bdollar drops\b|\bdollar retreats\b|\bdollar falls\b|\bdollar slides\b|\bdollar slips\b|\bdollar weakens\b/.test(text);
  const isBullishYields =
    /\byields retreat\b|\byields fall\b|\byields drop\b|\bsofter yields\b|\brate cuts?\b|\bcut rates\b|\bdovish\b|\bavoid consecutive hike\b|\bmay not raise rates\b|\bflexible on interest rates\b/.test(text);
  const isDirectBullishPrice =
    /\bprices? rise\b|\bprices? gain\b|\bprices? surge\b|\bprices? jump\b|\bprices? climb\b|\bheads? for weekly gain\b|\bheads? for gain\b|\bbargain-hunting\b|\bbuying opportunity\b|\bextend gains\b|\bhits? one-week high\b|\bhits? record high\b|\bhits? all-time high\b|\bforecasts? \$[4-9]\b|\bsupport near\b|\bup \d+%|\brise \d+%|\bjumps? \d+%|\bclimbs? \d+%/.test(text);
  const isSafeHaven =
    /\bsafe[- ]haven\b|\bgeopolitical\b|\bcentral[- ]bank buying\b|\bcentral[- ]bank purchases\b|\bhedge against inflation\b|\bwar\b|\bconflict\b/.test(text);

  // 3. Volatility / Awaiting Crucial Data
  const isPreDataWait =
    /\bspotlight on\b|\bstrap in for\b|\bahead of us economic data\b|\bahead of (?:us |the )?cpi\b|\bahead of (?:us )?inflation\b|\bahead of fed\b|\bawaiting (?:us )?inflation\b|\bawaiting fed\b|\bwhat investors should watch\b|\brange-bound\b|\bsteady as\b|\bmarket strap in\b/.test(text);

  // Score calculations
  let bullishScore = 0;
  let bearishScore = 0;
  let volatileScore = 0;

  if (isBearishDollar) bearishScore += 3;
  if (isBearishYields) bearishScore += 2;
  if (isDirectBearishPrice) bearishScore += 3;

  if (isBullishDollar) bullishScore += 3;
  if (isBullishYields) bullishScore += 2;
  if (isDirectBullishPrice) bullishScore += 3;
  if (isSafeHaven) bullishScore += 2.5;

  if (isPreDataWait) volatileScore += 3.5;

  // Decision logic
  if (volatileScore >= 3.5 && Math.abs(bullishScore - bearishScore) < 2) {
    return {
      direction: 'volatile',
      biasTag: isKhmer ? '⚡ ប្រែប្រួលខ្លាំង (±XAU/USD)' : '⚡ HIGH VOLATILITY (±XAU/USD)',
      shortBadge: isKhmer ? 'ប្រែប្រួលខ្លាំង' : 'Volatile',
      badgeClass: 'gna-flat',
      driverTag: isKhmer ? 'រង់ចាំទិន្នន័យ Macro' : 'Pre-Data Caution',
      impactTitle: isKhmer ? 'ឥទ្ធិពលលើមាស: ទីផ្សារប្រែប្រួលខ្លាំង (High Volatility)' : 'Gold Impact: High Volatility Ahead',
      explanation: isKhmer
        ? 'ទីផ្សារមាសកំពុងរង់ចាំទិន្នន័យអតិផរណា (CPI) ឬការសម្រេចរបស់ Fed។ តម្លៃអាចប្រែប្រួលខ្លាំងភ្លាមៗនៅពេលទិន្នន័យចេញ។'
        : 'Bullion is consolidating with heightened volatility as traders await US macro prints (CPI/Fed). Expect sharp multi-pip spikes upon release.',
      tradingTip: isKhmer
        ? 'គន្លឹះ: ប្រយ័ត្នបញ្ជាទិញមុនម៉ោង News ចេញ គួរបន្ថយទំហំ Lot ឬរង់ចាំ Post-News Price Action។'
        : 'Pro Tip: Tighten stop-losses or stay sidelined right before the data release to avoid slippage.',
    };
  }

  if (bearishScore > bullishScore) {
    const isDollarDriven = isBearishDollar || isBearishYields;
    return {
      direction: 'bearish',
      biasTag: isKhmer ? '▼ សម្ពាធធ្លាក់ចុះ (-XAU/USD)' : '▼ BEARISH ON GOLD (-XAU/USD)',
      shortBadge: isKhmer ? 'និន្នាការចុះ' : 'Bearish',
      badgeClass: 'gna-down',
      driverTag: isDollarDriven
        ? (isKhmer ? 'កម្លាំងដុល្លារ (DXY) កើនឡើង' : 'Dollar & Yields Strength')
        : (isKhmer ? 'សម្ពាធលក់លើ Bullion' : 'Bullion Selling Pressure'),
      impactTitle: isKhmer ? 'ឥទ្ធិពលលើមាស: សម្ពាធធ្លាក់ចុះ (Bearish)' : 'Gold Impact: Downward Pressure (Bearish)',
      explanation: isDollarDriven
        ? (isKhmer
            ? 'កម្លាំងប្រាក់ដុល្លារ (USD) និងទិន្នផលប័ណ្ណបំណុលកើនឡើង ធ្វើឱ្យថ្លៃដើមកាន់កាប់មាសថ្លៃជាងមុន បង្កើតសម្ពាធលក់មកលើ Comex & MCX bullion។'
            : 'Firm US Dollar (DXY) and elevated Treasury yields increase holding costs for non-yielding bullion, exerting direct downward pressure on spot gold.')
        : (isKhmer
            ? 'ការលក់ដកប្រាក់ចំណេញ និងការកែសម្រួលទីផ្សារ បង្កើតសម្ពាធធ្លាក់ចុះរយៈពេលខ្លីមកលើតម្លៃមាស XAU/USD។'
            : 'Profit-taking and risk-off sentiment in precious metals are currently pushing spot gold towards lower technical support zones.'),
      tradingTip: isKhmer
        ? 'គន្លឹះ: ស្វែងរកឱកាស Sell Setup នៅ Resistance ឬរង់ចាំ Reversal Support កុំប្រញាប់ Buy តាមអារម្មណ៍។'
        : 'Pro Tip: Look for premium-to-discount sell setups at resistance zones, or wait for strong liquidity sweeps before buying.',
    };
  }

  if (bullishScore > bearishScore) {
    const isDipBuy = /bargain-hunting|buying opportunity|support near|forecasts/i.test(text);
    return {
      direction: 'bullish',
      biasTag: isKhmer ? '▲ និន្នាការកើនឡើង (+XAU/USD)' : '▲ BULLISH ON GOLD (+XAU/USD)',
      shortBadge: isKhmer ? 'និន្នាការឡើង' : 'Bullish',
      badgeClass: 'gna-up',
      driverTag: isDipBuy
        ? (isKhmer ? 'កម្លាំងទិញត្រឡប់ (Bargain Buying)' : 'Institutional Dip Buying')
        : isBullishDollar
        ? (isKhmer ? 'ដុល្លារចុះខ្សោយ (Weak USD)' : 'Dollar Retreat Support')
        : (isKhmer ? 'តម្រូវការទីផ្សារមាសឡើង' : 'Bullion Upward Momentum'),
      impactTitle: isKhmer ? 'ឥទ្ធិពលលើមាស: និន្នាការកើនឡើង (Bullish)' : 'Gold Impact: Upward Momentum (Bullish)',
      explanation: isDipBuy
        ? (isKhmer
            ? 'ស្ថាប័នហិរញ្ញវត្ថុ និងអ្នកវិនិយោគធំៗកំពុងឆ្លៀតឱកាសទិញស្រូបយក (Dip Buying) នៅកម្រិត Support សំខាន់ ដែលជួយរុញតម្លៃមាសឡើងវិញ។'
            : 'Institutional investors and dip-buyers are aggressively defending key support levels, setting the stage for strong upside expansion.')
        : isBullishDollar
        ? (isKhmer
            ? 'ប្រាក់ដុល្លារអាមេរិក (USD) ចុះថមថយ និង Yields ធ្លាក់ចុះ បង្កើតឱកាសល្អបំផុតសម្រាប់ការកើនឡើងនៃតម្លៃមាស XAU/USD។'
            : 'A softening US Dollar and retreating yields make gold more attractive for global investors, fueling buying momentum on XAU/USD.')
        : (isKhmer
            ? 'តម្រូវការទិញមាសមានកម្លាំងខ្លាំង ជួយរុញច្រានតម្លៃឱ្យបំបែកទម្លុះកម្រិតតស៊ូ (Resistance) ឡើងលើ។'
            : 'Sustained precious metal inflows and positive technical momentum are propelling spot gold into higher liquidity pools.'),
      tradingTip: isKhmer
        ? 'គន្លឹះ: ស្វែងរកឱកាស Buy នៅតំបន់ Discount / Demand Zone ឬរង់ចាំ Liquidity Sweep មុនចូល Order។'
        : 'Pro Tip: Favor bullish order block retests and buy setups at discount pricing during New York & London sessions.',
    };
  }

  // Fallback: Neutral
  return {
    direction: 'neutral',
    biasTag: isKhmer ? '■ អព្យាក្រឹត (Consolidation)' : '■ NEUTRAL / CONSOLIDATION',
    shortBadge: isKhmer ? 'អព្យាក្រឹត' : 'Neutral',
    badgeClass: 'gna-flat',
    driverTag: isKhmer ? 'ទីផ្សារកំពុងស្ទង់ស្ទាប' : 'Market Consolidation',
    impactTitle: isKhmer ? 'ឥទ្ធិពលលើមាស: ទីផ្សារស្ទង់ស្ទាប' : 'Gold Impact: Neutral Consolidation',
    explanation: isKhmer
      ? 'ព័ត៌មាននេះមិនទាន់មានកម្លាំងជំរុញគ្រប់គ្រាន់ដើម្បីផ្លាស់ប្តូរទិសដៅមាសទាំងស្រុងនោះទេ។ ទីផ្សារកំពុងស្ថិតក្នុងរង្វង់ Sideway។'
      : 'This headline has moderate or balanced market implications. Spot gold is likely to maintain sideways consolidation within current ranges.',
    tradingTip: isKhmer
      ? 'គន្លឹះ: ជួញដូរតាម Range (Buy Support / Sell Resistance) ឬរង់ចាំការ Breakout ច្បាស់លាស់។'
      : 'Pro Tip: Trade the range boundaries (buy support, sell resistance) or wait for a confirmed market structure break.',
  };
}

