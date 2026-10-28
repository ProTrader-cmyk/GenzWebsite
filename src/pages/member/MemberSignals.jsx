import { useEffect, useMemo, useState } from 'react';
import { subscribeSignals } from '../../data/signals.js';
import { BACKTEST_SIGNALS } from '../../data/backtestSignals.js';
import '../../styles/memberSignalHistory.css';

const toMillis = (value) => {
  if (value?.toMillis) return value.toMillis();
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
};

function signalDate(signal) {
  return toMillis(signal.publishedAt || signal.timestamp || signal.createdAt || signal._timeMs);
}

function instrumentOf(signal) {
  return String(signal.pair || signal.symbol || signal.instrument || '—').replace('/', '').toUpperCase();
}

function strategyOf(signal) {
  const text = `${signal.style || ''} ${signal.mode || ''} ${signal.strategy || ''} ${signal.strategy_version || ''}`.toLowerCase();
  if (text.includes('scalp')) return 'Scalp';
  if (text.includes('intraday') || text.includes('daytrade') || text.includes('day trade')) return 'Intraday';
  return signal.isBacktest ? 'Backtest' : 'Analysis';
}

function statusOf(signal) {
  const value = String(signal.status || '').toLowerCase();
  if (['active', 'open', 'live'].includes(value)) return 'Active';
  if (['waiting', 'pending', 'wait'].includes(value)) return 'Waiting';
  if (['cancelled', 'canceled'].includes(value)) return 'Cancelled';
  if (['expired'].includes(value)) return 'Expired';
  if (['tp', 'sl', 'be', 'breakeven', 'win', 'loss', 'completed', 'closed'].includes(value)) return 'Completed';
  return 'Waiting';
}

function price(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : String(value);
}

function timeframeOf(signal) {
  const timeframe = signal.timeframe || signal.time_frame || signal.interval || (strategyOf(signal) === 'Scalp' ? '1m / 5m' : '15m');
  return String(timeframe).replace(/\s+/g, ' ').toUpperCase();
}

function targetsOf(signal) {
  const first = signal.tp1 ?? signal.tp_1 ?? signal.takeProfit1 ?? signal.tp ?? signal.take_profit ?? signal.target;
  return [first, signal.tp2 ?? signal.tp_2 ?? signal.takeProfit2, signal.tp3 ?? signal.tp_3 ?? signal.takeProfit3];
}

function rrOf(signal) {
  const value = signal.rr || signal.riskReward || signal.planned_rr;
  if (typeof value === 'string' && value.includes(':')) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? `1:${parsed.toFixed(1)}` : '—';
}

function SignalDetails({ signal, onClose, onCopy, copied }) {
  const targets = targetsOf(signal);
  const status = statusOf(signal);
  const date = signalDate(signal);
  return <div className="mh-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="mh-detail" role="dialog" aria-modal="true" aria-labelledby="mh-detail-title">
      <header><div><span className="mh-eyebrow">SIGNAL DETAILS</span><h2 id="mh-detail-title">{instrumentOf(signal)} · {signal.direction?.toUpperCase() || '—'}</h2></div><button type="button" aria-label="Close details" onClick={onClose}>×</button></header>
      <div className="mh-detail-meta"><span className={`mh-status ${status.toLowerCase()}`}>{status}</span><span>{signal.isBacktest ? 'Historical record' : 'Live signal'}</span><span>{strategyOf(signal)} · {timeframeOf(signal)}</span><span>{date ? new Date(date).toLocaleString() : 'Date unavailable'}</span></div>
      <div className="mh-detail-levels"><div><small>Entry</small><b>{price(signal.entry ?? signal.entry_price ?? signal.entryPrice)}</b></div><div><small>Stop loss</small><b className="mh-down">{price(signal.sl ?? signal.stop_loss ?? signal.stopLoss)}</b></div>{targets.map((target, index) => <div key={index}><small>TP{index + 1}</small><b className="mh-up">{price(target)}</b></div>)}<div><small>Risk : Reward</small><b>{rrOf(signal)}</b></div><div><small>Break-even</small><b>{price(signal.beTrigger ?? signal.breakEvenTrigger)}</b></div></div>
      <div className="mh-detail-reason"><small>Analysis</small><p>{signal.reason || signal.analysis || signal.confluences?.join(' · ') || 'No additional analysis was saved with this signal.'}</p></div>
      <footer className="mh-detail-footer"><span>{signal.isBacktest ? 'Historical signal record' : 'Live member signal'}</span><button type="button" className="mh-view" onClick={() => onCopy(signal)}>{copied ? 'Copied' : 'Copy trade plan'}</button></footer>
    </section>
  </div>;
}

