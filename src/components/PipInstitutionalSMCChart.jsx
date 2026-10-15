import { useState, useEffect, useMemo, useRef } from 'react';
import { formatSpotPrice } from '../services/marketPriceService.js';

const BOTTOM_TABS = [
  { pair: 'EURUSD', tf: 'D1', label: 'EURUSD,Daily' },
  { pair: 'XAUUSD', tf: 'D1', label: 'XAUUSD,Daily' },
  { pair: 'GBPUSD', tf: 'D1', label: 'GBPUSD,Daily' },
  { pair: 'BTCUSD', tf: 'D1', label: 'BTCUSD,Daily' },
  { pair: 'US30', tf: 'M15', label: 'US30,M15' },
  { pair: 'EURUSD', tf: 'H1', label: 'EURUSD,H1' },
  { pair: 'XAUUSD', tf: '15m', label: 'XAUUSD,15m' },
  { pair: 'BTCUSD', tf: 'M30', label: 'BTCUSD,M30' },
  { pair: 'US30', tf: 'H1', label: 'US30,H1' },
];

export default function PipInstitutionalSMCChart({
  currentAsset,
  timeframe = '15',
  livePrice,
  activeSession = { name: 'London Killzone' },
  onSelectAsset,
  onSelectTimeframe,
  aiMetrics = { bias: 'BULLISH', confidence: 98 },
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 850, height: 600 });
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState('XAUUSD,15m');
  const [msobActive, setMsobActive] = useState(true);

  // Resize observer to keep chart responsive to 100% width and height
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(containerRef.current.clientWidth, 600),
          height: Math.max(containerRef.current.clientHeight, 450),
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const basePrice = useMemo(() => {
    const p = parseFloat(String(livePrice || currentAsset.defaultPrice).replace(/,/g, ''));
    return isNaN(p) ? currentAsset.defaultPrice : p;
  }, [livePrice, currentAsset]);

  // Generate realistic SMC candlestick sequence anchored to current basePrice
  const candles = useMemo(() => {
    const count = 38;
    const pipScale = currentAsset.pipScale || 0.1;
    const generated = [];

    // Pre-calculated wave pattern that creates HH, HL, LH, LL, Break of Structure & FVGs
    const waveMultipliers = [
      -18, -15, -12, -9, -5, -8, -4, 0, 5, 12, 18, 14, 20, 26, 34, 45, 58, 48, 38,
      28, 32, 22, 14, 18, 25, 30, 24, 15, 6, -4, -15, -28, -38, -32, -22, -10, -4, 0,
    ];

    let currentOpen = basePrice + waveMultipliers[0] * pipScale * 4;

    for (let i = 0; i < count; i++) {
      const step = waveMultipliers[i] * pipScale * 4;
      const targetClose = basePrice + step;
      const isUp = targetClose >= currentOpen;
      const bodyMin = Math.min(currentOpen, targetClose);
      const bodyMax = Math.max(currentOpen, targetClose);
      const wickHigh = bodyMax + Math.abs(bodyMax - bodyMin) * 0.4 + (i % 3) * pipScale * 2;
      const wickLow = bodyMin - Math.abs(bodyMax - bodyMin) * 0.4 - (i % 2) * pipScale * 2;

      // Deterministic volume spike
      const vol = Math.floor(800 + Math.sin(i * 0.7) * 500 + (i === 16 || i === 31 ? 950 : 200));

      generated.push({
        index: i,
        open: currentOpen,
        high: wickHigh,
        low: wickLow,
        close: i === count - 1 ? basePrice : targetClose,
        isUp,
        volume: vol,
      });

      currentOpen = targetClose + ((i % 4) - 2) * pipScale * 0.5;
    }

    return generated;
  }, [basePrice, currentAsset]);

  // Price range calculation
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    // Padding
    const pad = (max - min) * 0.12 || 1;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      priceRange: max - min + pad * 2,
    };
  }, [candles]);

  // Coordinate mapping
  const chartWidth = dimensions.width;
  const chartHeight = dimensions.height;
  const priceAxisWidth = 75;
  const volumeHeight = 65;
  const plotWidth = chartWidth - priceAxisWidth;
  const plotHeight = chartHeight - volumeHeight - 35; // margin for bottom timeline

  const candleSlotWidth = plotWidth / candles.length;
  const candleBodyWidth = Math.max(candleSlotWidth * 0.65, 4);

  const getY = (val) => {
    return plotHeight - ((val - minPrice) / priceRange) * plotHeight;
  };

  const getX = (index) => {
    return index * candleSlotWidth + candleSlotWidth / 2;
  };

  // High-conviction SMC Overlay Coordinates
  // 1. Bearish Order Block (Red Supply Zone): Peak around candle index 16–22
  const supplyZone = useMemo(() => {
    const peakCandle = candles[16] || candles[0];
    const top = getY(peakCandle.high + 2);
    const bottom = getY(peakCandle.open);
    const startX = getX(16);
    const width = plotWidth - startX;
    return {
      x: startX,
      y: top,
      width,
      height: Math.max(bottom - top, 24),
      label: '74% SELL',
    };
  }, [candles, plotWidth]);

  // 2. Bullish Fair Value Gap (Pink Zone): Imbalance around candle index 24–31
  const fvgZones = useMemo(() => {
    const c1 = candles[24];
    const c2 = candles[26];
    if (!c1 || !c2) return [];

    const fvg1Top = getY(c1.high);
    const fvg1Bottom = getY(c2.low);

    const c3 = candles[28];
    const c4 = candles[30];
    const fvg2Top = c3 ? getY(c3.high) : fvg1Top;
    const fvg2Bottom = c4 ? getY(c4.low) : fvg1Bottom;

    return [
      {
        x: getX(24),
        y: Math.min(fvg1Top, fvg1Bottom),
        width: plotWidth - getX(24),
        height: Math.max(Math.abs(fvg1Bottom - fvg1Top), 14),
        label: 'FVG',
      },
      {
        x: getX(28),
        y: Math.min(fvg2Top, fvg2Bottom),
        width: plotWidth - getX(28),
        height: Math.max(Math.abs(fvg2Bottom - fvg2Top), 18),
        label: 'FVG (M15 Discount)',
      },
    ];
  }, [candles, plotWidth]);

  // 3. Bullish Order Block (Green Demand Zone): Reversal at candle index 32–37
  const demandZone = useMemo(() => {
    const lowCandle = candles[32] || candles[0];
    const top = getY(lowCandle.open);
    const bottom = getY(lowCandle.low - 2);
    const startX = getX(32);
    const width = plotWidth - startX;
    return {
      x: startX,
      y: top,
      width,
      height: Math.max(bottom - top, 26),
      label: '88% BUY',
    };
  }, [candles, plotWidth]);

  // Max volume for bottom histogram
  const maxVolume = useMemo(() => {
    return Math.max(...candles.map((c) => c.volume), 1);
  }, [candles]);

  const handleBottomTabClick = (tab) => {
    setActiveTabKey(tab.label);
    if (tab.pair !== currentAsset.pair && onSelectAsset) {
      onSelectAsset(tab.pair.toLowerCase());
    }
    if (onSelectTimeframe) {
      onSelectTimeframe(tab.tf.replace(/[^0-9]/g, '') || '15');
    }
  };

  return (
    <div className="pip-smc-chart-root" ref={containerRef}>
      {/* 1. TOP Pinned Floating MSOB DASHBOARD HUD (Exact match to screenshot) */}
      {msobActive && (
        <div className="pip-msob-hud-card ait-mono">
          {/* Header */}
          <div className="pip-msob-head">
            <span className="pip-msob-title">MSOB DASHBOARD</span>
            <div className="pip-msob-status-wrap">
              <span className="pip-msob-dot" />
              <span className="pip-msob-on">ON</span>
              <span className="pip-msob-ver">v1.20</span>
            </div>
          </div>

          {/* Row 1: Trend */}
          <div className="pip-msob-row">
            <span className="pip-msob-lbl">TREND</span>
            <span className="pip-msob-pill trend-bull">
              ▲ {aiMetrics.bias || 'BULLISH'}
            </span>
          </div>

          {/* Row 2: Signal */}
          <div className="pip-msob-row">
            <span className="pip-msob-lbl">SIGNAL</span>
            <div className="pip-msob-signal-box">
              ChoCH ▲ {formatSpotPrice(currentAsset.pair, basePrice)}
            </div>
          </div>

          {/* Row 3: Demand & Supply Split */}
          <div className="pip-msob-split-row">
            <div className="pip-msob-box demand">
              DEMAND <span className="pip-msob-num">1</span>
            </div>
            <div className="pip-msob-box supply">
              SUPPLY <span className="pip-msob-num">1</span>
            </div>
          </div>

          {/* Row 4: Fair Value Gaps */}
          <div className="pip-msob-row fvg-row">
            <span className="pip-msob-lbl">FVG</span>
            <span className="pip-msob-val fvg-counts">Bull:5 | Bear:3</span>
          </div>

          {/* Row 5: Active Trading Session Killzone */}
          <div className="pip-msob-row session-row">
            <span className="pip-msob-lbl">SESSION</span>
            <span className="pip-msob-val session-name">
              {(activeSession?.name || 'LONDON (KZ)').toUpperCase()}
            </span>
          </div>

          {/* Row 6: Confluence Meter */}
          <div className="pip-msob-confluence-block">
            <div className="pip-msob-conf-head">
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="pip-msob-dot small" />
                CONFLUENCE
              </span>
              <strong style={{ color: '#10B981' }}>{aiMetrics.confidence || 98}%</strong>
            </div>
            <div className="pip-msob-bar-track">
              <div
                className="pip-msob-bar-fill"
                style={{ width: `${aiMetrics.confidence || 98}%` }}
              />
            </div>
          </div>

          {/* Row 7: Multi-Timeframe Alignment */}
          <div className="pip-msob-mtf-block">
            <div className="pip-msob-mtf-head">
              <span>MULTI-TIMEFRAME</span>
              <span className="pip-msob-aligned-tag">3/4 aligned</span>
            </div>
            <div className="pip-msob-mtf-grid">
              <div className="pip-mtf-col">
                <span className="pip-mtf-tf">M15</span>
                <span className="pip-mtf-badge rng">RNG</span>
              </div>
              <div className="pip-mtf-col">
                <span className="pip-mtf-tf">H1</span>
                <span className="pip-mtf-badge bull">BULL</span>
              </div>
              <div className="pip-mtf-col">
                <span className="pip-mtf-tf">H4</span>
                <span className="pip-mtf-badge bear">BEAR</span>
              </div>
              <div className="pip-mtf-col">
                <span className="pip-mtf-tf">D1</span>
                <span className="pip-mtf-badge bull">BULL</span>
              </div>
            </div>
          </div>

          {/* Row 8: OB Performance Statistics */}
          <div className="pip-msob-perf-block">
            <div className="pip-msob-perf-title">OB PERFORMANCE</div>
            <div className="pip-msob-perf-grid">
              <div>
                <span className="pip-p-lbl">DETECTED</span>
                <span className="pip-p-val">2</span>
              </div>
              <div>
                <span className="pip-p-lbl">ACTIVE</span>
                <span className="pip-p-val">2</span>
              </div>
              <div>
                <span className="pip-p-lbl">MITIGATED</span>
                <span className="pip-p-val">0</span>
              </div>
              <div>
                <span className="pip-p-lbl">HIT RATE</span>
                <span className="pip-p-val">--</span>
              </div>
              <div>
                <span className="pip-p-lbl">AVG STR</span>
                <span className="pip-p-val" style={{ color: '#10B981' }}>77%</span>
              </div>
              <div>
                <span className="pip-p-lbl">MIT %</span>
                <span className="pip-p-val">0%</span>
              </div>
            </div>
          </div>

          {/* Footer Asset & Timeframe Tag */}
          <div className="pip-msob-footer">
            <span>{currentAsset.pair}</span>
            <span>|</span>
            <span>{timeframe === 'D' ? 'D1' : `${timeframe}m`}</span>
            <span style={{ marginLeft: 'auto', color: '#38bdf8', fontSize: 10 }}>TradingView · Pip AI</span>
          </div>
        </div>
      )}

      {/* 2. Interactive SVG Pitch-Black Candlestick Stage */}
      <svg
        className="pip-smc-svg-stage"
        width={chartWidth}
        height={chartHeight}
        onMouseLeave={() => setHoveredCandle(null)}
      >
        <defs>
          {/* Subtle gradient for demand & supply zones */}
          <linearGradient id="pipSupplyGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="pipDemandGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#064E3B" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="pipFvgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Pitch Black Canvas Background */}
        <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#000000" />

        {/* Faint Institutional Grid Lines */}
        {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => (
          <line
            key={`h-grid-${idx}`}
            x1="0"
            y1={plotHeight * pct}
            x2={plotWidth}
            y2={plotHeight * pct}
            stroke="#121212"
            strokeWidth="1"
          />
        ))}

        {/* 1. Bearish Order Block (Supply Zone: 74% SELL) */}
        <g className="pip-supply-zone-group">
          <rect
            x={supplyZone.x}
            y={supplyZone.y}
            width={supplyZone.width}
            height={supplyZone.height}
            fill="url(#pipSupplyGrad)"
            stroke="#EF4444"
            strokeWidth="1.5"
          />
          {/* Dash equilibrium inside OB */}
          <line
            x1={supplyZone.x}
            y1={supplyZone.y + supplyZone.height / 2}
            x2={supplyZone.x + supplyZone.width}
            y2={supplyZone.y + supplyZone.height / 2}
            stroke="#EF4444"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          {/* 74% SELL Badge */}
          <rect
            x={plotWidth - 78}
            y={supplyZone.y + 5}
            width="68"
            height="18"
            rx="3"
            fill="#B91C1C"
          />
          <text
            x={plotWidth - 44}
            y={supplyZone.y + 17}
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {supplyZone.label}
          </text>
        </g>

        {/* 2. Pink Fair Value Gap (FVG) Rectangles */}
        {fvgZones.map((fvg, idx) => (
          <g key={`fvg-${idx}`} className="pip-fvg-group">
            <rect
              x={fvg.x}
              y={fvg.y}
              width={fvg.width}
              height={fvg.height}
              fill="url(#pipFvgGrad)"
              stroke="#F472B6"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {/* FVG Label Tag */}
            <rect
              x={plotWidth - 46}
              y={fvg.y + 2}
              width="38"
              height="14"
              rx="2"
              fill="#DB2777"
            />
            <text
              x={plotWidth - 27}
              y={fvg.y + 12}
              fill="#FFFFFF"
              fontSize="9"
              fontWeight="800"
              fontFamily="monospace"
              textAnchor="middle"
            >
              FVG
            </text>
          </g>
        ))}

        {/* 3. Bullish Order Block (Demand Zone: 88% BUY) */}
        <g className="pip-demand-zone-group">
          <rect
            x={demandZone.x}
            y={demandZone.y}
            width={demandZone.width}
            height={demandZone.height}
            fill="url(#pipDemandGrad)"
            stroke="#10B981"
            strokeWidth="1.5"
          />
          <line
            x1={demandZone.x}
            y1={demandZone.y + demandZone.height / 2}
            x2={demandZone.x + demandZone.width}
            y2={demandZone.y + demandZone.height / 2}
            stroke="#10B981"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          <rect
            x={plotWidth - 78}
            y={demandZone.y + 5}
            width="68"
            height="18"
            rx="3"
            fill="#059669"
          />
          <text
            x={plotWidth - 44}
            y={demandZone.y + 17}
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {demandZone.label}
          </text>
        </g>

        {/* 4. Break of Structure (BOS ▲) & Change of Character (ChoCH ▼) Lines */}
        {/* BOS Line (Green) */}
        <line
          x1={getX(8)}
          y1={getY(candles[10]?.high || basePrice)}
          x2={getX(16)}
          y2={getY(candles[10]?.high || basePrice)}
          stroke="#10B981"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <text
          x={getX(12)}
          y={getY(candles[10]?.high || basePrice) - 5}
          fill="#10B981"
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
        >
          BOS ▲
        </text>

        {/* ChoCH Line (Purple) */}
        <line
          x1={getX(17)}
          y1={getY(candles[22]?.low || basePrice)}
          x2={getX(32)}
          y2={getY(candles[22]?.low || basePrice)}
          stroke="#C084FC"
          strokeWidth="1.5"
        />
        <text
          x={getX(24)}
          y={getY(candles[22]?.low || basePrice) + 12}
          fill="#C084FC"
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
        >
          ChoCH ▼
        </text>

        {/* Swing Labels (HH, HL, LH, LL) */}
        <text x={getX(16)} y={getY(candles[16]?.high) - 8} fill="#10B981" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          HH
        </text>
        <text x={getX(22)} y={getY(candles[22]?.high) - 8} fill="#EF4444" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          LH
        </text>
        <text x={getX(11)} y={getY(candles[11]?.low) + 14} fill="#10B981" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          HL
        </text>
        <text x={getX(32)} y={getY(candles[32]?.low) + 14} fill="#EF4444" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          LL
        </text>

        {/* 5. Japanese Candlesticks (White for Up, Black with crisp White Border for Down) */}
        {candles.map((c) => {
          const x = getX(c.index);
          const yOpen = getY(c.open);
          const yClose = getY(c.close);
          const yHigh = getY(c.high);
          const yLow = getY(c.low);

          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2.5);

          return (
            <g
              key={`c-${c.index}`}
              className="pip-candle-group"
              onMouseEnter={() => setHoveredCandle(c)}
              style={{ cursor: 'crosshair' }}
            >
              {/* Wick */}
              <line
                x1={x}
                y1={yHigh}
                x2={x}
                y2={yLow}
                stroke={c.isUp ? '#FFFFFF' : '#D1D5DB'}
                strokeWidth="1.2"
              />

              {/* Candle Body */}
              <rect
                x={x - candleBodyWidth / 2}
                y={bodyTop}
                width={candleBodyWidth}
                height={bodyHeight}
                fill={c.isUp ? '#FFFFFF' : '#090B0E'}
                stroke="#FFFFFF"
                strokeWidth="1.1"
                rx="0.5"
              />
            </g>
          );
        })}

        {/* 6. Volume Histogram Bars along the bottom */}
        <g className="pip-volume-group" transform={`translate(0, ${chartHeight - volumeHeight - 30})`}>
          {candles.map((c) => {
            const x = getX(c.index);
            const vHeight = (c.volume / maxVolume) * (volumeHeight - 10);
            return (
              <rect
                key={`v-${c.index}`}
                x={x - candleBodyWidth / 2}
                y={volumeHeight - vHeight}
                width={candleBodyWidth}
                height={vHeight}
                fill={c.isUp ? '#10B981' : '#EF4444'}
                opacity={0.65}
              />
            );
          })}
        </g>

        {/* 7. Current Live Spot Price Pulsing Horizon Line */}
        <line
          x1="0"
          y1={getY(basePrice)}
          x2={plotWidth}
          y2={getY(basePrice)}
          stroke="#00F2FE"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Price Axis on Right */}
        <g transform={`translate(${plotWidth}, 0)`}>
          <rect x="0" y="0" width={priceAxisWidth} height={chartHeight} fill="#050505" stroke="#181818" strokeWidth="1" />
          {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((pct, idx) => {
            const val = maxPrice - pct * priceRange;
            return (
              <text
                key={`p-txt-${idx}`}
                x="8"
                y={plotHeight * pct + 4}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="600"
              >
                {formatSpotPrice(currentAsset.pair, val)}
              </text>
            );
          })}

          {/* Live Price Tag on Axis */}
          <rect
            x="0"
            y={getY(basePrice) - 10}
            width={priceAxisWidth}
            height="20"
            fill="#0284C7"
          />
          <text
            x={priceAxisWidth / 2}
            y={getY(basePrice) + 4}
            fill="#FFFFFF"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="900"
            textAnchor="middle"
          >
            {formatSpotPrice(currentAsset.pair, basePrice)}
          </text>
        </g>
      </svg>

      {/* Hover Candlestick Inspection Tooltip */}
      {hoveredCandle && (
        <div
          className="pip-candle-tooltip ait-mono"
          style={{
            position: 'absolute',
            left: Math.min(getX(hoveredCandle.index) + 12, plotWidth - 160),
            top: Math.max(getY(hoveredCandle.high) - 40, 20),
          }}
        >
          <div><strong>O:</strong> {formatSpotPrice(currentAsset.pair, hoveredCandle.open)}</div>
          <div><strong>H:</strong> {formatSpotPrice(currentAsset.pair, hoveredCandle.high)}</div>
          <div><strong>L:</strong> {formatSpotPrice(currentAsset.pair, hoveredCandle.low)}</div>
          <div><strong>C:</strong> {formatSpotPrice(currentAsset.pair, hoveredCandle.close)}</div>
          <div style={{ color: '#00F2FE' }}><strong>Vol:</strong> {hoveredCandle.volume}</div>
        </div>
      )}

      {/* 3. Bottom Multi-Asset / Timeframe Quick Switch Tabs (Matching user screenshot) */}
      <div className="pip-chart-bottom-tabs-bar ait-mono">
        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTabKey === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              className={`pip-chart-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => handleBottomTabClick(tab)}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Toggle HUD button on bottom right */}
        <button
          type="button"
          className="pip-hud-toggle-btn"
          onClick={() => setMsobActive((v) => !v)}
          title="Toggle MSOB Dashboard HUD"
        >
          {msobActive ? 'Hide MSOB HUD' : 'Show MSOB HUD'}
        </button>
      </div>
    </div>
  );
}

