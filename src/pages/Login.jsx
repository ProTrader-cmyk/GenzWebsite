import { useState } from 'react';
import { loginUser } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';

export default function Login({ onLogin, onNeedVerification, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser({ email, password });
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
      <div className="auth-card">
        <div className="auth-head">
          <h1>ចូលគណនី</h1>
          <p>សូមស្វាគមន៍ត្រឡប់មកវិញកាន់ GenZ Trader</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="login-email">
            អ៊ីមែល
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
            ពាក្យសម្ងាត់
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
            {loading ? 'កំពុងចូល...' : 'ចូលគណនី'}
          </button>
        </form>

        <div className="auth-switch">
          មិនទាន់មានគណនីមែនទេ?{' '}
          <button type="button" className="auth-link" onClick={onSwitchToSignup}>
            ចុះឈ្មោះ
          </button>
        </div>
      </div>
    </div>
  );
}
