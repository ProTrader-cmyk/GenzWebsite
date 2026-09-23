import { useRef, useState } from 'react';
import { verifyOtp, resendOtp, fetchUserProfile } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const OTP_LENGTH = 6;

export default function VerifyOtp({ pending, onAuthStart, onVerified, onCancel }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).otp;
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const boxRefs = useRef([]);

  function submitCode(code) {
    setLoading(true);
    setError('');
    verifyOtp({ uid: pending.uid, code }, lang).then(async (result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setDigits(Array(OTP_LENGTH).fill(''));
        boxRefs.current[0]?.focus();
        return;
      }
      const profile = await fetchUserProfile(pending.uid);
      onAuthStart?.();
      onVerified(profile);
    });
  }

  function setDigitAt(index, value) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleDigitChange(index, e) {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setDigitAt(index, '');
      return;
    }
    const chars = value.split('');
    setDigits((prev) => {
      const next = [...prev];
      let i = index;
      for (const ch of chars) {
        if (i >= OTP_LENGTH) break;
        next[i] = ch;
        i += 1;
      }
      const nextEmpty = next.findIndex((d) => !d);
      const focusIndex = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
      boxRefs.current[focusIndex]?.focus();
      if (next.every((d) => d)) submitCode(next.join(''));
      return next;
    });
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
      setDigitAt(index - 1, '');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIndex = pasted.length >= OTP_LENGTH ? OTP_LENGTH - 1 : pasted.length;
    boxRefs.current[focusIndex]?.focus();
    if (pasted.length === OTP_LENGTH) submitCode(pasted);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError(t.needSixDigits);
      return;
    }
    submitCode(code);
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
        <ThemeToggle />
        <LanguageDropdown />
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <img src={favicon} alt="GenZ Trader" />
        </div>

        <div className="auth-head">
          <h1>{t.title}</h1>
          <p>
            {t.subPrefix} <b>{pending.email}</b>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="otp-box-0">
            {t.code}
          </label>
          <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                id={`otp-box-${i}`}
                ref={(el) => { boxRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-box"
                value={digit}
                onChange={(e) => handleDigitChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                autoFocus={i === 0}
                required
              />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          {loading && <div className="auth-info">{t.confirming}</div>}
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
