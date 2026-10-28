import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchLivePrice, formatSpotPrice, subscribeLiveTicks } from '../services/marketPriceService.js';
import '../styles/howPipWorks.css';

// "How Pip works" explainer. Everything here describes what the system really does:
// live candles -> indicators + filters -> rule-checked AI answer -> delivery. No invented stats.

const STEP_MS = 6000;

const TEXT = {
  en: {
    pill: 'PIP PROTOCOL • HOW IT WORKS',
    title: 'How Pip Finds a Trade, Step by Step',
    sub: 'Every closed 15-minute candle, Pip reads the market, checks it against strict rules, and only speaks up when a real setup passes. Most of the time the honest answer is "no trade".',
    radar: 'PIP RADAR',
    live: 'LIVE',
    steps: [
      { key: 'ingest', title: 'INGEST', sub: 'Live candles', doing: 'Reading live M5, M15, H1 and H4 candles…', log: 'candles synced · M5 / M15 / H1 / H4 · waiting for the 15m candle to close' },
      { key: 'detect', title: 'DETECT', sub: 'Indicators & levels', doing: 'Measuring trend, momentum and key levels…', log: 'EMA, RSI, MACD, ATR and support/resistance calculated · choppy-market filter applied' },
      { key: 'validate', title: 'VALIDATE', sub: 'AI + hard rules', doing: 'Checking the AI answer against the rules…', log: 'AI answered in a fixed format · stop-loss, risk-reward and confidence verified' },
      { key: 'dispatch', title: 'DISPATCH', sub: 'Signal delivery', doing: 'Delivering the signal…', log: 'signal published · duplicates blocked · you confirm any order yourself' },
    ],
    ingestTitle: 'Four timeframes, one picture',
    ingestNote: 'Higher timeframes give direction, lower ones give the entry.',
    nextCandle: 'Next 15m candle closes in',
    detectTitle: 'What Pip measures',
    illustration: 'Illustration',
    chips: ['EMA 20 / 50 / 200 trend', 'RSI 14 momentum', 'MACD direction', 'ATR 14 volatility', 'Support & resistance', 'Choppy-market filter'],
    resistance: 'Resistance',
    support: 'Support',
    validateTitle: 'The AI can suggest. The rules decide.',
    checks: [
      'Answer must be buy, sell or hold, with entry, stop-loss and take-profit',
      'Stop-loss on the correct side and sized to current volatility (ATR)',
      'Risk-reward at least 1 : 2',
      'Confidence at least 70%',
      'Choppy, unclear or closed market → no trade',
    ],
    noTrade: 'No trade is a valid answer',
    verdicts: ['BUY', 'SELL', 'HOLD'],
    dispatchTitle: 'Delivered, then left to you',
    channels: [
      ['Signal feed', 'Appears on the site instantly'],
      ['Push alerts', 'Sent to member devices'],
      ['Telegram', 'Posted to the channel when connected'],
      ['Duplicate guard', 'No second signal at the same level'],
    ],
    sent: 'SENT',
    guard: 'ACTIVE',
    youDecide: 'Pip never places a trade for you. You review the setup and confirm every order yourself.',
    waiting: 'PIP IS',
    example: 'EXAMPLE LAYOUT',
    entry: 'Entry',
    stop: 'Stop-loss',
    take: 'Take-profit',
    rr: 'Risk / reward',
    conf: 'Confidence',
    atLive: 'at live price',
    stopHow: 'beyond structure, sized by ATR',
    takeHow: 'next support / resistance',
    rrHow: 'minimum 1 : 2',
    confHow: 'minimum 70%',
    pause: 'Paused while you look',
  },
  km: {
    pill: 'PIP PROTOCOL • របៀបដំណើរការ',
    title: 'របៀបដែល Pip រកឃើញឱកាសជួញដូរ ជាជំហានៗ',
    sub: 'រាល់ Candle 15 នាទីដែលបិទ Pip អានទីផ្សារ ផ្ទៀងផ្ទាត់តាមច្បាប់តឹងរ៉ឹង ហើយប្រាប់តែនៅពេលមានឱកាសពិតប្រាកដ។ ភាគច្រើនចម្លើយដោយស្មោះត្រង់គឺ «មិនគួរជួញដូរ»។',
    radar: 'PIP RADAR',
    live: 'LIVE',
    steps: [
      { key: 'ingest', title: 'ប្រមូល', sub: 'Candle ផ្ទាល់', doing: 'កំពុងអាន Candle M5, M15, H1 និង H4…', log: 'ទិន្នន័យ M5 / M15 / H1 / H4 ត្រូវបានធ្វើសមកាលកម្ម · រង់ចាំ Candle 15 នាទីបិទ' },
      { key: 'detect', title: 'រកឃើញ', sub: 'សូចនាករ និងកម្រិត', doing: 'កំពុងវាស់និន្នាការ សន្ទុះ និងកម្រិតសំខាន់…', log: 'EMA, RSI, MACD, ATR និង Support/Resistance ត្រូវបានគណនា · ច្រោះទីផ្សារមិនច្បាស់' },
      { key: 'validate', title: 'ផ្ទៀងផ្ទាត់', sub: 'AI + ច្បាប់តឹងរ៉ឹង', doing: 'កំពុងផ្ទៀងផ្ទាត់ចម្លើយ AI តាមច្បាប់…', log: 'AI ឆ្លើយតាមទម្រង់ថេរ · ផ្ទៀងផ្ទាត់ Stop-loss, R:R និងទំនុកចិត្ត' },
      { key: 'dispatch', title: 'បញ្ជូន', sub: 'ផ្ញើសញ្ញា', doing: 'កំពុងបញ្ជូនសញ្ញា…', log: 'សញ្ញាត្រូវបានផ្សាយ · ទប់ស្កាត់សញ្ញាស្ទួន · អ្នកជាអ្នកបញ្ជាក់ការបញ្ជាទិញខ្លួនឯង' },
    ],
    ingestTitle: 'Timeframe បួន ក្នុងរូបភាពតែមួយ',
    ingestNote: 'Timeframe ធំផ្តល់ទិសដៅ ហើយតូចផ្តល់ចំណុចចូល។',
    nextCandle: 'Candle 15 នាទីបន្ទាប់បិទក្នុង',
    detectTitle: 'អ្វីដែល Pip វាស់',
    illustration: 'រូបភាពគំនូរ',
    chips: ['និន្នាការ EMA 20 / 50 / 200', 'សន្ទុះ RSI 14', 'ទិសដៅ MACD', 'ភាពប្រែប្រួល ATR 14', 'Support & Resistance', 'ត្រង់ទីផ្សារមិនច្បាស់'],
    resistance: 'Resistance',
    support: 'Support',
    validateTitle: 'AI អាចស្នើ ប៉ុន្តែច្បាប់ជាអ្នកសម្រេច',
    checks: [
      'ចម្លើយត្រូវជា buy, sell ឬ hold ជាមួយ Entry, Stop-loss និង Take-profit',
      'Stop-loss នៅខាងត្រឹមត្រូវ ហើយសមស្របនឹងភាពប្រែប្រួល (ATR)',
      'Risk-reward យ៉ាងតិច 1 : 2',
      'ទំនុកចិត្តយ៉ាងតិច 70%',
      'ទីផ្សារមិនច្បាស់ ឬបិទ → មិនជួញដូរ',
    ],
    noTrade: 'ការមិនជួញដូរគឺជាចម្លើយត្រឹមត្រូវ',
    verdicts: ['BUY', 'SELL', 'HOLD'],
    dispatchTitle: 'បញ្ជូនរួច ហើយទុកឱ្យអ្នកសម្រេច',
    channels: [
      ['Signal feed', 'បង្ហាញលើគេហទំព័រភ្លាមៗ'],
      ['Push alerts', 'ផ្ញើទៅឧបករណ៍សមាជិក'],
      ['Telegram', 'ផ្សាយក្នុង Channel នៅពេលភ្ជាប់'],
      ['ការពារសញ្ញាស្ទួន', 'គ្មានសញ្ញាទីពីរនៅកម្រិតដូចគ្នា'],
    ],
    sent: 'បានផ្ញើ',
    guard: 'ដំណើរការ',
    youDecide: 'Pip មិនដែលជួញដូរជំនួសអ្នកទេ។ អ្នកពិនិត្យ ហើយបញ្ជាក់រាល់ការបញ្ជាទិញដោយខ្លួនឯង។',
    waiting: 'PIP កំពុង',
    example: 'ទម្រង់គំរូ',
    entry: 'Entry',
    stop: 'Stop-loss',
    take: 'Take-profit',
    rr: 'Risk / reward',
    conf: 'ទំនុកចិត្ត',
    atLive: 'តម្លៃផ្ទាល់',
    stopHow: 'ក្រោយរចនាសម្ព័ន្ធ តាម ATR',
    takeHow: 'Support / Resistance បន្ទាប់',
    rrHow: 'យ៉ាងតិច 1 : 2',
    confHow: 'យ៉ាងតិច 70%',
    pause: 'ផ្អាកពេលអ្នកកំពុងមើល',
  },
};

