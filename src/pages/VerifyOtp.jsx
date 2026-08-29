import { useState } from 'react';
import { verifyOtp, resendOtp, fetchUserProfile } from '../data/auth.js';
import AuthBackgroundVideo from '../components/ui/AuthBackgroundVideo.jsx';

export default function VerifyOtp({ pending, onVerified, onCancel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់។');
      return;
    }

    setLoading(true);
    const result = await verifyOtp({ uid: pending.uid, code });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    const profile = await fetchUserProfile(pending.uid);
    onVerified(profile);
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setInfo('');
    const result = await resendOtp(pending);
    setResending(false);
    setInfo(result.ok ? 'បានផ្ញើលេខកូដថ្មីទៅអ៊ីមែលរបស់អ្នកហើយ។' : '');
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="auth-wrap">
      <AuthBackgroundVideo />
      <div className="auth-card">
        <div className="auth-head">
          <h1>បញ្ជាក់អ៊ីមែល</h1>
          <p>
            យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅកាន់ <b>{pending.email}</b>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="otp-code">
            លេខកូដ
          </label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="auth-input"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="one-time-code"
            required
          />

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'បញ្ជាក់'}
          </button>
        </form>

        <div className="auth-switch">
          <button type="button" className="auth-link" onClick={handleResend} disabled={resending}>
            {resending ? 'កំពុងផ្ញើ...' : 'ផ្ញើលេខកូដម្តងទៀត'}
          </button>
        </div>
        <div className="auth-switch">
          <button type="button" className="auth-link" onClick={onCancel}>
            ត្រឡប់ក្រោយ
          </button>
        </div>
      </div>
    </div>
  );
}
