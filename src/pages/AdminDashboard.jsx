import { useEffect, useMemo, useState } from 'react';
import {
  fetchAllUsers,
  setUserStatus,
  setUserAccess,
  setUserLessonAccess,
  createUserAsAdmin,
  deleteUserAsAdmin,
} from '../data/auth.js';
import { lessons } from '../data/lessons.js';
import { appsLessons } from '../data/appsLessons.js';
import { backtestLessons } from '../data/backtestLessons.js';
import { psychologyLessons } from '../data/psychologyLessons.js';
import { advancedLessons } from '../data/advancedLessons.js';
import { VIDEO_KEYS, fetchAllVideos, saveVideoUrl, deleteVideo } from '../data/videos.js';
import { invalidateVideoCache } from '../data/useVideos.js';
import { fetchAllFeedback } from '../data/feedback.js';
import {
  subscribeSignals,
  publishSignal,
  updateSignalStatus,
  deleteSignal,
  generateAiSignal,
} from '../data/signals.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Suspended' },
];

// The underlying status value stays 'rejected' (Firestore, setUserStatus,
// stats.rejected, etc.) -- only the display label reads "Suspended".
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Suspended' };

function formatDate(ts) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Short "19 Jul" form for the member table's Joined column.
function formatJoined(ts) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
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
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUid, setUpdatingUid] = useState(null);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()));
  const [actionsMenu, setActionsMenu] = useState(null); // { uid, top, right }
  const [permUser, setPermUser] = useState(null);
  const [permSelection, setPermSelection] = useState([]);
  const [permSaving, setPermSaving] = useState(false);
  const [videos, setVideos] = useState({});
  const [videosLoading, setVideosLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [videoError, setVideoError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', status: 'pending', tier: 'member' });
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [hideMembers, setHideMembers] = useState(() => {
    try {
      return localStorage.getItem('admin_hide_members') === 'true';
    } catch {
      return false;
    }
  });

  function toggleHideMembers() {
    setHideMembers((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_hide_members', String(next));
      } catch {}
      return next;
    });
  }

  const isDev = admin.role === 'dev';

  // Signals State & AI Generator
  const [signals, setSignals] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [signalError, setSignalError] = useState('');
  const [signalSuccess, setSignalSuccess] = useState('');
  const [updatingSignalId, setUpdatingSignalId] = useState(null);

  // AI Generator Form State
  const [aiPair, setAiPair] = useState('XAUUSD');
  const [aiNotes, setAiNotes] = useState('');
  const [aiImage, setAiImage] = useState(null);
  const [aiImagePreview, setAiImagePreview] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Draft Signal Form State
  const [signalDraft, setSignalDraft] = useState({
    pair: 'XAUUSD',
    direction: 'buy',
    entry: '',
    sl: '',
    tp: '',
    rr: '2.0',
    session: 'London Killzone',
    reason: '',
    status: 'active',
  });
  const [isDroppingSignal, setIsDroppingSignal] = useState(false);

  function updateDraftField(field, value) {
    setSignalDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'entry' || field === 'sl' || field === 'tp') {
        const e = parseFloat(field === 'entry' ? value : next.entry);
        const s = parseFloat(field === 'sl' ? value : next.sl);
        const t = parseFloat(field === 'tp' ? value : next.tp);
        if (e && s && t) {
          const risk = Math.abs(e - s);
          const reward = Math.abs(t - e);
          if (risk > 0) {
            next.rr = (Math.round((reward / risk) * 10) / 10).toFixed(1);
          }
        }
      }
      return next;
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setSignalError('Chart screenshot must be smaller than 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAiImage(reader.result);
      setAiImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setAiImage(null);
    setAiImagePreview(null);
  }

  async function handleAiGenerate() {
    setSignalError('');
    setSignalSuccess('');
    setAiGenerating(true);
    try {
      const res = await generateAiSignal({
        notes: aiNotes,
        pair: aiPair,
        base64Image: aiImage,
      });

      setSignalDraft({
        pair: res.pair || aiPair || 'XAUUSD',
        direction: res.direction || 'buy',
        entry: res.entry ? String(res.entry) : '',
        sl: res.sl ? String(res.sl) : '',
        tp: res.tp ? String(res.tp) : '',
        rr: res.rr ? String(res.rr) : '2.0',
        session: res.session || 'London Killzone',
        reason: res.reason || '',
        status: 'active',
      });
      setSignalSuccess('✨ Gemini auto-filled your signal! You can edit any numbers or rationale below before dropping.');
      setTimeout(() => {
        document.getElementById('signal-review-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      console.error('AI Signal generation error:', err);
      setSignalError(err.message || 'Failed to generate signal with Gemini AI.');
    } finally {
      setAiGenerating(false);
    }
  }

  async function handlePublishSignal(e) {
    e?.preventDefault?.();
    setSignalError('');
    setSignalSuccess('');

    if (!signalDraft.entry || !signalDraft.sl || !signalDraft.tp) {
      setSignalError('Please fill in Entry, Stop Loss, and Take Profit levels before dropping signal.');
      return;
    }

    setIsDroppingSignal(true);
    try {
      await publishSignal(signalDraft);
      setSignalSuccess(`🚀 Dropped ${signalDraft.pair} ${signalDraft.direction.toUpperCase()} signal live to website!`);
      setSignalDraft((prev) => ({
        ...prev,
        entry: '',
        sl: '',
        tp: '',
        reason: '',
      }));
      setAiNotes('');
      setAiImage(null);
      setAiImagePreview(null);
    } catch (err) {
      console.error('Error dropping signal:', err);
      setSignalError('Failed to publish signal. Check Firestore rules / admin access.');
    } finally {
      setIsDroppingSignal(false);
    }
  }

  async function handleUpdateSignalStatus(id, newStatus) {
    setUpdatingSignalId(id);
    try {
      await updateSignalStatus(id, newStatus);
    } catch (err) {
      console.error('Error updating signal status:', err);
      setSignalError('Failed to update signal status.');
    } finally {
      setUpdatingSignalId(null);
    }
  }

  async function handleDeleteSignal(id, pair) {
    if (!window.confirm(`Delete ${pair} signal? This removes it from the member terminal.`)) return;
    try {
      await deleteSignal(id);
    } catch (err) {
      console.error('Error deleting signal:', err);
      setSignalError('Failed to delete signal.');
    }
  }

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

  async function loadFeedback() {
    setFeedbackLoading(true);
    setFeedbackError('');
    try {
      const all = await fetchAllFeedback();
      setFeedback(all);
    } catch {
      setFeedbackError('Could not load feedback. Check that firestore.rules is published.');
    }
    setFeedbackLoading(false);
  }

  useEffect(() => {
    load();
    loadVideos();
    loadFeedback();
    const unsubSignals = subscribeSignals((list) => {
      setSignals(list);
      setSignalsLoading(false);
    });
    return () => unsubSignals();
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

  const tabUsers = tab === 'all' ? users : users.filter((u) => u.status === tab);
  const q = searchQuery.trim().toLowerCase();
  const visibleUsers = q
    ? tabUsers.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    : tabUsers;

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

  async function handleDeleteUser(u) {
    if (!window.confirm(`Delete ${u.name || u.email}? This permanently removes their account and can't be undone.`)) {
      return;
    }
    setUpdatingUid(u.uid);
    setError('');
    try {
      const result = await deleteUserAsAdmin(u.uid);
      if (!result.ok) throw new Error(result.error);
      setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
    setUpdatingUid(null);
  }

  // One dropdown covering both role and tier — Member/VIP set role: 'user'
  // with tier: 'member'/'vip'; Admin/Dev set role and leave tier untouched.
  function accessValue(u) {
    if (u.role === 'admin') return 'admin';
    if (u.role === 'dev') return 'dev';
    return u.tier === 'vip' ? 'vip' : 'member';
  }

  async function handleAccessChange(uid, value) {
    const role = value === 'admin' || value === 'dev' ? value : 'user';
    const tier = value === 'vip' ? 'vip' : 'member';
    setUpdatingUid(uid);
    try {
      await setUserAccess(uid, { role, tier });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role, tier } : u)));
    } catch {
      setError('Failed to update role. Check Firestore rules / your admin access.');
    }
    setUpdatingUid(null);
  }

  function openActionsMenu(e, uid) {
    const rect = e.currentTarget.getBoundingClientRect();
    setActionsMenu((prev) =>
      prev?.uid === uid ? null : { uid, top: rect.bottom + 6, right: window.innerWidth - rect.right }
    );
  }

  function openPermissions(u) {
    const initial = Array.isArray(u.allowedLessons)
      ? u.allowedLessons
      : [
          ...(u.status === 'approved' ? lessons.map((l) => l.id) : ['l1']),
          ...appsLessons.map((l) => l.id),
          ...backtestLessons.map((l) => l.id),
          ...psychologyLessons.map((l) => l.id),
          ...advancedLessons.map((l) => l.id),
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

  function openAddUser() {
    setNewUser({ name: '', email: '', password: '', role: 'user', status: 'pending', tier: 'member' });
    setAddUserError('');
    setShowAddUser(true);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || newUser.password.length < 6) {
      setAddUserError('Name, email, and a password of at least 6 characters are required.');
      return;
    }
    setAddUserSaving(true);
    setAddUserError('');
    const result = await createUserAsAdmin(newUser);
    if (result.ok) {
      setShowAddUser(false);
      load();
    } else {
      setAddUserError(result.error);
    }
    setAddUserSaving(false);
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
          <button
            type="button"
            className={`admin-toggle-members-btn${hideMembers ? ' is-hidden' : ''}`}
            onClick={toggleHideMembers}
            title={hideMembers ? 'Show Members' : 'Hide Members'}
          >
            {hideMembers ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Show Members</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <span>Hide Members</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="admin-signals-shortcut-btn"
            onClick={() => document.getElementById('admin-signals-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            ⚡ Signals ({signals.filter((s) => s.status === 'active').length})
          </button>
          <button className="admin-feedback-btn" onClick={() => setShowFeedback(true)}>
            Feedback{feedback.length ? <span className="admin-feedback-count">{feedback.length}</span> : null}
          </button>
          <button className="admin-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* ===== MEMBERS SECTION ===== */}
      {hideMembers ? (
        <div className="admin-collapsed-banner">
          <div className="admin-collapsed-banner-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Members section is hidden ({users.length} total members) — focusing on Videos</span>
          </div>
          <button
            type="button"
            className="admin-btn-primary admin-collapsed-show-btn"
            onClick={toggleHideMembers}
          >
            Show Members
          </button>
        </div>
      ) : (
        <div className="admin-members-section">
          <div className="admin-section-bar">
            <div className="admin-section-title" style={{ margin: 0 }}>
              Members Management
            </div>
            <button
              type="button"
              className="admin-collapse-inline-btn"
              onClick={toggleHideMembers}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <span>Hide Members</span>
            </button>
          </div>

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
          <div className="stat-label">Suspended</div>
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

      <div className="admin-search-row">
        <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" className="admin-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
            ×
          </button>
        )}
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
        <button className="admin-btn-primary admin-add-user-btn" onClick={openAddUser}>
          + Add User
        </button>
      </div>

      {error && <div className="admin-error admin-error-block">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Joined</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => (
              <tr key={u.uid}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-name">{u.name}</div>
                    <div className="admin-user-email">{u.email}</div>
                  </div>
                </td>
                <td>{formatJoined(u.createdAt)}</td>
                <td>
                  <select
                    className={`tier-select${accessValue(u) === 'vip' ? ' tier-vip' : ''}${accessValue(u) === 'admin' || accessValue(u) === 'dev' ? ' role-admin' : ''}${accessValue(u) === 'member' ? ' role-member' : ''}`}
                    value={accessValue(u)}
                    disabled={updatingUid === u.uid || u.status !== 'approved'}
                    title={u.status !== 'approved' ? 'Approve this user first to change their role' : undefined}
                    onChange={(e) => handleAccessChange(u.uid, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="vip">VIP</option>
                    <option value="admin">Admin</option>
                    <option value="dev">Dev</option>
                  </select>
                </td>
                <td>
                  {/* No real AI Trading subscription data exists yet (see
                      AITradingPage.jsx) -- every account just shows "Free"
                      here until real plan purchases are wired up. */}
                  <span className="plan-badge">Free</span>
                </td>
                <td>
                  <span className={`status-pill status-${u.status}`}>{STATUS_LABELS[u.status] ?? u.status}</span>
                </td>
                <td>
                  <div className="admin-actions">
                    {u.status === 'pending' && (
                      <button
                        className="action-btn approve"
                        disabled={updatingUid === u.uid}
                        onClick={() => handleStatusChange(u.uid, 'approved')}
                      >
                        Approve
                      </button>
                    )}
                    {u.status === 'approved' && (
                      <button
                        className="action-btn reject"
                        disabled={updatingUid === u.uid}
                        onClick={() => handleStatusChange(u.uid, 'rejected')}
                      >
                        Suspend
                      </button>
                    )}
                    {u.status === 'rejected' && (
                      <button
                        className="action-btn approve"
                        disabled={updatingUid === u.uid}
                        onClick={() => handleStatusChange(u.uid, 'approved')}
                      >
                        Reinstate
                      </button>
                    )}
                    <button
                      className="row-menu-trigger"
                      disabled={updatingUid === u.uid}
                      onClick={(e) => openActionsMenu(e, u.uid)}
                    >
                      ⋯
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No users in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {/* ===== INSTITUTIONAL SIGNALS & AI GENERATOR SECTION ===== */}
      <div className="admin-signals-section" id="admin-signals-section">
        <div className="admin-section-bar">
          <div className="admin-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--brand2)', fontSize: '18px' }}>⚡</span>
            <span>Institutional Signals & AI Generator</span>
          </div>
          <div className="signals-live-badge">
            <span className="status-live-pulse" />
            <span>LIVE TERMINAL FEED ({signals.filter((s) => s.status === 'active').length} Active)</span>
          </div>
        </div>
        <p className="admin-section-sub">
          Generate high-probability ICT Smart Money Concept (SMC) setups with Google Gemini AI or craft them manually,
          review the confluence, and drop them directly to the VIP Member Terminal with one click.
        </p>

        {signalError && <div className="admin-error admin-error-block">{signalError}</div>}
        {signalSuccess && (
          <div className="admin-success-block">
            {signalSuccess}
          </div>
        )}

        {/* 2-COLUMN WORKBENCH */}
        <div className="signal-workbench-grid">
          {/* LEFT: GEMINI AI GENERATOR */}
          <div className="signal-box ai-generator-box">
            <div className="signal-box-header">
              <div className="signal-box-title">
                <span className="sparkle-icon">✨</span> Step 1: AI Setup Generator
              </div>
              <span className="gemini-tag">Gemini Flash</span>
            </div>

            <div className="signal-form-group">
              <label className="signal-form-label">SELECT ASSET</label>
              <div className="asset-pills">
                {['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'US30'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`asset-pill${aiPair === p ? ' active' : ''}`}
                    onClick={() => {
                      setAiPair(p);
                      updateDraftField('pair', p);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="signal-form-group">
              <label className="signal-form-label">
                MARKET CONTEXT / OBSERVATIONS (OPTIONAL)
              </label>
              <textarea
                className="signal-textarea"
                placeholder="e.g. Gold at 2685 swept Asian low (SSL), 5m bullish displacement with FVG, expecting continuation towards Asian high 2698 during London Killzone..."
                rows={3}
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
              />
            </div>

            <div className="signal-form-group">
              <label className="signal-form-label">CHART SCREENSHOT (OPTIONAL)</label>
              {aiImagePreview ? (
                <div className="chart-preview-wrap">
                  <img src={aiImagePreview} alt="Chart preview" className="chart-preview-img" />
                  <button
                    type="button"
                    className="chart-remove-btn"
                    onClick={handleRemoveImage}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              ) : (
                <label className="chart-upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="chart-dropzone-content">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Click or drop TradingView screenshot here</span>
                    <span className="dropzone-sub">Gemini analyzes price action, liquidity sweeps & FVGs</span>
                  </div>
                </label>
              )}
            </div>

            <button
              type="button"
              className="admin-btn-ai-generate"
              onClick={handleAiGenerate}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <>
                  <span className="spinner-ai" />
                  <span>Gemini Analyzing SMC Structure...</span>
                </>
              ) : (
                <>
                  <span>⚡ Generate ICT Setup with Gemini</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT: REVIEW & DROP TO WEBSITE */}
          <div className="signal-box review-drop-box" id="signal-review-box">
            <div className="signal-box-header">
              <div className="signal-box-title">
                <span>🎯</span> Step 2: Review & Drop to Website
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {signalDraft.entry ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    ✨ Auto-filled by AI
                  </span>
                ) : null}
                <span className="drop-target-tag">VIP Member Terminal</span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', marginBottom: '14px', lineHeight: '1.5' }}>
              Auto-filled by Gemini AI. You have 100% full control to review or modify any price levels and notes below before publishing live to VIP members.
            </div>

            <form onSubmit={handlePublishSignal}>
              <div className="signal-fields-row">
                <div className="signal-field-col">
                  <label className="signal-form-label">PAIR</label>
                  <input
                    type="text"
                    className="signal-input"
                    value={signalDraft.pair}
                    onChange={(e) => updateDraftField('pair', e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="signal-field-col">
                  <label className="signal-form-label">DIRECTION</label>
                  <div className="dir-toggle-group">
                    <button
                      type="button"
                      className={`dir-toggle-btn buy${signalDraft.direction === 'buy' ? ' active' : ''}`}
                      onClick={() => updateDraftField('direction', 'buy')}
                    >
                      ▲ BUY
                    </button>
                    <button
                      type="button"
                      className={`dir-toggle-btn sell${signalDraft.direction === 'sell' ? ' active' : ''}`}
                      onClick={() => updateDraftField('direction', 'sell')}
                    >
                      ▼ SELL
                    </button>
                  </div>
                </div>
              </div>

              <div className="signal-fields-triple">
                <div className="signal-field-col">
                  <label className="signal-form-label">ENTRY LEVEL</label>
                  <input
                    type="number"
                    step="any"
                    className="signal-input highlight-entry"
                    placeholder="e.g. 2685.50"
                    value={signalDraft.entry}
                    onChange={(e) => updateDraftField('entry', e.target.value)}
                    required
                  />
                </div>
                <div className="signal-field-col">
                  <label className="signal-form-label">STOP LOSS (SL)</label>
                  <input
                    type="number"
                    step="any"
                    className="signal-input highlight-sl"
                    placeholder="e.g. 2679.00"
                    value={signalDraft.sl}
                    onChange={(e) => updateDraftField('sl', e.target.value)}
                    required
                  />
                </div>
                <div className="signal-field-col">
                  <label className="signal-form-label">TAKE PROFIT (TP)</label>
                  <input
                    type="number"
                    step="any"
                    className="signal-input highlight-tp"
                    placeholder="e.g. 2698.50"
                    value={signalDraft.tp}
                    onChange={(e) => updateDraftField('tp', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="signal-fields-row">
                <div className="signal-field-col">
                  <label className="signal-form-label">RISK : REWARD (R:R)</label>
                  <input
                    type="text"
                    className="signal-input"
                    value={signalDraft.rr ? `${signalDraft.rr}R` : '2.0R'}
                    onChange={(e) => updateDraftField('rr', e.target.value.replace('R', ''))}
                  />
                </div>
                <div className="signal-field-col">
                  <label className="signal-form-label">SESSION</label>
                  <select
                    className="signal-select"
                    value={signalDraft.session}
                    onChange={(e) => updateDraftField('session', e.target.value)}
                  >
                    <option value="London Killzone">London Killzone (14:00-17:00 GMT+7)</option>
                    <option value="New York AM Killzone">New York AM Killzone (19:00-22:00 GMT+7)</option>
                    <option value="Asian Session">Asian Session (07:00-13:00 GMT+7)</option>
                    <option value="London Close">London Close (22:00-00:00 GMT+7)</option>
                  </select>
                </div>
              </div>

              <div className="signal-form-group">
                <label className="signal-form-label">INSTITUTIONAL SMC RATIONALE</label>
                <textarea
                  className="signal-textarea"
                  rows={3}
                  placeholder="Explain why this setup works: Liquidity sweep, FVG, OTE, Order Block confluence..."
                  value={signalDraft.reason}
                  onChange={(e) => updateDraftField('reason', e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="admin-btn-drop-signal"
                disabled={isDroppingSignal}
              >
                {isDroppingSignal ? 'Dropping to Website...' : '🚀 Drop Signal to Website (Live)'}
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM: LIVE SIGNALS LIST ON WEBSITE */}
        <div className="live-signals-manager">
          <div className="live-signals-head">
            <div className="live-signals-title">
              📡 Published Signals on Website ({signals.length})
            </div>
            <div className="live-signals-sub">
              Manage live setups, update trade outcomes (Take Profit / Stop Loss), or remove expired signals.
            </div>
          </div>

          {signalsLoading ? (
            <div className="admin-empty">Loading live signals...</div>
          ) : signals.length === 0 ? (
            <div className="admin-empty">No signals published yet. Use the generator above to drop your first signal!</div>
          ) : (
            <div className="admin-signals-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Direction</th>
                    <th>Entry</th>
                    <th>SL</th>
                    <th>TP</th>
                    <th>R:R</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.pair}</strong>
                      </td>
                      <td>
                        <span className={`signal-dir-pill ${s.direction}`}>
                          {s.direction === 'buy' ? '▲ BUY' : '▼ SELL'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.entry}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--down)' }}>{s.sl}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--up)' }}>{s.tp}</td>
                      <td>{s.rr}R</td>
                      <td style={{ fontSize: '12px', color: 'var(--mute)' }}>{s.session || '—'}</td>
                      <td>
                        <div className="status-selector-row">
                          <button
                            type="button"
                            className={`status-btn-pill active${s.status === 'active' ? ' current' : ''}`}
                            onClick={() => handleUpdateSignalStatus(s.id, 'active')}
                            disabled={updatingSignalId === s.id}
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            className={`status-btn-pill tp${s.status === 'tp' ? ' current' : ''}`}
                            onClick={() => handleUpdateSignalStatus(s.id, 'tp')}
                            disabled={updatingSignalId === s.id}
                          >
                            🎯 Hit TP
                          </button>
                          <button
                            type="button"
                            className={`status-btn-pill sl${s.status === 'sl' ? ' current' : ''}`}
                            onClick={() => handleUpdateSignalStatus(s.id, 'sl')}
                            disabled={updatingSignalId === s.id}
                          >
                            ❌ Hit SL
                          </button>
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--mute)' }}>
                        {s.minutesAgo != null ? `${s.minutesAgo}m ago` : 'Just now'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="action-btn reject"
                          onClick={() => handleDeleteSignal(s.id, s.pair)}
                          title="Delete Signal"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isDev && (
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
      )}

      {actionsMenu && (() => {
        const u = users.find((x) => x.uid === actionsMenu.uid);
        if (!u) return null;
        return (
          <>
            <div className="row-menu-overlay" onClick={() => setActionsMenu(null)} />
            <div className="row-menu" style={{ top: actionsMenu.top, right: actionsMenu.right }}>
              <button
                className="row-menu-item"
                onClick={() => {
                  openPermissions(u);
                  setActionsMenu(null);
                }}
              >
                Permissions{Array.isArray(u.allowedLessons) ? ` (${u.allowedLessons.length})` : ''}
              </button>
              {u.status !== 'pending' && (
                <button
                  className="row-menu-item"
                  onClick={() => {
                    handleStatusChange(u.uid, 'pending');
                    setActionsMenu(null);
                  }}
                >
                  Set pending
                </button>
              )}
              <button
                className="row-menu-item row-menu-danger"
                onClick={() => {
                  setActionsMenu(null);
                  handleDeleteUser(u);
                }}
              >
                Delete user
              </button>
            </div>
          </>
        );
      })()}

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

            <div className="perm-section">
              <div className="perm-section-title">Advanced</div>
              {advancedLessons.map((l, i) => (
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

      {showAddUser && (
        <div className="modal-overlay" onClick={() => !addUserSaving && setShowAddUser(false)}>
          <div className="perm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="perm-modal-header">
              <div>
                <div className="perm-modal-title">Add User</div>
                <div className="perm-modal-sub">Creates the account directly (email pre-verified).</div>
              </div>
            </div>

            <form onSubmit={handleCreateUser}>
              <label className="auth-label" htmlFor="au-name" style={{ textAlign: 'left' }}>
                Name
              </label>
              <input
                id="au-name"
                type="text"
                className="auth-input"
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <label className="auth-label" htmlFor="au-email" style={{ textAlign: 'left' }}>
                Email
              </label>
              <input
                id="au-email"
                type="email"
                className="auth-input"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                required
              />

              <label className="auth-label" htmlFor="au-password" style={{ textAlign: 'left' }}>
                Password
              </label>
              <input
                id="au-password"
                type="text"
                className="auth-input"
                placeholder="At least 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                required
              />

              <div className="admin-add-user-row">
                <div>
                  <label className="auth-label" htmlFor="au-role" style={{ textAlign: 'left' }}>
                    Role
                  </label>
                  <select
                    id="au-role"
                    className="tier-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="dev">Dev</option>
                  </select>
                </div>
                <div>
                  <label className="auth-label" htmlFor="au-status" style={{ textAlign: 'left' }}>
                    Status
                  </label>
                  <select
                    id="au-status"
                    className="tier-select"
                    value={newUser.status}
                    onChange={(e) => setNewUser((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="auth-label" htmlFor="au-tier" style={{ textAlign: 'left' }}>
                    Tier
                  </label>
                  <select
                    id="au-tier"
                    className={`tier-select${newUser.tier === 'vip' ? ' tier-vip' : ''}`}
                    value={newUser.tier}
                    disabled={newUser.status !== 'approved'}
                    title={newUser.status !== 'approved' ? 'Approve this user first to set their tier' : undefined}
                    onChange={(e) => setNewUser((p) => ({ ...p, tier: e.target.value }))}
                  >
                    <option value="member">Member</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              {addUserError && <div className="auth-error">{addUserError}</div>}

              <div className="perm-modal-actions">
                <button
                  type="button"
                  className="action-btn reset"
                  onClick={() => setShowAddUser(false)}
                  disabled={addUserSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={addUserSaving}>
                  {addUserSaving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="perm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="perm-modal-header">
              <div>
                <div className="perm-modal-title">User Feedback</div>
                <div className="perm-modal-sub">Ratings and comments left after finishing a lesson.</div>
              </div>
            </div>

            {feedbackError && <div className="admin-error admin-error-block">{feedbackError}</div>}

            <div className="fbadm-list">
              {feedback.map((f) => (
                <div key={f.id} className="fbadm-row">
                  <div className="fbadm-row-head">
                    <div>
                      <div className="fbadm-user">{f.name || f.email || 'Unknown user'}</div>
                      <div className="fbadm-lesson">{f.lessonTitle || 'General website feedback'}</div>
                    </div>
                    <div className="fbadm-stars-display" aria-label={`${f.rating} out of 5 stars`}>
                      {'★'.repeat(f.rating || 0)}
                      {'☆'.repeat(5 - (f.rating || 0))}
                    </div>
                  </div>
                  {f.comment && <div className="fbadm-comment">{f.comment}</div>}
                  <div className="fbadm-date">{formatDate(f.createdAt)}</div>
                </div>
              ))}
              {!feedbackLoading && feedback.length === 0 && (
                <div className="admin-empty">No feedback yet.</div>
              )}
            </div>

            <div className="perm-modal-actions">
              <button className="action-btn reset" onClick={loadFeedback} disabled={feedbackLoading}>
                {feedbackLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button className="admin-btn-primary" onClick={() => setShowFeedback(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
