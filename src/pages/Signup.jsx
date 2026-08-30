import { useState } from 'react';
import { registerUser } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Signup({ onNeedVerification, onSwitchToLogin }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
        <div className="auth-head">
          <h1>{t.signupTitle}</h1>
          <p>{t.signupSub}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="signup-name">
            {t.name}
          </label>
          <input
            id="signup-name"
            type="text"
            className="auth-input"
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <label className="auth-label" htmlFor="signup-email">
            {t.email}
          </label>
          <input
            id="signup-email"
            type="email"
            className="auth-input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className="auth-label" htmlFor="signup-password">
            {t.password}
          </label>
          <input
            id="signup-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <label className="auth-label" htmlFor="signup-confirm">
            {t.confirmPassword}
          </label>
          <input
            id="signup-confirm"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t.signupBtnLoading : t.signupBtn}
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
