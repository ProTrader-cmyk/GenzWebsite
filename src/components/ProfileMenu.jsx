import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

function initials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// The actual profile content — shared between the desktop dropdown panel
// below and the always-open mobile burger menu (Navbar.jsx), since a
// click-to-toggle dropdown doesn't make sense nested inside an already-open
// mobile menu.
export function ProfileDetails({ user }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).profile;
  const status = user.status === 'approved' || user.status === 'rejected' ? user.status : 'pending';
  const statusLabel = { pending: t.statusPending, approved: t.statusApproved, rejected: t.statusRejected }[status];
  const isVip = user.tier === 'vip';

  return (
    <>
      <div className="profile-menu-header">
        <div className="profile-menu-avatar">{initials(user.name, user.email)}</div>
        <div>
          <div className="profile-menu-name">{user.name || '—'}</div>
          <div className="profile-menu-email">{user.email}</div>
        </div>
      </div>

      <div className="profile-menu-rows">
        <div className="profile-menu-row">
          <span>{t.statusLabel}</span>
          <span className={`status-pill status-${status}`}>{statusLabel}</span>
        </div>
        <div className="profile-menu-row">
          <span>{t.tierLabel}</span>
          <span className={`tier-pill${isVip ? ' tier-pill-vip' : ''}`}>{isVip ? t.vip : t.member}</span>
        </div>
        <div className="profile-menu-row">
          <span>{t.verifiedLabel}</span>
          <span className="profile-menu-row-value">{user.emailVerified ? t.yes : t.no}</span>
        </div>
      </div>
    </>
  );
}

// Desktop/tablet: an avatar button in the top bar that toggles a dropdown
// panel. Hidden below 640px (see main.css) — ProfileDetails is shown inline
// in the mobile burger menu instead, same as nav-logout/nav-mobile-logout.
export default function ProfileMenu({ user }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).profile;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className="profile-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.ariaLabel}
        aria-expanded={open}
      >
        {initials(user.name, user.email)}
      </button>

      {open && (
        <div className="profile-menu-panel">
          <ProfileDetails user={user} />
        </div>
      )}
    </div>
  );
}
