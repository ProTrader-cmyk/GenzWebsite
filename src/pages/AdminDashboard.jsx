import { useEffect, useMemo, useState } from 'react';
import {
  fetchAllUsers,
  setUserStatus,
  setUserAccess,
  setUserPlan,
  setUserRole,
  setUserLessonAccess,
  createUserAsAdmin,
  deleteUserAsAdmin,
  getUserPlan,
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
import {
  fetchLivePrice,
  evaluateSignalOutcome,
  calcTradeProgress,
  subscribeLiveTicks,
  formatSpotPrice,
} from '../services/marketPriceService.js';
import { broadcastSignalNotification } from '../services/pushNotificationService.js';
import GoldChart from '../components/GoldChart.jsx';
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

function formatSignalAge(mins) {
  if (mins == null) return 'Just now';
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m ago` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h ago` : `${days}d ago`;
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
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', status: 'pending', tier: 'member', plan: 'free' });
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [adminSection, setAdminSection] = useState('members'); // 'members' | 'signals' | 'configure'
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
  const [signalTab, setSignalTab] = useState('all'); // 'all' | 'active' | 'tp' | 'sl'

  const signalCounts = useMemo(() => {
    const total = signals.length;
    const active = signals.filter((s) => s.status === 'active').length;
    const tp = signals.filter((s) => s.status === 'tp').length;
    const sl = signals.filter((s) => s.status === 'sl').length;
    return { total, active, tp, sl };
  }, [signals]);

  const filteredSignals = useMemo(() => {
    if (signalTab === 'all') return signals;
    return signals.filter((s) => s.status === signalTab);
  }, [signals, signalTab]);

  // Live Market Prices & Automated TP/SL State
  const [livePrices, setLivePrices] = useState({});
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(true);
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);

  // AI Generator Form State (Option B Dual-Timeframe)
  const [aiPair, setAiPair] = useState('XAUUSD');
  const [aiNotes, setAiNotes] = useState('');
  const [aiHtfImage, setAiHtfImage] = useState(null); // Chart 1: HTF 1H/4H
  const [aiLtfImage, setAiLtfImage] = useState(null); // Chart 2: LTF 15m/5m
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showChartUpload, setShowChartUpload] = useState(false);
  const [showAdminChart, setShowAdminChart] = useState(true);

  // Draft Signal Form State
  const [signalDraft, setSignalDraft] = useState({
    pair: 'XAUUSD',
    direction: 'buy',
    entry: '',
    sl: '',
    tp: '',
    rr: '1:2',
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
            const ratio = Math.round((reward / risk) * 10) / 10;
            next.rr = ratio === 2 ? '1:2' : `1:${ratio}`;
          }
        }
      }
      return next;
    });
  }

  function processImageFile(file, slot = 'htf') {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setSignalError('Only screenshot images (PNG, JPG, WebP) are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSignalError('Chart screenshot must be smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setShowChartUpload(true);
      if (slot === 'htf') {
        setAiHtfImage(dataUrl);
        setSignalSuccess('📋 Pasted screenshot into Chart 1: 1H / 4H HTF (Bias)!');
      } else {
        setAiLtfImage(dataUrl);
        setSignalSuccess('📋 Pasted screenshot into Chart 2: 15m / 5m LTF (Entry)!');
      }
      setTimeout(() => setSignalSuccess(''), 3500);
    };
    reader.readAsDataURL(file);
  }

  function extractImageFromClipboard(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return null;
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          return items[i].getAsFile();
        }
      }
    }
    const files = clipboardData.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type && files[i].type.startsWith('image/')) {
          return files[i];
        }
      }
    }
    return null;
  }

  function handleSlotPaste(e, slot) {
    const imageFile = extractImageFromClipboard(e);
    if (imageFile) {
      e.preventDefault();
      e.stopPropagation();
      processImageFile(imageFile, slot);
    }
  }

  function handleAiBoxPaste(e) {
    const imageFile = extractImageFromClipboard(e);
    if (imageFile) {
      e.preventDefault();
      // If Chart 1 is empty, assign to Chart 1; otherwise assign to Chart 2
      const targetSlot = !aiHtfImage ? 'htf' : 'ltf';
      processImageFile(imageFile, targetSlot);
    }
  }

  function handleSlotDrop(e, slot) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file, slot);
    }
  }

  function handleHtfImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file, 'htf');
  }

  function handleLtfImageUpload(e) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file, 'ltf');
  }

  async function handleAiGenerate() {
    setSignalError('');
    setSignalSuccess('');
    setAiGenerating(true);
    try {
      let currentSpot = livePrices[aiPair];
      if (!currentSpot) {
        currentSpot = await fetchLivePrice(aiPair);
        if (currentSpot) {
          setLivePrices((prev) => ({ ...prev, [aiPair]: currentSpot }));
        }
      }

      const base64Images = [aiHtfImage, aiLtfImage].filter(Boolean);
      const res = await generateAiSignal({
        notes: aiNotes,
        pair: aiPair,
        base64Images,
        currentPrice: currentSpot,
      });

      setSignalDraft({
        pair: res.pair || aiPair || 'XAUUSD',
        direction: res.direction || 'buy',
        entry: res.entry ? String(res.entry) : '',
        sl: res.sl ? String(res.sl) : '',
        tp: res.tp ? String(res.tp) : '',
        rr: '1:2',
        session: res.session || 'London Killzone',
        reason: res.reason || '',
        status: 'active',
      });
      setSignalSuccess('✨ Pip analyzed live market price & setup and auto-filled the parameters! Review or edit levels below before publishing.');
      setTimeout(() => {
        document.getElementById('signal-review-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      console.error('Pip AI Signal generation error:', err);
      setSignalError(err.message || 'Failed to generate signal with Pip AI.');
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

      // 🔔 Push notification — broadcast to all subscribed member clients
      broadcastSignalNotification(signalDraft).catch((err) =>
        console.warn('Notification broadcast failed (non-blocking):', err)
      );

      setSignalSuccess(`🚀 Dropped ${signalDraft.pair} ${signalDraft.direction.toUpperCase()} signal live to website!`);
      setSignalDraft((prev) => ({
        ...prev,
        entry: '',
        sl: '',
        tp: '',
        reason: '',
      }));
      setAiNotes('');
      setAiHtfImage(null);
      setAiLtfImage(null);
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

  async function runPriceCheck(signalsList = signals) {
    if (isCheckingPrices) return;
    setIsCheckingPrices(true);
    const activeList = signalsList.filter((s) => s.status === 'active');
    const newPrices = { ...livePrices };

    try {
      const pairs = Array.from(new Set(['XAUUSD', ...activeList.map((s) => s.pair || 'XAUUSD')]));
      for (const p of pairs) {
        const price = await fetchLivePrice(p);
        if (price) newPrices[p] = price;
      }
      setLivePrices(newPrices);
      setLastCheckedTime(new Date().toLocaleTimeString());

      if (autoTrackingEnabled) {
        for (const s of activeList) {
          const currentPrice = newPrices[s.pair || 'XAUUSD'];
          if (!currentPrice) continue;

          const outcome = evaluateSignalOutcome(s, currentPrice);
          if (outcome === 'tp' || outcome === 'sl') {
            await updateSignalStatus(s.id, outcome);
            const isTp = outcome === 'tp';
            setSignalSuccess(
              `${isTp ? '🎯 [AUTO-TRIGGER]' : '❌ [AUTO-TRIGGER]'} ${s.pair} touched ${isTp ? 'Take Profit' : 'Stop Loss'} at $${currentPrice}! Signal status updated live on VIP terminal.`
            );
          }
        }
      }
    } catch (err) {
      console.warn('Auto price check error:', err);
    } finally {
      setIsCheckingPrices(false);
    }
  }

  useEffect(() => {
    runPriceCheck(signals);
    const pairs = Array.from(new Set(['XAUUSD', ...signals.map((s) => s.pair || 'XAUUSD')]));
    const unsubTicks = subscribeLiveTicks(pairs, (incoming) => {
      setLivePrices((prev) => ({ ...prev, ...incoming }));
      setLastCheckedTime(new Date().toLocaleTimeString());
      if (autoTrackingEnabled) {
        const activeList = signals.filter((s) => s.status === 'active');
        for (const s of activeList) {
          const currentPrice = incoming[s.pair || 'XAUUSD'];
          if (!currentPrice) continue;
          const outcome = evaluateSignalOutcome(s, currentPrice);
          if (outcome === 'tp' || outcome === 'sl') {
            updateSignalStatus(s.id, outcome);
            const isTp = outcome === 'tp';
            setSignalSuccess(
              `${isTp ? '🎯 [AUTO-TRIGGER]' : '❌ [AUTO-TRIGGER]'} ${s.pair} touched ${isTp ? 'Take Profit' : 'Stop Loss'} at $${currentPrice}! Signal status updated live on VIP terminal.`
            );
          }
        }
      }
    });

    const interval = setInterval(() => {
      runPriceCheck(signals);
    }, 10000);
    return () => {
      clearInterval(interval);
      unsubTicks();
    };
  }, [signals, autoTrackingEnabled]);

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

  function roleValue(u) {
    if (u.role === 'admin') return 'admin';
    if (u.role === 'dev') return 'dev';
    return 'user';
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

  function userPlan(u) {
    return getUserPlan(u);
  }

  async function handlePlanChange(uid, plan) {
    const tier = plan === 'free' ? 'member' : plan;
    setUpdatingUid(uid);
    try {
      await setUserPlan(uid, plan);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, plan, tier } : u)));
    } catch (err) {
      console.error('Plan update failed:', err);
      setError('Failed to update user plan. Check Firestore rules / your admin access.');
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
    setNewUser({ name: '', email: '', password: '', role: 'user', status: 'pending', tier: 'member', plan: 'free' });
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
          <button className="admin-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* 3 TOP NAVIGATION BUTTONS: Member, Signal, Configure */}
      <div className="admin-nav-bar">
        <button
          type="button"
          className={`admin-nav-tab-btn${adminSection === 'members' ? ' active' : ''}`}
          onClick={() => setAdminSection('members')}
        >
          <span className="admin-nav-tab-icon">👥</span>
          <span className="admin-nav-tab-text">Member</span>
          <span className="admin-nav-tab-pill">{users.length}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab-btn${adminSection === 'signals' ? ' active' : ''}`}
          onClick={() => setAdminSection('signals')}
        >
          <span className="admin-nav-tab-icon">⚡</span>
          <span className="admin-nav-tab-text">Signal</span>
          <span className="admin-nav-tab-pill green-pill">
            {signals.filter((s) => s.status === 'active').length} Active
          </span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab-btn${adminSection === 'configure' ? ' active' : ''}`}
          onClick={() => setAdminSection('configure')}
        >
          <span className="admin-nav-tab-icon">⚙️</span>
          <span className="admin-nav-tab-text">Configure</span>
          {feedback.length > 0 && (
            <span className="admin-nav-tab-pill blue-pill">{feedback.length}</span>
          )}
        </button>
      </div>

      {/* ===== MEMBERS SECTION ===== */}
      {adminSection === 'members' && (
        <div className="admin-members-section">
          <div className="admin-section-bar">
            <div className="admin-section-title" style={{ margin: 0 }}>
              Members Management
            </div>
            <button type="button" className="admin-btn-primary" onClick={openAddUser}>
              + Add User
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
                    className={`tier-select${roleValue(u) === 'admin' || roleValue(u) === 'dev' ? ' role-admin' : ' role-member'}`}
                    value={roleValue(u)}
                    disabled={updatingUid === u.uid || u.status !== 'approved'}
                    title={u.status !== 'approved' ? 'Approve this user first to change their role' : undefined}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="dev">Dev</option>
                  </select>
                </td>
                <td>
                  <select
                    className={`plan-select plan-${userPlan(u)}`}
                    value={userPlan(u)}
                    disabled={updatingUid === u.uid || u.status !== 'approved'}
                    title={u.status !== 'approved' ? 'Approve this user first to change their plan' : 'Change user subscription plan'}
                    onChange={(e) => handlePlanChange(u.uid, e.target.value)}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter VIP</option>
                    <option value="pro">Pro VIP</option>
                    <option value="elite">Elite VIP</option>
                  </select>
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
      {adminSection === 'signals' && (
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
          Generate high-probability ICT Smart Money Concept (SMC) setups with Pip AI or craft them manually,
          review the confluence, and drop them directly to the VIP Member Terminal with one click.
        </p>

        {signalError && <div className="admin-error admin-error-block">{signalError}</div>}
        {signalSuccess && (
          <div className="admin-success-block">
            {signalSuccess}
          </div>
        )}

        {/* LIVE INTERACTIVE OANDA CHART FOR SIGNAL ANALYSIS & SCREENSHOTS */}
        <div className="terminal-chart-section">
          <div className="terminal-chart-header">
            <div className="terminal-chart-title-wrap">
              <div className="terminal-chart-icon">📈</div>
              <div>
                <div className="terminal-chart-title">
                  <span>OANDA Multi-Asset Live Chart</span>
                  <span className="live-chart-feed-badge">
                    <span className="status-live-pulse" style={{ width: '6px', height: '6px' }} />
                    Live OANDA Feed
                  </span>
                  {livePrices['XAUUSD'] && (
                    <span className="live-chart-price-pill">
                      Gold Spot: ${formatSpotPrice('XAUUSD', livePrices['XAUUSD'])}
                    </span>
                  )}
                </div>
                <div className="terminal-chart-sub">
                  Analyze real-time ICT market structure (1H bias / 15m entry) or capture screenshots to feed into Step 1 below.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="terminal-chart-toggle-btn"
              onClick={() => setShowAdminChart((v) => !v)}
            >
              {showAdminChart ? 'Hide Chart ▴' : 'Show Chart ▾'}
            </button>
          </div>
          {showAdminChart && (
            <div className="terminal-chart-body">
              <GoldChart initialSymbol="gold" defaultTimeframe="1" />
            </div>
          )}
        </div>

        {/* 2-COLUMN WORKBENCH */}
        <div className="signal-workbench-grid">
          {/* LEFT: PIP AI GENERATOR (WITH SCREENSHOT CLIPBOARD PASTE SUPPORT) */}
          <div
            className="signal-box ai-generator-box"
            onPaste={handleAiBoxPaste}
            tabIndex={0}
            title="Tip: You can paste screenshots directly here using Ctrl + V!"
          >
            <div className="signal-box-header">
              <div className="signal-box-title">
                <span className="sparkle-icon">✨</span> Step 1: AI Setup Generator
              </div>
              <span className="gemini-tag" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.2))', color: '#DDD6FE', border: '1px solid rgba(139, 92, 246, 0.45)' }}>
                🤖 Pip AI (Live Feed)
              </span>
            </div>

            <div className="signal-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="signal-form-label" style={{ margin: 0 }}>SELECT ASSET</label>
                {livePrices[aiPair] && (
                  <div className="live-spot-sync-badge" title="Live real-time spot price synced from TradingView OANDA feed">
                    <span className="spot-sync-pulse" />
                    <span>LIVE SPOT:</span>
                    <strong>${formatSpotPrice(aiPair, livePrices[aiPair])}</strong>
                  </div>
                )}
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="signal-form-label" style={{ margin: 0 }}>
                  MARKET CONTEXT / OBSERVATIONS (OPTIONAL)
                </label>
                <span style={{ fontSize: '10.5px', color: 'var(--mute)' }}>ICT Confluence Notes</span>
              </div>
              <textarea
                className="signal-textarea"
                placeholder="e.g. Swept session low into bullish FVG, 15m MSS displacement confirmed, targeting liquidity pools..."
                rows={3}
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                onPaste={handleAiBoxPaste}
              />
              <div className="quick-bias-tags">
                {['Swept Asian Low', 'London Judas Swing', '15m Bullish FVG', 'Bearish Order Block', 'Targeting Equal Highs'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="quick-bias-chip"
                    onClick={() => setAiNotes((prev) => (prev ? `${prev}, ${tag}` : tag))}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* EXPANDABLE CHART SCREENSHOT ATTACHMENT */}
            <div className="chart-upload-expandable-box">
              <div
                className="chart-toggle-summary-bar"
                onClick={() => setShowChartUpload((v) => !v)}
                role="button"
                tabIndex={0}
              >
                <div className="chart-summary-left">
                  <span className="chart-camera-icon">📸</span>
                  <div>
                    <div className="chart-summary-title">Attach Chart Screenshots (Optional)</div>
                    <div className="chart-summary-sub">
                      {aiHtfImage || aiLtfImage
                        ? `${[aiHtfImage && 'Chart 1 (HTF)', aiLtfImage && 'Chart 2 (LTF)'].filter(Boolean).join(' + ')} attached`
                        : 'Ctrl + V to paste or click to expand upload slots'}
                    </div>
                  </div>
                </div>
                <div className="chart-summary-right">
                  <span className="chart-paste-pill">📋 Paste (Ctrl+V)</span>
                  <span className="chart-toggle-arrow">{showChartUpload || aiHtfImage || aiLtfImage ? '▲' : '▼'}</span>
                </div>
              </div>

              {(showChartUpload || aiHtfImage || aiLtfImage) && (
                <div className="dual-charts-grid" style={{ marginTop: '12px' }}>
                  {/* CHART 1: HTF 1H/4H */}
                  <div
                    className="chart-upload-col"
                    onPaste={(e) => handleSlotPaste(e, 'htf')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleSlotDrop(e, 'htf')}
                    tabIndex={0}
                  >
                    <div className="chart-slot-label">
                      <span>📊</span> Chart 1: 1H / 4H HTF (Bias)
                    </div>
                    {aiHtfImage ? (
                      <div className="chart-preview-wrap">
                        <img src={aiHtfImage} alt="HTF Chart" className="chart-preview-img" />
                        <button
                          type="button"
                          className="chart-remove-btn"
                          onClick={() => setAiHtfImage(null)}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <label className="chart-upload-dropzone" title="Click to browse or press Ctrl+V to paste screenshot">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHtfImageUpload}
                          style={{ display: 'none' }}
                        />
                        <div className="chart-dropzone-content">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span>Drop 1H/4H Chart</span>
                          <span className="dropzone-sub">Higher Timeframe Bias</span>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* CHART 2: LTF 15m/5m */}
                  <div
                    className="chart-upload-col"
                    onPaste={(e) => handleSlotPaste(e, 'ltf')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleSlotDrop(e, 'ltf')}
                    tabIndex={0}
                  >
                    <div className="chart-slot-label">
                      <span>⚡</span> Chart 2: 15m / 5m LTF (Entry)
                    </div>
                    {aiLtfImage ? (
                      <div className="chart-preview-wrap">
                        <img src={aiLtfImage} alt="LTF Chart" className="chart-preview-img" />
                        <button
                          type="button"
                          className="chart-remove-btn"
                          onClick={() => setAiLtfImage(null)}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <label className="chart-upload-dropzone" title="Click to browse or press Ctrl+V to paste screenshot">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLtfImageUpload}
                          style={{ display: 'none' }}
                        />
                        <div className="chart-dropzone-content">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span>Drop 15m/5m Chart</span>
                          <span className="dropzone-sub">Session Sweep & FVG</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
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
                  <span>Pip AI Analyzing Market Price & Structure...</span>
                </>
              ) : (
                <>
                  <span>⚡ Generate High-Probability Setup with Pip</span>
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
                    ✨ Auto-filled by Pip
                  </span>
                ) : null}
                <span className="drop-target-tag">VIP Member Terminal</span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', marginBottom: '14px', lineHeight: '1.5' }}>
              Auto-filled by Pip AI. You have 100% full control to review or modify any price levels and notes below before publishing live to VIP members.
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
                    placeholder={livePrices[signalDraft.pair || aiPair] ? `e.g. ${formatSpotPrice(signalDraft.pair || aiPair, livePrices[signalDraft.pair || aiPair])}` : 'e.g. Entry'}
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
                    placeholder="e.g. Stop Loss"
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
                    placeholder="e.g. Take Profit"
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
                    value={signalDraft.rr ? (signalDraft.rr.includes(':') ? signalDraft.rr : `1:${signalDraft.rr}`) : '1:2'}
                    onChange={(e) => updateDraftField('rr', e.target.value)}
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

              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <button
                  type="submit"
                  className="admin-btn-drop-signal"
                  disabled={isDroppingSignal}
                  style={{ flex: 1 }}
                >
                  {isDroppingSignal ? 'Dropping to Website...' : '🚀 Drop Signal to Website (Live)'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* BOTTOM: LIVE SIGNALS LIST ON WEBSITE */}
        <div className="live-signals-manager">
          <div className="live-signals-head">
            <div className="live-signals-head-left">
              <div className="live-signals-icon-bubble">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                  <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                </svg>
              </div>
              <div>
                <div className="live-signals-title">
                  <span>Published Signals on Website</span>
                  <span className="live-signals-count-pill">{signals.length}</span>
                </div>
                <div className="live-signals-sub">
                  Live trade setups synced with the member dashboard. Track real-time market movements, auto-trigger outcomes, and manage active orders.
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="live-signals-filter-tabs">
              <button
                type="button"
                className={`sig-tab-btn ${signalTab === 'all' ? 'active' : ''}`}
                onClick={() => setSignalTab('all')}
              >
                All ({signals.length})
              </button>
              <button
                type="button"
                className={`sig-tab-btn active-tab ${signalTab === 'active' ? 'active' : ''}`}
                onClick={() => setSignalTab('active')}
              >
                <span className="sig-tab-dot active" />
                Active ({signalCounts.active})
              </button>
              <button
                type="button"
                className={`sig-tab-btn tp-tab ${signalTab === 'tp' ? 'active' : ''}`}
                onClick={() => setSignalTab('tp')}
              >
                <span className="sig-tab-dot tp" />
                Hit TP ({signalCounts.tp})
              </button>
              <button
                type="button"
                className={`sig-tab-btn sl-tab ${signalTab === 'sl' ? 'active' : ''}`}
                onClick={() => setSignalTab('sl')}
              >
                <span className="sig-tab-dot sl" />
                Hit SL ({signalCounts.sl})
              </button>
            </div>
          </div>

          {/* LIVE PRICE TRACKER & AUTO EVALUATOR BAR */}
          <div className="price-tracker-bar">
            <div className="tracker-bar-left">
              <div className="tracker-pulse-badge">
                <span className="pulse-dot" />
                <span className="pulse-text">LIVE MARKET FEED</span>
              </div>
              <div className="tracker-rates-row">
                {Object.entries(livePrices).map(([pair, price]) => (
                  <div key={pair} className="tracker-price-pill">
                    <span className="tracker-pair-tag">{pair}:</span>
                    <strong className="tracker-price-num">${price}</strong>
                  </div>
                ))}
              </div>
              {lastCheckedTime && (
                <div className="tracker-last-sync">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Synced {lastCheckedTime}</span>
                </div>
              )}
            </div>

            <div className="tracker-bar-right">
              <div className="auto-toggle-box">
                <span className="auto-toggle-label">Auto-Trigger TP/SL</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoTrackingEnabled}
                  className={`modern-toggle-switch ${autoTrackingEnabled ? 'is-active' : ''}`}
                  onClick={() => setAutoTrackingEnabled((prev) => !prev)}
                  title="Auto-detect when live price crosses Take Profit or Stop Loss"
                >
                  <span className="toggle-slider-knob" />
                </button>
                <span className={`auto-status-text ${autoTrackingEnabled ? 'active' : 'off'}`}>
                  {autoTrackingEnabled ? 'Active' : 'Off'}
                </span>
              </div>

              <button
                type="button"
                className={`btn-check-now ${isCheckingPrices ? 'is-checking' : ''}`}
                onClick={() => runPriceCheck()}
                disabled={isCheckingPrices}
              >
                <svg
                  className={`btn-refresh-icon ${isCheckingPrices ? 'spin' : ''}`}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isCheckingPrices ? 'Checking...' : 'Check Price'}</span>
              </button>
            </div>
          </div>

          {signalsLoading ? (
            <div className="admin-signals-loading">
              <div className="admin-spinner-dot" />
              <span>Loading live website signals...</span>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="admin-signals-empty-card">
              <div className="empty-radar-glow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h4>No {signalTab === 'all' ? '' : signalTab.toUpperCase() + ' '}Signals Found</h4>
              <p>
                {signalTab === 'all'
                  ? 'No signals published yet. Use the generator above to drop your first live setup!'
                  : `There are currently no signals marked with "${signalTab}". Select another tab to see all setups.`}
              </p>
            </div>
          ) : (
            <div className="admin-signals-table-wrap">
              <table className="admin-table signals-data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Direction</th>
                    <th>Entry</th>
                    <th>Live Price / PnL</th>
                    <th>SL</th>
                    <th>TP</th>
                    <th>R:R</th>
                    <th>Session</th>
                    <th>Status Outcome</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignals.map((s) => {
                    const livePrice = livePrices[s.pair];
                    const isBuy = String(s.direction).toLowerCase() === 'buy';
                    const entryNum = parseFloat(s.entry);
                    const priceNum = livePrice ? parseFloat(livePrice) : null;
                    const isGold = (s.pair || '').toUpperCase().includes('XAU') || (s.pair || '').toUpperCase().includes('GOLD');
                    const pipMultiplier = isGold ? 10 : 10000;
                    
                    let floatingPips = null;
                    let isProfit = false;
                    let progressData = null;
                    if (entryNum && priceNum) {
                      floatingPips = isBuy ? (priceNum - entryNum) * pipMultiplier : (entryNum - priceNum) * pipMultiplier;
                      isProfit = floatingPips >= 0;
                      progressData = calcTradeProgress(s, priceNum);
                    }

                    return (
                      <tr key={s.id} className={`signal-table-row status-${s.status}`}>
                        {/* ASSET */}
                        <td>
                          <div className="signal-asset-cell">
                            <div className={`signal-asset-avatar ${isGold ? 'gold-avatar' : 'fx-avatar'}`}>
                              {isGold ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                  <polyline points="2 17 12 22 22 17" />
                                  <polyline points="2 12 12 17 22 12" />
                                </svg>
                              ) : (
                                <span className="fx-symbol">$</span>
                              )}
                            </div>
                            <div className="signal-asset-meta">
                              <span className="signal-pair-name">{s.pair}</span>
                              <span className="signal-pair-type">{isGold ? 'Spot Gold' : 'Forex'}</span>
                            </div>
                          </div>
                        </td>

                        {/* DIRECTION */}
                        <td>
                          <span className={`signal-dir-pill ${s.direction}`}>
                            {isBuy ? (
                              <>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                                BUY
                              </>
                            ) : (
                              <>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                                SELL
                              </>
                            )}
                          </span>
                        </td>

                        {/* ENTRY */}
                        <td>
                          <span className="signal-price-num entry-val">{s.entry}</span>
                        </td>

                        {/* LIVE PRICE & PNL TRACKING */}
                        <td>
                          {priceNum != null ? (
                            <div className="signal-live-cell">
                              <div className="signal-live-price-line">
                                <span className="live-spot-dot" />
                                <span className="live-spot-price">${livePrice}</span>
                              </div>
                              {s.status === 'active' && floatingPips != null ? (
                                <div className="signal-live-sub">
                                  <span className={`signal-pnl-chip ${isProfit ? 'pos' : 'neg'}`}>
                                    {isProfit ? '+' : ''}{floatingPips.toFixed(1)} pips
                                  </span>
                                  {progressData && (
                                    <span className="signal-tp-dist">
                                      {progressData.pipsToTp} to TP
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`signal-final-outcome-chip ${s.status}`}>
                                  {s.status === 'tp' ? '🎯 Target Hit' : s.status === 'sl' ? '❌ Stopped Out' : 'Active'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="signal-connecting-pulse">Connecting...</span>
                          )}
                        </td>

                        {/* SL */}
                        <td>
                          <div className="signal-target-val sl">
                            <span className="target-prefix">SL</span>
                            <span className="target-num">{s.sl}</span>
                          </div>
                        </td>

                        {/* TP */}
                        <td>
                          <div className="signal-target-val tp">
                            <span className="target-prefix">TP</span>
                            <span className="target-num">{s.tp}</span>
                          </div>
                        </td>

                        {/* R:R */}
                        <td>
                          <span className="signal-rr-pill">{String(s.rr).includes(':') ? s.rr : `1:${s.rr}`}</span>
                        </td>

                        {/* SESSION */}
                        <td>
                          <span className="signal-session-pill">
                            {s.session || 'London KZ'}
                          </span>
                        </td>

                        {/* STATUS SELECTOR */}
                        <td>
                          <div className="signal-segmented-control" role="group" aria-label="Trade Outcome">
                            <button
                              type="button"
                              className={`signal-seg-btn active${s.status === 'active' ? ' selected' : ''}`}
                              onClick={() => handleUpdateSignalStatus(s.id, 'active')}
                              disabled={updatingSignalId === s.id}
                              title="Set status to Active"
                            >
                              <span className="status-seg-dot" />
                              Active
                            </button>
                            <button
                              type="button"
                              className={`signal-seg-btn tp${s.status === 'tp' ? ' selected' : ''}`}
                              onClick={() => handleUpdateSignalStatus(s.id, 'tp')}
                              disabled={updatingSignalId === s.id}
                              title="Set status to Hit TP"
                            >
                              🎯 Hit TP
                            </button>
                            <button
                              type="button"
                              className={`signal-seg-btn sl${s.status === 'sl' ? ' selected' : ''}`}
                              onClick={() => handleUpdateSignalStatus(s.id, 'sl')}
                              disabled={updatingSignalId === s.id}
                              title="Set status to Hit SL"
                            >
                              ❌ Hit SL
                            </button>
                          </div>
                        </td>

                        {/* CREATED */}
                        <td>
                          <span className="signal-created-time">
                            {formatSignalAge(s.minutesAgo)}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="signal-action-delete-btn"
                            onClick={() => handleDeleteSignal(s.id, s.pair)}
                            title={`Delete ${s.pair} Signal`}
                            aria-label={`Delete ${s.pair} Signal`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ===== CONFIGURE SECTION ===== */}
      {adminSection === 'configure' && (
        <div className="admin-configure-section">
          {/* SYSTEM & ENGINE STATUS CARDS */}
          <div className="admin-config-cards-grid">
            <div className="config-card">
              <div className="config-card-header">
                <span className="config-card-icon">🤖</span>
                <div>
                  <div className="config-card-title">AI Signal Engine</div>
                  <div className="config-card-sub">Pip AI Vision (Dual-Timeframe Analysis)</div>
                </div>
              </div>
              <div className="config-card-status">
                <span className="pulse-dot live" /> Ready for HTF 1H + LTF 15m Analysis
              </div>
            </div>

            <div className="config-card">
              <div className="config-card-header">
                <span className="config-card-icon">📡</span>
                <div>
                  <div className="config-card-title">Live Market Pipe</div>
                  <div className="config-card-sub">TradingView OANDA WebSocket Feed</div>
                </div>
              </div>
              <button
                type="button"
                className={`config-toggle-btn${autoTrackingEnabled ? ' active' : ''}`}
                onClick={() => setAutoTrackingEnabled((v) => !v)}
              >
                {autoTrackingEnabled ? '✓ Auto TP/SL Active' : '✕ Auto TP/SL Paused'}
              </button>
            </div>

            <div className="config-card">
              <div className="config-card-header">
                <span className="config-card-icon">💬</span>
                <div>
                  <div className="config-card-title">Feedback & Inquiries</div>
                  <div className="config-card-sub">{feedback.length} student submission{feedback.length === 1 ? '' : 's'}</div>
                </div>
              </div>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px', width: 'fit-content' }}
                onClick={() => setShowFeedback(true)}
              >
                View Feedback Inbox ({feedback.length})
              </button>
            </div>
          </div>

          {/* COURSE LESSON VIDEOS CONFIGURATION */}
          <div className="admin-videos-section" style={{ marginTop: '12px' }}>
            <div className="admin-section-bar">
              <div className="admin-section-title" style={{ margin: 0 }}>
                Course Lesson Video URLs
              </div>
              <span className="signals-count-tag">
                {Object.keys(videos).length} of {VIDEO_KEYS.length} videos configured
              </span>
            </div>
            <p className="admin-section-sub">
              Upload your MP4 lesson recordings to GitHub Releases (any repo → Releases → attach MP4),
              copy the direct download link, and paste it here. The website reads directly from Firestore in real time.
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
                  <label className="auth-label" htmlFor="au-plan" style={{ textAlign: 'left' }}>
                    Plan
                  </label>
                  <select
                    id="au-plan"
                    className={`plan-select plan-${newUser.plan || 'free'}`}
                    value={newUser.plan || 'free'}
                    disabled={newUser.status !== 'approved'}
                    title={newUser.status !== 'approved' ? 'Approve this user first to set their plan' : undefined}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const tier = plan === 'free' ? 'member' : 'vip';
                      setNewUser((p) => ({ ...p, plan, tier }));
                    }}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter VIP</option>
                    <option value="pro">Pro VIP</option>
                    <option value="elite">Elite VIP</option>
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
