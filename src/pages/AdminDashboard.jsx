import { useEffect, useMemo, useState } from 'react';
import { fetchAllUsers, setUserStatus, setUserRole } from '../data/auth.js';

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

export default function AdminDashboard({ admin, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [updatingUid, setUpdatingUid] = useState(null);
  const [error, setError] = useState('');

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
      <header className="admin-header">
        <h1>GenZ Trader Admin</h1>
        <div className="admin-header-right">
          <span className="admin-whoami">{admin.email}</span>
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

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
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
                <td>{u.name}</td>
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