// ---- small helpers -------------------------------------------------------

function useCandleCountdown() {
  const calc = () => {
    const now = new Date();
    const left = (15 - (now.getMinutes() % 15)) * 60 - now.getSeconds();
    return { left, pct: ((900 - left) / 900) * 100, text: `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` };
  };
  const [v, setV] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setV(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return v;
}

function Typing({ text, speed = 16 }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return undefined;
    setN(0);
    const t = setInterval(() => setN((c) => (c >= text.length ? c : c + 1)), speed);
    return () => clearInterval(t);
  }, [text, speed, reduce]);
  return <>{text.slice(0, n)}<span className="hpw-caret" /></>;
}

// Deterministic illustrative candles: drift up, sweep a high, then reject.
function makeCandles() {
  const closes = [];
  for (let i = 0; i < 26; i += 1) {
    const base = i < 13 ? 38 + i * 2.6 : 72 - (i - 13) * 3.3;
    closes.push(base + Math.sin(i * 1.9) * 3.2);
  }
  return closes.map((c, i) => {
    const o = i === 0 ? c - 2 : closes[i - 1];
    const wick = 2.5 + Math.abs(Math.sin(i * 2.7)) * 3.5;
    return { o, c, h: Math.max(o, c) + wick, l: Math.min(o, c) - wick };
  });
}
const CANDLES = makeCandles();
const Y = (v) => 195 - (v - 25.2) * 3.075;

