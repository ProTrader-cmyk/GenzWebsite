import { useEffect, useMemo, useRef, useState } from 'react';
import { INTRADAY_STRATEGY_STATS, SCALP_STRATEGY_STATS } from '../data/backtestSignals.js';
import '../styles/featureShowcase.css';

// Four feature cards on the home page. Every number is either live (gold price), computed from the
// audited backtest data, or calculated from the visitor's own inputs. Nothing is invented.

const TEXT = {
  en: {
    live: { tag: 'LIVE DATA', title: 'AI-Supported Fundamental Analysis', desc: 'AI-assisted macroeconomic and technical audits, so every red-folder USD event is read with data, not guesswork.', sym: 'Gold XAU/USD', wait: 'Waiting for live ticks…', feed: 'Live from the market feed', since: 'Since you opened this page', high: 'High', low: 'Low', chg: 'Change' },
    win: { tag: 'BACKTEST', title: 'Dual Strategy Win-Rate Tracking', desc: 'Two strategies verified on historical XAUUSD data and tracked side by side, so you can see what each one did over a full sample.', scalp: 'Pip Scalp · 1M-5M', intra: 'Intraday · 5M ICT', closed: 'trades', note: 'Historical results. Not a promise of future returns.' },
    size: { tag: 'CALCULATOR', title: 'Precision Position Sizing', desc: 'Set your balance and risk, and see the exact lot size. Try it: this is the same maths Pip applies to every setup.', balance: 'Account balance', risk: 'Risk per trade', stop: 'Stop-loss', riskAmt: 'You risk', lot: 'Lot size', target: 'Target at 1:2', hint: 'Gold: 1 lot moves $100 per $1.' },
    eq: { tag: 'BACKTEST', title: 'Drawdown Protection & Equity Growth', desc: 'A fixed risk per trade and a daily loss limit keep losing streaks small, so the equity curve can keep growing.', bal: 'Backtest', start: 'Start', trades: 'trades', note: 'Simulated $10,000 backtest account, last 7 trading days.' },
  },
  km: {
    live: { tag: 'ទិន្នន័យផ្ទាល់', title: 'ការវិភាគ AI Fundamental & Macro', desc: 'ការវិភាគ Macro និងបច្ចេកទេសដោយជំនួយ AI ដើម្បីអានព្រឹត្តិការណ៍ USD ដោយទិន្នន័យ មិនមែនការស្មាន។', sym: 'មាស XAU/USD', wait: 'កំពុងរង់ចាំតម្លៃផ្ទាល់…', feed: 'ផ្ទាល់ពីប្រភពទីផ្សារ', since: 'តាំងពីអ្នកបើកទំព័រនេះ', high: 'ខ្ពស់បំផុត', low: 'ទាបបំផុត', chg: 'ការប្រែប្រួល' },
    win: { tag: 'BACKTEST', title: 'តាមដានអត្រាឈ្នះ ២ យុទ្ធសាស្ត្រ', desc: 'យុទ្ធសាស្ត្រពីរត្រូវបានផ្ទៀងផ្ទាត់លើទិន្នន័យ XAUUSD ប្រវត្តិសាស្ត្រ ហើយតាមដានជាប់គ្នា។', scalp: 'Pip Scalp · 1M-5M', intra: 'Intraday · 5M ICT', closed: 'ការជួញដូរ', note: 'លទ្ធផលប្រវត្តិសាស្ត្រ មិនមែនការធានាអនាគតទេ។' },
    size: { tag: 'ម៉ាស៊ីនគណនា', title: 'ការគណនា Lot Size ឱ្យត្រឹមត្រូវ', desc: 'កំណត់សមតុល្យ និងហានិភ័យ រួចមើល Lot Size ពិតប្រាកដ។ នេះជារូបមន្តដូច Pip ប្រើលើគ្រប់ Setup។', balance: 'សមតុល្យគណនី', risk: 'ហានិភ័យក្នុងមួយការជួញដូរ', stop: 'Stop-loss', riskAmt: 'អ្នកប្រថុយ', lot: 'Lot Size', target: 'គោលដៅ 1:2', hint: 'មាស៖ 1 Lot ប្រែប្រួល $100 ក្នុង $1។' },
    eq: { tag: 'BACKTEST', title: 'ការពារ Drawdown & កំណើនដើមទុន', desc: 'ហានិភ័យថេរក្នុងមួយការជួញដូរ និងដែនកំណត់ខាតប្រចាំថ្ងៃ ជួយឱ្យខាតជាប់គ្នាតូច ហើយដើមទុនអាចលូតលាស់។', bal: 'Backtest', start: 'ចាប់ផ្តើម', trades: 'ការជួញដូរ', note: 'គណនី Backtest $10,000 ក្លែងធ្វើ ៧ ថ្ងៃជួញដូរចុងក្រោយ។' },
  },
};

function useInView(ref, once = true) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once]);
  return seen;
}

function useCountUp(target, run, ms = 1100) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [v, setV] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!run) return undefined;
    if (reduce) { setV(target); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms, reduce]);
  return v;
}

