import { useState, useEffect, useRef } from 'react';
import '../styles/howPipWorks.css';

export default function HowPipWorks({ isKhmer }) {
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoPlayRef = useRef(null);

  const STEP_DURATION = 5200;

  // Auto-cycle through the 4 steps every 5.2 seconds unless paused by user interaction
  useEffect(() => {
    if (isPaused) return;
    autoPlayRef.current = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, STEP_DURATION);
    return () => clearInterval(autoPlayRef.current);
  }, [isPaused, activeStep]);

  const handleStepClick = (step) => {
    setActiveStep(step);
    setIsPaused(true);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    // Resume auto-play after 14 seconds of user inactivity
    autoPlayRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 14000);
  };

  const handlePrev = () => {
    handleStepClick(activeStep <= 1 ? 4 : activeStep - 1);
  };

  const handleNext = () => {
    handleStepClick(activeStep >= 4 ? 1 : activeStep + 1);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleCopySignal = () => {
    const text = `🎯 PIP AI LIVE SIGNAL\nPair: XAUUSD (15m)\nAction: SELL\nEntry: 3,998.40\nStop Loss: 4,014.90\nTake Profit 1: 3,982.00\nTake Profit 2: 3,974.10\nRisk/Reward: 1:3.2\nConfidence: 88%\nStatus: Verified by Multi-Agent Consensus`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // Rail progress width percentage based on activeStep
  const railProgressWidth =
    activeStep === 1 ? '0%' :
    activeStep === 2 ? '33.33%' :
    activeStep === 3 ? '66.66%' : '100%';

  return (
    <section className="lnd-section lnd-how-pip-section" id="how-pip-works">
      <div className="lnd-container">
        {/* Section Header */}
        <div className="lnd-section-header">
          <span className="lnd-section-pill">
            <span className="pip-header-sparkle">✦</span>
            {isKhmer ? 'ស្ថាបត្យកម្ម PIP AI • ដំណើរការស្វ័យប្រវត្តិ' : 'HOW PIP WORKS • MULTI-AGENT CONSENSUS ENGINE'}
          </span>
          <h2 className="lnd-section-title">
            {isKhmer ? 'របៀបដែល Pip ស្កេន និងបញ្ចេញ Signal' : 'How Pip Scans & Publishes Signals'}
          </h2>
          <p className="lnd-section-sub">
            {isKhmer
              ? 'ចាប់ពីការចាប់យកទិន្នន័យរហូតដល់ការបញ្ចេញ Signal ផ្ទាល់ — មើលរបៀបដែល Pip AI វិភាគរចនាសម្ព័ន្ធទីផ្សារ ជជែកវាយតម្លៃ និងបង្កើតសញ្ញាជួញដូរប្រកបដោយភាពច្បាស់លាស់។'
              : 'From real-time tick ingestion to execution — explore how Pip’s 4-agent consensus engine analyzes institutional order flow, debates high-probability setups, and publishes verified signals in 14ms.'}
          </p>
        </div>

        {/* Main Console Board */}
        <div
          className="pip-engine-console"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top Laser Accent Strip */}
          <div className="pip-top-laser-line" />

          {/* Console Header Bar */}
          <div className="pip-console-header">
            <div className="pip-header-left">
              <div className="pip-engine-status">
                <span className="pip-live-pulse-dot" />
                <span className="pip-status-txt">ENGINE LIVE • PIP AI V4.2</span>
              </div>
              <div className="pip-live-ticker-badge">
                <span className="pip-pair-name">XAUUSD</span>
                <span className="pip-pair-tf">15m</span>
                <span className="pip-pair-price">3,998.40</span>
                <span className="pip-pair-change">+0.38%</span>
              </div>
            </div>

            {/* Quick Playback Controls */}
            <div className="pip-console-controls">
              <button
                className="pip-ctrl-btn pip-prev-btn"
                onClick={handlePrev}
                title="Previous Stage"
                aria-label="Previous Stage"
              >
                ‹
              </button>
              <button
                className={`pip-ctrl-btn pip-play-btn ${isPaused ? 'is-paused' : ''}`}
                onClick={togglePause}
                title={isPaused ? 'Resume Auto-Play' : 'Pause Auto-Play'}
                aria-label={isPaused ? 'Resume Auto-Play' : 'Pause Auto-Play'}
              >
                {isPaused ? '▶' : '❚❚'}
              </button>
              <button
                className="pip-ctrl-btn pip-next-btn"
                onClick={handleNext}
                title="Next Stage"
                aria-label="Next Stage"
              >
                ›
              </button>
            </div>
          </div>

          {/* Smooth Auto-Cycle Progress Indicator Bar */}
          <div className="pip-timer-bar-track">
            <div
              key={`${activeStep}-${isPaused}`}
              className={`pip-timer-bar-fill ${isPaused ? 'is-paused' : ''}`}
              style={{ animationDuration: `${STEP_DURATION}ms` }}
            />
          </div>

          {/* Unified Fluid Pipeline Stepper (Seamless Continuous Rail) */}
          <div className="pip-pipeline-track">
            {/* Continuous Energy Rail Layer */}
            <div className="pip-pipeline-rail-container">
              <div className="pip-pipeline-rail-bg" />
              <div
                className="pip-pipeline-rail-fill"
                style={{ width: railProgressWidth }}
              >
                <span className="pip-rail-photon-dot" />
              </div>
            </div>

            {/* Step 1: WAKE */}
            <div
              className={`pip-pipe-node ${activeStep === 1 ? 'is-active' : ''} ${activeStep > 1 ? 'is-done' : ''}`}
              onClick={() => handleStepClick(1)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(1); }}
              role="button"
              tabIndex={0}
              aria-label="Stage 1: WAKE"
            >
              <div className="pip-pipe-capsule">
                <div className="pip-pipe-icon-box">
                  {/* Custom SVG Icon 1: Quantum Synaptic Reactor */}
                  <svg className="pip-custom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
                    <path d="M12 3v3m0 12v3M3 12h3m12 0h3" strokeLinecap="round" />
                    <path d="m5.6 5.6 2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" strokeLinecap="round" opacity="0.6" />
                  </svg>
                  <span className="pip-pipe-check-badge">✓</span>
                </div>
                <div className="pip-pipe-meta">
                  <span className="pip-pipe-num">01</span>
                  <span className="pip-pipe-title">WAKE</span>
                  <span className="pip-pipe-sub">Data Ingestion</span>
                </div>
              </div>
            </div>

            {/* Step 2: SCAN */}
            <div
              className={`pip-pipe-node ${activeStep === 2 ? 'is-active' : ''} ${activeStep > 2 ? 'is-done' : ''}`}
              onClick={() => handleStepClick(2)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(2); }}
              role="button"
              tabIndex={0}
              aria-label="Stage 2: SCAN"
            >
              <div className="pip-pipe-capsule">
                <div className="pip-pipe-icon-box">
                  {/* Custom SVG Icon 2: Deep SMC Crosshair Radar */}
                  <svg className="pip-custom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" strokeDasharray="3 3" opacity="0.7" />
                    <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
                    <circle cx="15.5" cy="8.5" r="1.5" fill="#10b981" stroke="none" />
                  </svg>
                  <span className="pip-pipe-check-badge">✓</span>
                </div>
                <div className="pip-pipe-meta">
                  <span className="pip-pipe-num">02</span>
                  <span className="pip-pipe-title">SCAN</span>
                  <span className="pip-pipe-sub">Structure & SMC</span>
                </div>
              </div>
            </div>

            {/* Step 3: DEBATE */}
            <div
              className={`pip-pipe-node ${activeStep === 3 ? 'is-active' : ''} ${activeStep > 3 ? 'is-done' : ''}`}
              onClick={() => handleStepClick(3)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(3); }}
              role="button"
              tabIndex={0}
              aria-label="Stage 3: DEBATE"
            >
              <div className="pip-pipe-capsule">
                <div className="pip-pipe-icon-box">
                  {/* Custom SVG Icon 3: 4-Node Consensus Matrix */}
                  <svg className="pip-custom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="2.5" />
                    <circle cx="18" cy="6" r="2.5" />
                    <circle cx="6" cy="18" r="2.5" />
                    <circle cx="18" cy="18" r="2.5" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <path d="M7.8 7.8 10.2 10.2M16.2 7.8l-2.4 2.4M7.8 16.2l2.4-2.4M16.2 16.2l-2.4-2.4" strokeLinecap="round" />
                  </svg>
                  <span className="pip-pipe-check-badge">✓</span>
                </div>
                <div className="pip-pipe-meta">
                  <span className="pip-pipe-num">03</span>
                  <span className="pip-pipe-title">DEBATE</span>
                  <span className="pip-pipe-sub">4-Agent Nexus</span>
                </div>
              </div>
            </div>

            {/* Step 4: PUBLISH */}
            <div
              className={`pip-pipe-node ${activeStep === 4 ? 'is-active' : ''}`}
              onClick={() => handleStepClick(4)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(4); }}
              role="button"
              tabIndex={0}
              aria-label="Stage 4: PUBLISH"
            >
              <div className="pip-pipe-capsule">
                <div className="pip-pipe-icon-box">
                  {/* Custom SVG Icon 4: Lightning Broadcast Beacon */}
                  <svg className="pip-custom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
                  </svg>
                  <span className="pip-pipe-check-badge">✓</span>
                </div>
                <div className="pip-pipe-meta">
                  <span className="pip-pipe-num">04</span>
                  <span className="pip-pipe-title">PUBLISH</span>
                  <span className="pip-pipe-sub">14ms Broadcast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Console Main Body (Left Stage & Right Consensus Card) */}
          <div className="pip-console-body">
            {/* Left Screen: Dynamic Stage View (Stacked Grid for Buttery-Smooth Crossfade) */}
            <div className="pip-main-stage">
              {/* STAGE 1: WAKE (Unique Cyber Ingestion HUD) */}
              <div
                className={`pip-stage-pane pip-stage-wake ${
                  activeStep === 1 ? 'pip-pane-active' : activeStep > 1 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                {/* Visual Quantum Reactor Core */}
                <div className="pip-reactor-container">
                  <div className="pip-reactor-ring-outer" />
                  <div className="pip-reactor-ring-inner" />
                  <div className="pip-reactor-orbit-particle p1" />
                  <div className="pip-reactor-orbit-particle p2" />
                  <div className="pip-reactor-orbit-particle p3" />
                  <div className="pip-reactor-orbit-particle p4" />

                  <div className="pip-reactor-core">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" fill="rgba(0, 242, 254, 0.15)" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                </div>

                {/* Animated Ingestion Equalizer */}
                <div className="pip-equalizer-stream">
                  <span className="pip-eq-bar eq-1" />
                  <span className="pip-eq-bar eq-2" />
                  <span className="pip-eq-bar eq-3" />
                  <span className="pip-eq-bar eq-4" />
                  <span className="pip-eq-bar eq-5" />
                  <span className="pip-eq-label">14,200 TICKS / SEC INGESTION</span>
                </div>

                {/* Floating Telemetry Pods */}
                <div className="pip-telemetry-pods-grid">
                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot cyan" />
                      <span className="pip-pod-tag">ORDER BOOKS</span>
                    </div>
                    <strong className="pip-pod-val">14 Institutional Feeds</strong>
                    <span className="pip-pod-sub">CME • LMAX • Binance</span>
                  </div>

                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot amber" />
                      <span className="pip-pod-tag">PATTERN MEMORY</span>
                    </div>
                    <strong className="pip-pod-val">14,280 SMC Setups</strong>
                    <span className="pip-pod-sub">Synced 99.8% Recall</span>
                  </div>

                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot emerald" />
                      <span className="pip-pod-tag">RISK CEILING</span>
                    </div>
                    <strong className="pip-pod-val">0.8% Max Drawdown</strong>
                    <span className="pip-pod-sub">Guaranteed Shield</span>
                  </div>
                </div>

                {/* Animated Terminal Bar */}
                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-CORE]</span>
                  <span className="pip-term-text">synaptic mesh active • 14 order books streaming • volatility normal</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 2: SCAN (Unique High-Precision SMC Order Flow Terminal) */}
              <div
                className={`pip-stage-pane pip-stage-scan ${
                  activeStep === 2 ? 'pip-pane-active' : activeStep > 2 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                <div className="pip-scan-chart-container">
                  {/* Real-time Scanning Radar Laser Beam */}
                  <div className="pip-chart-scan-beam" />

                  {/* Institutional Order Block Zone */}
                  <div className="pip-order-block-band">
                    <div className="pip-ob-tag">
                      <span className="pip-ob-pulse-dot" />
                      <span>ORDER BLOCK • SUPPLY 4,014.00</span>
                    </div>
                  </div>

                  {/* Asian Session High Sweep Marker */}
                  <div className="pip-sweep-marker">
                    <span>⚡ ASIAN HIGH SWEPT</span>
                  </div>

                  {/* Candlestick Wave Graphic with Real Order Flow Rejection */}
                  <svg className="pip-scan-candles-svg" viewBox="0 0 680 180" preserveAspectRatio="none">
                    {/* Asian Accumulation Range */}
                    <line x1="40" y1="110" x2="40" y2="135" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="36" y="115" width="8" height="15" rx="1.5" fill="#10b981" />

                    <line x1="80" y1="95" x2="80" y2="128" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="76" y="102" width="8" height="18" rx="1.5" fill="#10b981" />

                    <line x1="120" y1="92" x2="120" y2="125" stroke="#ef4444" strokeWidth="1.6" />
                    <rect x="116" y="98" width="8" height="16" rx="1.5" fill="#f87171" />

                    <line x1="160" y1="80" x2="160" y2="118" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="156" y="86" width="8" height="20" rx="1.5" fill="#10b981" />

                    <line x1="200" y1="72" x2="200" y2="108" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="196" y="78" width="8" height="22" rx="1.5" fill="#10b981" />

                    {/* Liquidity Sweep Spike into Supply */}
                    <line x1="240" y1="45" x2="240" y2="95" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="236" y="52" width="8" height="24" rx="1.5" fill="#10b981" />

                    <line x1="280" y1="40" x2="280" y2="92" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="276" y="48" width="8" height="26" rx="1.5" fill="#10b981" />

                    {/* Clean Rejection Pin Bar at 4,014 Supply */}
                    <line x1="320" y1="36" x2="320" y2="98" stroke="#f87171" strokeWidth="1.8" />
                    <rect x="316" y="62" width="8" height="18" rx="1.5" fill="#f87171" />

                    {/* Bearish Displacement Candles */}
                    <line x1="365" y1="65" x2="365" y2="110" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="361" y="72" width="8" height="24" rx="1.5" fill="#f87171" />

                    <line x1="410" y1="78" x2="410" y2="120" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="406" y="85" width="8" height="24" rx="1.5" fill="#f87171" />

                    <line x1="455" y1="90" x2="455" y2="135" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="451" y="98" width="8" height="26" rx="1.5" fill="#f87171" />

                    <line x1="500" y1="105" x2="500" y2="148" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="496" y="112" width="8" height="25" rx="1.5" fill="#f87171" />

                    <line x1="545" y1="118" x2="545" y2="158" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="541" y="125" width="8" height="24" rx="1.5" fill="#f87171" />

                    <line x1="590" y1="126" x2="590" y2="168" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="586" y="132" width="8" height="26" rx="1.5" fill="#f87171" />

                    <line x1="635" y1="135" x2="635" y2="175" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="631" y="140" width="8" height="26" rx="1.5" fill="#f87171" />
                  </svg>
                </div>

                {/* Detected Confluence Tags Matrix */}
                <div className="pip-confluences-row">
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">⚡</span>
                    <span>Asian High Swept</span>
                  </div>
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">🎯</span>
                    <span>Supply Rejection (4,014)</span>
                  </div>
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">📉</span>
                    <span>15m ChoCh Confirmed</span>
                  </div>
                  <div className="pip-conf-tag-pill">
                    <span className="pip-conf-icon">📊</span>
                    <span>FVG Imbalance Zone</span>
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-SCAN]</span>
                  <span className="pip-term-text">order block confirmed at 4,014.00 • liquidity pool absorbed • initiating debate</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 3: DEBATE (Unique 4-Agent Autonomous Arena) */}
              <div
                className={`pip-stage-pane pip-stage-debate ${
                  activeStep === 3 ? 'pip-pane-active' : activeStep > 3 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                <div className="pip-agent-arena-grid">
                  {/* Agent 1: Quant SMC */}
                  <div className="pip-arena-card cyan-theme" style={{ '--card-delay': '0.04s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar cyan">
                        <span>⚡</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Quant SMC Engine</strong>
                        <span className="pip-arena-role">Market Structure</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      Asian liquidity swept clean. 15m Fair Value Gap displacement confirms institutional distribution.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>92%</strong>
                    </div>
                  </div>

                  {/* Agent 2: Macro Sentinel */}
                  <div className="pip-arena-card purple-theme" style={{ '--card-delay': '0.10s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar purple">
                        <span>🌐</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Macro Sentinel</strong>
                        <span className="pip-arena-role">Yields & Dollar Index</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      US 10Y Yields firm at 4.28%, DXY bullish expansion capping Gold upside pressure.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>88%</strong>
                    </div>
                  </div>

                  {/* Agent 3: Sentiment AI */}
                  <div className="pip-arena-card blue-theme" style={{ '--card-delay': '0.16s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar blue">
                        <span>📊</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Orderbook Sentiment</strong>
                        <span className="pip-arena-role">Retail Positioning</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      Retail crowd 74% net-long near highs. Prime institutional liquidity trap scenario.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>91%</strong>
                    </div>
                  </div>

                  {/* Agent 4: Risk Guardian */}
                  <div className="pip-arena-card emerald-theme" style={{ '--card-delay': '0.22s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar emerald">
                        <span>🛡️</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Capital Guardian</strong>
                        <span className="pip-arena-role">Drawdown Shield</span>
                      </div>
                      <span className="pip-arena-vote pass">APPROVED</span>
                    </div>
                    <p className="pip-arena-arg">
                      Stop loss placed above 4,014.90 wick structure provides 1:3.2 Risk-to-Reward. Approved.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>96%</strong>
                    </div>
                  </div>
                </div>

                {/* Consensus Nexus Bar */}
                <div className="pip-consensus-nexus-box">
                  <div className="pip-nexus-header">
                    <span className="pip-nexus-label">Consensus Chamber Tally:</span>
                    <strong className="pip-nexus-stat">3 of 4 Agents Agree (75%)</strong>
                    <span className="pip-nexus-badge">✓ SUPERMAJORITY REACHED</span>
                  </div>
                  <div className="pip-nexus-track">
                    <div
                      className="pip-nexus-fill"
                      style={{ width: activeStep === 3 ? '75%' : '0%' }}
                    />
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-DEBATE]</span>
                  <span className="pip-term-text">supermajority agreement verified • risk parameters signed • compiling dispatch</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 4: PUBLISH (Unique 14ms Sub-Second Execution Hub) */}
              <div
                className={`pip-stage-pane pip-stage-publish ${
                  activeStep === 4 ? 'pip-pane-active' : 'pip-pane-right'
                }`}
              >
                {/* Broadcast Hub Console */}
                <div className="pip-dispatch-hub">
                  <div className="pip-dispatch-header">
                    <div className="pip-dispatch-identity">
                      <span className="pip-dispatch-beacon" />
                      <div>
                        <h4 className="pip-dispatch-title">High-Frequency Execution Broadcast</h4>
                        <span className="pip-dispatch-sub">Dispatched simultaneously across VIP channels in 14ms</span>
                      </div>
                    </div>
                    <span className="pip-latency-tag">14ms SPEED</span>
                  </div>

                  {/* Multi-Channel Distribution Grid */}
                  <div className="pip-dispatch-channels-grid">
                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">✈️</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">VIP TELEGRAM</span>
                        <strong className="pip-channel-status">✓ 2,400+ SENT</strong>
                      </div>
                    </div>

                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">📱</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">MOBILE APP PUSH</span>
                        <strong className="pip-channel-status">✓ INSTANT NOTIFIED</strong>
                      </div>
                    </div>

                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">⚡</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">WEB TERMINAL</span>
                        <strong className="pip-channel-status">✓ LIVE SYNCED</strong>
                      </div>
                    </div>

                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">🛡️</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">SLIPPAGE GUARD</span>
                        <strong className="pip-channel-status gold">ZERO SLIP</strong>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Order Parameters Checklist */}
                  <div className="pip-dispatch-checklist">
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>SMC order block confluence confirmed with 88% collective confidence</span>
                    </div>
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>Asymmetric 1:3.2 Risk-to-Reward locked with predefined TP1 / TP2 levels</span>
                    </div>
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>Automated 24/7 WebSocket tracker activated for real-time TP hit alerts</span>
                    </div>
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-EXECUTE]</span>
                  <span className="pip-term-text">signal broadcast live • entry, SL & TP monitored 24/7 across WebSocket</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>
            </div>

            {/* Right Screen: Consensus Waiting State OR Published Live Signal Card (Stacked Grid) */}
            <div className="pip-right-panel">
              {/* Steps 1-3: Skeleton placeholder waiting for consensus */}
              <div className={`pip-right-card-pane pip-skeleton-card ${activeStep < 4 ? 'pip-card-active' : 'pip-card-hidden'}`}>
                <div className="pip-skel-header-row">
                  <div className="pip-skel-bar pip-skel-bar-lg" />
                  <div className="pip-skel-bar pip-skel-bar-sm" />
                </div>
                <div className="pip-skel-lines">
                  <div className="pip-skel-bar pip-skel-bar-full" />
                  <div className="pip-skel-bar pip-skel-bar-med" />
                  <div className="pip-skel-bar pip-skel-bar-short" />
                </div>
                <div className="pip-skel-circle-row">
                  <div className="pip-skel-circle" />
                  <div className="pip-skel-bar pip-skel-bar-med" />
                </div>
                <div className="pip-waiting-label">
                  <span className="pip-wait-spinner" />
                  <span>
                    {activeStep === 1 && 'Ingesting institutional order flow...'}
                    {activeStep === 2 && 'Scanning liquidity & SMC structure...'}
                    {activeStep === 3 && 'Agents debating trade consensus...'}
                  </span>
                </div>
              </div>

              {/* Step 4: Published Live Signal Card (Unique Cyber Glassmorphism) */}
              <div className={`pip-right-card-pane pip-published-signal-card ${activeStep === 4 ? 'pip-card-active' : 'pip-card-hidden'}`}>
                <div className="pip-pub-header">
                  <div>
                    <h4 className="pip-pub-pair">XAUUSD</h4>
                    <span className="pip-pub-sub">GOLD • 15M • INSTITUTIONAL SMC</span>
                  </div>
                  <span className="pip-pub-badge-sell">
                    <span className="pip-badge-pulse-dot" /> SELL ORDER
                  </span>
                </div>

                <div className="pip-pub-metrics">
                  <div className="pip-pub-metric-row">
                    <span>Entry Zone</span>
                    <strong className="pip-val-entry">3,998.40</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Stop Loss (Risk)</span>
                    <strong className="pip-text-sl">4,014.90</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Take Profit 1</span>
                    <strong className="pip-text-tp">3,982.00</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Take Profit 2</span>
                    <strong className="pip-text-tp">3,974.10</strong>
                  </div>
                  <div className="pip-pub-metric-row pip-rr-row">
                    <span>Risk / Reward Ratio</span>
                    <strong className="pip-val-gold">1 : 3.2</strong>
                  </div>
                </div>

                {/* Circular Confidence Meter */}
                <div className="pip-pub-confidence-row">
                  <div className="pip-confidence-ring">
                    <svg viewBox="0 0 44 44" className="pip-conf-svg">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.2"
                        strokeDasharray="113"
                        strokeDashoffset={activeStep === 4 ? 24 : 113}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                        className="pip-conf-circle-progress"
                      />
                    </svg>
                    <span className="pip-conf-pct">88%</span>
                  </div>
                  <div className="pip-conf-info">
                    <strong>88% AI Confidence</strong>
                    <span>Verified by 4-agent consensus</span>
                  </div>
                </div>

                {/* Published Status & Copy Action Buttons */}
                <div className="pip-card-actions">
                  <div className="pip-published-btn">
                    <span>✓ PUBLISHED & TRACKED LIVE</span>
                  </div>
                  <button
                    className="pip-copy-setup-btn"
                    onClick={handleCopySignal}
                    type="button"
                  >
                    {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY SIGNAL SETUP'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