export default function MemberSignals() {
  const [liveSignals, setLiveSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrument, setInstrument] = useState('all');
  const [strategy, setStrategy] = useState('all');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [copiedSignalId, setCopiedSignalId] = useState('');

  useEffect(() => subscribeSignals((items) => {
    setLiveSignals(Array.isArray(items) ? items : []);
    setLoading(false);
  }), []);

  const allSignals = useMemo(() => {
    const keyed = new Map();
    for (const signal of [...BACKTEST_SIGNALS, ...liveSignals]) {
      const source = signal.isBacktest ? 'backtest' : 'live';
      const key = `${source}:${signal.id || signal.trade_id || `${instrumentOf(signal)}:${signalDate(signal)}`}`;
      keyed.set(key, { ...signal, id: signal.id || signal.trade_id || key });
    }
    return [...keyed.values()].sort((a, b) => signalDate(b) - signalDate(a));
  }, [liveSignals]);

  const instruments = useMemo(() => [...new Set(allSignals.map(instrumentOf))].filter((item) => item !== '—').sort(), [allSignals]);
  const filtered = useMemo(() => allSignals.filter((signal) => {
    const time = signalDate(signal);
    const afterFrom = !fromDate || (time && time >= new Date(`${fromDate}T00:00:00`).getTime());
    const beforeTo = !toDate || (time && time <= new Date(`${toDate}T23:59:59.999`).getTime());
    return (instrument === 'all' || instrumentOf(signal) === instrument)
      && (strategy === 'all' || strategyOf(signal).toLowerCase() === strategy)
      && (status === 'all' || statusOf(signal).toLowerCase() === status)
      && (!search.trim() || `${instrumentOf(signal)} ${signal.direction || ''} ${signal.reason || ''} ${Array.isArray(signal.confluences) ? signal.confluences.join(' ') : signal.confluences || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
      && afterFrom && beforeTo;
  }), [allSignals, instrument, strategy, status, fromDate, toDate, search]);

  function resetFilters() {
    setInstrument('all'); setStrategy('all'); setStatus('all'); setFromDate(''); setToDate(''); setSearch('');
  }

  async function copyTradePlan(signal) {
    const targets = targetsOf(signal);
    const text = [
      `${instrumentOf(signal)} ${String(signal.direction || '').toUpperCase()} - ${strategyOf(signal)} - ${timeframeOf(signal)}`,
      `Status: ${statusOf(signal)}`,
      `Entry: ${price(signal.entry ?? signal.entry_price ?? signal.entryPrice)}`,
      `Stop loss: ${price(signal.sl ?? signal.stop_loss ?? signal.stopLoss)}`,
      ...targets.map((target, index) => target ? `TP${index + 1}: ${price(target)}` : null).filter(Boolean),
      `Risk : Reward: ${rrOf(signal)}`,
      signal.reason || signal.analysis || '',
    ].filter(Boolean).join('\n');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Clipboard copy is unavailable.');
      }
      setCopiedSignalId(signal.id);
      window.setTimeout(() => setCopiedSignalId(''), 1800);
    } catch (err) {
      console.warn('[MemberSignals] Could not copy signal:', err);
    }
  }

  function exportFilteredCsv() {
    const columns = ['Date', 'Instrument', 'Strategy', 'Timeframe', 'Direction', 'Status', 'Entry', 'Stop Loss', 'TP1', 'TP2', 'TP3', 'Risk Reward', 'Analysis'];
    const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((signal) => {
      const targets = targetsOf(signal);
      const date = signalDate(signal);
      return [date ? new Date(date).toISOString() : '', instrumentOf(signal), strategyOf(signal), timeframeOf(signal),
        signal.direction || '', statusOf(signal), signal.entry ?? signal.entry_price ?? signal.entryPrice,
        signal.sl ?? signal.stop_loss ?? signal.stopLoss, ...targets, rrOf(signal), signal.reason || signal.analysis || ''];
    });
    const csv = `\uFEFF${[columns, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `genz-signal-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="mh-page" aria-labelledby="mh-title">
    {selected && <SignalDetails signal={selected} onClose={() => setSelected(null)} onCopy={copyTradePlan} copied={copiedSignalId === selected.id} />}
    <div className="mh-heading"><div><span className="mh-eyebrow">YOUR RECORD</span><h1 id="mh-title">Signal History</h1><p>Review live signals and historical signal records.</p></div><div className="mh-heading-actions"><div className="mh-total"><b>{filtered.length}</b><span>records</span></div><button type="button" className="mh-export" onClick={exportFilteredCsv} disabled={!filtered.length}>Export CSV</button></div></div>
    <div className="mh-filters">
      <label className="mh-search"><span>Search signals</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pair, direction, or setup" /></label>
      <label><span>Instrument</span><select value={instrument} onChange={(event) => setInstrument(event.target.value)}><option value="all">All Instruments</option>{instruments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Strategy</span><select value={strategy} onChange={(event) => setStrategy(event.target.value)}><option value="all">All Strategies</option><option value="scalp">Scalp</option><option value="intraday">Intraday</option><option value="analysis">Other / Analysis</option></select></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All Statuses</option><option value="waiting">Waiting</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></label>
      <label className="mh-date"><span>From</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
      <label className="mh-date"><span>To</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
      <button className="mh-reset" type="button" onClick={resetFilters}>↺ <span>Reset</span></button>
    </div>
    <div className="mh-table-wrap"><table className="mh-table"><thead><tr><th>Date</th><th>Instrument</th><th>Strategy</th><th>Timeframe</th><th>Direction</th><th>Status</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>R:R</th><th>Actions</th></tr></thead>
      <tbody>{filtered.map((signal) => { const targets = targetsOf(signal); const date = signalDate(signal); const state = statusOf(signal); return <tr key={`${signal.isBacktest ? 'history' : 'live'}-${signal.id}`}>
        <td className="mh-date-cell">{date ? <>{new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}<small>{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></> : '—'}</td>
        <td className="mh-instrument">{instrumentOf(signal)}</td><td>{strategyOf(signal)}{signal.isBacktest && <small className="mh-row-sub">Historical</small>}</td><td>{timeframeOf(signal)}</td><td><span className={`mh-direction ${(signal.direction || '').toLowerCase()}`}>{signal.direction?.toUpperCase() || '—'}</span></td><td><span className={`mh-status ${state.toLowerCase()}`}>{state}</span></td><td>{price(signal.entry ?? signal.entry_price ?? signal.entryPrice)}</td><td className="mh-down">{price(signal.sl ?? signal.stop_loss ?? signal.stopLoss)}</td>{targets.map((target, index) => <td className={target ? 'mh-up' : 'mh-muted'} key={index}>{price(target)}</td>)}<td>{rrOf(signal)}</td><td><div className="mh-row-actions"><button className="mh-view" type="button" onClick={() => setSelected(signal)}>View</button><button className="mh-copy" type="button" onClick={() => copyTradePlan(signal)}>{copiedSignalId === signal.id ? 'Copied' : 'Copy'}</button></div></td>
      </tr>; })}
      {!filtered.length && <tr><td colSpan="13" className="mh-empty">{loading ? 'Loading live records and historical signals…' : 'No records match these filters.'}</td></tr>}</tbody>
    </table></div>
    <div className="mh-mobile-list">{filtered.map((signal) => { const date = signalDate(signal); const state = statusOf(signal); const targets = targetsOf(signal); return <button type="button" className="mh-mobile-card" key={`mobile-${signal.isBacktest ? 'bt' : 'live'}-${signal.id}`} onClick={() => setSelected(signal)}><span className="mh-mobile-top"><b>{instrumentOf(signal)}</b><span className={`mh-status ${state.toLowerCase()}`}>{state}</span></span><span className="mh-mobile-meta">{strategyOf(signal)} · {timeframeOf(signal)} · {date ? new Date(date).toLocaleDateString() : 'Date unavailable'}</span><span className="mh-mobile-levels"><span>Entry <b>{price(signal.entry ?? signal.entry_price)}</b></span><span>SL <b className="mh-down">{price(signal.sl ?? signal.stop_loss)}</b></span><span>TP1 <b className="mh-up">{price(targets[0])}</b></span></span><span className={`mh-direction ${(signal.direction || '').toLowerCase()}`}>{signal.direction?.toUpperCase() || '—'}</span></button>; })}{!filtered.length && <div className="mh-empty">{loading ? 'Loading signal records…' : 'No records match these filters.'}</div>}</div>
    <footer className="mh-footnote">Historical outcomes are kept separate from live signals and are not inferred from current prices.</footer>
  </section>;
}
