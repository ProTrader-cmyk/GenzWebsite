import { useState } from 'react';
import { TrendUpIcon } from '../components/ui/CategoryIcons.jsx';
import MemberDashboard from './member/MemberDashboard.jsx';
import MemberSignals from './member/MemberSignals.jsx';
import MemberPipCoach from './member/MemberPipCoach.jsx';
import MemberPerks from './member/MemberPerks.jsx';
import MemberTierLocked from './member/MemberTierLocked.jsx';

const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

function TerminalIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m7 8 4 4-4 4" />
      <path d="M13 16h4" />
    </svg>
  );
}

function DiamondIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
    </svg>
  );
}

function BotIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="5" y="9" width="14" height="10" rx="2.5" />
      <path d="M12 5.5v3.5M9.5 5.5h5" />
      <circle cx="9.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Terminal Overview', Icon: TerminalIcon },
  { key: 'signals', label: 'VIP Signals Stream', Icon: TrendUpIcon, badge: 'Live' },
  { key: 'pip', label: 'Pip Trading Coach', Icon: BotIcon, badge: 'PRO', proOnly: true },
  { key: 'perks', label: 'VIP Perks & Playbooks', Icon: DiamondIcon, badge: 'PRO+', proOnly: true },
];

const PLAN_OPTIONS = [
  { key: 'starter', label: 'Starter VIP' },
  { key: 'pro', label: 'Pro VIP' },
  { key: 'elite', label: 'Elite VIP' },
];

export default function MemberArea({ user, doneMap, onExit }) {
  const [view, setView] = useState('dashboard');
  const [previewPlan, setPreviewPlan] = useState('elite');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('genz_terminal_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [hideProfileCard, setHideProfileCard] = useState(() => {
    try {
      return localStorage.getItem('genz_hide_profile_card') === 'true';
    } catch {
      return false;
    }
  });

  function toggleSidebar(val) {
    const next = typeof val === 'boolean' ? val : !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('genz_terminal_sidebar_collapsed', String(next));
    } catch {}
  }

  function toggleProfileCard(val) {
    const next = typeof val === 'boolean' ? val : !hideProfileCard;
    setHideProfileCard(next);
    try {
      localStorage.setItem('genz_hide_profile_card', String(next));
    } catch {}
  }

  const isProOrElite = previewPlan === 'pro' || previewPlan === 'elite';

  return (
    <div className="terminal-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`terminal-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        {/* USER PROFILE BADGE CARD (HIDEABLE) */}
        {!hideProfileCard && (
          <div className="terminal-user-badge-card">
            <div className="terminal-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="terminal-avatar-img" />
              ) : (
                (user?.name || user?.email || 'V').slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="terminal-user-meta">
              <div className="terminal-user-name">{user?.name || user?.email?.split('@')[0] || 'VIP Member'}</div>
              <div className="terminal-plan-tag">👑 {previewPlan.toUpperCase()} MEMBER</div>
            </div>
            <button
              type="button"
              className="terminal-card-close-btn"
              onClick={() => toggleProfileCard(true)}
              title="Hide user badge"
              aria-label="Hide user badge"
            >
              ×
            </button>
          </div>
        )}

        <nav className="terminal-nav-list">
          {NAV_ITEMS.map((item) => {
            const isGated = item.proOnly && !isProOrElite;
            return (
              <button
                key={item.key}
                type="button"
                className={`terminal-nav-btn${view === item.key ? ' active' : ''}${isGated ? ' gated' : ''}`}
                onClick={() => setView(item.key)}
              >
                <item.Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isGated ? (
                  <span className="nav-badge locked">🔒 PRO+</span>
                ) : (
                  item.badge && <span className={`nav-badge ${item.badge.toLowerCase().replace('+', '')}`}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* TIER PREVIEW SWITCHER */}
        <div className="terminal-sidebar-bottom">
          <div className="tier-switcher-box">
            <div className="tier-switcher-label">View As Plan Tier:</div>
            <div className="tier-switcher-pills">
              {PLAN_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`tier-pill-btn${previewPlan === p.key ? ' active' : ''}`}
                  onClick={() => setPreviewPlan(p.key)}
                >
                  {p.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="terminal-exit-btn" onClick={onExit}>
            ← Return to Website
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="terminal-main-viewport">
        {/* TOPBAR */}
        <header className="terminal-topbar">
          <div className="topbar-left">
            <div className="topbar-heading-row">
              <button
                type="button"
                className={`terminal-sidebar-toggle-btn${sidebarCollapsed ? ' is-collapsed' : ''}`}
                onClick={() => toggleSidebar()}
                title={sidebarCollapsed ? "Show Sidebar Menu" : "Hide Sidebar"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                </svg>
                <span>{sidebarCollapsed ? "Show Menu" : "Hide Menu"}</span>
              </button>
              <h2 className="topbar-section-title">
                {NAV_ITEMS.find((n) => n.key === view)?.label}
              </h2>
            </div>
            <div className="topbar-breadcrumb">
              <span>Member Portal</span> / <span className="active-crumb">{view}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-live-status">
              <span className="live-pulse-beacon" />
              <span>MARKET LIVE (ICT UTC+7)</span>
            </div>
            <div className="topbar-plan-pill">
              <span>★ {previewPlan.toUpperCase()} TIER</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="terminal-content-scroll">
          {view === 'dashboard' && (
            <MemberDashboard
              user={user}
              doneMap={doneMap}
              previewPlan={previewPlan}
              onNavigate={setView}
            />
          )}

          {view === 'signals' && (
            <MemberSignals
              previewPlan={previewPlan}
              onNavigate={setView}
            />
          )}


          {view === 'pip' && (
            !isProOrElite ? (
              <MemberTierLocked
                feature="pip"
                onUpgrade={() => setPreviewPlan('pro')}
                onNavigate={setView}
              />
            ) : (
              <MemberPipCoach user={user} />
            )
          )}

          {view === 'perks' && (
            !isProOrElite ? (
              <MemberTierLocked
                feature="perks"
                onUpgrade={() => setPreviewPlan('pro')}
                onNavigate={setView}
              />
            ) : (
              <MemberPerks />
            )
          )}
        </div>

        {/* FOOTER DISCLAIMER */}
        <footer className="terminal-disclaimer">
          <strong>Risk Disclosure:</strong> Trading forex and CFD financial instruments carries high risk and may not be suitable for all investors. Ensure you trade with strictly defined risk management. Past performance does not guarantee future results.
        </footer>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="terminal-mobile-tabbar">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`terminal-tab-item${view === item.key ? ' active' : ''}`}
            onClick={() => setView(item.key)}
          >
            <item.Icon width={18} height={18} />
            <span>{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
