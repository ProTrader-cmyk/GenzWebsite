import { useState } from 'react';
import { verifyOtp, resendOtp, fetchUserProfile } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function VerifyOtp({ pending, onVerified, onCancel }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).otp;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError(t.needSixDigits);
      return;
    }

    setLoading(true);
    const result = await verifyOtp({ uid: pending.uid, code }, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    const profile = await fetchUserProfile(pending.uid);
    onVerified(profile);
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setInfo('');
    const result = await resendOtp(pending, lang);
    setResending(false);
    setInfo(result.ok ? t.resent : '');
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="auth-wrap">
      <AuthBackgroundVideo />
      <div className="auth-lang">
        <LanguageDropdown />
      </div>
      <div className="auth-card">
        <div className="auth-head">
          <h1>{t.title}</h1>
          <p>
            {t.subPrefix} <b>{pending.email}</b>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="otp-code">
            {t.code}
          </label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="auth-input"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="one-time-code"
            required
          />

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t.confirming : t.confirm}
          </button>
        </form>

        <div className="auth-switch">
          <button type="button" className="auth-link" onClick={handleResend} disabled={resending}>
            {resending ? t.resending : t.resend}
          </button>
        </div>
        <div className="auth-switch">
          <button type="button" className="auth-link" onClick={onCancel}>
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}