const money = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---- card 1: live gold ----------------------------------------------------
function LiveCard({ t, price }) {
  const ticks = useRef([]);
  const [, bump] = useState(0);
  const prev = useRef(null);
  const [dir, setDir] = useState('');

  useEffect(() => {
    if (!price) return;
    const p = Number(price);
    if (prev.current != null && p !== prev.current) setDir(p > prev.current ? 'up' : 'down');
    prev.current = p;
    ticks.current = [...ticks.current, p].slice(-48);
    bump((n) => n + 1);
  }, [price]);

  const pts = ticks.current;
  let path = '';
  let area = '';
  let last = null;
  if (pts.length > 1) {
    const lo = Math.min(...pts);
    const hi = Math.max(...pts);
    const span = hi - lo || 1;
    const xy = pts.map((p, i) => [(i / (pts.length - 1)) * 300, 56 - ((p - lo) / span) * 46]);
    path = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    area = `${path} L300 70 L0 70 Z`;
    last = xy[xy.length - 1];
  }

  return (
    <div className="fs-visual fs-live">
      <div className="fs-live-top">
        <span className="fs-sym">{t.sym}</span>
        <span className="fs-livebadge"><i />LIVE</span>
      </div>
      {price ? (
        <div className={`fs-price ${dir}`} key={price}>${money(Number(price))}</div>
      ) : (
        <div className="fs-price skel" />
      )}
      <svg viewBox="0 0 300 70" preserveAspectRatio="none" className="fs-spark" aria-hidden="true">
        <defs><linearGradient id="fsSpark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity=".35" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
        {path ? (
          <>
            <path d={area} fill="url(#fsSpark)" />
            <path d={path} className="fs-spark-line" />
            <circle cx={last[0]} cy={last[1]} r="4" className="fs-spark-dot" />
          </>
        ) : (
          <line x1="0" x2="300" y1="40" y2="40" className="fs-spark-flat" />
        )}
      </svg>
      {pts.length > 1 && (
        <div className="fs-stats">
          <div><small>{t.high}</small><b className="fs-mono">{money(Math.max(...pts))}</b></div>
          <div><small>{t.low}</small><b className="fs-mono">{money(Math.min(...pts))}</b></div>
          <div><small>{t.chg}</small><b className={`fs-mono ${pts[pts.length - 1] - pts[0] >= 0 ? 'up' : 'dn'}`}>{pts[pts.length - 1] - pts[0] >= 0 ? '+' : ''}{money(pts[pts.length - 1] - pts[0])}</b></div>
        </div>
      )}
      <div className="fs-foot">{pts.length > 1 ? `${t.feed} · ${t.since}` : t.wait}</div>
    </div>
  );
}

// ---- card 2: win rates ----------------------------------------------------
function WinRow({ label, stats, color, run, closedLabel }) {
  const rate = useCountUp(stats.winRatePct, run);
  const total = stats.winsCount + stats.lossesCount + (stats.breakevenCount || 0);
  return (
    <div className="fs-win-row">
      <div className="fs-win-head">
        <span style={{ color }}>{label}</span>
        <strong className="fs-mono" style={{ color }}>{rate.toFixed(1)}%</strong>
      </div>
      <div className="fs-bar" title={`${stats.winsCount}W / ${stats.lossesCount}L / ${stats.breakevenCount || 0}BE`}>
        <i className="win" style={{ width: run ? `${(stats.winsCount / total) * 100}%` : 0, background: color }} />
        <i className="be" style={{ width: run ? `${((stats.breakevenCount || 0) / total) * 100}%` : 0 }} />
        <i className="loss" style={{ width: run ? `${(stats.lossesCount / total) * 100}%` : 0 }} />
      </div>
      <div className="fs-win-meta fs-mono">{stats.winsCount}W · {stats.lossesCount}L{stats.breakevenCount ? ` · ${stats.breakevenCount}BE` : ''} · {total} {closedLabel}</div>
    </div>
  );
}
function WinCard({ t, run }) {
  return (
    <div className="fs-visual fs-win">
      <WinRow label={t.scalp} stats={SCALP_STRATEGY_STATS} color="#10B981" run={run} closedLabel={t.closed} />
      <WinRow label={t.intra} stats={INTRADAY_STRATEGY_STATS} color="#F59E0B" run={run} closedLabel={t.closed} />
      <div className="fs-foot">{t.note}</div>
    </div>
  );
}

