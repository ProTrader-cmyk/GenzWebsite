import { useState } from 'react';
import { registerUser } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';

export default function Signup({ onNeedVerification, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError('សូមបំពេញព័ត៌មានទាំងអស់។');
      return;
    }
    if (password.length < 6) {
      setError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។');
      return;
    }
    if (password !== confirm) {
      setError('ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ។');
      return;
    }

    setLoading(true);
    const result = await registerUser({ name: name.trim(), email: email.trim(), password });
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
      <div className="auth-card">
        <div className="auth-head">
          <h1>ចុះឈ្មោះ</h1>
          <p>បង្កើតគណនីថ្មីដើម្បីចាប់ផ្តើមរៀន</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="signup-name">
            ឈ្មោះ
          </label>
          <input
            id="signup-name"
            type="text"
            className="auth-input"
            placeholder="ឈ្មោះរបស់អ្នក"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <label className="auth-label" htmlFor="signup-email">
            អ៊ីមែល
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
            ពាក្យសម្ងាត់
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
            បញ្ជាក់ពាក្យសម្ងាត់
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
            {loading ? 'កំពុងបង្កើតគណនី...' : 'បង្កើតគណនី'}
          </button>
        </form>

        <div className="auth-switch">
          មានគណនីរួចហើយ?{' '}
          <button type="button" className="auth-link" onClick={onSwitchToLogin}>
            ចូលគណនី
          </button>
        </div>
      </div>
    </div>
  );
}
