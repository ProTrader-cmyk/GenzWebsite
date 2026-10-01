import { useState, useEffect, useCallback } from 'react';
import { TrendUpIcon } from '../components/ui/CategoryIcons.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import MemberDashboard from './member/MemberDashboard.jsx';
import MemberSignals from './member/MemberSignals.jsx';
import MemberPipCoach from './member/MemberPipCoach.jsx';
import MemberPerks from './member/MemberPerks.jsx';
import MemberTierLocked from './member/MemberTierLocked.jsx';
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerForSignalPush,
} from '../services/pushNotificationService.js';
import { getUserPlan } from '../data/auth.js';

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
  { key: 'dashboard', label: 'Terminal Overview', shortLabel: 'Overview', Icon: TerminalIcon },
  { key: 'signals', label: 'VIP Signals Stream', shortLabel: 'Signals', Icon: TrendUpIcon, badge: 'Live' },
  { key: 'pip', label: 'Pip Trading Coach', shortLabel: 'Pip AI', Icon: BotIcon, badge: 'STARTER+', proOnly: true },
  { key: 'perks', label: 'VIP Perks & Playbooks', shortLabel: 'Perks', Icon: DiamondIcon, badge: 'PRO+', proOnly: true },
];

const PLAN_OPTIONS = [
  { key: 'starter', label: 'Starter VIP' },
  { key: 'pro', label: 'Pro VIP' },
  { key: 'elite', label: 'Elite VIP' },
];

