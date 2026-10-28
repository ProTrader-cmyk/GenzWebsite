import { useCallback, useEffect, useRef, useState } from 'react';
import {
  analyzePair, executeSignal, fetchPositions, fetchScannerSignal, fetchTradeHistory, fetchTradeMarket, fetchTradeStatus,
} from '../services/aiTradeService.js';

const STEPS = ['Pair', 'Live data', 'AI analysis', 'Signal', 'Confirm', 'Positions', 'Result'];

const fmt = (n, d = 2) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));
const money = (n, ccy = 'USD') => (n == null ? '—' : `${n >= 0 ? '+' : '-'}${Math.abs(n).toLocaleString(undefined, { style: 'currency', currency: ccy })}`);
const when = (ms) => (ms ? new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function useAsync() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const run = useCallback(async (fn, { silent = false } = {}) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState((s) => ({ loading: false, error, data: silent ? s.data : null }));
      return null;
    }
  }, []);
  return [state, run];
}

export default function AITradeDesk({ pair = 'XAUUSD', user }) {
  const [market, loadMarket] = useAsync();
  const [status, loadStatus] = useAsync();
  const [positions, loadPositions] = useAsync();
  const [history, loadHistory] = useAsync();

  const [analysis, setAnalysis] = useState({ phase: 'idle', result: null, error: null });
  const [order, setOrder] = useState({ phase: 'idle', trade: null, error: null });
  const [now, setNow] = useState(Date.now());
  const sending = useRef(false);

  const canExecute = Boolean(status.data?.canExecute);
  const ccy = status.data?.account?.currency || 'USD';

  const refreshTrades = useCallback(() => {
    loadPositions(fetchPositions, { silent: true });
    loadHistory(fetchTradeHistory, { silent: true });
    loadStatus(fetchTradeStatus, { silent: true });
  }, [loadPositions, loadHistory, loadStatus]);

  useEffect(() => {
    if (!user) return undefined;
    loadMarket(() => fetchTradeMarket(pair));
    const t = setInterval(() => loadMarket(() => fetchTradeMarket(pair), { silent: true }), 10000);
    return () => clearInterval(t);
  }, [user, pair, loadMarket]);

  useEffect(() => {
    if (user) loadStatus(fetchTradeStatus);
  }, [user, loadStatus]);

  useEffect(() => {
    if (!user || !canExecute) return undefined;
    loadPositions(fetchPositions);
    loadHistory(fetchTradeHistory);
    const t = setInterval(refreshTrades, 15000);
    return () => clearInterval(t);
  }, [user, canExecute, loadPositions, loadHistory, refreshTrades]);

  // Signals dropped by the always-on background scanner show up here even if the page was closed
  // when they fired. A signal the user is already looking at or ordering is never replaced.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetchScannerSignal(pair);
        if (!alive || !res.signal) return;
        setAnalysis((cur) => {
          if (cur.phase === 'loading' || cur.result?.signalId === res.signalId) return cur;
          if (cur.phase === 'done' && cur.result?.signalId && cur.result.expiresAt > Date.now() && !cur.result.scanner) return cur;
          return { phase: 'done', result: res, error: null };
        });
      } catch { /* the desk keeps working without it */ }
    };
    poll();
    const t = setInterval(poll, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [user, pair]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // A new pair invalidates any signal on screen.
  useEffect(() => {
    setAnalysis({ phase: 'idle', result: null, error: null });
    setOrder({ phase: 'idle', trade: null, error: null });
  }, [pair]);

  const runAnalysis = async () => {
    if (analysis.phase === 'loading') return;
    setOrder({ phase: 'idle', trade: null, error: null });
    setAnalysis({ phase: 'loading', result: null, error: null });
    try {
      const result = await analyzePair(pair);
      setAnalysis({ phase: 'done', result, error: null });
    } catch (error) {
      setAnalysis({ phase: 'error', result: null, error });
    }
  };

  const confirmOrder = async () => {
    const signalId = analysis.result?.signalId;
    if (!signalId || sending.current) return; // ref guard: a double-click can't enqueue two requests
    sending.current = true;
    setOrder({ phase: 'sending', trade: null, error: null });
    try {
      const { trade } = await executeSignal(signalId);
      const placed = ['open', 'partial', 'closed'].includes(trade.status);
      const pending = ['submitting', 'sending'].includes(trade.status);
      setOrder({
        phase: placed ? 'done' : 'error',
        trade,
        error: placed ? null : new Error(pending ? 'This order is still being processed. Check Open positions before trying again.' : trade.note || 'Order was not placed.'),
      });
    } catch (error) {
      // The server executes each signal once, so a network failure here is safe to re-check, not re-send.
      setOrder({ phase: 'error', trade: null, error: error.network ? new Error('Connection lost. Check Open positions before trying again — the order may have been placed.') : error });
    } finally {
      sending.current = false;
      refreshTrades();
    }
  };

  if (!user) {
    return (
      <section className="ait-desk">
        <div className="ait-desk-empty">Sign in to analyse the market and trade with the AI.</div>
      </section>
    );
  }

  const sig = analysis.result?.signal;
  const isTrade = Boolean(sig) && sig.direction !== 'hold';
  const secsLeft = analysis.result?.expiresAt ? Math.max(0, Math.ceil((analysis.result.expiresAt - now) / 1000)) : 0;
  const expired = isTrade && secsLeft === 0;
  const today = status.data?.today;
  const precision = market.data?.precision ?? 2;

  let step = 1;
  if (market.data) step = 2;
  if (analysis.phase === 'loading') step = 2;
  if (analysis.phase === 'done') step = isTrade ? 4 : 3;
  if (order.phase === 'sending') step = 4;
  if (order.phase === 'done') step = 6;

  const tf = market.data?.summaries;

  return (
    <section className="ait-desk" aria-label="AI trade desk">
      <ol className="ait-desk-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'done' : i === step ? 'current' : ''}>
            <span>{i + 1}</span>{label}
          </li>
        ))}
      </ol>

      {today?.locked && (
        <div className="ait-desk-banner warn">Daily loss limit reached ({fmt(status.data.limits.maxDailyLossPct, 0)}%). The AI will not place any more trades today.</div>
      )}

      <div className="ait-desk-grid">
        <div className="ait-desk-card">
          <h3>Live market · {pair}</h3>
          {market.loading && !market.data && <div className="ait-desk-skel">Loading live data…</div>}
          {market.error && !market.data && (
            <div className="ait-desk-error">{market.error.message} <button type="button" onClick={() => loadMarket(() => fetchTradeMarket(pair))}>Retry</button></div>
          )}
          {market.data && (
            <>
              <div className="ait-desk-price ait-mono">
                <span>Bid {fmt(market.data.quote.bid, precision)}</span>
                <span>Ask {fmt(market.data.quote.ask, precision)}</span>
                <span className="mute">Spread {fmt(market.data.quote.spread, precision)}</span>
              </div>
              {!market.data.quote.tradeable && <div className="ait-desk-banner warn">Market closed — the AI will not trade.</div>}
              {market.error && <div className="ait-desk-error">Live data update failed: {market.error.message}</div>}
              <table className="ait-desk-table ait-mono">
                <thead><tr><th>TF</th><th>Trend</th><th>RSI</th><th>MACD hist</th><th>ATR</th></tr></thead>
                <tbody>
                  {['M15', 'H1', 'H4'].map((k) => tf?.[k] && (
                    <tr key={k}>
                      <td>{k}</td>
                      <td className={tf[k].trend}>{tf[k].trend}</td>
                      <td>{fmt(tf[k].rsi14, 1)}</td>
                      <td>{fmt(tf[k].macdHistogram, precision)}</td>
                      <td>{fmt(tf[k].atr14, precision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="ait-desk-card">
          <h3>AI signal{analysis.result?.scanner ? ' · from background scanner' : ''}</h3>
          {analysis.phase === 'idle' && <p className="mute">Run the AI on live multi-timeframe candles. “Hold” is a valid answer.</p>}
          {analysis.phase === 'loading' && <div className="ait-desk-skel">Analysing M5 · M15 · H1 · H4 candles…</div>}
          {analysis.phase === 'error' && (
            <div className="ait-desk-error">{analysis.error.message}{analysis.error.retryAfter ? ` (retry in ${analysis.error.retryAfter}s)` : ''}</div>
          )}

          {analysis.phase === 'done' && !isTrade && (
            <div className="ait-desk-hold">
              <strong>NO TRADE</strong>
              <p>{sig.reason}</p>
            </div>
          )}

          {analysis.phase === 'done' && isTrade && (
            <div className={`ait-desk-signal ${sig.direction}`}>
              <div className="ait-desk-signal-head">
                <strong className="dir">{sig.direction.toUpperCase()}</strong>
                <span className="ait-mono">Confidence {sig.confidence}%</span>
                <span className="ait-mono">R:R 1:{sig.riskReward}</span>
              </div>
              <div className="ait-desk-levels ait-mono">
                <div><span>Entry</span>{fmt(sig.entry, precision)}</div>
                <div><span>Stop-loss</span>{fmt(sig.stopLoss, precision)}</div>
                <div><span>Take-profit</span>{fmt(sig.takeProfit, precision)}</div>
              </div>
              <p className="reason">{sig.reason}</p>
              <p className="mute small">Size is set by the server at {analysis.result.limits.riskPct}% account risk. Max {analysis.result.limits.maxOpenTrades} open trades.</p>

              {order.phase === 'done' && order.trade && (
                <div className="ait-desk-banner ok">
                  Order {order.trade.status === 'partial' ? 'partially filled' : 'filled'} @ {fmt(order.trade.fillPrice, precision)} · {fmt(order.trade.filledUnits, 0)} units
                  {order.trade.note ? ` · ${order.trade.note}` : ''}
                </div>
              )}
              {order.phase === 'error' && <div className="ait-desk-error">{order.error?.message || 'Order failed.'}</div>}

              {!canExecute && <p className="mute small">Order execution is limited to the account owner.</p>}
              {canExecute && order.phase !== 'done' && order.phase !== 'error' && (
                <button
                  type="button"
                  className="ait-btn-gold-action ait-desk-confirm"
                  onClick={confirmOrder}
                  disabled={order.phase === 'sending' || expired || Boolean(today?.locked)}
                >
                  {order.phase === 'sending' ? <><span className="ait-spin-loader" /> Sending order…</>
                    : expired ? 'Signal expired — analyse again'
                    : `Confirm & place real order (${secsLeft}s)`}
                </button>
              )}
            </div>
          )}

          <button type="button" className="ait-btn-outline ait-desk-analyze" onClick={runAnalysis} disabled={analysis.phase === 'loading' || order.phase === 'sending'}>
            {analysis.phase === 'loading' ? 'Analysing…' : analysis.phase === 'idle' ? 'Analyse market' : 'Analyse again'}
          </button>
        </div>
      </div>

      {canExecute && (
        <>
          {today && (
            <div className="ait-desk-risk ait-mono">
              <span>Today {money(today.dayPnl, ccy)}</span>
              <span>Loss limit −{fmt(today.lossLimit)} {ccy}</span>
              <span>Open {today.openTrades}/{status.data.limits.maxOpenTrades}</span>
              <span>Balance {fmt(status.data.account.balance)} {ccy}</span>
            </div>
          )}

          <div className="ait-desk-card">
            <h3>Open positions</h3>
            {positions.loading && !positions.data && <div className="ait-desk-skel">Loading positions…</div>}
            {positions.error && <div className="ait-desk-error">{positions.error.message}</div>}
            {positions.data && positions.data.positions.length === 0 && <p className="mute">No open AI positions.</p>}
            {positions.data?.positions.length > 0 && (
              <table className="ait-desk-table ait-mono">
                <thead><tr><th>Pair</th><th>Side</th><th>Entry</th><th>SL</th><th>TP</th><th>Units</th><th>P/L</th></tr></thead>
                <tbody>
                  {positions.data.positions.map((p) => (
                    <tr key={p.id}>
                      <td>{p.pair}</td><td className={p.direction}>{p.direction}</td><td>{fmt(p.fillPrice, precision)}</td>
                      <td>{fmt(p.stopLoss, precision)}</td><td>{fmt(p.takeProfit, precision)}</td><td>{fmt(p.filledUnits, 0)}</td>
                      <td className={p.unrealizedPL >= 0 ? 'buy' : 'sell'}>{money(p.unrealizedPL, ccy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ait-desk-card">
            <h3>Trade history</h3>
            {history.loading && !history.data && <div className="ait-desk-skel">Loading history…</div>}
            {history.error && <div className="ait-desk-error">{history.error.message}</div>}
            {history.data && (
              <>
                <div className="ait-desk-risk ait-mono">
                  <span>Closed {history.data.summary.closed}</span>
                  <span>Win rate {history.data.summary.winRate == null ? '—' : `${history.data.summary.winRate}%`}</span>
                  <span>Net {money(history.data.summary.netPL, ccy)}</span>
                  <span>Pips {fmt(history.data.summary.totalPips, 1)}</span>
                </div>
                {history.data.trades.length === 0 ? <p className="mute">No trades yet. Analyse the market to get started.</p> : (
                  <table className="ait-desk-table ait-mono">
                    <thead><tr><th>Opened</th><th>Pair</th><th>Side</th><th>Status</th><th>Pips</th><th>P/L</th><th>R</th></tr></thead>
                    <tbody>
                      {history.data.trades.map((t) => (
                        <tr key={t.id} title={t.note || t.reason}>
                          <td>{when(t.openedAt || t.createdAt)}</td><td>{t.pair}</td><td className={t.direction}>{t.direction}</td>
                          <td className={t.outcome || t.status}>{t.status === 'closed' ? t.outcome : t.status}</td>
                          <td>{t.pips == null ? '—' : fmt(t.pips, 1)}</td>
                          <td className={t.realizedPL >= 0 ? 'buy' : 'sell'}>{t.realizedPL == null ? '—' : money(t.realizedPL, ccy)}</td>
                          <td>{t.rMultiple == null ? '—' : fmt(t.rMultiple, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
