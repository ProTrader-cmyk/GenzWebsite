import { useState, useEffect, useCallback } from 'react';
import MemberDashboard from './member/MemberDashboard.jsx';
import MemberSignals from './member/MemberSignals.jsx';
import MemberPipCoach from './member/MemberPipCoach.jsx';
import MemberLiveRoomPage from './member/MemberLiveRoom.jsx';
import MemberPerks from './member/MemberPerks.jsx';
import MemberComingSoon from './member/MemberComingSoon.jsx';
import '../styles/memberArea.css';
import '../styles/memberShell.css';
import '../styles/memberChrome.css';
import '../styles/memberProfile.css';
import '../styles/memberReadable.css';
import '../styles/memberReadableFix.css';
import '../styles/memberAlways.css';
import '../styles/memberAvatar.css';
import '../styles/memberBrand.css';
import '../styles/memberAiWorkspace.css';
import '../styles/memberSidebarScale.css';
import '../styles/memberRedesign.css';
import memberLogo from '../assets/Fav.png';
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerForSignalPush,
} from '../services/pushNotificationService.js';
import { getUserPlan } from '../data/auth.js';
import { usePersistentState, useScrollPersistence } from '../utils/statePersistence.js';

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

function DashboardIcon(props) {
  return <svg {...common} {...props}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>;
}

function VideoIcon(props) {
  return <svg {...common} {...props}><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/></svg>;
}

function CandlestickIcon(props) {
  return <svg {...common} {...props}><path d="M6 3v18M12 3v18M18 3v18"/><path d="M4 7h4v6H4zM10 12h4v7h-4zM16 5h4v6h-4z"/></svg>;
}

function UserRoundIcon(props) {
  return <svg {...common} {...props}><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>;
}

function MarketIcon(props) {
  return <svg {...common} {...props}><path d="M3 17.5 9 11l4 3 7-8"/><path d="M15 6h5v5"/><path d="M4 21h16"/></svg>;
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
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', Icon: DashboardIcon },
  { key: 'live-room', label: 'Live Room', shortLabel: 'Live Room', Icon: VideoIcon },
  { key: 'signals', label: 'Signal History', shortLabel: 'Signals', Icon: CandlestickIcon },
  { key: 'pip', label: 'AI Chart Assistant', shortLabel: 'AI Assistant', Icon: BotIcon, badge: 'AI', proOnly: true },
  { key: 'profile', label: 'Profile & Membership', shortLabel: 'Profile', Icon: UserRoundIcon },
];

const PLAN_OPTIONS = [
  { key: 'starter', label: 'Starter VIP' },
  { key: 'pro', label: 'Pro VIP' },
  { key: 'elite', label: 'Elite VIP' },
];

function MemberLiveRoom() {
  const [sessionTab, setSessionTab] = useState('live');
  const [chatTab, setChatTab] = useState('chat');
  return (
    <section className="member-room-page" aria-labelledby="member-room-heading">
      <div className="member-room-heading">
        <div><span className="member-room-eyebrow">COMMUNITY BROADCAST</span><h1 id="member-room-heading">Live Room</h1><p>Watch real sessions, follow the analysis, and learn alongside the community.</p></div>
        <span className="member-room-status"><i /> Offline</span>
      </div>
      <div className="member-room-tabs">{[['live','Live'],['upcoming','Upcoming'],['past','Past']].map(([key,label]) => <button type="button" key={key} className={sessionTab === key ? 'active' : ''} onClick={() => setSessionTab(key)}>{label}</button>)}</div>
      <div className="member-room-grid">
        <div className="member-room-player">
          <div className="member-room-player-mark"><span>▶</span><strong>No stream is live</strong><p>When a host starts a broadcast, the player and live chat will appear here.</p></div>
        </div>
        <aside className="member-room-chat"><div className="member-chat-tabs"><button className={chatTab === 'chat' ? 'active' : ''} onClick={() => setChatTab('chat')}>Live Chat</button><button className={chatTab === 'moderators' ? 'active' : ''} onClick={() => setChatTab('moderators')}>Moderators</button></div><div className="member-room-chat-empty">{chatTab === 'chat' ? 'Chat will open when a host starts a live session.' : 'Moderator details will appear during a live session.'}</div><input aria-label="Chat message" disabled placeholder="Chat is offline" /></aside>
      </div>
      <section className="member-room-schedule"><div><h2>Upcoming sessions</h2><p>No sessions have been scheduled yet.</p></div><span>Times shown in your local timezone</span></section>
      <p className="member-room-note">A streaming provider has not been configured for this site yet. No video or viewer count is being simulated.</p>
    </section>
  );
}

function MemberProfile({ user, plan, onEditProfile }) {
  return (
    <section className="member-profile-page">
      <span className="member-room-eyebrow">YOUR ACCOUNT</span><h1>Profile &amp; Membership</h1><p>Manage your profile, membership, and account settings.</p>
      <div className="member-profile-columns">
        <div className="member-profile-card member-profile-main"><div className="member-profile-avatar">{(user?.name || user?.email || 'M').slice(0, 1).toUpperCase()}</div><div><h2>{user?.name || 'Member'}</h2><p>{user?.email || 'Signed-in account'}</p></div><span className="member-profile-plan">{plan.toUpperCase()} MEMBER</span><div className="member-profile-fields"><span>Full name<b>{user?.name || '—'}</b></span><span>Email<b>{user?.email || '—'}</b></span><span>Membership<b>{plan.toUpperCase()}</b></span><span>Member since<b>{user?.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '—'}</b></span></div><button className="member-profile-action" type="button" onClick={onEditProfile}>✎ Edit Profile</button></div>
        <div className="member-profile-card member-account-settings"><h2>Account Settings</h2>{['Password & sign-in','Notification settings','Privacy & security'].map((label) => <div key={label}><span>◈</span><b>{label}</b><i>›</i></div>)}</div>
        <div className="member-profile-card member-community-rules"><h2>Community Rules</h2>{['Be respectful and professional.','No spam or self-promotion.','No fake signals or misleading information.','Keep discussions relevant to trading.','Report any suspicious activity.'].map((rule) => <p key={rule}><span>✓</span>{rule}</p>)}</div>
      </div>
    </section>
  );
}

