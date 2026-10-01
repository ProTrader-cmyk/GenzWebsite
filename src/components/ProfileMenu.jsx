import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { PersonIcon } from './ui/CategoryIcons.jsx';
import { getUserPlan } from '../data/auth.js';

function initials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function AvatarContent({ user }) {
  if (user.photoURL) return <img src={user.photoURL} alt="" className="avatar-img" />;
  return initials(user.name, user.email);
}

// The actual profile content — shared between desktop dropdown and mobile menu
export function ProfileDetails({ user, onViewProfile, onViewPricing }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).profile;
  const status = user.status === 'approved' || user.status === 'rejected' ? user.status : 'pending';
  const statusLabel = { pending: t.statusPending, approved: t.statusApproved, rejected: t.statusRejected }[status];
  const userPlan = getUserPlan(user);
  const isVip = user.tier === 'vip' || userPlan !== 'free';

  return (
    <>
      <div className="profile-menu-header">
        <div className="profile-menu-avatar">
          <AvatarContent user={user} />
        </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`tier-pill${isVip ? ' tier-pill-vip' : ''}`}>
              {isVip ? (userPlan !== 'free' ? userPlan.toUpperCase() + ' VIP' : t.vip) : t.member}
            </span>
            {onViewPricing && (
              <button
                type="button"
                onClick={onViewPricing}
                style={{
                  background: 'rgba(225, 29, 72, 0.15)',
                  color: '#F43F5E',
                  border: '1px solid rgba(225, 29, 72, 0.35)',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                💳 {isVip ? 'Plan' : 'Upgrade'}
              </button>
            )}
          </div>
        </div>
        <div className="profile-menu-row">
          <span>{t.verifiedLabel}</span>
          <span className="profile-menu-row-value">{user.emailVerified ? t.yes : t.no}</span>
        </div>
      </div>

      {onViewProfile && (
        <button type="button" className="profile-menu-view-btn" onClick={onViewProfile}>
          {t.viewProfile}
        </button>
      )}
    </>
  );
}

// Desktop/tablet avatar dropdown panel
export default function ProfileMenu({ user, onViewProfile, onViewPricing }) {
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
        <PersonIcon width="60%" height="60%" />
      </button>

      {open && (
        <div className="profile-menu-panel">
          <ProfileDetails
            user={user}
            onViewProfile={
              onViewProfile &&
              (() => {
                setOpen(false);
                onViewProfile();
              })
            }
            onViewPricing={
              onViewPricing &&
              (() => {
                setOpen(false);
                onViewPricing();
              })
            }
          />
        </div>
      )}
    </div>
  );
}
