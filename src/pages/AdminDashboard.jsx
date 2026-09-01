import { useEffect, useMemo, useState } from 'react';
import { fetchAllUsers, setUserStatus, setUserRole, setUserLessonAccess } from '../data/auth.js';
import { lessons } from '../data/lessons.js';
import { appsLessons } from '../data/appsLessons.js';
import { backtestLessons } from '../data/backtestLessons.js';
import { psychologyLessons } from '../data/psychologyLessons.js';
import { VIDEO_KEYS, fetchAllVideos, saveVideoUrl, deleteVideo } from '../data/videos.js';
import { invalidateVideoCache } from '../data/useVideos.js';
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
  const [permUser, setPermUser] = useState(null);
  const [permSelection, setPermSelection] = useState([]);
  const [permSaving, setPermSaving] = useState(false);
  const [videos, setVideos] = useState({});
  const [videosLoading, setVideosLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [videoError, setVideoError] = useState('');

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

  async function loadVideos() {
    setVideosLoading(true);
    try {
      const all = await fetchAllVideos();
      setVideos(all);
    } catch {
      setVideoError('Could not load videos. Check that firestore.rules is published.');
    }
    setVideosLoading(false);
  }

  useEffect(() => {
    load();
    loadVideos();
  }, []);

  function startEditing(key) {
    setEditingKey(key);
    setUrlDraft(videos[key]?.url ?? '');
    setVideoError('');
  }

  async function handleSaveUrl(key) {
    const url = urlDraft.trim();
    if (!url) return;
    const meta = VIDEO_KEYS.find((v) => v.key === key);
    setSavingKey(key);
    setVideoError('');
    try {
      await saveVideoUrl(key, url, meta?.label);
      setVideos((prev) => ({ ...prev, [key]: { url, label: meta?.label } }));
      invalidateVideoCache();
      setEditingKey(null);
    } catch {
      setVideoError(`Failed to save "${meta?.label ?? key}". Check firestore.rules are published and you're an admin.`);
    }
    setSavingKey(null);
  }

  async function handleDeleteVideo(key) {
    setVideoError('');
    try {
      await deleteVideo(key);
      setVideos((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      invalidateVideoCache();
    } catch {
      setVideoError('Failed to delete video. Check firestore.rules are published.');
    }
  }

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

  function openPermissions(u) {
    const initial = Array.isArray(u.allowedLessons)
      ? u.allowedLessons
      : [
          ...(u.status === 'approved' ? lessons.map((l) => l.id) : ['l1']),
          ...appsLessons.map((l) => l.id),
          ...backtestLessons.map((l) => l.id),
          ...psychologyLessons.map((l) => l.id),
        ];
    setPermUser(u);
    setPermSelection(initial);
  }

  function toggleLesson(id) {
    setPermSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function savePermissions() {
    setPermSaving(true);
    try {
      await setUserLessonAccess(permUser.uid, permSelection);
      setUsers((prev) => prev.map((u) => (u.uid === permUser.uid ? { ...u, allowedLessons: permSelection } : u)));
      setPermUser(null);
    } catch {
      setError('Failed to update permissions. Check Firestore rules / your admin access.');
    }
    setPermSaving(false);
  }

  async function clearPermissions() {
    setPermSaving(true);
    try {
      await setUserLessonAccess(permUser.uid, null);
      setUsers((prev) => prev.map((u) => (u.uid === permUser.uid ? { ...u, allowedLessons: null } : u)));
      setPermUser(null);
    } catch {
      setError('Failed to reset permissions. Check Firestore rules / your admin access.');
    }
    setPermSaving(false);
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
              <th>Paid</th>
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
                <td>{formatDate(u.paidAt)}</td>
                <td className="admin-actions">
                  <button className="action-btn perm" onClick={() => openPermissions(u)}>
                    Permissions{Array.isArray(u.allowedLessons) ? ` (${u.allowedLessons.length})` : ''}
                  </button>
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

      <div className="admin-videos-section">
        <div className="admin-section-title">Videos</div>
        <p className="admin-section-sub">
          For each spot below: upload the file to a GitHub Release (any repo → Releases → attach the file to a
          release), copy the resulting direct-download link, then paste it here. The site reads the URL from
          Firestore, so nothing needs redeploying after saving.
        </p>

        {videoError && <div className="admin-error admin-error-block">{videoError}</div>}

        <div className="video-list">
          {VIDEO_KEYS.map(({ key, label }) => {
            const existing = videos[key];
            const isEditing = editingKey === key;
            const isSaving = savingKey === key;
            return (
              <div key={key} className="video-row">
                <div className="video-row-info">
                  <div className={`video-status-dot${existing ? ' uploaded' : ''}`}></div>
                  <div style={{ flex: 1 }}>
                    <div className="video-row-label">{label}</div>
                    {isEditing ? (
                      <input
                        type="url"
                        className="admin-date-input video-url-input"
                        placeholder="https://github.com/.../releases/download/.../file.mp4"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        autoFocus
                      />
                    ) : existing ? (
                      <a className="video-row-link" href={existing.url} target="_blank" rel="noopener noreferrer">
                        View current video
                      </a>
                    ) : (
                      <div className="video-row-empty">Not set yet</div>
                    )}
                  </div>
                </div>
                <div className="video-row-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="admin-btn-primary"
                        onClick={() => handleSaveUrl(key)}
                        disabled={isSaving || !urlDraft.trim()}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="action-btn reset" onClick={() => setEditingKey(null)} disabled={isSaving}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="action-btn perm" onClick={() => startEditing(key)} disabled={videosLoading}>
                        {existing ? 'Replace' : 'Set URL'}
                      </button>
                      {existing && (
                        <button className="action-btn reject" onClick={() => handleDeleteVideo(key)}>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {permUser && (
        <div className="modal-overlay" onClick={() => setPermUser(null)}>
          <div className="perm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="perm-modal-header">
              <div className="admin-avatar">{initials(permUser.name, permUser.email)}</div>
              <div>
                <div className="perm-modal-title">Permissions</div>
                <div className="perm-modal-sub">
                  {permUser.name} · {permUser.email}
                </div>
              </div>
            </div>

            <div className="perm-section">
              <div className="perm-section-title">Technical Analysis</div>
              {lessons.map((l, i) => (
                <label key={l.id} className="perm-row">
                  <input type="checkbox" checked={permSelection.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                  <span>
                    {i + 1}. {l.title}
                  </span>
                </label>
              ))}
            </div>

            <div className="perm-section">
              <div className="perm-section-title">App & Website for Trading</div>
              {appsLessons.map((l, i) => (
                <label key={l.id} className="perm-row">
                  <input type="checkbox" checked={permSelection.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                  <span>
                    {i + 1}. {l.title}
                  </span>
                </label>
              ))}
            </div>

            <div className="perm-section">
              <div className="perm-section-title">Backtest</div>
              {backtestLessons.map((l, i) => (
                <label key={l.id} className="perm-row">
                  <input type="checkbox" checked={permSelection.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                  <span>
                    {i + 1}. {l.title}
                  </span>
                </label>
              ))}
            </div>

            <div className="perm-section">
              <div className="perm-section-title">Psychology</div>
              {psychologyLessons.map((l, i) => (
                <label key={l.id} className="perm-row">
                  <input type="checkbox" checked={permSelection.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                  <span>
                    {i + 1}. {l.title}
                  </span>
                </label>
              ))}
            </div>

            <div className="perm-modal-actions">
              <button className="action-btn reset" onClick={clearPermissions} disabled={permSaving}>
                Use default access
              </button>
              <button className="action-btn reset" onClick={() => setPermUser(null)} disabled={permSaving}>
                Cancel
              </button>
              <button className="admin-btn-primary" onClick={savePermissions} disabled={permSaving}>
                {permSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
