import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { TelegramIcon, LockIcon, SparkleIcon } from './ui/CategoryIcons.jsx';

const ADMIN_TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';
const ADMIN_TELEGRAM_HANDLE = '@Vengsopheagenz';
const MENTOR_TELEGRAM_URL = 'https://t.me/Vengsopheagenz';

export default function ReferralAccessModal({ isOpen, onClose, user }) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyHandle = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ADMIN_TELEGRAM_HANDLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-box referral-access-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: '92%',
          padding: '28px 24px',
          borderRadius: 24,
          background: 'var(--bg1, #13141B)',
          border: '1px solid var(--brandline, rgba(245, 158, 11, 0.35))',
          boxShadow: '0 24px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px -10px rgba(245, 158, 11, 0.25)',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="modal-close-btn"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 18,
            fontSize: 22,
            background: 'none',
            border: 'none',
            color: 'var(--mute, #94A3B8)',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        {/* Brand Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#F59E0B', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', marginBottom: 16 }}>
          <SparkleIcon style={{ width: 13, height: 13 }} />
          <span>{isKhmer ? 'សិទ្ធិចូលប្រើប្រាស់ VIP · TRADE UNDER REFERRAL' : 'VIP EXCLUSIVE · TRADE UNDER REFERRAL'}</span>
        </div>

        {/* Lock / Key Icon Badge */}
        <div style={{ width: 62, height: 62, margin: '0 auto 16px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(225, 29, 72, 0.2))', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)' }}>
          💎
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text, #F8FAFC)', margin: '0 0 10px', lineHeight: 1.3 }}>
          {isKhmer ? 'សិទ្ធិចូលប្រើប្រាស់ AI Trading' : 'Access AI Trading Terminal'}
        </h3>

        {/* Main Instruction Message */}
        <div style={{ background: 'var(--bg2, rgba(255,255,255,0.04))', border: '1px solid var(--faint, rgba(255,255,255,0.08))', borderRadius: 16, padding: '16px 18px', margin: '0 0 20px', textAlign: 'left' }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text, #E2E8F0)', margin: '0 0 8px', fontWeight: 600 }}>
            {isKhmer
              ? 'ដើម្បីទទួលបានសិទ្ធិចូលប្រើប្រាស់ AI Trading Workstation និង VIP Signals អ្នកត្រូវផ្ញើសារផ្ទាល់ (Direct Message) ទៅកាន់ Admin តាម Telegram ដើម្បីចុះឈ្មោះ និងជួញដូរក្រោម Link Referral របស់យើង។'
              : 'To gain access to our real-time AI Trading Terminal and VIP Signals, you need to direct message the Admin to trade under my referral.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--mute, #94A3B8)', marginTop: 8 }}>
            <span>👤 Admin Telegram:</span>
            <strong style={{ color: '#F59E0B' }}>{ADMIN_TELEGRAM_HANDLE}</strong>
            <button
              type="button"
              onClick={handleCopyHandle}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 24px', fontSize: 12.5, color: 'var(--mute, #94A3B8)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>1</span>
            <span>{isKhmer ? 'ផ្ញើសារផ្ទាល់ទៅកាន់ Admin តាម Telegram យក Link ចុះឈ្មោះ Broker' : 'DM Admin on Telegram to request your official broker referral registration link.'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>2</span>
            <span>{isKhmer ? 'បង្កើតគណនី និងជួញដូរក្រោម Link Referral របស់យើង' : 'Create and fund your live trading account under our verified referral.'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>3</span>
            <span>{isKhmer ? 'Admin នឹងបើកសិទ្ធិប្រើប្រាស់ VIP AI Trading ដោយឥតគិតថ្លៃភ្លាមៗ!' : 'Admin instantly activates your 100% free VIP AI Trading & Signal access!'}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <a
          href={ADMIN_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #0088CC, #00A3E0)',
            color: '#FFFFFF',
            textDecoration: 'none',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 14.5,
            boxShadow: '0 8px 24px rgba(0, 136, 204, 0.35)',
            marginBottom: 10,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <TelegramIcon width="18" height="18" />
          <span>{isKhmer ? 'ផ្ញើសារទៅ Admin ឥឡូវនេះ (@Vengsopheagenz)' : 'Direct Message Admin on Telegram (@Vengsopheagenz)'}</span>
        </a>

        {/* Secondary Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={MENTOR_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 14px',
              background: 'var(--bg2, rgba(255,255,255,0.06))',
              color: 'var(--text, #E2E8F0)',
              textDecoration: 'none',
              borderRadius: 12,
              fontSize: 12.5,
              fontWeight: 700,
              border: '1px solid var(--faint, rgba(255,255,255,0.1))',
            }}
          >
            <span>💬</span>
            <span>{isKhmer ? 'Support / Mentor' : 'Contact Support'}</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'none',
              color: 'var(--mute, #94A3B8)',
              border: '1px solid var(--faint, rgba(255,255,255,0.1))',
              borderRadius: 12,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isKhmer ? 'បិទផ្ទាំងនេះ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

