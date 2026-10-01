import { useCallback, useEffect, useRef, useState } from 'react';
import { createPayment, verifyPayment } from '../data/payments.js';

export default function BakongPaymentModal({ plan, billing = 'monthly', onClose, onActivated }) {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('creating');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const createRequest = useRef(null);

  useEffect(() => {
    createRequest.current ||= createPayment(plan.id, billing);
    createRequest.current.then((result) => {
      setOrder(result);
      setStatus('pending');
    }).catch((err) => {
      setError(err.message); setStatus('failed');
    });
  }, [plan.id, billing]);

  const check = useCallback(async () => {
    if (!order || checking || status !== 'pending') return;
    setChecking(true);
    setError('');
    try {
      const result = await verifyPayment(order.paymentId);
      setStatus(result.status);
      if (result.status === 'failed') {
        const reasons = {
          amount_mismatch: 'The verified transfer amount did not match this order.',
          currency_mismatch: 'The verified transfer currency did not match this order.',
          recipient_mismatch: 'The transfer was sent to a different Bakong account.',
          transaction_already_used: 'This Bakong transaction was already applied to another order.',
        };
        setError(reasons[result.reason] || 'Bakong could not match this transfer to the order.');
      }
      if (result.status === 'paid') onActivated?.({ id: plan.id, paymentId: order.paymentId });
    } catch (err) { setError(err.message); }
    finally { setChecking(false); }
  }, [order, checking, status, plan.id, onActivated]);

  useEffect(() => {
    if (status !== 'pending') return undefined;
    const timer = window.setInterval(check, 5000);
    return () => window.clearInterval(timer);
  }, [status, check]);

  const terminal = status === 'paid' || status === 'failed' || status === 'expired';
  return (
    <div className="modal-overlay bakong-modal-overlay" onClick={onClose}>
      <section className="modal-box bakong-modal-box" role="dialog" aria-modal="true" aria-labelledby="payment-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close">×</button>
        <div className="bakong-modal-header">
          <span className="bakong-brand-pill">BAKONG KHQR</span>
          <h2 id="payment-title" className="bakong-modal-title">{status === 'paid' ? 'Payment confirmed' : status === 'failed' ? 'Payment failed' : status === 'expired' ? 'Payment expired' : 'Scan to pay'}</h2>
          <p className="bakong-modal-desc">{plan.name} · {billing}. Access stays locked until Bakong verifies this order.</p>
        </div>
        {status === 'creating' && <p role="status">Creating your secure payment order…</p>}
        {order && status === 'pending' && <div className="bakong-content-grid">
          <div className="bakong-qr-standee"><img src={order.qrImage} alt={`KHQR for $${order.amount.toFixed(2)} USD`} style={{ width: '100%', maxWidth: 320 }} />
            <strong>${order.amount.toFixed(2)} USD</strong><p>{order.packageName} · {billing}</p></div>
          <div className="bakong-info-col"><p>Pay to <strong>{order.recipient}</strong></p>
            <p>Order <code>{order.paymentId}</code></p><p role="status">Waiting for payment verification…</p>
            <button type="button" className="bakong-submit-btn" onClick={check} disabled={checking}>{checking ? 'Checking…' : 'Check payment status'}</button>
            <p>Expires {new Date(order.expiresAt).toLocaleString()}</p></div>
        </div>}
        {status === 'paid' && <div className="bakong-success-card"><h3>Subscription activated</h3><p>Your verified payment was applied to {plan.name}. You can now use the features included in your package.</p><button type="button" className="bakong-submit-btn" onClick={onClose}>Continue</button></div>}
        {terminal && status !== 'paid' && <div className="bakong-success-card"><p>{status === 'expired' ? 'This QR has expired. Create a new order to try again.' : 'We could not verify a matching payment. Contact support if money was transferred.'}</p><button type="button" className="bakong-done-btn" onClick={onClose}>Close</button></div>}
        {error && <p className="bakong-error-text" role="alert">{error}</p>}
      </section>
    </div>
  );
}
