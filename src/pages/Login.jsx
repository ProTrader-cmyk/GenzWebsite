import { useEffect, useRef, useState } from 'react';
import { loginUser, requestPasswordResetCode, confirmPasswordResetCode } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { MailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from '../components/ui/CategoryIcons.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Login({ onLogin, onAuthStart, onAuthCancel, onNeedVerification, onSwitchToSignup }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const tr = getStrings(lang).resetPassword;
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot-password flow — entirely in-app, no email link to click:
  // 'email' (enter address, request a code) -> 'verify' (code + new
  // password + confirm, all on one screen) -> 'done'.
  const [resetStep, setResetStep] = useState('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const resetCodeRef = useRef(null);
  const newPasswordRef = useRef(null);

  // Auto-focus the code field the moment the verify screen appears, so
  // typing can start immediately without an extra click.
  useEffect(() => {
    if (resetStep === 'verify') resetCodeRef.current?.focus();
  }, [resetStep]);
  const [resending, setResending] = useState(false);
  const [resendInfo, setResendInfo] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Must be set before loginUser() — it's the signInWithEmailAndPassword
    // call inside it that fires App.jsx's onAuthStateChanged listener,
    // which would otherwise race this handler to set `user` first.
    onAuthStart?.();
    const result = await loginUser({ email, password }, lang);
    setLoading(false);

    if (!result.ok) {
      onAuthCancel?.();
      setError(result.error);
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

  async function handleRequestCode(e) {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordResetCode(email, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setResetStep('verify');
  }

  async function handleResendCode() {
    setResending(true);
    setError('');
    setResendInfo('');
    const result = await requestPasswordResetCode(email, lang);
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResendInfo(tr.resent);
  }

  async function handleConfirmReset(e) {
    e.preventDefault();
    if (resetCode.trim().length !== 6) {
      setError(tr.codeSixDigits);
      return;
    }
    if (newPassword.length < 6) {
      setError(tr.errWeakPassword);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const result = await confirmPasswordResetCode({ email, code: resetCode, newPassword }, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setResetStep('done');
  }

  function backToLogin() {
    setMode('login');
    setResetStep('email');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResendInfo('');
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

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? t.loginBtnLoading : <>{t.loginBtn} →</>}
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

            <form onSubmit={handleRequestCode} noValidate>
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
        ) : resetStep === 'verify' ? (
          <>
            <div className="auth-head">
              <h1>{tr.title}</h1>
              <p>
                {tr.codeSubPrefix} <b>{email}</b>
              </p>
            </div>

            <form onSubmit={handleConfirmReset} noValidate>
              <label className="auth-label" htmlFor="reset-code">
                {tr.codeLabel}
              </label>
              <input
                id="reset-code"
                ref={resetCodeRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="auth-input"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setResetCode(digits);
                  if (digits.length === 6) newPasswordRef.current?.focus();
                }}
                autoComplete="one-time-code"
                required
              />

              <label className="auth-label" htmlFor="reset-new-password">
                {tr.newPassword}
              </label>
              <div className="auth-field">
                <span className="auth-field-icon">
                  <PasswordIcon />
                </span>
                <input
                  id="reset-new-password"
                  ref={newPasswordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-icon auth-input-eye"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {resendInfo && <div className="auth-info">{resendInfo}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? tr.submitting : tr.submit}
              </button>
            </form>

            <div className="auth-switch">
              <button type="button" className="auth-link" onClick={handleResendCode} disabled={resending}>
                {resending ? tr.resending : tr.resend}
              </button>
            </div>
            <div className="auth-switch">
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setResetStep('email');
                  setResetCode('');
                  setError('');
                  setResendInfo('');
                }}
              >
                {tr.changeEmail}
              </button>
            </div>
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