// Member Area is still "Coming Soon" for everyone. Only admin/dev can use the
// override button on that page to preview the real area.
export default function MemberArea(props) {
  const { user, onExit, onExploreAI } = props;
  const isAdmin = user?.role === 'admin' || user?.role === 'dev';
  const [showComingSoon, setShowComingSoon] = usePersistentState('gzt_member_showComingSoon', true, { userId: user?.uid });

  if (showComingSoon || !isAdmin) {
    return (
      <MemberComingSoon
        user={user}
        onExit={onExit}
        onExploreAI={onExploreAI}
        isAdmin={isAdmin}
        onToggleDevTerminal={() => setShowComingSoon(false)}
      />
    );
  }
  return <MemberAreaLive {...props} />;
}

function MemberAreaLive({ user, doneMap, onExit, initialView = 'dashboard', onExploreAI, onViewAdmin, onViewProfile }) {
  useScrollPersistence('member_area');
  useEffect(() => {
    document.body.classList.add('member-area-open');
    return () => document.body.classList.remove('member-area-open');
  }, []);
  const isAdmin = user?.role === 'admin' || user?.role === 'dev';

  // Actual plan assigned by admin: 'starter' | 'pro' | 'elite' | 'free'
  const userPlan = getUserPlan(user);

  // Admins can preview any tier ('starter', 'pro', 'elite'); members always use their actual assigned plan
  const [previewPlan, setPreviewPlan] = usePersistentState('gzt_member_previewPlan', () => {
    if (userPlan && userPlan !== 'free') return userPlan;
    return isAdmin ? 'elite' : 'starter';
  }, { userId: user?.uid });

  const activePlan = isAdmin ? previewPlan : userPlan;
  const isProOrElite = activePlan === 'pro' || activePlan === 'elite';
  const hasPipAccess = ['starter', 'pro', 'elite'].includes(activePlan);

  // Sync state if user's plan is updated in real-time
  useEffect(() => {
    if (userPlan && userPlan !== 'free') {
      setPreviewPlan(userPlan);
    }
  }, [userPlan]);

  const [view, setView] = usePersistentState('gzt_member_active_view', () => {
    if (initialView === 'pip' && !hasPipAccess && !isAdmin) {
      return 'dashboard';
    }
    return initialView;
  }, { userId: user?.uid });

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

  const [hideProfileCard, setHideProfileCard] = useState(() => {
    try {
      return localStorage.getItem('genz_hide_profile_card') === 'true';
    } catch {
      return false;
    }
  });

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
      setPushSetupMessage('Push alerts are enabled on this device.');
    }
  }, []);

  const handleDismissNotifPrompt = useCallback(() => {
    setShowNotifPrompt(false);
  }, []);

  return (
    <div className="terminal-shell member-terminal-shell">
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
      <aside className={`terminal-sidebar${mobileDrawerOpen ? ' mobile-open' : ''}`}>
        <div className="member-brand"><img src={memberLogo} alt=""/><div><b>GenZ Trader</b><small>Trading Community</small></div></div>
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

        <div className="member-nav-caption">MEMBER AREA</div>
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

        <div className="member-nav-caption member-main-caption">MAIN SITE</div>
        <button type="button" className="member-main-link" onClick={onExploreAI}><MarketIcon className="nav-icon"/><span>AI Trading</span></button>
        {isAdmin && <button type="button" className="member-main-link" onClick={onViewAdmin}><TerminalIcon className="nav-icon"/><span>Admin Panel</span></button>}

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
              <h2 className="topbar-section-title">
                {NAV_ITEMS.find((n) => n.key === view)?.label}
              </h2>
            </div>
            <div className="member-page-subtitle">{({dashboard:'Your trading community, real insights, better decisions.', 'live-room':'Watch live trading sessions, learn from experts, and join the community.', signals:'Manage your previous chart analyses and trading signals.', pip:'Upload or paste your chart screenshot and get AI-powered analysis.', profile:'Manage your profile, membership, and account settings.'})[view] || 'Your trading community, real insights, better decisions.'}</div>
          </div>

          <div className="topbar-right">
            <button type="button" className="member-bell" onClick={handleEnableNotifications} aria-label="Enable push notifications" title="Enable push notifications"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></button>
            <div className="member-top-avatar">{user?.photoURL ? <img className="member-top-avatar-image" src={user.photoURL} alt=""/> : <span className="member-top-avatar-initials">{(user?.name || 'M').slice(0,1).toUpperCase()}</span>}<span className="member-top-meta"><b>{user?.name || 'Member'}</b><small>{activePlan} Member</small></span></div>
            <div className="topbar-plan-pill"
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

          {view === 'live-room' && <MemberLiveRoomPage user={user} isAdmin={isAdmin} />}

          {view === 'profile' && <MemberProfile user={user} plan={activePlan} onEditProfile={onViewProfile} />}

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

          {view === 'perks' && <MemberPerks />}
        </div>

        {/* FOOTER DISCLAIMER */}
        <footer className="terminal-disclaimer">
          <strong>Risk Disclosure:</strong> Trading forex and CFD financial instruments carries high risk and may not be suitable for all investors. Ensure you trade with strictly defined risk management. Past performance does not guarantee future results.
        </footer>
      </main>

    </div>
  );
}
