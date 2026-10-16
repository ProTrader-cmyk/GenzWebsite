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
    // Resume auto-play after 14 seconds of inactivity
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
    const text = `🎯 PIP AI LIVE SIGNAL\nPair: XAUUSD (15m)\nAction: SELL\nEntry: 3,998.40\nStop Loss: 4,014.90\nTake Profit: 3,974.10\nRisk/Reward: 1:3.2\nConfidence: 88%\nStatus: Verified by Multi-Agent Consensus`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // 4 Feature Pillars under the console
  const pillars = [
    {
      id: 1,
      tag: isKhmer ? 'ដំណាក់កាលទី ១' : 'STAGE 01',
      title: isKhmer ? 'ការចាប់យកទិន្នន័យ (WAKE)' : 'Synaptic Ingestion (WAKE)',
      desc: isKhmer
        ? 'ម៉ាស៊ីន AI ភ្ញាក់ឡើងដើម្បីទាញទិន្នន័យពីទីផ្សារសកលចំនួន ១៤ ប្រភព រួមទាំង Order Book, Volatility និងប្រវត្តិជួញដូរ។'
        : 'Pip awakens 24/7, continuously streaming from 14 institutional order books, volatility feeds, and pattern memory.'
    },
    {
      id: 2,
      tag: isKhmer ? 'ដំណាក់កាលទី ២' : 'STAGE 02',
      title: isKhmer ? 'ស្កេនរចនាសម្ព័ន្ធ (SCAN)' : 'SMC Structure Scan (SCAN)',
      desc: isKhmer
        ? 'ស្កេនរក Liquidity Sweeps, Supply/Demand Zones និង Fair Value Gaps ដោយស្វ័យប្រវត្តិតាមរយៈ Computer Vision។'
        : 'Algorithmic computer vision identifies liquidity sweeps, institutional supply zones, and fair value gaps.'
    },
    {
      id: 3,
      tag: isKhmer ? 'ដំណាក់កាលទី ៣' : 'STAGE 03',
      title: isKhmer ? 'ជជែកវាយតម្លៃ (DEBATE)' : '4-Agent Debate (DEBATE)',
      desc: isKhmer
        ? 'ភ្នាក់ងារ AI ចំនួន ៤ (បច្ចេកទេស, ម៉ាក្រូ, អារម្មណ៍ទីផ្សារ, និងហានិភ័យ) ជជែកពិភាក្សាដើម្បីសម្រេចមតិរួម >= ៧៥%។'
        : 'Four specialized autonomous agents cross-examine the trade until a supermajority consensus (>=75%) is reached.'
    },
    {
      id: 4,
      tag: isKhmer ? 'ដំណាក់កាលទី ៤' : 'STAGE 04',
      title: isKhmer ? 'បញ្ចេញ Signal (PUBLISH)' : 'Instant Execution (PUBLISH)',
      desc: isKhmer
        ? 'បញ្ចេញ Signal ក្នុងរយៈពេល ១៤ms ទៅកាន់ Telegram VIP និងកម្មវិធីផ្ទាល់ ដោយមានចំណុច Entry, SL និង TP ច្បាស់លាស់។'
        : 'Sub-second 14ms broadcast directly to Telegram VIP, Webhook, and mobile push with verified TP/SL parameters.'
    }
  ];

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
                <span className="pip-status-txt">ENGINE LIVE • V4.2 CORE</span>
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

          {/* 4-Stage Interactive Stepper Track */}
          <div className="pip-stepper-track">
            {/* Step 1: WAKE */}
            <div
              className={`pip-step-node ${activeStep === 1 ? 'pip-step-active' : ''} ${activeStep > 1 ? 'pip-step-done' : ''}`}
              onClick={() => handleStepClick(1)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(1); }}
              role="button"
              tabIndex={0}
              aria-label="Step 1: WAKE"
            >
              <div className="pip-step-circle">
                <span className="pip-step-num">1</span>
                <span className="pip-step-check">✓</span>
              </div>
              <span className="pip-step-label">WAKE</span>
              <span className="pip-step-sublabel">Data Sync</span>
            </div>

            {/* Connecting Line 1-2 */}
            <div className={`pip-step-connector ${activeStep >= 2 ? 'pip-connector-done' : activeStep === 1 ? 'pip-connector-active' : ''}`}>
              <div
                className="pip-connector-progress"
                style={{ width: activeStep >= 2 ? '100%' : activeStep === 1 ? '55%' : '0%' }}
              />
              {activeStep === 1 && <span className="pip-connector-pulse-beam" />}
            </div>

            {/* Step 2: SCAN */}
            <div
              className={`pip-step-node ${activeStep === 2 ? 'pip-step-active' : ''} ${activeStep > 2 ? 'pip-step-done' : ''}`}
              onClick={() => handleStepClick(2)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(2); }}
              role="button"
              tabIndex={0}
              aria-label="Step 2: SCAN"
            >
              <div className="pip-step-circle">
                <span className="pip-step-num">2</span>
                <span className="pip-step-check">✓</span>
              </div>
              <span className="pip-step-label">SCAN</span>
              <span className="pip-step-sublabel">SMC Flow</span>
            </div>

            {/* Connecting Line 2-3 */}
            <div className={`pip-step-connector ${activeStep >= 3 ? 'pip-connector-done' : activeStep === 2 ? 'pip-connector-active' : ''}`}>
              <div
                className="pip-connector-progress"
                style={{ width: activeStep >= 3 ? '100%' : activeStep === 2 ? '55%' : '0%' }}
              />
              {activeStep === 2 && <span className="pip-connector-pulse-beam" />}
            </div>

            {/* Step 3: DEBATE */}
            <div
              className={`pip-step-node ${activeStep === 3 ? 'pip-step-active' : ''} ${activeStep > 3 ? 'pip-step-done' : ''}`}
              onClick={() => handleStepClick(3)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(3); }}
              role="button"
              tabIndex={0}
              aria-label="Step 3: DEBATE"
            >
              <div className="pip-step-circle">
                <span className="pip-step-num">3</span>
                <span className="pip-step-check">✓</span>
              </div>
              <span className="pip-step-label">DEBATE</span>
              <span className="pip-step-sublabel">4-Agent Vote</span>
            </div>

            {/* Connecting Line 3-4 */}
            <div className={`pip-step-connector ${activeStep >= 4 ? 'pip-connector-done' : activeStep === 3 ? 'pip-connector-active' : ''}`}>
              <div
                className="pip-connector-progress"
                style={{ width: activeStep >= 4 ? '100%' : activeStep === 3 ? '55%' : '0%' }}
              />
              {activeStep === 3 && <span className="pip-connector-pulse-beam" />}
            </div>

            {/* Step 4: PUBLISH */}
            <div
              className={`pip-step-node ${activeStep === 4 ? 'pip-step-active' : ''}`}
              onClick={() => handleStepClick(4)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(4); }}
              role="button"
              tabIndex={0}
              aria-label="Step 4: PUBLISH"
            >
              <div className="pip-step-circle">
                <span className="pip-step-num">4</span>
                <span className="pip-step-check">✓</span>
              </div>
              <span className="pip-step-label">PUBLISH</span>
              <span className="pip-step-sublabel">14ms Broadcast</span>
            </div>
          </div>

          {/* Console Main Body (Left Stage & Right Consensus Card) */}
          <div className="pip-console-body">
            {/* Left Screen: Dynamic Stage View (Stacked Grid for Buttery-Smooth Crossfade) */}
            <div className="pip-main-stage">
              {/* STAGE 1: WAKE */}
              <div
                className={`pip-stage-pane pip-stage-wake ${
                  activeStep === 1 ? 'pip-pane-active' : activeStep > 1 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                {/* Visual Brain / Neural Core Container */}
                <div className="pip-wake-orbit-container">
                  <div className="pip-orbit-ring pip-orbit-ring-outer" />
                  <div className="pip-orbit-ring pip-orbit-ring-inner" />
                  <div className="pip-orbit-dot pip-dot-1" />
                  <div className="pip-orbit-dot pip-dot-2" />
                  <div className="pip-orbit-dot pip-dot-3" />
                  <div className="pip-orbit-dot pip-dot-4" />
                  <div className="pip-orbit-dot pip-dot-5" />
                  <div className="pip-orbit-dot pip-dot-6" />

                  <div className="pip-wake-brain-core">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 3.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 5 12a3 3 0 0 0 1.5 5.2 3 3 0 0 0 3 2.8 2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5Z" />
                      <path d="M14.5 3.5a3 3 0 0 1 3 3v.3A3 3 0 0 1 19 12a3 3 0 0 1-1.5 5.2 3 3 0 0 1-3 2.8 2.5 2.5 0 0 1-2.5-2.5V6a2.5 2.5 0 0 1 2.5-2.5Z" />
                      <path d="M9.5 8.5h1.8M9 12.5h2.3M9.5 16.2h1.8M12.7 8.5h1.8M12.7 12.5h2.3M12.7 16.2h1.8" opacity=".6" />
                    </svg>
                  </div>
                </div>

                {/* Live Ingestion Chips */}
                <div className="pip-wake-chips-row">
                  <span className="pip-chip pip-chip-active-gold">
                    <span className="pip-chip-dot" /> Market data (14 feeds)
                  </span>
                  <span className="pip-chip pip-chip-active-gold">
                    <span className="pip-chip-dot" /> Loss memory (14,280 setups)
                  </span>
                  <span className="pip-chip pip-chip-active-cyan">
                    <span className="pip-chip-dot" /> Risk guardrail (0.8% cap)
                  </span>
                </div>

                {/* Telemetry Matrix Grid */}
                <div className="pip-wake-telemetry-grid">
                  <div className="pip-telem-item">
                    <span className="pip-telem-label">STREAM LATENCY</span>
                    <strong className="pip-telem-val">18 ms</strong>
                  </div>
                  <div className="pip-telem-item">
                    <span className="pip-telem-label">ORDER FLOW REGIME</span>
                    <strong className="pip-telem-val pip-val-emerald">ACCUMULATION</strong>
                  </div>
                  <div className="pip-telem-item">
                    <span className="pip-telem-label">NEURAL WEIGHTS</span>
                    <strong className="pip-telem-val">CALIBRATED</strong>
                  </div>
                </div>

                {/* Animated Terminal Bar */}
                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">$ pip.boot()</span>
                  <span className="pip-term-text">neural weights warmed • 14 orderbook feeds streaming live</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 2: SCAN */}
              <div
                className={`pip-stage-pane pip-stage-scan ${
                  activeStep === 2 ? 'pip-pane-active' : activeStep > 2 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                <div className="pip-scan-chart-container">
                  {/* Real-time Scanning Radar Laser Beam */}
                  <div className="pip-chart-scan-beam" />

                  {/* Supply Zone Glow Overlay */}
                  <div className="pip-supply-glow" />

                  {/* Dashed Line Supply Level */}
                  <div className="pip-supply-line">
                    <span className="pip-supply-tag">
                      <span className="pip-supply-dot" /> Institutional Supply 4,014.00
                    </span>
                  </div>

                  {/* Candlestick Wave Graphic */}
                  <svg className="pip-scan-candles-svg" viewBox="0 0 680 180" preserveAspectRatio="none">
                    {/* Bullish run into supply */}
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

                    <line x1="240" y1="65" x2="240" y2="100" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="236" y="70" width="8" height="18" rx="1.5" fill="#f87171" />

                    <line x1="280" y1="58" x2="280" y2="92" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="276" y="65" width="8" height="20" rx="1.5" fill="#10b981" />

                    <line x1="320" y1="52" x2="320" y2="88" stroke="#10b981" strokeWidth="1.6" />
                    <rect x="316" y="58" width="8" height="18" rx="1.5" fill="#10b981" />

                    {/* Rejection candles at Supply line (4,014) */}
                    <line x1="360" y1="55" x2="360" y2="95" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="356" y="62" width="8" height="18" rx="1.5" fill="#f87171" />

                    <line x1="400" y1="60" x2="400" y2="105" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="396" y="68" width="8" height="22" rx="1.5" fill="#f87171" />

                    <line x1="440" y1="70" x2="440" y2="115" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="436" y="78" width="8" height="24" rx="1.5" fill="#f87171" />

                    <line x1="480" y1="85" x2="480" y2="128" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="476" y="92" width="8" height="22" rx="1.5" fill="#f87171" />

                    <line x1="520" y1="98" x2="520" y2="140" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="516" y="105" width="8" height="25" rx="1.5" fill="#f87171" />

                    <line x1="560" y1="110" x2="560" y2="150" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="556" y="118" width="8" height="24" rx="1.5" fill="#f87171" />

                    <line x1="600" y1="120" x2="600" y2="160" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="596" y="128" width="8" height="22" rx="1.5" fill="#f87171" />

                    <line x1="640" y1="130" x2="640" y2="170" stroke="#f87171" strokeWidth="1.6" />
                    <rect x="636" y="136" width="8" height="26" rx="1.5" fill="#f87171" />
                  </svg>
                </div>

                {/* Detected SMC Criteria Chips */}
                <div className="pip-scan-chips-row">
                  <span className="pip-chip pip-chip-active-green">✓ Structure Rejection</span>
                  <span className="pip-chip pip-chip-active-green">✓ Asian High Swept</span>
                  <span className="pip-chip pip-chip-active-green">✓ Bearish ChoCh (15m)</span>
                  <span className="pip-chip pip-chip-faint">FVG Imbalance</span>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">$ pip.scan()</span>
                  <span className="pip-term-text">supply zone confirmed at 4,014.00 — institutional sellers in control</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 3: DEBATE */}
              <div
                className={`pip-stage-pane pip-stage-debate ${
                  activeStep === 3 ? 'pip-pane-active' : activeStep > 3 ? 'pip-pane-left' : 'pip-pane-right'
                }`}
              >
                <div className="pip-debate-list">
                  {/* Row 1: Technical */}
                  <div className="pip-debate-row pip-debate-green" style={{ '--row-delay': '0.04s' }}>
                    <div className="pip-agent-badge pip-badge-ta">TA</div>
                    <div className="pip-agent-info">
                      <div className="pip-agent-title-row">
                        <span className="pip-agent-name">Technical Agent</span>
                        <span className="pip-agent-role-pill">SMC Market Structure</span>
                      </div>
                      <span className="pip-agent-msg">Lower highs into 4,014 supply. Bearish FVG displacement on 15m.</span>
                    </div>
                    <div className="pip-agent-vote-col">
                      <span className="pip-vote-badge pip-vote-sell">SELL</span>
                      <span className="pip-vote-conf">91% conf</span>
                    </div>
                  </div>

                  {/* Row 2: Macro */}
                  <div className="pip-debate-row pip-debate-green" style={{ '--row-delay': '0.10s' }}>
                    <div className="pip-agent-badge pip-badge-ma">MA</div>
                    <div className="pip-agent-info">
                      <div className="pip-agent-title-row">
                        <span className="pip-agent-name">Macro Agent</span>
                        <span className="pip-agent-role-pill">Yields & DXY</span>
                      </div>
                      <span className="pip-agent-msg">US 10-Year yield firm above 4.28%, Dollar Index gaining bullish momentum.</span>
                    </div>
                    <div className="pip-agent-vote-col">
                      <span className="pip-vote-badge pip-vote-sell">SELL</span>
                      <span className="pip-vote-conf">86% conf</span>
                    </div>
                  </div>

                  {/* Row 3: Sentiment */}
                  <div className="pip-debate-row pip-debate-green" style={{ '--row-delay': '0.16s' }}>
                    <div className="pip-agent-badge pip-badge-se">SE</div>
                    <div className="pip-agent-info">
                      <div className="pip-agent-title-row">
                        <span className="pip-agent-name">Sentiment Agent</span>
                        <span className="pip-agent-role-pill">Retail Positioning</span>
                      </div>
                      <span className="pip-agent-msg">Retail crowd 74% long near highs. High probability liquidity trap.</span>
                    </div>
                    <div className="pip-agent-vote-col">
                      <span className="pip-vote-badge pip-vote-sell">SELL</span>
                      <span className="pip-vote-conf">89% conf</span>
                    </div>
                  </div>

                  {/* Row 4: Risk */}
                  <div className="pip-debate-row pip-debate-dark" style={{ '--row-delay': '0.22s' }}>
                    <div className="pip-agent-badge pip-badge-rk">RK</div>
                    <div className="pip-agent-info">
                      <div className="pip-agent-title-row">
                        <span className="pip-agent-name">Risk Sentinel</span>
                        <span className="pip-agent-role-pill">Capital Shield</span>
                      </div>
                      <span className="pip-agent-msg">Tight stop above 4,014.90 wick gives asymmetric 1:3.2 R:R. Approved.</span>
                    </div>
                    <div className="pip-agent-vote-col">
                      <span className="pip-vote-badge pip-vote-buy">PASS</span>
                      <span className="pip-vote-conf">95% conf</span>
                    </div>
                  </div>
                </div>

                {/* Consensus Meter Bar */}
                <div className="pip-consensus-meter-container">
                  <div className="pip-consensus-meta">
                    <span className="pip-consensus-text">Consensus Threshold: <strong>3 of 4 Agree (75%)</strong></span>
                    <span className="pip-consensus-status-pill">✓ SUPERMAJORITY REACHED</span>
                  </div>
                  <div className="pip-consensus-track">
                    <div
                      className="pip-consensus-fill"
                      style={{ width: activeStep === 3 ? '75%' : '0%' }}
                    />
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">$ pip.debate()</span>
                  <span className="pip-term-text">3 of 4 supermajority confirmed — SELL bias approved by Risk Sentinel</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 4: PUBLISH */}
              <div
                className={`pip-stage-pane pip-stage-publish ${
                  activeStep === 4 ? 'pip-pane-active' : 'pip-pane-right'
                }`}
              >
                {/* Broadcast Execution Dashboard */}
                <div className="pip-publish-broadcast-box">
                  <div className="pip-broadcast-header">
                    <div className="pip-broadcast-title-group">
                      <span className="pip-broadcast-pulse-dot" />
                      <div>
                        <h4 className="pip-broadcast-title">Execution Order Compiled & Dispatched</h4>
                        <span className="pip-broadcast-sub">Multi-channel broadcast completed in 14 milliseconds</span>
                      </div>
                    </div>
                    <span className="pip-broadcast-speed-badge">14ms SPEED</span>
                  </div>

                  {/* Telemetry metrics */}
                  <div className="pip-broadcast-stats-grid">
                    <div className="pip-b-stat">
                      <span className="pip-b-stat-label">VIP TELEGRAM</span>
                      <strong className="pip-b-stat-val pip-val-emerald">✓ DISPATCHED</strong>
                    </div>
                    <div className="pip-b-stat">
                      <span className="pip-b-stat-label">MOBILE PUSH</span>
                      <strong className="pip-b-stat-val pip-val-emerald">✓ 2,400+ SENT</strong>
                    </div>
                    <div className="pip-b-stat">
                      <span className="pip-b-stat-label">EXECUTION LATENCY</span>
                      <strong className="pip-b-stat-val">14 ms</strong>
                    </div>
                    <div className="pip-b-stat">
                      <span className="pip-b-stat-label">SLIPPAGE GUARD</span>
                      <strong className="pip-b-stat-val pip-val-gold">ZERO SLIP</strong>
                    </div>
                  </div>

                  {/* Real-time Execution Steps checklist */}
                  <div className="pip-broadcast-checklist">
                    <div className="pip-b-check-item">
                      <span className="pip-b-check-icon">✓</span>
                      <span>SMC structure verified with 88% overall confidence</span>
                    </div>
                    <div className="pip-b-check-item">
                      <span className="pip-b-check-icon">✓</span>
                      <span>1:3.2 Risk-to-Reward ratio locked with strict Stop Loss at 4,014.90</span>
                    </div>
                    <div className="pip-b-check-item">
                      <span className="pip-b-check-icon">✓</span>
                      <span>Live WebSocket tracking activated for automated TP1 / TP2 updates</span>
                    </div>
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">$ pip.publish()</span>
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
                    {activeStep === 1 && 'Ingesting order flow & memory...'}
                    {activeStep === 2 && 'Scanning liquidity & supply structure...'}
                    {activeStep === 3 && 'Agents debating setup (3/4 agree)...'}
                  </span>
                </div>
              </div>

              {/* Step 4: Published Live Signal Card matching screenshot 4 */}
              <div className={`pip-right-card-pane pip-published-signal-card ${activeStep === 4 ? 'pip-card-active' : 'pip-card-hidden'}`}>
                <div className="pip-pub-header">
                  <div>
                    <h4 className="pip-pub-pair">XAUUSD</h4>
                    <span className="pip-pub-sub">GOLD • 15M • INSTITUTIONAL SMC</span>
                  </div>
                  <span className="pip-pub-badge-sell">
                    <span className="pip-badge-pulse-dot" /> SELL
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
                    <strong>88% Confidence</strong>
                    <span>Verified by 4-agent consensus</span>
                  </div>
                </div>

                {/* Published & Tracked Button Badge + Interactive Copy Button */}
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

        {/* 4 Interactive Feature Pillars Under Console */}
        <div className="pip-pillars-grid">
          {pillars.map((p, idx) => {
            const stepNum = idx + 1;
            const isActive = activeStep === stepNum;
            return (
              <div
                key={p.id}
                className={`pip-pillar-card ${isActive ? 'pip-pillar-active' : ''}`}
                onClick={() => handleStepClick(stepNum)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepClick(stepNum); }}
                role="button"
                tabIndex={0}
                aria-label={`Jump to Stage ${stepNum}: ${p.title}`}
              >
                <div className="pip-pillar-header">
                  <span className="pip-pillar-num">0{stepNum}</span>
                  <span className="pip-pillar-tag">{p.tag}</span>
                </div>
                <h4 className="pip-pillar-title">{p.title}</h4>
                <p className="pip-pillar-desc">{p.desc}</p>
                <div className="pip-pillar-footer">
                  <span className="pip-pillar-action">
                    {isActive ? (isKhmer ? '● កំពុងបង្ហាញ' : '● ACTIVE STAGE') : (isKhmer ? 'ចុចមើល →' : 'VIEW STAGE →')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
