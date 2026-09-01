import { useEffect, useState } from 'react';
import { verifyResetCode, confirmReset } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { PasswordIcon, EyeIcon, EyeOffIcon } from '../components/ui/CategoryIcons.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Reached when a user clicks the link from their password-reset email —
// App.jsx detects ?mode=resetPassword&oobCode=... in the URL and renders
// this instead of the normal login flow, regardless of auth state.
export default function ResetPassword({ oobCode, onDone }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).resetPassword;
  const ta = getStrings(lang).auth;
  const [status, setStatus] = useState('verifying'); // verifying | ready | invalid | success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    verifyResetCode(oobCode, lang).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setEmail(result.email);
        setStatus('ready');
      } else {
        setError(result.error);
        setStatus('invalid');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [oobCode, lang]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError(ta.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(ta.passwordMismatch);
      return;
    }

    setSubmitting(true);
    const result = await confirmReset(oobCode, password, lang);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setStatus('success');
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

        {status === 'verifying' && (
          <div className="auth-head">
            <h1>{t.title}</h1>
            <p>{t.verifying}</p>
          </div>
        )}

        {status === 'invalid' && (
          <>
            <div className="auth-head">
              <h1>{t.title}</h1>
            </div>
            <div className="auth-error">{error}</div>
            <button type="button" className="auth-btn" onClick={onDone}>
              {t.backToLogin}
            </button>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="auth-head">
              <h1>{t.title}</h1>
              <p>
                {t.subPrefix} <b>{email}</b>
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="auth-label" htmlFor="reset-new-password">
                {t.newPassword}
              </label>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <PasswordIcon />
                </span>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-icon auth-input-eye"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <label className="auth-label" htmlFor="reset-confirm-password">
                {t.confirmPassword}
              </label>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <PasswordIcon />
                </span>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-icon"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn" disabled={submitting}>
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="auth-head">
              <h1>{t.title}</h1>
            </div>
            <div className="auth-info">{t.success}</div>
            <button type="button" className="auth-btn" onClick={onDone}>
              {t.backToLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
