import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
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
import {
  broadcastSignalNotification,
  sendPaidMemberSignalNotification,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/pushNotificationService.js';
import { usePersistentState, useScrollPersistence } from '../utils/statePersistence.js';
import {
  sendTelegramSignal,
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramNotification,
  detectTelegramChannel,
} from '../services/telegramService.js';
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
  useScrollPersistence('admin_dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = usePersistentState('gzt_admin_tab', 'all', { userId: admin?.uid });
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
  const [adminSection, setAdminSection] = usePersistentState('gzt_admin_section', 'members', { userId: admin?.uid }); // 'members' | 'configure' | 'payments'
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = usePersistentState('gzt_admin_paymentFilter', 'all', { userId: admin?.uid }); // 'all' | 'pending' | 'approved' | 'rejected'
  const [paymentSearch, setPaymentSearch] = useState('');
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
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
  const [signalTab, setSignalTab] = usePersistentState('gzt_admin_signalTab', 'all', { userId: admin?.uid }); // 'all' | 'active' | 'tp' | 'sl'

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

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (paymentFilter !== 'all') {
      list = list.filter((p) => p.status === paymentFilter);
    }
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
          (p.userName && p.userName.toLowerCase().includes(q)) ||
          (p.planName && p.planName.toLowerCase().includes(q)) ||
          (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
          (p.uid && p.uid.toLowerCase().includes(q))
      );
    }
    return list;
  }, [payments, paymentFilter, paymentSearch]);

  const pendingPaymentsCount = useMemo(
    () => payments.filter((p) => p.status === 'pending').length,
    [payments]
  );

  // Live Market Prices & Automated TP/SL State
  const [livePrices, setLivePrices] = useState({});
  const lastObservedPrices = useRef({});
  const [autoTrackingEnabled, setAutoTrackingEnabled] = usePersistentState('gzt_admin_autoTracking', true, { userId: admin?.uid });
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);

  // AI Generator Form State (Option B Dual-Timeframe)
  const [aiPair, setAiPair] = usePersistentState('gzt_admin_aiPair', 'XAUUSD', { userId: admin?.uid });
  const [aiNotes, setAiNotes] = useState('');
  const [aiHtfImage, setAiHtfImage] = useState(null); // Chart 1: HTF 1H/4H
  const [aiLtfImage, setAiLtfImage] = useState(null); // Chart 2: LTF 15m/5m
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showChartUpload, setShowChartUpload] = usePersistentState('gzt_admin_showChartUpload', false, { userId: admin?.uid });
  const [showAdminChart, setShowAdminChart] = usePersistentState('gzt_admin_showAdminChart', true, { userId: admin?.uid });

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

  // Telegram VIP Signal Sync State
  const [tgConfig, setTgConfig] = useState(() => getTelegramConfig());
  const [tgSaving, setTgSaving] = useState(false);
  const [tgTesting, setTgTesting] = useState(false);
  const [tgMsg, setTgMsg] = useState('');
  const [showTgToken, setShowTgToken] = useState(false);
  const [showTgPreview, setShowTgPreview] = useState(false);

  const [tgDetecting, setTgDetecting] = useState(false);

  function handleSaveTelegram() {
    setTgSaving(true);
    saveTelegramConfig(tgConfig);
    setTgMsg('✅ Telegram configuration saved!');
    setTimeout(() => setTgMsg(''), 4000);
    setTgSaving(false);
  }

  async function handleTestTelegram() {
    setTgTesting(true);
    setTgMsg('');
    try {
      saveTelegramConfig(tgConfig);
      const res = await testTelegramNotification();
      if (res.ok) {
        setTgMsg('✅ Test message sent to your Telegram channel!');
      } else {
        setTgMsg('⚠️ Telegram error: ' + (res.error || 'Failed to send'));
      }
    } catch (e) {
      setTgMsg('⚠️ ' + (e?.message || 'Network error'));
    } finally {
      setTgTesting(false);
    }
  }

  async function handleDetectChannel() {
    if (!tgConfig.botToken) {
      setTgMsg('⚠️ Please enter your Bot API Token first.');
      return;
    }
    setTgDetecting(true);
    setTgMsg('🔍 Scanning Telegram for connected channels...');
    const res = await detectTelegramChannel(tgConfig.botToken);
    setTgDetecting(false);
    if (res.ok) {
      const updated = { ...tgConfig, chatId: res.chatId };
      setTgConfig(updated);
      saveTelegramConfig(updated);
      if (res.canPost) {
        setTgMsg(`✅ Detected "${res.title}" (${res.chatId})! Permissions are verified and ready.`);
      } else {
        setTgMsg(`⚠️ Connected to "${res.title}" (${res.chatId}), but "Post Messages" permission is OFF! In Telegram: Channel Settings → Administrators → @${res.botUsername || 'bot'} → Turn ON "Post Messages" → Save.`);
      }
    } else {
      setTgMsg(`⚠️ ${res.error || 'Could not detect channel.'}`);
    }
  }

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
    if (!aiHtfImage || !aiLtfImage) {
      setSignalError('Pip needs both charts: upload a readable HTF 1H/4H screenshot and LTF 15m/5m screenshot to verify structure, PD-array, and Fibonacci confluence.');
      return;
    }
    setAiGenerating(true);
    try {
      const currentSpot = await fetchLivePrice(aiPair);
      if (currentSpot) setLivePrices((prev) => ({ ...prev, [aiPair]: currentSpot }));

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
      const message = err.message || 'Failed to generate signal with Pip AI.';
      console.info('[Pip] No signal generated:', message);
      setSignalError(message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handlePublishSignal(e) {
    e?.preventDefault?.();
    setSignalError('');
    setSignalSuccess('');

    const targetPair = signalDraft.pair || aiPair || 'XAUUSD';
    const currentSpot = livePrices[targetPair]
      ? formatSpotPrice(targetPair, livePrices[targetPair])
      : signalDraft.entry;

    if (!currentSpot && !signalDraft.entry) {
      setSignalError('Waiting for live spot price. Please verify market feed is connected.');
      return;
    }

    if (!signalDraft.sl || !signalDraft.tp) {
      setSignalError('Please fill in Stop Loss and Take Profit levels before dropping signal.');
      return;
    }

    setIsDroppingSignal(true);
    try {
      const quote = await fetchLivePrice(targetPair);
      const chartQuote = quote ? formatSpotPrice(targetPair, quote) : currentSpot;
      const signalToPublish = { ...signalDraft, entry: String(chartQuote) };

      if (getNotificationPermission() === 'default') {
        try { await requestNotificationPermission(); } catch {}
      }

      const publishedSignal = await publishSignal(signalToPublish);

      let pushStatus = '';
      try {
        const pushResult = await sendPaidMemberSignalNotification(publishedSignal.id);
        pushStatus = pushResult.sentCount > 0
          ? ` Push sent to ${pushResult.sentCount} paid member device${pushResult.sentCount === 1 ? '' : 's'}.`
          : ` No paid member devices received the push (${pushResult.registeredCount} registered, ${pushResult.failedCount} failed).`;
      } catch (pushErr) {
        console.warn('Server push notification notice:', pushErr);
        pushStatus = ` Push delivery failed: ${pushErr.message || 'Check the API service logs.'}`;
      }

      // 🔔 Push notification — broadcast to all subscribed member clients & local tab
      try {
        await broadcastSignalNotification(signalToPublish);
      } catch (broadcastErr) {
        console.warn('Notification broadcast notice:', broadcastErr);
      }

      // 📲 Telegram VIP Channel Broadcast
      let tgStatus = '';
      try {
        const tgRes = await sendTelegramSignal(signalToPublish);
        if (tgRes.ok) {
          tgStatus = ' 📲 Synced to Telegram VIP!';
        } else if (tgRes.skipped) {
          tgStatus = ` Telegram not sent: ${tgRes.reason || 'Telegram sync is disabled.'}`;
        } else {
          tgStatus = ` Telegram delivery failed: ${tgRes.error || tgRes.reason || 'Unknown error.'}`;
          console.warn('Telegram sync notice:', tgStatus);
        }
      } catch (tgErr) {
        console.warn('Telegram sync notice:', tgErr);
        tgStatus = ` Telegram delivery failed: ${tgErr.message || 'Unknown error.'}`;
      }

      setSignalSuccess(`🚀 Dropped ${signalToPublish.pair} ${signalToPublish.direction.toUpperCase()} signal live to website!${pushStatus}${tgStatus}`);
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
      setSignalError(err.message || 'Failed to publish signal. Check Firestore rules / admin access.');
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
      const previousPrices = lastObservedPrices.current;
      lastObservedPrices.current = { ...previousPrices, ...newPrices };
      setLivePrices(newPrices);
      setLastCheckedTime(new Date().toLocaleTimeString());

      if (autoTrackingEnabled) {
        for (const s of activeList) {
          const currentPrice = newPrices[s.pair || 'XAUUSD'];
          if (!currentPrice) continue;

          const outcome = evaluateSignalOutcome(s, currentPrice, previousPrices[s.pair || 'XAUUSD']);
          if (outcome === 'tp' || outcome === 'sl') {
            await updateSignalStatus(s.id, outcome);
            const isTp = outcome === 'tp';
            setSignalSuccess(
              `${isTp ? '🎯 [AUTO-TRIGGER]' : '❌ [AUTO-TRIGGER]'} ${s.pair} touched ${isTp ? 'Take Profit' : 'Stop Loss'} at $${currentPrice}! Signal status updated live on AI Trading terminal.`
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
      const previousPrices = lastObservedPrices.current;
      lastObservedPrices.current = { ...previousPrices, ...incoming };
      setLivePrices((prev) => ({ ...prev, ...incoming }));
      setLastCheckedTime(new Date().toLocaleTimeString());
      if (autoTrackingEnabled) {
        const activeList = signals.filter((s) => s.status === 'active');
        for (const s of activeList) {
          const currentPrice = incoming[s.pair || 'XAUUSD'];
          if (!currentPrice) continue;
          const outcome = evaluateSignalOutcome(s, currentPrice, previousPrices[s.pair || 'XAUUSD']);
          if (outcome === 'tp' || outcome === 'sl') {
            updateSignalStatus(s.id, outcome);
            const isTp = outcome === 'tp';
            setSignalSuccess(
              `${isTp ? '🎯 [AUTO-TRIGGER]' : '❌ [AUTO-TRIGGER]'} ${s.pair} touched ${isTp ? 'Take Profit' : 'Stop Loss'} at $${currentPrice}! Signal status updated live on AI Trading terminal.`
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

  // Automatically lock draft entry to live spot price
  useEffect(() => {
    const pair = signalDraft.pair || aiPair || 'XAUUSD';
    const spot = livePrices[pair];
    if (spot) {
      const formatted = formatSpotPrice(pair, spot);
      setSignalDraft((prev) => {
        if (prev.entry === formatted) return prev;
        const next = { ...prev, entry: formatted };
        const e = parseFloat(formatted);
        const s = parseFloat(prev.sl);
        const t = parseFloat(prev.tp);
        if (e && s && t) {
          const risk = Math.abs(e - s);
          const reward = Math.abs(t - e);
          if (risk > 0) {
            const ratio = Math.round((reward / risk) * 10) / 10;
            next.rr = ratio === 2 ? '1:2' : `1:${ratio}`;
          }
        }
        return next;
      });
    }
  }, [livePrices, signalDraft.pair, aiPair]);

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

    const qPayments = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'));
    const unsubPayments = onSnapshot(
      qPayments,
      (snapshot) => {
        setPayments(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setPaymentsLoading(false);
      },
      (err) => {
        console.warn('paymentRequests listener warning:', err);
        setPaymentsLoading(false);
      }
    );

    return () => {
      unsubSignals();
      unsubPayments();
    };
  }, []);

  async function handleApprovePayment(paymentReq) {
    if (!paymentReq || processingPaymentId) return;
    setProcessingPaymentId(paymentReq.id);
    try {
      await updateDoc(doc(db, 'paymentRequests', paymentReq.id), {
        status: 'approved',
        reviewedAt: new Date(),
      });
      if (paymentReq.uid && !paymentReq.uid.startsWith('guest_')) {
        await setUserPlan(paymentReq.uid, paymentReq.planId);
        await setUserStatus(paymentReq.uid, 'approved');
        await setUserAccess(paymentReq.uid, 'vip');
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === paymentReq.uid
              ? { ...u, plan: paymentReq.planId, status: 'approved', tier: 'vip' }
              : u
          )
        );
      }
    } catch (err) {
      console.error('Failed to approve payment:', err);
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleRejectPayment(paymentReq) {
    if (!paymentReq || processingPaymentId) return;
    setProcessingPaymentId(paymentReq.id);
    try {
      await updateDoc(doc(db, 'paymentRequests', paymentReq.id), {
        status: 'rejected',
        reviewedAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to reject payment:', err);
    } finally {
      setProcessingPaymentId(null);
    }
  }

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

      {/* TOP NAVIGATION BUTTONS: Member, Configure, KHQR Payments */}
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
          className={`admin-nav-tab-btn${adminSection === 'configure' ? ' active' : ''}`}
          onClick={() => setAdminSection('configure')}
        >
          <span className="admin-nav-tab-icon">⚙️</span>
          <span className="admin-nav-tab-text">Configure</span>
          {feedback.length > 0 && (
            <span className="admin-nav-tab-pill blue-pill">{feedback.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-nav-tab-btn${adminSection === 'payments' ? ' active' : ''}`}
          onClick={() => setAdminSection('payments')}
        >
          <span className="admin-nav-tab-icon">💳</span>
          <span className="admin-nav-tab-text">KHQR Payments</span>
          {pendingPaymentsCount > 0 ? (
            <span className="admin-nav-tab-pill red-pill">{pendingPaymentsCount} Pending</span>
          ) : (
            <span className="admin-nav-tab-pill">{payments.length}</span>
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

            <div className="config-card">
              <div className="config-card-header">
                <span className="config-card-icon">✈️</span>
                <div>
                  <div className="config-card-title">Telegram VIP Channel Sync</div>
                  <div className="config-card-sub">{tgConfig.enabled ? (tgConfig.chatId ? 'Active: ' + tgConfig.chatId : 'Active') : 'Disabled / Paused'}</div>
                </div>
              </div>
              <button
                type="button"
                className={`config-toggle-btn${tgConfig.enabled ? ' active' : ''}`}
                onClick={() => {
                  const updated = { ...tgConfig, enabled: !tgConfig.enabled };
                  setTgConfig(updated);
                  saveTelegramConfig(updated);
                  setTgMsg(updated.enabled ? 'Telegram sync turned ON' : 'Telegram sync turned OFF');
                  setTimeout(() => setTgMsg(''), 3000);
                }}
              >
                {tgConfig.enabled ? '✓ Telegram Sync Active' : '✕ Telegram Sync Paused'}
              </button>
            </div>
          </div>

          {/* TELEGRAM VIP CHANNEL CONFIGURATION (REDESIGNED) */}
          <div className="tg-broadcast-card">
            <div className="tg-header-flex">
              <div className="tg-brand-wrap">
                <div className="tg-icon-circle">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <div className="tg-title-group">
                  <h3>
                    Telegram VIP Signal Sync
                    <span className="tg-version-tag">Live Engine</span>
                  </h3>
                  <div className="tg-title-sub">
                    Automatically broadcast every published signal to your private Telegram VIP channel in real-time.
                  </div>
                </div>
              </div>

              <div className="tg-status-switch-wrap">
                <span className={`tg-status-pill ${tgConfig.enabled ? 'active' : 'paused'}`}>
                  {tgConfig.enabled ? (
                    <>
                      <span className="pulse-dot live" />
                      Auto-Broadcast Active
                    </>
                  ) : (
                    '○ Broadcast Paused'
                  )}
                </span>
                <label className="tg-toggle-switch" title="Toggle Telegram broadcast on/off">
                  <input
                    type="checkbox"
                    checked={!!tgConfig.enabled}
                    onChange={(e) => {
                      const updated = { ...tgConfig, enabled: e.target.checked };
                      setTgConfig(updated);
                      saveTelegramConfig(updated);
                      setTgMsg(updated.enabled ? '✅ Telegram sync activated!' : '⏸️ Telegram sync paused.');
                      setTimeout(() => setTgMsg(''), 3500);
                    }}
                  />
                  <span className="tg-toggle-slider" />
                </label>
              </div>
            </div>

            {/* 3-STEP QUICK SETUP GUIDE */}
            <div className="tg-steps-grid">
              <div className="tg-step-box">
                <div className="tg-step-num">1</div>
                <div className="tg-step-text">
                  Create a bot with <a href="https://t.me/botfather" target="_blank" rel="noreferrer">@BotFather</a> and copy the API Token.
                </div>
              </div>
              <div className="tg-step-box">
                <div className="tg-step-num">2</div>
                <div className="tg-step-text">
                  Add your bot as an <strong>Administrator</strong> in your VIP Channel with <em>Post Messages</em> permission.
                </div>
              </div>
              <div className="tg-step-box">
                <div className="tg-step-num">3</div>
                <div className="tg-step-text">
                  Paste credentials below, click <strong>Save</strong>, and verify with <strong>Send Test Broadcast</strong>.
                </div>
              </div>
            </div>

            {tgMsg && (
              <div
                className={`admin-success-block ${tgMsg.includes('⚠️') ? 'admin-error-block' : ''}`}
                style={{ marginBottom: '16px' }}
              >
                {tgMsg}
              </div>
            )}

            {/* CREDENTIALS FORM INPUTS */}
            <div className="tg-inputs-row">
              <div className="tg-field-card">
                <div className="tg-field-top">
                  <span className="tg-field-label">🔑 Bot API Token</span>
                  <a
                    href="https://t.me/botfather"
                    target="_blank"
                    rel="noreferrer"
                    className="tg-field-sublink"
                  >
                    Open @BotFather ↗
                  </a>
                </div>
                <div className="tg-input-wrapper">
                  <input
                    type={showTgToken ? 'text' : 'password'}
                    className="tg-input-box"
                    placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTUvxyz"
                    value={tgConfig.botToken || ''}
                    onChange={(e) => setTgConfig((prev) => ({ ...prev, botToken: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="tg-token-toggle"
                    title={showTgToken ? 'Hide token' : 'Show token'}
                    onClick={() => setShowTgToken((v) => !v)}
                  >
                    {showTgToken ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="tg-field-card">
                <div className="tg-field-top">
                  <span className="tg-field-label">📢 VIP Channel or Group ID</span>
                  <button
                    type="button"
                    className="tg-field-sublink"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={handleDetectChannel}
                    disabled={tgDetecting}
                    title="Automatically scan Telegram to find your VIP channel ID"
                  >
                    {tgDetecting ? '🔍 Detecting...' : '🔍 Auto-Detect Channel ID'}
                  </button>
                </div>
                <div className="tg-input-wrapper">
                  <input
                    type="text"
                    className="tg-input-box"
                    placeholder="e.g. @genz_vip_signals or -1001234567890"
                    value={tgConfig.chatId || ''}
                    onChange={(e) => setTgConfig((prev) => ({ ...prev, chatId: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS & PREVIEW TOGGLE */}
            <div className="tg-actions-row">
              <div className="tg-btns-group">
                <button
                  type="button"
                  className="tg-btn-primary"
                  onClick={handleSaveTelegram}
                  disabled={tgSaving}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {tgSaving ? 'Saving...' : 'Save Configuration'}
                </button>

                <button
                  type="button"
                  className="tg-btn-secondary"
                  onClick={handleTestTelegram}
                  disabled={tgTesting || !tgConfig.botToken || !tgConfig.chatId}
                  title="Dispatch a test institutional signal to your channel"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {tgTesting ? '📡 Sending Test...' : 'Send Test Broadcast'}
                </button>

                <button
                  type="button"
                  className="tg-btn-ghost"
                  onClick={() => setShowTgPreview((v) => !v)}
                >
                  {showTgPreview ? '✕ Hide Post Preview' : '👁️ View Message Format'}
                </button>
              </div>

              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                💡 Tip: Add the bot as an <strong>Administrator</strong> so it can post.
              </span>
            </div>

            {/* INTERACTIVE MOCK TELEGRAM PREVIEW */}
            {showTgPreview && (
              <div className="tg-preview-container">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📱 Live Telegram Channel Post Preview</span>
                  <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>HTML Formatted</span>
                </div>
                <div className="tg-preview-bubble">
                  <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>GenZ Trader VIP Signals</span>
                    <span style={{ fontSize: '12px' }}>✓</span>
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    🎯 <strong>#XAUUSD</strong> ┃ 🟢 <strong>BUY <code>4180.905 – 4173.208</code></strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '8px 0' }}>
                    <div>🔹 <strong>Take Profit (TP)</strong> — <code>4195.210</code></div>
                    <div>🔸 <strong>Stop Loss (SL)</strong> — <code>4173.208</code></div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>⚖️ <strong>Risk to Reward</strong> — <code>1:2.5</code> (15m • London Killzone)</div>
                  </div>
                  <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                    <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 600 }}>💡 Setup Rationale:</div>
                    <div style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '12px', marginTop: '2px' }}>
                      Institutional Liquidity Sweep & 15m Displacement confirmation.
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '11.5px' }}>
                    🛡️ <strong>Strict Risk Protocol:</strong><br />
                    Risk only 1%–2% per trade. Apply proper risk management ‼️‼️
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span>⚡ Powered by GenZ Trader AI</span>
                    <span style={{ color: '#38bdf8' }}>10:45 AM ✓✓</span>
                  </div>
                </div>
              </div>
            )}
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

      {/* ===== KHQR PAYMENTS SECTION ===== */}
      {adminSection === 'payments' && (
        <div className="admin-payments-section">
          {/* Top Banner & Stats */}
          <div className="admin-section-bar">
            <div>
              <div className="admin-section-title" style={{ margin: 0 }}>
                Bakong KHQR Payments & Subscriptions
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--mute)', fontSize: '13px' }}>
                Verify and manage incoming KHQR payments for account <strong>sunhour_lim@bkrt</strong>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(200, 16, 46, 0.12)', border: '1px solid rgba(200, 16, 46, 0.3)', padding: '6px 14px', borderRadius: '999px', fontSize: '12px' }}>
              <span className="pulse-dot live" style={{ background: '#C8102E' }} />
              <span style={{ color: 'var(--text)' }}>Bakong Account: <strong style={{ color: '#E11D48' }}>sunhour_lim@bkrt</strong></span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="admin-stats-grid" style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div className="admin-stat-card">
              <div className="stat-label">Total Submissions</div>
              <div className="stat-value">{payments.length}</div>
            </div>
            <div className="admin-stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div className="stat-label">Pending Review</div>
              <div className="stat-value" style={{ color: '#F59E0B' }}>{pendingPaymentsCount}</div>
            </div>
            <div className="admin-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div className="stat-label">Approved & Active</div>
              <div className="stat-value" style={{ color: '#10B981' }}>
                {payments.filter((p) => p.status === 'approved').length}
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderColor: 'rgba(0, 166, 244, 0.4)' }}>
              <div className="stat-label">Total Verified Revenue</div>
              <div className="stat-value" style={{ color: 'var(--brand2)' }}>
                ${payments
                  .filter((p) => p.status === 'approved')
                  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                  .toFixed(2)}{' '}
                USD
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPaymentFilter(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: paymentFilter === f ? 'var(--bg2)' : 'transparent',
                    border: '1px solid ' + (paymentFilter === f ? 'var(--brandline)' : 'var(--faint)'),
                    color: paymentFilter === f ? 'var(--text)' : 'var(--mute)',
                    textTransform: 'capitalize'
                  }}
                >
                  {f} {f === 'pending' && pendingPaymentsCount > 0 ? `(${pendingPaymentsCount})` : ''}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search email, name, ref..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg1)',
                  border: '1px solid var(--faint)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Payments Table */}
          {paymentsLoading ? (
            <div className="admin-empty">Loading payment requests...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="admin-empty">No payment requests found matching your filter.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User / Account</th>
                    <th>Plan & Cycle</th>
                    <th>Amount</th>
                    <th>Ref / Note</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const isProcessing = processingPaymentId === p.id;
                    const dateStr = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : formatDate(p.createdAt);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontSize: '12px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {p.userName || p.userEmail || 'Anonymous'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                            {p.userEmail}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {p.planName || p.planId}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--mute)', marginLeft: '6px' }}>
                            ({p.billing || 'monthly'})
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#10B981', fontSize: '14px' }}>
                            ${Number(p.amount || 0).toFixed(2)} USD
                          </strong>
                        </td>
                        <td>
                          {p.transactionId ? (
                            <code style={{ fontSize: '11.5px', background: 'var(--bg2)', padding: '2px 6px', borderRadius: '4px' }}>
                              {p.transactionId}
                            </code>
                          ) : (
                            <span style={{ color: 'var(--mute)', fontSize: '12px' }}>—</span>
                          )}
                          {p.note && (
                            <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '2px' }}>
                              {p.note}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background:
                                p.status === 'approved'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : p.status === 'rejected'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                p.status === 'approved'
                                  ? '#10B981'
                                  : p.status === 'rejected'
                                  ? '#EF4444'
                                  : '#F59E0B',
                              border:
                                '1px solid ' +
                                (p.status === 'approved'
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : p.status === 'rejected'
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : 'rgba(245, 158, 11, 0.3)'),
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {p.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApprovePayment(p)}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {isProcessing ? '...' : '✓ Approve & Grant Plan'}
                              </button>
                            )}
                            {p.status === 'pending' && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRejectPayment(p)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {isProcessing ? '...' : '✕ Reject'}
                              </button>
                            )}
                            <a
                              href="https://t.me/Vengsopheagenz"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--brand2)',
                                fontSize: '11.5px',
                                textDecoration: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              Telegram
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