// ---- card 3: position size calculator -------------------------------------
const BALANCES = [500, 1000, 5000, 10000];
function SizeCard({ t }) {
  const [balance, setBalance] = useState(1000);
  const [riskPct, setRiskPct] = useState(1);
  const stopUsd = 10; // example stop distance in gold dollars
  const riskAmt = balance * (riskPct / 100);
  const lotRaw = riskAmt / (stopUsd * 100);
  const lot = Math.max(0.01, Math.floor(lotRaw * 100) / 100);
  const realRisk = lot * stopUsd * 100;
  const tooSmall = lotRaw < 0.01;

  return (
    <div className="fs-visual fs-size">
      <div className="fs-label">{t.balance}</div>
      <div className="fs-chips" role="group" aria-label={t.balance}>
        {BALANCES.map((b) => (
          <button key={b} type="button" className={b === balance ? 'on' : ''} onClick={() => setBalance(b)}>${money(b, 0)}</button>
        ))}
      </div>
      <label className="fs-range">
        <span>{t.risk}<b className="fs-mono">{riskPct.toFixed(1)}%</b></span>
        <input type="range" min="0.5" max="2" step="0.5" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} />
      </label>
      <div className="fs-calc">
        <div><small>{t.stop}</small><b className="fs-mono">${stopUsd}</b></div>
        <div><small>{t.riskAmt}</small><b className="fs-mono dn">${money(tooSmall ? realRisk : riskAmt)}</b></div>
        <div><small>{t.lot}</small><b className="fs-mono key" key={`${balance}-${riskPct}`}>{lot.toFixed(2)}</b></div>
        <div><small>{t.target}</small><b className="fs-mono up">+${money((tooSmall ? realRisk : riskAmt) * 2)}</b></div>
      </div>
      <div className="fs-rr" aria-hidden="true"><i className="risk" /><i className="reward" /></div>
      <div className="fs-foot">{t.hint}</div>
    </div>
  );
}

// ---- card 4: equity curve -------------------------------------------------
function EquityCard({ t, portfolio, startBalance, run }) {
  const bars = portfolio?.barData || [];
  const net = portfolio?.netProfit ?? 0;
  const roi = portfolio?.roiPercent ?? 0;
  const vals = [startBalance, ...bars.map((b) => b.val)];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const xy = vals.map((v, i) => [vals.length === 1 ? 150 : (i / (vals.length - 1)) * 300, 60 - ((v - lo) / span) * 46]);
  const path = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = xy[xy.length - 1];
  const totalTrades = bars.reduce((s, b) => s + (b.tradesCount || 0), 0);
  const up = net >= 0;

  return (
    <div className={`fs-visual fs-eq ${run ? 'run' : ''}`}>
      <div className="fs-eq-top">
        <span>{t.bal}</span>
        <strong className={`fs-mono ${up ? 'up' : 'dn'}`}>{up ? '+' : '-'}${money(Math.abs(net))} <em>({up ? '+' : ''}{roi.toFixed(1)}%)</em></strong>
      </div>
      <svg viewBox="0 0 300 70" preserveAspectRatio="none" className="fs-eq-svg" aria-hidden="true">
        <defs><linearGradient id="fsEq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={up ? '#22C55E' : '#F87171'} stopOpacity=".35" /><stop offset="1" stopColor={up ? '#22C55E' : '#F87171'} stopOpacity="0" /></linearGradient></defs>
        <line x1="0" x2="300" y1={60 - ((startBalance - lo) / span) * 46} y2={60 - ((startBalance - lo) / span) * 46} className="fs-eq-base" />
        <path d={`${path} L300 70 L0 70 Z`} fill="url(#fsEq)" className="fs-eq-area" />
        <path d={path} className={`fs-eq-line ${up ? 'up' : 'dn'}`} pathLength="1" />
        <circle cx={last[0]} cy={last[1]} r="4.5" className={`fs-eq-dot ${up ? 'up' : 'dn'}`} />
      </svg>
      <div className="fs-eq-stats fs-mono"><span>{t.start} ${money(startBalance, 0)}</span><span>{bars.length}d · {totalTrades} {t.trades}</span></div>
      <div className="fs-foot">{t.note}</div>
    </div>
  );
}

// ---- section ---------------------------------------------------------------
export default function FeatureShowcase({ isKhmer, liveGoldPrice, portfolio, startBalance = 10000 }) {
  const t = isKhmer ? TEXT.km : TEXT.en;
  const ref = useRef(null);
  const seen = useInView(ref);
  const cards = useMemo(() => [
    { n: '01', ...t.live, visual: <LiveCard t={t.live} price={liveGoldPrice} /> },
    { n: '02', ...t.win, visual: <WinCard t={t.win} run={seen} /> },
    { n: '03', ...t.size, visual: <SizeCard t={t.size} /> },
    { n: '04', ...t.eq, visual: <EquityCard t={t.eq} portfolio={portfolio} startBalance={startBalance} run={seen} /> },
  ], [t, liveGoldPrice, portfolio, startBalance, seen, isKhmer]);

  return (
    <div className={`fs-grid ${seen ? 'is-in' : ''}`} ref={ref}>
      {cards.map((c, i) => (
        <article key={c.n} className="fs-card" style={{ '--i': i }}>
          <header className="fs-card-head"><span className="fs-num">{c.n}</span><span className="fs-tag">{c.tag}</span></header>
          {c.visual}
          <h3 className="fs-title">{c.title}</h3>
          <p className="fs-desc">{c.desc}</p>
        </article>
      ))}
    </div>
  );
}
