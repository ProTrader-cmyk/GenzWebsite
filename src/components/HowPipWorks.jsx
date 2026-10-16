import { useState, useEffect, useRef } from 'react';
import '../styles/howPipWorks.css';

export default function HowPipWorks({ isKhmer }) {
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);

  // Auto-cycle through the 4 steps every 4.8 seconds unless paused by user interaction
  useEffect(() => {
    if (isPaused) return;
    autoPlayRef.current = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 4800);
    return () => clearInterval(autoPlayRef.current);
  }, [isPaused]);

  const handleStepClick = (step) => {
    setActiveStep(step);
    setIsPaused(true);
    // Resume auto-play after 12 seconds of inactivity
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 12000);
  };

  return (
    <section className="lnd-section lnd-how-pip-section" id="how-pip-works">
      <div className="lnd-container">
        {/* Section Header */}
        <div className="lnd-section-header">
          <span className="lnd-section-pill">
            {isKhmer ? 'ស្ថាបត្យកម្ម PIP AI • ដំណើរការស្វ័យប្រវត្តិ' : 'HOW PIP WORKS • MULTI-AGENT CONSENSUS'}
          </span>
          <h2 className="lnd-section-title">
            {isKhmer ? 'របៀបដែល Pip ស្កេន និងបញ្ចេញ Signal' : 'How Pip Scans & Publishes Signals'}
          </h2>
          <p className="lnd-section-sub">
            {isKhmer
              ? 'ចាប់ពីការចាប់យកទិន្នន័យរហូតដល់ការបញ្ចេញ Signal ផ្ទាល់ — មើលរបៀបដែល Pip AI វិភាគរចនាសម្ព័ន្ធទីផ្សារ ជជែកវាយតម្លៃ និងបង្កើតសញ្ញាជួញដូរប្រកបដោយភាពច្បាស់លាស់។'
              : 'From real-time market awakening to execution — explore how Pip’s multi-agent consensus engine analyzes structure, debates high-probability setups, and publishes verified signals.'}
          </p>
        </div>

        {/* Main Console Board */}
        <div
          className="pip-engine-console"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Console Header Bar */}
          <div className="pip-console-header">
            <div className="pip-engine-status">
              <span className="pip-live-pulse-dot" />
              <span>ENGINE LIVE</span>
            </div>
            <div className="pip-engine-pair">
              <span>XAUUSD • 15m</span>
            </div>
          </div>

          {/* 4-Stage Interactive Stepper */}
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
                <div className="pip-wake-orbit-container">
                  <div className="pip-orbit-ring" />
                  <div className="pip-orbit-dot pip-dot-1" />
                  <div className="pip-orbit-dot pip-dot-2" />
                  <div className="pip-orbit-dot pip-dot-3" />
                  <div className="pip-orbit-dot pip-dot-4" />
                  <div className="pip-orbit-dot pip-dot-5" />
                  <div className="pip-orbit-dot pip-dot-6" />

                  <div className="pip-wake-brain-core">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 3.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 5 12a3 3 0 0 0 1.5 5.2 3 3 0 0 0 3 2.8 2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5Z" />
                      <path d="M14.5 3.5a3 3 0 0 1 3 3v.3A3 3 0 0 1 19 12a3 3 0 0 1-1.5 5.2 3 3 0 0 1-3 2.8 2.5 2.5 0 0 1-2.5-2.5V6a2.5 2.5 0 0 1 2.5-2.5Z" />
                      <path d="M9.5 8.5h1.8M9 12.5h2.3M9.5 16.2h1.8M12.7 8.5h1.8M12.7 12.5h2.3M12.7 16.2h1.8" opacity=".6" />
                    </svg>
                  </div>
                </div>

                <div className="pip-wake-chips-row">
                  <span className="pip-chip pip-chip-active-gold">Market data</span>
                  <span className="pip-chip pip-chip-active-gold">Loss memory</span>
                  <span className="pip-chip pip-chip-faint">Risk engine</span>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-text">boot • engine online, models warm</span>
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
                    <span className="pip-supply-tag">Supply 4,014</span>
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

                <div className="pip-scan-chips-row">
                  <span className="pip-chip pip-chip-active-green">✓ Structure</span>
                  <span className="pip-chip pip-chip-faint">Liquidity</span>
                  <span className="pip-chip pip-chip-faint">News</span>
                  <span className="pip-chip pip-chip-faint">Momentum</span>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-text">supply zone confirmed — sellers in control</span>
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
                      <span className="pip-agent-name">Technical</span>
                      <span className="pip-agent-msg">Demand held the retest</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-buy">BUY</span>
                  </div>

                  {/* Row 2: Macro */}
                  <div className="pip-debate-row pip-debate-green" style={{ '--row-delay': '0.10s' }}>
                    <div className="pip-agent-badge pip-badge-ma">MA</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Macro</span>
                      <span className="pip-agent-msg">Real yields easing off</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-buy">BUY</span>
                  </div>

                  {/* Row 3: Sentiment */}
                  <div className="pip-debate-row pip-debate-amber" style={{ '--row-delay': '0.16s' }}>
                    <div className="pip-agent-badge pip-badge-se">SE</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Sentiment</span>
                      <span className="pip-agent-msg">Shorts crowded near lows</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-hold">HOLD</span>
                  </div>

                  {/* Row 4: Risk */}
                  <div className="pip-debate-row pip-debate-green" style={{ '--row-delay': '0.22s' }}>
                    <div className="pip-agent-badge pip-badge-rk">RK</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Risk</span>
                      <span className="pip-agent-msg">Tight stop under the wick</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-buy">BUY</span>
                  </div>
                </div>

                {/* Consensus Meter */}
                <div className="pip-consensus-meter-container">
                  <div className="pip-consensus-track">
                    <div
                      className="pip-consensus-fill"
                      style={{ width: activeStep === 3 ? '75%' : '0%' }}
                    />
                  </div>
                  <span className="pip-consensus-text">Consensus <strong>3/4</strong></span>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-text">3 of 4 agree — BUY bias confirmed</span>
                  <span className="pip-term-cursor">█</span>
                </div>
              </div>

              {/* STAGE 4: PUBLISH */}
              <div
                className={`pip-stage-pane pip-stage-publish ${
                  activeStep === 4 ? 'pip-pane-active' : 'pip-pane-right'
                }`}
              >
                <div className="pip-debate-list">
                  {/* Row 1: Technical SELL */}
                  <div className="pip-debate-row pip-debate-red" style={{ '--row-delay': '0.04s' }}>
                    <div className="pip-agent-badge pip-badge-ta-red">TA</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Technical</span>
                      <span className="pip-agent-msg">Lower highs into supply</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-sell">SELL</span>
                  </div>

                  {/* Row 2: Macro SELL */}
                  <div className="pip-debate-row pip-debate-red" style={{ '--row-delay': '0.10s' }}>
                    <div className="pip-agent-badge pip-badge-ma-red">MA</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Macro</span>
                      <span className="pip-agent-msg">Yields firm, dollar bid</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-sell">SELL</span>
                  </div>

                  {/* Row 3: Sentiment SELL */}
                  <div className="pip-debate-row pip-debate-red" style={{ '--row-delay': '0.16s' }}>
                    <div className="pip-agent-badge pip-badge-se-red">SE</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Sentiment</span>
                      <span className="pip-agent-msg">Crowd still long gold</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-sell">SELL</span>
                  </div>

                  {/* Row 4: Risk HOLD */}
                  <div className="pip-debate-row pip-debate-dark" style={{ '--row-delay': '0.22s' }}>
                    <div className="pip-agent-badge pip-badge-rk-amber">RK</div>
                    <div className="pip-agent-info">
                      <span className="pip-agent-name">Risk</span>
                      <span className="pip-agent-msg">Stop sits above the zone</span>
                    </div>
                    <span className="pip-vote-badge pip-vote-hold">HOLD</span>
                  </div>
                </div>

                {/* Consensus Meter */}
                <div className="pip-consensus-meter-container">
                  <div className="pip-consensus-track">
                    <div
                      className="pip-consensus-fill pip-fill-red-green"
                      style={{ width: activeStep === 4 ? '75%' : '0%' }}
                    />
                  </div>
                  <span className="pip-consensus-text">Consensus <strong>3/4</strong></span>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-text">signal published — entry, SL & TP tracked live</span>
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
                </div>
                <div className="pip-skel-circle-row">
                  <div className="pip-skel-circle" />
                  <div className="pip-skel-bar pip-skel-bar-short" />
                </div>
                <div className="pip-waiting-label">
                  <span>Waiting for consensus...</span>
                </div>
              </div>

              {/* Step 4: Published Live Signal Card matching screenshot 4 */}
              <div className={`pip-right-card-pane pip-published-signal-card ${activeStep === 4 ? 'pip-card-active' : 'pip-card-hidden'}`}>
                <div className="pip-pub-header">
                  <div>
                    <h4 className="pip-pub-pair">XAUUSD</h4>
                    <span className="pip-pub-sub">GOLD • 15M</span>
                  </div>
                  <span className="pip-pub-badge-sell">SELL</span>
                </div>

                <div className="pip-pub-metrics">
                  <div className="pip-pub-metric-row">
                    <span>Entry</span>
                    <strong>3,998.40</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Stop loss</span>
                    <strong className="pip-text-sl">4,014.90</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Take profit</span>
                    <strong className="pip-text-tp">3,974.10</strong>
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
                        strokeDashoffset={activeStep === 4 ? 65 : 113}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                        className="pip-conf-circle-progress"
                      />
                    </svg>
                    <span className="pip-conf-pct">42%</span>
                  </div>
                  <div className="pip-conf-info">
                    <strong>Confidence</strong>
                    <span>from the team vote</span>
                  </div>
                </div>

                {/* Published & Tracked Button Badge */}
                <div className="pip-published-btn">
                  <span>✓ PUBLISHED & TRACKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

