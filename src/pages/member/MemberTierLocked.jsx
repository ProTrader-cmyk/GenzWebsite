export default function MemberTierLocked({ feature, onUpgrade, onNavigate }) {
  const isPip = feature === 'pip';

  return (
    <div className="tier-locked-wrapper">
      <div className="tier-locked-card">
        {/* GLOW DECORATION */}
        <div className="tier-locked-glow" />

        {/* TOP BADGE */}
        <div className="tier-locked-badge-row">
          <span className="tier-locked-badge-pill">
            <span className="tier-locked-lock-icon">🔒</span> PRO &amp; ELITE EXCLUSIVE
          </span>
        </div>

        {/* ICON */}
        <div className="tier-locked-icon-bubble">
          {isPip ? '🤖' : '💎'}
        </div>

        <h2 className="tier-locked-title">
          {isPip ? 'Unlock Pip AI Trading Coach' : 'Unlock VIP Perks & Playbooks'}
        </h2>

        <p className="tier-locked-sub">
          {isPip
            ? '24/7 Institutional SMC Analysis, Lot Sizing & Gemini Vision Chart Reviews'
            : 'Downloadable Institutional Playbooks, Weekly Live Zooms & Mentorship'}
        </p>

        <p className="tier-locked-desc">
          {isPip
            ? 'Pip AI is our proprietary trading intelligence trained on SMC dealing ranges, liquidity sweeps, Killzones, and Gold risk models. This feature is reserved exclusively for Pro VIP and Elite VIP tiers.'
            : 'Access our high-probability ICT playbooks (BOS, CHoCH, PD Array Matrix), live weekly Zoom killzone breakdowns with Veng Sophea, and direct chart submission reviews reserved for Pro VIP & Elite VIP tiers.'}
        </p>

        {/* FEATURE COMPARISON PILLS */}
        <div className="tier-locked-matrix">
          <div className="tier-matrix-col starter">
            <div className="matrix-tier-tag">STARTER VIP</div>
            <div className="matrix-status-text">Your Current Preview</div>
            <ul className="matrix-features-list">
              <li>✓ Basic Signals Feed</li>
              <li>✓ Academy Tracker</li>
              <li className="dim">✕ {isPip ? 'Pip AI Trading Coach' : 'Institutional Playbooks'}</li>
              <li className="dim">✕ Live Zoom Reviews</li>
            </ul>
          </div>

          <div className="tier-matrix-col pro-elite active">
            <div className="matrix-crown-tag">👑 PRO &amp; ELITE TIERS</div>
            <div className="matrix-status-text highlight">Unlocked Instantly</div>
            <ul className="matrix-features-list">
              <li>✓ All VIP Signals + Live Alerts</li>
              <li>✓ Full Academy Tracker</li>
              <li>✓ {isPip ? '24/7 Pip AI Coach (Gemini Powered)' : 'ICT PDFs & Excel Journals'}</li>
              <li>✓ Weekly Live Zoom Market Outlooks</li>
            </ul>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="tier-locked-actions">
          <button
            type="button"
            className="tier-upgrade-btn"
            onClick={onUpgrade}
          >
            👑 Switch to Pro Preview &amp; Unlock
          </button>
          <button
            type="button"
            className="tier-back-btn"
            onClick={() => onNavigate('dashboard')}
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
}
