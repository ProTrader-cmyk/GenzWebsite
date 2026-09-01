import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// A one-time celebratory popup fired by App.jsx's live Firestore listener the
// moment an admin approves the account (kind: 'approved') or upgrades it to
// VIP (kind: 'vip') — shows immediately if the tab is open, or on next visit
// otherwise. `kind` is null when there's nothing to show.
export default function AccessGrantedModal({ kind, onClose }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).accessGranted;

  if (!kind) return null;

  const title = kind === 'vip' ? t.vipTitle : t.approvedTitle;
  const text = kind === 'vip' ? t.vipText : t.approvedText;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" aria-label={t.close} onClick={onClose}>
          ×
        </button>
        <div className="modal-celebrate-icon">🎉</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-text">{text}</p>
        <button className="modal-btn" onClick={onClose}>
          {t.cta}
        </button>
      </div>
    </div>
  );
}