const ICONS = [
  <svg key="i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" /></svg>,
  <svg key="i2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  <svg key="i3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  <svg key="i4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
];

// ---- stage panes ---------------------------------------------------------

function IngestPane({ t, countdown }) {
  const tfs = ['M5', 'M15', 'H1', 'H4'];
  return (
    <div className="hpw-pane">
      <h4 className="hpw-pane-title">{t.ingestTitle}</h4>
      <div className="hpw-tf-grid">
        {tfs.map((tf, i) => (
          <div key={tf} className={`hpw-tf ${tf === 'M15' ? 'is-key' : ''}`} style={{ '--d': `${i * 120}ms` }}>
            <div className="hpw-tf-bars">
              {[0, 1, 2, 3, 4, 5, 6].map((b) => <i key={b} style={{ '--h': `${30 + ((b * 37 + i * 19) % 60)}%`, '--bd': `${b * 90 + i * 140}ms` }} />)}
            </div>
            <b>{tf}</b>
          </div>
        ))}
      </div>
      <p className="hpw-note">{t.ingestNote}</p>
      <div className="hpw-countdown">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="18" className="trk" />
          <circle cx="22" cy="22" r="18" className="bar" style={{ strokeDashoffset: 113 - (113 * countdown.pct) / 100 }} />
        </svg>
        <div><span>{t.nextCandle}</span><strong className="hpw-mono">{countdown.text}</strong></div>
      </div>
    </div>
  );
}

