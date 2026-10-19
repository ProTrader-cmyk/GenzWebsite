import { useState, useEffect } from 'react';
import '../styles/howPipWorks.css';

export default function HowPipWorks({ isKhmer }) {
  const [activeStep, setActiveStep] = useState(1);

  const STEP_DURATION = 4000; // Exactly 4 seconds for 1->2, 2->3, 3->4, 4->1

  // Auto-cycle continuously through the 4 steps every 4 seconds (autonomous engine)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, []);

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
            {isKhmer ? 'ប្រព័ន្ធស្វ័យប្រវត្ត PIP • បច្ចេកវិទ្យាជំនាន់ថ្មី' : 'GENZ PIP PROTOCOL • AUTONOMOUS INTELLIGENCE'}
          </span>
          <h2 className="lnd-section-title">
            {isKhmer ? 'របៀបដែល Pip បង្កើតឱកាសជួញដូរផ្ទាល់' : 'How Pip Engine Generates Real-Time Setups'}
          </h2>
          <p className="lnd-section-sub">
            {isKhmer
              ? 'ស្វែងយល់ពីប្រព័ន្ធដំណើរការផ្ទាល់របស់ Pip — ការប្រមូលទិន្នន័យទីផ្សារពិភពលោក ការផ្ទៀងផ្ទាត់តំបន់ទុនធំ និងការបញ្ជូនសញ្ញាជួញដូរច្បាស់លាស់។'
              : 'Experience Pip’s proprietary pipeline in action — aggregating global liquidity, cross-validating smart money patterns, aligning algorithmic models, and dispatching surgical entries.'}
          </p>
        </div>

        {/* Main Console Board (Autonomous Continuous Stream) */}
        <div className="pip-engine-console">
          {/* Top Laser Accent Strip */}
          <div className="pip-top-laser-line" />

          {/* Console Header Bar */}
          <div className="pip-console-header">
            <div className="pip-engine-status">
              <span className="pip-live-pulse-dot" />
              <span className="pip-status-txt">PIP NEURAL RADAR</span>
            </div>
            <div className="pip-live-ticker-badge">
              <span className="pip-pair-name">XAUUSD</span>
              <span className="pip-pair-tf">15m</span>
              <span className="pip-pair-price">2,946.50</span>
              <span className="pip-pair-change">+0.48%</span>
            </div>
          </div>

          {/* Unified Fluid Pipeline Stepper (Autonomous Read-Only Stepper) */}
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

            {/* Step 1: INGEST */}
            <div className={`pip-pipe-node ${activeStep === 1 ? 'is-active' : ''} ${activeStep > 1 ? 'is-done' : ''}`}>
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
                  <span className="pip-pipe-title">INGEST</span>
                  <span className="pip-pipe-sub">Market Stream</span>
                </div>
              </div>
            </div>

            {/* Step 2: DETECT */}
            <div className={`pip-pipe-node ${activeStep === 2 ? 'is-active' : ''} ${activeStep > 2 ? 'is-done' : ''}`}>
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
                  <span className="pip-pipe-title">DETECT</span>
                  <span className="pip-pipe-sub">Liquidity & SMC</span>
                </div>
              </div>
            </div>

            {/* Step 3: VALIDATE */}
            <div className={`pip-pipe-node ${activeStep === 3 ? 'is-active' : ''} ${activeStep > 3 ? 'is-done' : ''}`}>
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
                  <span className="pip-pipe-title">VALIDATE</span>
                  <span className="pip-pipe-sub">Council Consensus</span>
                </div>
              </div>
            </div>

            {/* Step 4: DISPATCH */}
            <div className={`pip-pipe-node ${activeStep === 4 ? 'is-active' : ''}`}>
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
                  <span className="pip-pipe-title">DISPATCH</span>
                  <span className="pip-pipe-sub">8.4ms Delivery</span>
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
                  <span className="pip-eq-label">28,500 TICKS / SEC STREAM</span>
                </div>

                {/* Floating Telemetry Pods */}
                <div className="pip-telemetry-pods-grid">
                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot cyan" />
                      <span className="pip-pod-tag">DEEP LIQUIDITY</span>
                    </div>
                    <strong className="pip-pod-val">Tier-1 Interbank Feeds</strong>
                    <span className="pip-pod-sub">Currenex • EBS • FastMatch</span>
                  </div>

                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot amber" />
                      <span className="pip-pod-tag">PATTERN MEMORY</span>
                    </div>
                    <strong className="pip-pod-val">45,000+ Real Market Regimes</strong>
                    <span className="pip-pod-sub">99.4% Structural Match</span>
                  </div>

                  <div className="pip-pod-item">
                    <div className="pip-pod-header">
                      <span className="pip-pod-dot emerald" />
                      <span className="pip-pod-tag">RISK CEILING</span>
                    </div>
                    <strong className="pip-pod-val">1.0% Hard Stop Limit</strong>
                    <span className="pip-pod-sub">Capital Preservation Shield</span>
                  </div>
                </div>

                {/* Animated Terminal Bar */}
                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-INGEST]</span>
                  <span className="pip-term-text">multi-venue feed active • interbank spread 0.2 pips • network latency 1.8ms</span>
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
                      <span>BEARISH MITIGATION • 2,958.50</span>
                    </div>
                  </div>

                  {/* London Session High Sweep Marker */}
                  <div className="pip-sweep-marker">
                    <span>⚡ LONDON SESSION HIGH SWEPT</span>
                  </div>

                  {/* Candlestick Wave Graphic with Real Order Flow Rejection (Animated Stream) */}
                  <svg className="pip-scan-candles-svg" viewBox="0 0 680 180" preserveAspectRatio="none">
                    {/* Asian Accumulation Range */}
                    <g className="pip-candle" style={{ '--c-idx': 1 }}>
                      <line x1="40" y1="110" x2="40" y2="135" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="36" y="115" width="8" height="15" rx="1.5" fill="#10b981" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 2 }}>
                      <line x1="80" y1="95" x2="80" y2="128" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="76" y="102" width="8" height="18" rx="1.5" fill="#10b981" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 3 }}>
                      <line x1="120" y1="92" x2="120" y2="125" stroke="#ef4444" strokeWidth="1.6" />
                      <rect x="116" y="98" width="8" height="16" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 4 }}>
                      <line x1="160" y1="80" x2="160" y2="118" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="156" y="86" width="8" height="20" rx="1.5" fill="#10b981" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 5 }}>
                      <line x1="200" y1="72" x2="200" y2="108" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="196" y="78" width="8" height="22" rx="1.5" fill="#10b981" />
                    </g>

                    {/* Liquidity Sweep Spike into Supply */}
                    <g className="pip-candle" style={{ '--c-idx': 6 }}>
                      <line x1="240" y1="45" x2="240" y2="95" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="236" y="52" width="8" height="24" rx="1.5" fill="#10b981" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 7 }}>
                      <line x1="280" y1="40" x2="280" y2="92" stroke="#10b981" strokeWidth="1.6" />
                      <rect x="276" y="48" width="8" height="26" rx="1.5" fill="#10b981" />
                    </g>

                    {/* Clean Rejection Pin Bar at 4,014 Supply */}
                    <g className="pip-candle" style={{ '--c-idx': 8 }}>
                      <line x1="320" y1="36" x2="320" y2="98" stroke="#f87171" strokeWidth="1.8" />
                      <rect x="316" y="62" width="8" height="18" rx="1.5" fill="#f87171" />
                    </g>

                    {/* Bearish Displacement Candles */}
                    <g className="pip-candle" style={{ '--c-idx': 9 }}>
                      <line x1="365" y1="65" x2="365" y2="110" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="361" y="72" width="8" height="24" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 10 }}>
                      <line x1="410" y1="78" x2="410" y2="120" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="406" y="85" width="8" height="24" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 11 }}>
                      <line x1="455" y1="90" x2="455" y2="135" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="451" y="98" width="8" height="26" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 12 }}>
                      <line x1="500" y1="105" x2="500" y2="148" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="496" y="112" width="8" height="25" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 13 }}>
                      <line x1="545" y1="118" x2="545" y2="158" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="541" y="125" width="8" height="24" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 14 }}>
                      <line x1="590" y1="126" x2="590" y2="168" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="586" y="132" width="8" height="26" rx="1.5" fill="#f87171" />
                    </g>

                    <g className="pip-candle" style={{ '--c-idx': 15 }}>
                      <line x1="635" y1="135" x2="635" y2="175" stroke="#f87171" strokeWidth="1.6" />
                      <rect x="631" y="140" width="8" height="26" rx="1.5" fill="#f87171" />
                    </g>
                  </svg>
                </div>

                {/* Detected Confluence Tags Matrix */}
                <div className="pip-confluences-row">
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">⚡</span>
                    <span>Buyside Liquidity Swept</span>
                  </div>
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">🎯</span>
                    <span>Premium Supply Tapped (2,958)</span>
                  </div>
                  <div className="pip-conf-tag-pill active">
                    <span className="pip-conf-icon">📉</span>
                    <span>Market Structure Shift (MSS)</span>
                  </div>
                  <div className="pip-conf-tag-pill">
                    <span className="pip-conf-icon">📊</span>
                    <span>15m Fair Value Gap Fill</span>
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-DETECT]</span>
                  <span className="pip-term-text">buyside sweep confirmed at 2,958.50 • institutional mitigation detected • convening council</span>
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
                  {/* Agent 1: Price Action */}
                  <div className="pip-arena-card cyan-theme" style={{ '--card-delay': '0.04s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar cyan">
                        <span>⚡</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Algorithmic Price Action Model</strong>
                        <span className="pip-arena-role">Liquidity & Order Flow</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      Clean buyside purge above London peak. Bearish displacement through equilibrium confirms smart money distribution.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>94%</strong>
                    </div>
                    <div className="pip-arena-bar-track">
                      <div className="pip-arena-bar-fill cyan" style={{ width: activeStep === 3 ? '94%' : '0%' }} />
                    </div>
                  </div>

                  {/* Agent 2: Cross-Asset Matrix */}
                  <div className="pip-arena-card purple-theme" style={{ '--card-delay': '0.10s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar purple">
                        <span>🌐</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Cross-Asset Matrix</strong>
                        <span className="pip-arena-role">Treasury Yields & DXY Index</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      Treasury curve firming; US Dollar index testing 104.60 resistance, capping Gold upside expansion pressure.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>89%</strong>
                    </div>
                    <div className="pip-arena-bar-track">
                      <div className="pip-arena-bar-fill purple" style={{ width: activeStep === 3 ? '89%' : '0%' }} />
                    </div>
                  </div>

                  {/* Agent 3: Volume Profile */}
                  <div className="pip-arena-card blue-theme" style={{ '--card-delay': '0.16s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar blue">
                        <span>📊</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Volume Profile Analytics</strong>
                        <span className="pip-arena-role">Retail Positioning & Delta</span>
                      </div>
                      <span className="pip-arena-vote sell">SELL</span>
                    </div>
                    <p className="pip-arena-arg">
                      Retail crowd 76% net-long near resistance. Cumulative volume delta turns heavily negative with sell absorption.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>93%</strong>
                    </div>
                    <div className="pip-arena-bar-track">
                      <div className="pip-arena-bar-fill blue" style={{ width: activeStep === 3 ? '93%' : '0%' }} />
                    </div>
                  </div>

                  {/* Agent 4: Risk Sentinel */}
                  <div className="pip-arena-card emerald-theme" style={{ '--card-delay': '0.22s' }}>
                    <div className="pip-arena-top">
                      <div className="pip-arena-avatar emerald">
                        <span>🛡️</span>
                      </div>
                      <div className="pip-arena-info">
                        <strong className="pip-arena-name">Risk & Asymmetry Sentinel</strong>
                        <span className="pip-arena-role">Portfolio Preservation</span>
                      </div>
                      <span className="pip-arena-vote pass">PASSED</span>
                    </div>
                    <p className="pip-arena-arg">
                      Invalidation anchored at 2,962.20 structure wick. Favorable 1:3.5 Risk-to-Reward ratio. Trade parameters approved.
                    </p>
                    <div className="pip-arena-confidence">
                      <span>Confidence</span>
                      <strong>97%</strong>
                    </div>
                    <div className="pip-arena-bar-track">
                      <div className="pip-arena-bar-fill emerald" style={{ width: activeStep === 3 ? '97%' : '0%' }} />
                    </div>
                  </div>
                </div>

                {/* Consensus Nexus Bar */}
                <div className="pip-consensus-nexus-box">
                  <div className="pip-nexus-header">
                    <span className="pip-nexus-label">Council Decision Metric:</span>
                    <strong className="pip-nexus-stat">4 of 4 Algorithmic Models Aligned (100%)</strong>
                    <span className="pip-nexus-badge">✓ UNANIMOUS CONSENSUS VERIFIED</span>
                  </div>
                  <div className="pip-nexus-track">
                    <div
                      className="pip-nexus-fill"
                      style={{ width: activeStep === 3 ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-COUNCIL]</span>
                  <span className="pip-term-text">unanimous alignment verified • invalidation bounds confirmed • routing to execution hub</span>
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
                        <h4 className="pip-dispatch-title">Sub-Second Algorithmic Broadcast</h4>
                        <span className="pip-dispatch-sub">Proprietary multichannel delivery completed in 8.4ms</span>
                      </div>
                    </div>
                    <span className="pip-latency-tag">8.4ms LATENCY</span>
                  </div>

                  {/* Multi-Channel Distribution Grid */}
                  <div className="pip-dispatch-channels-grid">
                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">✈️</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">VIP TELEGRAM BOT</span>
                        <strong className="pip-channel-status">✓ 3,800+ SENT</strong>
                      </div>
                    </div>

                    <div className="pip-d-channel">
                      <span className="pip-channel-icon">📱</span>
                      <div className="pip-channel-info">
                        <span className="pip-channel-name">VIP MOBILE APP</span>
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
                        <span className="pip-channel-name">SPREAD PROTECTOR</span>
                        <strong className="pip-channel-status gold">0.0 PIP SLIPPAGE</strong>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Order Parameters Checklist */}
                  <div className="pip-dispatch-checklist">
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>Validated by 4 distinct algorithmic models with 91% collective confidence score</span>
                    </div>
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>Asymmetric 1:3.5 Risk/Reward profile locked with exact target milestones</span>
                    </div>
                    <div className="pip-check-row">
                      <span className="pip-check-bullet">✓</span>
                      <span>Live autonomous tracker initialized for automated Take-Profit & Break-Even triggers</span>
                    </div>
                  </div>
                </div>

                <div className="pip-terminal-prompt">
                  <span className="pip-term-prefix">[PIP-DISPATCH]</span>
                  <span className="pip-term-text">execution payload transmitted • autonomous price monitor active on 24/7 stream</span>
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
                    {activeStep === 1 && 'Stream-indexing global price ticks & order books...'}
                    {activeStep === 2 && 'Detecting liquidity pools & market displacement...'}
                    {activeStep === 3 && 'Aligning algorithmic models & risk thresholds...'}
                  </span>
                </div>
              </div>

              {/* Step 4: Published Live Signal Card (Unique Cyber Glassmorphism) */}
              <div className={`pip-right-card-pane pip-published-signal-card ${activeStep === 4 ? 'pip-card-active' : 'pip-card-hidden'}`}>
                <div className="pip-pub-header">
                  <div>
                    <h4 className="pip-pub-pair">XAUUSD</h4>
                    <span className="pip-pub-sub">SPOT GOLD • 15M • GENZ QUANT FRAMEWORK</span>
                  </div>
                  <span className="pip-pub-badge-sell">
                    <span className="pip-badge-pulse-dot" /> SELL SETUP
                  </span>
                </div>

                <div className="pip-pub-metrics">
                  <div className="pip-pub-metric-row">
                    <span>Entry Zone</span>
                    <strong className="pip-val-entry">2,946.50</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Stop Loss (Risk)</span>
                    <strong className="pip-text-sl">2,962.20</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Take Profit 1</span>
                    <strong className="pip-text-tp">2,925.00</strong>
                  </div>
                  <div className="pip-pub-metric-row">
                    <span>Take Profit 2</span>
                    <strong className="pip-text-tp">2,908.00</strong>
                  </div>
                  <div className="pip-pub-metric-row pip-rr-row">
                    <span>Risk / Reward Ratio</span>
                    <strong className="pip-val-gold">1 : 3.5</strong>
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
                        strokeDashoffset={activeStep === 4 ? 10 : 113}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                        className="pip-conf-circle-progress"
                      />
                    </svg>
                    <span className="pip-conf-pct">91%</span>
                  </div>
                  <div className="pip-conf-info">
                    <strong>91% Model Alignment</strong>
                    <span>Validated across 4 AI specialized models</span>
                  </div>
                </div>

                {/* Published Status & Real-time Autonomous Stream Telemetry */}
                <div className="pip-card-actions">
                  <div className="pip-published-btn">
                    <span>✓ PUBLISHED & TRACKED LIVE</span>
                  </div>
                  <div className="pip-auto-broadcast-pill">
                    <span>⚡ 24/7 AUTONOMOUS SIGNAL BROADCAST</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
