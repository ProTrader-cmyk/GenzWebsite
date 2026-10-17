import React from 'react';
import { SCAN_STEPS, MODE_CONFIGS, normalizeMode } from '../services/scanWorkflowService.js';

// Clean vector icons for each step
function IconMarketData(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
      <path d="m5.6 5.6 2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" opacity="0.6" />
    </svg>
  );
}

function IconTechAnalysis(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" strokeDasharray="3 3" opacity="0.7" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="#10B981" stroke="none" />
    </svg>
  );
}

function IconAiValidation(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconFinalDecision(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

const STEP_ICONS = {
  1: IconMarketData,
  2: IconTechAnalysis,
  3: IconAiValidation,
  4: IconFinalDecision,
};

export function ScanWorkflowStepper({
  mode = 'scalp',
  pair = 'XAUUSD',
  symbolLabel = 'XAU/USD',
  scanState = {
    isScanning: false,
    activeStep: 0,
    stepStatuses: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' },
    telemetry: '',
    completionStatus: null,
  },
  isMarketOpen = true,
}) {
  const normMode = normalizeMode(mode);
  const modeCfg = MODE_CONFIGS[normMode] || MODE_CONFIGS.scalp;
  const isScalp = normMode === 'scalp';

  // Calculate rail progress width based on current active step
  const getRailWidth = () => {
    if (!scanState.isScanning && !scanState.completionStatus) return '0%';
    const step = scanState.activeStep;
    if (step === 1) return '15%';
    if (step === 2) return '45%';
    if (step === 3) return '75%';
    if (step >= 4) return '100%';
    return scanState.completionStatus ? '100%' : '0%';
  };

  const railWidth = getRailWidth();

  return (
    <div className={`ait-sw-stepper-container mode-${normMode} ${scanState.isScanning ? 'is-scanning' : ''}`}>
      {/* 1. Header Bar: Mode Identity + Configured Timeframes */}
      <div className="ait-sw-stepper-header">
        <div className="ait-sw-header-left">
          <span className={`ait-sw-mode-badge ${isScalp ? 'scalp' : 'intra'}`}>
            <span className="ait-sw-badge-dot" />
            <strong>{modeCfg.headerTitle}</strong>
          </span>
          <span className="ait-sw-pair-label">{symbolLabel || pair}</span>
          <span className="ait-sw-tf-pill">{modeCfg.timeframes}</span>
        </div>

        <div className="ait-sw-header-right">
          {!isMarketOpen ? (
            <span className="ait-sw-status-pill closed">
              MARKET CLOSED
            </span>
          ) : scanState.isScanning ? (
            <span className="ait-sw-status-pill scanning">
              <span className="ait-sw-spin-ring" />
              STEP {scanState.activeStep || 1}/4 PROCESSING
            </span>
          ) : scanState.completionStatus === 'SIGNAL_PUBLISHED' ? (
            <span className="ait-sw-status-pill success">
              ✓ SETUP CONFIRMED
            </span>
          ) : scanState.completionStatus === 'ALREADY_PUBLISHED' ? (
            <span className="ait-sw-status-pill neutral">
              ● SIGNAL ALREADY PUBLISHED
            </span>
          ) : scanState.completionStatus === 'NO_SIGNAL' ? (
            <span className="ait-sw-status-pill neutral">
              SCAN COMPLETE · NO SETUP
            </span>
          ) : scanState.completionStatus === 'ERROR' ? (
            <span className="ait-sw-status-pill error">
              ✗ SCAN FAILED
            </span>
          ) : (
            <span className="ait-sw-status-pill standby">
              STANDBY · READY
            </span>
          )}
        </div>
      </div>

      {/* 2. Connected 4-Step Progress Line with Fluid Rail */}
      <div className="ait-sw-rail-track" role="progressbar" aria-valuenow={scanState.activeStep} aria-valuemin="0" aria-valuemax="4">
        {/* Continuous Energy Rail Layer */}
        <div className="ait-sw-rail-line-bg" />
        <div
          className={`ait-sw-rail-line-fill ${scanState.completionStatus === 'ERROR' ? 'error' : ''}`}
          style={{ width: railWidth }}
        >
          {scanState.isScanning && <span className="ait-sw-photon-dot" />}
        </div>

        {/* 4 Steps */}
        <div className="ait-sw-nodes-row">
          {SCAN_STEPS.map((stepDef) => {
            const stepNum = stepDef.step;
            const status = scanState.stepStatuses?.[stepNum] || 'pending';
            const isActive = scanState.isScanning && scanState.activeStep === stepNum;
            const isDone = status === 'done';
            const isError = status === 'error';
            const isNoSignal = status === 'no_signal';
            const StepIcon = STEP_ICONS[stepNum];

            const nodeClass = [
              'ait-sw-node',
              isActive ? 'is-active' : '',
              isDone ? 'is-done' : '',
              isError ? 'is-error' : '',
              isNoSignal ? 'is-no-signal' : '',
              status === 'pending' ? 'is-pending' : '',
            ].filter(Boolean).join(' ');

            const subtitle = stepNum === 2
              ? (isScalp ? stepDef.subScalp : stepDef.subIntra)
              : stepDef.subTitle;

            return (
              <div key={stepDef.id} className={nodeClass}>
                <div className="ait-sw-node-capsule">
                  <div className="ait-sw-node-icon-box">
                    <StepIcon />
                    {isDone && <span className="ait-sw-check-badge">✓</span>}
                    {isError && <span className="ait-sw-error-badge">✗</span>}
                    {isNoSignal && <span className="ait-sw-neutral-badge">—</span>}
                    {isActive && <span className="ait-sw-active-ring" />}
                  </div>

                  <div className="ait-sw-node-meta">
                    <div className="ait-sw-node-top">
                      <span className="ait-sw-node-num">{stepDef.num}</span>
                      <strong className="ait-sw-node-title">{stepDef.title}</strong>
                    </div>
                    <span className="ait-sw-node-sub">{subtitle}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Short Live Telemetry Status Message */}
      <div className="ait-sw-telemetry-strip ait-mono">
        <span className="ait-sw-tel-icon">
          {scanState.isScanning ? (
            <span className="ait-sw-spin-dot" />
          ) : scanState.completionStatus === 'SIGNAL_PUBLISHED' ? (
            <span className="ait-sw-dot green" />
          ) : scanState.completionStatus === 'ALREADY_PUBLISHED' || scanState.completionStatus === 'NO_SIGNAL' ? (
            <span className="ait-sw-dot amber" />
          ) : scanState.completionStatus === 'ERROR' ? (
            <span className="ait-sw-dot red" />
          ) : (
            <span className="ait-sw-dot muted" />
          )}
        </span>
        <span className="ait-sw-tel-message">
          {scanState.telemetry || (
            !isMarketOpen
              ? `Interbank markets closed for the weekend. Scanner paused until session reopens.`
              : isScalp
                ? `1M/5M Ultra Scalper standby. Evaluates micro-sweep liquidity & 2–3 pt targets.`
                : `15M/1H/4H CRT Intraday engine standby. Evaluates Asian extremes & higher-timeframe expansion.`
          )}
        </span>
      </div>
    </div>
  );
}

export default ScanWorkflowStepper;
