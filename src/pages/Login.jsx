import { useState } from 'react';
import { loginUser, resetPassword } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { MailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from '../components/ui/CategoryIcons.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Login({ onLogin, onNeedVerification, onSwitchToSignup }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  // On success, the logo above zooms in to fill the screen (CSS on
  // .auth-logo.zoom-in) before we actually hand off to the home page, so
  // it feels like passing through the logo rather than an instant swap.
  const [zooming, setZooming] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser({ email, password }, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    if (!result.user.emailVerified) {
      onNeedVerification({ uid: result.user.uid, email: result.user.email, name: result.user.name });
      return;
    }
    setZooming(true);
    setTimeout(() => onLogin(result.user), 600);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    const result = await resetPassword(email, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setResetSent(true);
  }

  function backToLogin() {
    setMode('login');
    setError('');
    setResetSent(false);
  }

  return (
    <div className="auth-wrap">
      <AuthBackgroundVideo />
      <div className="auth-lang">
        <ThemeToggle />
        <LanguageDropdown />
      </div>
      <div className={`auth-card${zooming ? ' zoom-out' : ''}`}>
        <div className={`auth-logo${zooming ? ' zoom-in' : ''}`}>
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

              <button type="submit" className="auth-btn" disabled={loading || zooming}>
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
        ) : (
          <>
            <div className="auth-head">
              <h1>{t.resetTitle}</h1>
              <p>{t.resetSub}</p>
            </div>

            {resetSent ? (
              <>
                <div className="auth-info">{t.resetSuccess}</div>
                <button type="button" className="auth-btn" onClick={backToLogin}>
                  {t.backToLogin}
                </button>
              </>
            ) : (
              <form onSubmit={handleReset} noValidate>
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
            )}

            {!resetSent && (
              <div className="auth-switch">
                <button type="button" className="auth-link" onClick={backToLogin}>
                  {t.backToLogin}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
