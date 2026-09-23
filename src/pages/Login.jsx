import { useEffect, useState } from 'react';
import { loginUser, requestPasswordResetLink, confirmPasswordReset } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { MailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from '../components/ui/CategoryIcons.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// resetLink: { email, token } when this page was reached by clicking the
// emailed reset link (App.jsx parses ?mode=resetPassword&token=&email=
// from the URL) — jumps straight to the New Password screen instead of the
// normal login form.
export default function Login({
  onLogin,
  onAuthStart,
  onAuthCancel,
  onNeedVerification,
  onSwitchToSignup,
  resetLink,
  onExitResetFlow,
}) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const tr = getStrings(lang).resetPassword;
  const [mode, setMode] = useState(resetLink ? 'reset' : 'login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Set from loginUser()'s lockedMs after a lockout-triggering attempt, so
  // the button itself goes disabled with a live countdown instead of the
  // user having to hit Log In again and again just to see the same error.
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const lockRemainingMs = lockedUntil ? Math.max(0, lockedUntil - now) : 0;
  const isLocked = lockRemainingMs > 0;

  useEffect(() => {
    if (lockedUntil && lockRemainingMs === 0) {
      setLockedUntil(null);
      setError('');
    }
  }, [lockRemainingMs, lockedUntil]);

  function formatCountdown(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // Forgot-password flow — an emailed link, not a code to type:
  // 'email' (enter address, request a link) -> 'sent' (check your inbox)
  // ...separately, clicking the emailed link reloads the app with
  // resetLink set, which jumps straight to 'setPassword' -> 'done'.
  const [resetStep, setResetStep] = useState(resetLink ? 'setPassword' : 'email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLocked) return;
    // Must be set before loginUser() — it's the signInWithEmailAndPassword
    // call inside it that fires App.jsx's onAuthStateChanged listener,
    // which would otherwise race this handler to set `user` first.
    onAuthStart?.();
    const result = await loginUser({ email, password }, lang);

    if (!result.ok) {
      onAuthCancel?.();
      setError(result.error);
      if (result.lockedMs) setLockedUntil(Date.now() + result.lockedMs);
      return;
    }

    setError('');
    if (!result.user.emailVerified) {
      onAuthCancel?.();
      onNeedVerification({ uid: result.user.uid, email: result.user.email, name: result.user.name });
      return;
    }
    onLogin(result.user);
  }

  async function handleRequestLink(e) {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordResetLink(email, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setResetStep('sent');
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError(tr.errWeakPassword);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const result = await confirmPasswordReset(
      { email: resetLink.email, token: resetLink.token, newPassword },
      lang
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setResetStep('done');
  }

  function backToLogin() {
    // Must clear App.jsx's resetLink state (not just local state here) —
    // otherwise it stays truthy for the rest of the page session and
    // App.jsx keeps rendering this reset-flow branch on every render,
    // regardless of `user` state, even after a real successful login.
    onExitResetFlow?.();
    setMode('login');
    setResetStep('email');
    setEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
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

        {mode === 'login' ? (
          <>
            <div className="auth-head">
              <h1>{t.loginTitle}</h1>
              <p>{t.loginSub}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="auth-label" htmlFor="login-email">
                {t.email}
              </label>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <MailIcon />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input auth-input-icon"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">
                  {t.password}
                </label>
                <button type="button" className="auth-link" onClick={() => { setMode('reset'); setError(''); }}>
                  {t.forgotPassword}
                </button>
              </div>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <PasswordIcon />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-icon auth-input-eye"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn" disabled={isLocked}>
                {isLocked ? t.loginBtnLocked(formatCountdown(lockRemainingMs)) : <>{t.loginBtn} →</>}
              </button>
            </form>

            <div className="auth-switch">
              {t.noAccount}{' '}
              <button type="button" className="auth-link" onClick={onSwitchToSignup}>
                {t.switchToSignup}
              </button>
            </div>
          </>
        ) : resetStep === 'email' ? (
          <>
            <div className="auth-head">
              <h1>{t.resetTitle}</h1>
              <p>{t.resetSub}</p>
            </div>

            <form onSubmit={handleRequestLink} noValidate>
              <label className="auth-label" htmlFor="reset-email">
                {t.email}
              </label>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <MailIcon />
                </span>
                <input
                  id="reset-email"
                  type="email"
                  className="auth-input auth-input-icon"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? t.resetBtnLoading : t.resetBtn}
              </button>
            </form>

            <div className="auth-switch">
              <button type="button" className="auth-link" onClick={backToLogin}>
                {t.backToLogin}
              </button>
            </div>
          </>
        ) : resetStep === 'sent' ? (
          <>
            <div className="auth-head">
              <h1>{t.resetTitle}</h1>
            </div>
            <div className="auth-info">{t.resetSuccess}</div>
            <button type="button" className="auth-btn" onClick={backToLogin}>
              {t.backToLogin}
            </button>
          </>
        ) : resetStep === 'setPassword' ? (
          <>
            <div className="auth-head">
              <h1>{tr.title}</h1>
              <p>
                {tr.codeSubPrefix} <b>{resetLink.email}</b>
              </p>
            </div>

            <form onSubmit={handleSetPassword} noValidate>
              <label className="auth-label" htmlFor="reset-new-password">
                {tr.newPassword}
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
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
                {tr.confirmPassword}
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
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? tr.submitting : tr.submit}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-head">
              <h1>{tr.title}</h1>
            </div>
            <div className="auth-info">{tr.success}</div>
            <button type="button" className="auth-btn" onClick={backToLogin}>
              {tr.backToLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
