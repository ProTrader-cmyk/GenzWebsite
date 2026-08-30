import { useState } from 'react';
import { loginUser } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';
import LanguageDropdown from '../components/LanguageDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Login({ onLogin, onNeedVerification, onSwitchToSignup }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    onLogin(result.user);
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
          <h1>{t.loginTitle}</h1>
          <p>{t.loginSub}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="login-email">
            {t.email}
          </label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className="auth-label" htmlFor="login-password">
            {t.password}
          </label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t.loginBtnLoading : t.loginBtn}
          </button>
        </form>

        <div className="auth-switch">
          {t.noAccount}{' '}
          <button type="button" className="auth-link" onClick={onSwitchToSignup}>
            {t.switchToSignup}
          </button>
        </div>
      </div>
    </div>
  );
}
