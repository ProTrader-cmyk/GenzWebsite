import { useEffect, useMemo, useState } from 'react';
import { fetchAllUsers, setUserStatus, setUserRole } from '../data/auth.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function formatDate(ts) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// Local calendar-day key (not UTC) so it lines up with what a <input
// type="date"> shows and returns, regardless of the viewer's timezone.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminDashboard({ admin, onLogout, onViewSite }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [updatingUid, setUpdatingUid] = useState(null);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()));

  async function load() {
    setLoading(true);
    setError('');
    try {
      const all = await fetchAllUsers();
      setUsers(all);
    } catch {
      setError('Could not load users. Check that this account has role: "admin" and rules are published.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const approved = users.filter((u) => u.status === 'approved').length;
    const rejected = users.filter((u) => u.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [users]);

  const visibleUsers = tab === 'all' ? users : users.filter((u) => u.status === tab);

  const signupsInRange = useMemo(() => {
    return users.filter((u) => {
      if (!u.createdAt) return false;
      const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const key = toDateKey(date);
      return key >= startDate && key <= endDate;
    }).length;
  }, [users, startDate, endDate]);

  async function handleStatusChange(uid, status) {
    setUpdatingUid(uid);
    try {
      await setUserStatus(uid, status);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status } : u)));
    } catch {
      setError('Failed to update status. Check Firestore rules / your admin access.');
    }
    setUpdatingUid(null);
  }

  async function handleRoleChange(uid, role) {
    setUpdatingUid(uid);
    try {
      await setUserRole(uid, role);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch {
      setError('Failed to update role. Check Firestore rules / your admin access.');
    }
    setUpdatingUid(null);
  }

  return (
    <div className="admin-shell">
      <button type="button" className="admin-back" onClick={onViewSite}>
        ← Go back to website
      </button>

      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10v-6L12 2.5Z" />
              <path d="M9 12.2l2 2 4-4.4" />
            </svg>
          </div>
          <div>
            <h1>GenZ Trader Admin</h1>
            <div className="admin-header-sub">User approvals & access control</div>
          </div>
        </div>
        <div className="admin-header-right">
          <span className="admin-whoami">{admin.email}</span>
          <ThemeToggle />
          <button className="admin-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">Total users</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-num">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-num">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-num">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="admin-daily">
        <div className="admin-daily-label">From</div>
        <input
          type="date"
          className="admin-date-input"
          value={startDate}
          max={endDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <div className="admin-daily-label">To</div>
        <input
          type="date"
          className="admin-date-input"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <div className="admin-daily-count-wrap">
          <div className="admin-daily-count">{signupsInRange}</div>
          <div className="admin-daily-count-label">Signups</div>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="admin-tab-count">{t.key === 'all' ? stats.total : stats[t.key]}</span>
          </button>
        ))}
        <button className="admin-refresh" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="admin-error admin-error-block">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Email verified</th>
              <th>Status</th>
              <th>Role</th>
              <th>Signed up</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => (
              <tr key={u.uid}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar">{initials(u.name, u.email)}</div>
                    {u.name}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                <td>
                  <span className={`status-pill status-${u.status}`}>{u.status}</span>
                </td>
                <td>
                  <span className={`role-pill${u.role === 'admin' ? ' role-admin' : ''}`}>
                    {u.role ?? 'user'}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td className="admin-actions">
                  {u.status !== 'approved' && (
                    <button
                      className="action-btn approve"
                      disabled={updatingUid === u.uid}
                      onClick={() => handleStatusChange(u.uid, 'approved')}
                    >
                      Approve
                    </button>
                  )}
                  {u.status !== 'rejected' && (
                    <button
                      className="action-btn reject"
                      disabled={updatingUid === u.uid}
                      onClick={() => handleStatusChange(u.uid, 'rejected')}
                    >
                      Reject
                    </button>
                  )}
                  {u.status !== 'pending' && (
                    <button
                      className="action-btn reset"
                      disabled={updatingUid === u.uid}
                      onClick={() => handleStatusChange(u.uid, 'pending')}
                    >
                      Set pending
                    </button>
                  )}
                  {u.role === 'admin' ? (
                    <button
                      className="action-btn reset"
                      disabled={updatingUid === u.uid}
                      onClick={() => handleRoleChange(u.uid, 'user')}
                    >
                      Remove admin
                    </button>
                  ) : (
                    <button
                      className="action-btn admin"
                      disabled={updatingUid === u.uid}
                      onClick={() => handleRoleChange(u.uid, 'admin')}
                    >
                      Make admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty">
                  No users in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