export default function MemberArea({ user, doneMap, onExit, initialView = 'dashboard' }) {
  const isAdmin = user?.role === 'admin' || user?.role === 'dev';
  // Actual plan assigned by admin: 'starter' | 'pro' | 'elite' | 'free'
  const userPlan = getUserPlan(user);

  // Admins can preview any tier ('starter', 'pro', 'elite'); members always use their actual assigned plan
  const [previewPlan, setPreviewPlan] = useState(() => {
    if (userPlan && userPlan !== 'free') return userPlan;
    return isAdmin ? 'elite' : 'starter';
  });

  const activePlan = isAdmin ? previewPlan : userPlan;
  const isProOrElite = activePlan === 'pro' || activePlan === 'elite';
  const hasPipAccess = ['starter', 'pro', 'elite'].includes(activePlan);

  // Sync state if user's plan is updated in real-time
  useEffect(() => {
    if (userPlan && userPlan !== 'free') {
      setPreviewPlan(userPlan);
    }
  }, [userPlan]);

  const [view, setView] = useState(() => {
    if (initialView === 'pip' && !hasPipAccess && !isAdmin) {
      return 'dashboard';
    }
    return initialView;
  });

  // Keep view in sync if initialView prop changes
  useEffect(() => {
    if (initialView) {
      if (initialView === 'pip' && !hasPipAccess && !isAdmin) {
        setView('dashboard');
      } else {
        setView(initialView);
      }
    }
  }, [initialView, hasPipAccess, isAdmin]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  // ── Push Notifications Permission Prompt ───────────────────────────
  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermission());
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [pushSetupMessage, setPushSetupMessage] = useState('');

  useEffect(() => {
    // Show the permission prompt if not yet decided
    if (getNotificationPermission() === 'default') {
      const timer = setTimeout(() => setShowNotifPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (notifPermission !== 'granted') return undefined;
    let active = true;
    registerForSignalPush(user.uid).then((result) => {
      if (!active || result.ok) return;
      const messages = {
        'missing-vapid-key': 'Push alerts need to be configured for this website.',
        unsupported: 'This browser does not support push alerts. On iPhone, add the site to your Home Screen and open it there.',
        'service-worker-failed': 'The notification service could not start. Reload the site and try again.',
      };
      setPushSetupMessage(messages[result.reason] || 'Could not register this device for signal alerts.');
    });
    return () => { active = false; };
  }, [notifPermission, user.uid]);

  const handleEnableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    setShowNotifPrompt(false);
    if (result === 'denied') {
      setPushSetupMessage('Notifications are blocked for this site. Allow them in your browser or Home Screen app settings, then reload.');
    } else if (result === 'unsupported') {
      setPushSetupMessage('This browser does not support push alerts. On iPhone, add the site to your Home Screen and open it there.');
    } else {
      setPushSetupMessage('');
    }
  }, []);

  const handleDismissNotifPrompt = useCallback(() => {
    setShowNotifPrompt(false);
  }, []);

  return (
    <div className="terminal-shell">
      {/* ── NOTIFICATION PERMISSION PROMPT ── */}
      {showNotifPrompt && (
        <div className="notif-permission-banner">
          <div className="notif-permission-content">
            <span className="notif-permission-icon">🔔</span>
            <div className="notif-permission-text">
              <strong>Enable Push Alerts</strong>
              <span>Get notifications for new trading signals and breaking market news.</span>
            </div>
          </div>
          <div className="notif-permission-actions">
            <button className="notif-enable-btn" onClick={handleEnableNotifications}>Enable</button>
            <button className="notif-dismiss-btn" onClick={handleDismissNotifPrompt}>Later</button>
          </div>
        </div>
      )}
      {pushSetupMessage && (
        <div className="notif-permission-banner" role="status">
          <div className="notif-permission-content">
            <span className="notif-permission-text">{pushSetupMessage}</span>
          </div>
        </div>
      )}
      {/* MOBILE DRAWER BACKDROP */}
      {mobileDrawerOpen && (
        <div
          className="terminal-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}

      {/* SIDEBAR NAVIGATION (Docked on Laptop/Desktop, Slide-in Drawer on Mobile) */}
      <aside className={`terminal-sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileDrawerOpen ? ' mobile-open' : ''}`}>
        {/* MOBILE DRAWER CLOSE HEADER (VISIBLE ON MOBILE ONLY) */}
        <div className="terminal-drawer-header">
          <div className="drawer-header-left">
            <span className="drawer-header-dot" />
            <span className="drawer-header-title">GENZ VIP PORTAL</span>
          </div>
          <button
            type="button"
            className="terminal-drawer-close-btn"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

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
              <div className="terminal-plan-tag">👑 {activePlan.toUpperCase()} MEMBER</div>
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
            const isGated = item.key === 'pip' ? !hasPipAccess : item.proOnly && !isProOrElite;
            return (
              <button
                key={item.key}
                type="button"
                className={`terminal-nav-btn${view === item.key ? ' active' : ''}${isGated ? ' gated' : ''}`}
                onClick={() => {
                  setView(item.key);
                  setMobileDrawerOpen(false);
                }}
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

        {/* TIER PREVIEW SWITCHER (ADMIN ONLY) */}
        <div className="terminal-sidebar-bottom">
          {isAdmin && (
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
          )}

          <button
            type="button"
            className="terminal-exit-btn"
            onClick={() => {
              setMobileDrawerOpen(false);
              onExit();
            }}
          >
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
              {/* MOBILE HAMBURGER BUTTON */}
              <button
                type="button"
                className="terminal-mobile-menu-btn"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {/* DESKTOP/LAPTOP SIDEBAR TOGGLE BUTTON */}
              <button
                type="button"
                className={`terminal-sidebar-toggle-btn${sidebarCollapsed ? ' is-collapsed' : ''}`}
                onClick={() => toggleSidebar()}
                title={sidebarCollapsed ? "Show Sidebar Menu" : "Hide Sidebar"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <ThemeToggle />
            <div className="topbar-live-status">
              <span className="live-pulse-beacon" />
              <span className="live-status-full">MARKET LIVE (ICT UTC+7)</span>
              <span className="live-status-mobile">LIVE</span>
            </div>

            <div
              className="topbar-plan-pill"
              onClick={() => setMobileDrawerOpen(true)}
              title="Click to view plan settings"
            >
              <span>★ {activePlan.toUpperCase()}</span>
            </div>

            <button
              type="button"
              className="terminal-topbar-exit-btn"
              onClick={onExit}
              title="Return to Website"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Exit</span>
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="terminal-content-scroll">
          {view === 'dashboard' && (
            <MemberDashboard
              user={user}
              doneMap={doneMap}
              previewPlan={activePlan}
              onNavigate={setView}
            />
          )}

          {view === 'signals' && (
            <MemberSignals
              plan={activePlan}
              previewPlan={activePlan}
              onNavigate={setView}
            />
          )}

          {view === 'pip' && (
            !hasPipAccess ? (
              <MemberTierLocked
                feature="pip"
                isAdmin={isAdmin}
                onUpgrade={() => {
                  if (isAdmin) setPreviewPlan('pro');
                }}
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
                isAdmin={isAdmin}
                onUpgrade={() => {
                  if (isAdmin) setPreviewPlan('pro');
                }}
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

    </div>
  );
}
