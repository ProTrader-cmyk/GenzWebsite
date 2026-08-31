import { useState } from 'react';
import { registerUser } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { UserIcon, MailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from '../components/ui/CategoryIcons.jsx';
import favicon from '../assets/Fav.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Signup({ onNeedVerification, onSwitchToLogin }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError(t.fillAllFields);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const result = await registerUser({ name: name.trim(), email: email.trim(), password }, lang);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    onNeedVerification({ uid: result.uid, email: result.email, name: result.name });
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
          <h1>{t.signupTitle}</h1>
          <p>{t.signupSub}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="signup-name">
            {t.name}
          </label>
          <div className="auth-field">
            <span className="auth-field-icon">
              <UserIcon />
            </span>
            <input
              id="signup-name"
              type="text"
              className="auth-input auth-input-icon"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <label className="auth-label" htmlFor="signup-email">
            {t.email}
          </label>
          <div className="auth-field">
            <span className="auth-field-icon">
              <MailIcon />
            </span>
            <input
              id="signup-email"
              type="email"
              className="auth-input auth-input-icon"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label className="auth-label" htmlFor="signup-password">
            {t.password}
          </label>
          <div className="auth-field">
            <span className="auth-field-icon">
              <PasswordIcon />
            </span>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input auth-input-icon auth-input-eye"
              placeholder="••••••••"
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

          <label className="auth-label" htmlFor="signup-confirm">
            {t.confirmPassword}
          </label>
          <div className="auth-field">
            <span className="auth-field-icon">
              <PasswordIcon />
            </span>
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              className="auth-input auth-input-icon auth-input-eye"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t.signupBtnLoading : <>{t.signupBtn} →</>}
          </button>
        </form>

        <div className="auth-switch">
          {t.haveAccount}{' '}
          <button type="button" className="auth-link" onClick={onSwitchToLogin}>
            {t.switchToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}