function DetectPane({ t }) {
  const hi = Math.max(...CANDLES.map((c) => c.h));
  const lo = Math.min(...CANDLES.map((c) => c.l));
  return (
    <div className="hpw-pane">
      <h4 className="hpw-pane-title">{t.detectTitle} <em>{t.illustration}</em></h4>
      <div className="hpw-chart">
        <div className="hpw-beam" />
        <svg viewBox="0 0 640 230" preserveAspectRatio="none" aria-hidden="true">
          <g className="hpw-lvl res"><line x1="0" x2="640" y1={Y(hi) - 4} y2={Y(hi) - 4} /><text x="632" y={Y(hi) - 10} textAnchor="end">{t.resistance}</text></g>
          <g className="hpw-lvl sup"><line x1="0" x2="640" y1={Y(lo) + 4} y2={Y(lo) + 4} /><text x="632" y={Y(lo) + 18} textAnchor="end">{t.support}</text></g>
          {CANDLES.map((c, i) => {
            const x = 22 + i * 24;
            const up = c.c >= c.o;
            return (
              <g key={i} className={`hpw-candle ${up ? 'up' : 'dn'}`} style={{ '--i': i }}>
                <line x1={x} x2={x} y1={Y(c.h)} y2={Y(c.l)} />
                <rect x={x - 6} width="12" y={Y(Math.max(c.o, c.c))} height={Math.max(3, Math.abs(Y(c.o) - Y(c.c)))} rx="2" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="hpw-chips">
        {t.chips.map((c, i) => <span key={c} className="hpw-chip" style={{ '--d': `${400 + i * 260}ms` }}><i />{c}</span>)}
      </div>
    </div>
  );
}

function ValidatePane({ t }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setV((x) => (x + 1) % 3), 1100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hpw-pane">
      <h4 className="hpw-pane-title">{t.validateTitle}</h4>
      <ul className="hpw-checks">
        {t.checks.map((c, i) => (
          <li key={c} style={{ '--d': `${i * 520}ms` }}>
            <span className="hpw-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <div className="hpw-verdicts" aria-hidden="true">
        {t.verdicts.map((x, i) => <span key={x} className={`${x.toLowerCase()} ${v === i ? 'on' : ''}`}>{x}</span>)}
      </div>
      <div className="hpw-callout">{t.noTrade}</div>
    </div>
  );
}

function DispatchPane({ t }) {
  return (
    <div className="hpw-pane">
      <h4 className="hpw-pane-title">{t.dispatchTitle}</h4>
      <div className="hpw-channels">
        {t.channels.map(([name, desc], i) => (
          <div key={name} className="hpw-channel" style={{ '--d': `${i * 450}ms` }}>
            <div><strong>{name}</strong><span>{desc}</span></div>
            <em>{i === 3 ? t.guard : t.sent}</em>
          </div>
        ))}
      </div>
      <div className="hpw-callout you">{t.youDecide}</div>
    </div>
  );
}

// ---- main ----------------------------------------------------------------

export default function HowPipWorks({ isKhmer }) {
  const t = isKhmer ? TEXT.km : TEXT.en;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef(null);
  const countdown = useCandleCountdown();
  const [price, setPrice] = useState(null);

  // real gold price in the header + example card
  useEffect(() => {
    let alive = true;
    fetchLivePrice('XAUUSD').then((p) => { if (alive && p) setPrice(p); });
    const unsub = subscribeLiveTicks(['XAUUSD'], (_pair, p) => { if (alive && p) setPrice(p); });
    return () => { alive = false; unsub?.(); };
  }, []);

  // only animate while on screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !paused;
  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => setActive((s) => (s + 1) % 4), STEP_MS);
    return () => clearTimeout(timer);
  }, [active, running]);

  const go = useCallback((i) => setActive(i), []);
  const step = t.steps[active];
  const logText = useMemo(() => `[PIP-${step.key.toUpperCase()}] ${step.log}`, [step]);

  const pane = [<IngestPane key="a" t={t} countdown={countdown} />, <DetectPane key="b" t={t} />, <ValidatePane key="c" t={t} />, <DispatchPane key="d" t={t} />][active];

  return (
    <section className="lnd-section lnd-how-pip-section" id="how-pip-works" ref={rootRef}>
      <div className="lnd-container">
        <div className="lnd-section-header">
          <span className="lnd-section-pill"><span className="pip-header-sparkle">✦</span>{t.pill}</span>
          <h2 className="lnd-section-title">{t.title}</h2>
          <p className="lnd-section-sub">{t.sub}</p>
        </div>

        <div
          className="hpw"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="hpw-top">
            <div className="hpw-brand"><span className="hpw-dot" />{t.radar}</div>
            <div className="hpw-ticker">
              <b>XAUUSD</b><span>15m</span>
              <strong className="hpw-mono">{price ? formatSpotPrice('XAUUSD', price) : '---'}</strong>
              <em><i />{t.live}</em>
            </div>
          </div>

          <ol className="hpw-steps">
            {t.steps.map((s, i) => (
              <li key={s.key} className={`${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}>
                <button type="button" onClick={() => go(i)} aria-current={i === active ? 'step' : undefined}>
                  <span className="hpw-step-icon">{ICONS[i]}</span>
                  <span className="hpw-step-meta"><small>0{i + 1}</small><strong>{s.title}</strong><span>{s.sub}</span></span>
                  <span className="hpw-step-progress"><i key={`${i}-${active}-${running}`} style={i === active ? { animationDuration: `${STEP_MS}ms`, animationPlayState: running ? 'running' : 'paused' } : undefined} /></span>
                </button>
              </li>
            ))}
          </ol>

          <div className="hpw-body">
            <div className="hpw-stage" key={active}>{pane}</div>

            <aside className="hpw-side">
              {active < 3 ? (
                <div className="hpw-wait" key={`w${active}`}>
                  <div className="hpw-wait-head"><span className="hpw-spin" />{t.waiting}</div>
                  <p>{step.doing}</p>
                  <div className="hpw-skel"><i /><i /><i /></div>
                </div>
              ) : (
                <div className="hpw-example" key="ex">
                  <div className="hpw-ex-head"><b>XAUUSD</b><em>{t.example}</em></div>
                  <dl>
                    <div><dt>{t.entry}</dt><dd className="hpw-mono">{price ? formatSpotPrice('XAUUSD', price) : t.atLive}<small>{t.atLive}</small></dd></div>
                    <div><dt>{t.stop}</dt><dd className="sl">{t.stopHow}</dd></div>
                    <div><dt>{t.take}</dt><dd className="tp">{t.takeHow}</dd></div>
                    <div><dt>{t.rr}</dt><dd>{t.rrHow}</dd></div>
                    <div><dt>{t.conf}</dt><dd>{t.confHow}</dd></div>
                  </dl>
                </div>
              )}
            </aside>
          </div>

          <div className="hpw-log hpw-mono" aria-live="off"><Typing key={active} text={logText} /></div>
          {paused && <div className="hpw-paused">{t.pause}</div>}
        </div>
      </div>
    </section>
  );
}
