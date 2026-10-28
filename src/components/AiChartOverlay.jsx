import { useEffect, useMemo, useState } from 'react';

// Click-through "AI is live" layer for the chart-only view. Everything it says comes from the
// real 15m market analysis; nothing here draws prices (the embedded chart can't be drawn on).
export default function AiChartOverlay({ pair, analysis, countdown, setup }) {
  const lines = useMemo(() => {
    const out = [];
    const a = analysis || {};
    if (setup?.direction) out.push(`Tracking ${String(setup.direction).toUpperCase()} setup`);
    if (a.bias) out.push(`Bias: ${a.bias}`);
    if (a.rsi?.val) out.push(`RSI ${a.rsi.val} · ${a.rsi.status}`);
    if (a.macd?.status) out.push(`MACD: ${a.macd.status}`);
    if (a.ema20?.status) out.push(`EMA 20: ${a.ema20.status}`);
    if (a.ema200?.status) out.push(`EMA 200: ${a.ema200.status}`);
    if (a.levels?.s1 && a.levels?.r1) out.push(`Support ${a.levels.s1} · Resistance ${a.levels.r1}`);
    if (a.confidence != null) out.push(`Confidence ${a.confidence}%`);
    if (a.fvg) out.push(`Imbalances ${a.fvg}`);
    return out.length ? out : ['Reading live candles…'];
  }, [analysis, setup?.direction]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx((i) => i + 1), 3800);
    return () => clearInterval(t);
  }, [lines]);

  const text = lines[idx % lines.length];

  return (
    <div className="ait-ai-overlay" aria-hidden="true">
      <span className="ait-ai-corner tl" /><span className="ait-ai-corner tr" />
      <span className="ait-ai-corner bl" /><span className="ait-ai-corner br" />
      <div className="ait-ai-sweep" />
      <div className="ait-ai-pill">
        <div className="ait-ai-pill-row">
          <span className="ait-ai-dot" />
          <strong>AI LIVE</strong>
          <span className="ait-ai-sep">·</span>
          <span>{pair} M15</span>
          <span className="ait-ai-sep">·</span>
          <span className="ait-ai-next">Next scan {countdown?.timeStr || '--:--'}</span>
        </div>
        <div key={`${idx}-${text}`} className="ait-ai-reading">{text}</div>
        <div className="ait-ai-bar"><span style={{ width: `${countdown?.progressPct ?? 0}%` }} /></div>
      </div>
    </div>
  );
}
