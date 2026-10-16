export default function MemberTierLocked({ feature, onUpgrade, onNavigate, isAdmin = false }) {
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
          {isPip ? 'Unlock Pip AI Coach' : 'Unlock VIP Perks'}
        </h2>

        <p className="tier-locked-sub">
          {isPip
            ? '24/7 SMC chart reviews and risk management.'
            : 'Downloadable playbooks, live zooms, and mentorship.'}
        </p>

        <p className="tier-locked-desc">
          {isPip
            ? 'Pip is our dedicated AI coach trained on GenZ SMC methods to help you review charts and risk. Available on Pro and Elite VIP.'
            : 'Access high-probability playbooks, weekly live Zoom breakdowns, and chart reviews. Available on Pro and Elite VIP.'}
        </p>

        {/* FEATURE COMPARISON PILLS */}
        <div className="tier-locked-matrix">
          <div className="tier-matrix-col starter">
            <div className="matrix-tier-tag">STARTER VIP</div>
            <div className="matrix-status-text">{isAdmin ? 'Your Current Preview' : 'Your Current Plan'}</div>
            <ul className="matrix-features-list">
              <li>✓ Basic Signals Feed</li>
              <li>✓ Academy Tracker</li>
              <li className="dim">✕ {isPip ? 'Pip Trading Coach' : 'Institutional Playbooks'}</li>
              <li className="dim">✕ Live Zoom Reviews</li>
            </ul>
          </div>

          <div className="tier-matrix-col pro-elite active">
            <div className="matrix-crown-tag">👑 PRO &amp; ELITE TIERS</div>
            <div className="matrix-status-text highlight">Unlocked Instantly</div>
            <ul className="matrix-features-list">
              <li>✓ All VIP Signals + Live Alerts</li>
              <li>✓ Full Academy Tracker</li>
              <li>✓ {isPip ? '24/7 Pip Coach (Taught by GenZ)' : 'ICT PDFs & Excel Journals'}</li>
              <li>✓ Weekly Live Zoom Market Outlooks</li>
            </ul>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="tier-locked-actions">
          {isAdmin ? (
            <button
              type="button"
              className="tier-upgrade-btn"
              onClick={onUpgrade}
            >
              👑 Switch to Pro Preview &amp; Unlock
            </button>
          ) : (
            <a
              href="https://t.me/Vengsopheagenz?direct"
              target="_blank"
              rel="noopener noreferrer"
              className="tier-upgrade-btn"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              👑 Upgrade to Pro VIP on Telegram (@Vengsopheagenz)
            </a>
          )}
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
