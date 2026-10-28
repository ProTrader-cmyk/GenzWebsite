import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar.jsx';
import LandingHome from './components/LandingHome.jsx';
import LessonBackdrop from './components/LessonBackdrop.jsx';
import AccessGrantedModal from './components/AccessGrantedModal.jsx';
import LessonFeedbackModal from './components/LessonFeedbackModal.jsx';
import { lessons, getNextLessonId } from './data/lessons.js';
import { appsLessons, getNextAppsLessonId } from './data/appsLessons.js';
import { backtestLessons, getNextBacktestLessonId } from './data/backtestLessons.js';
import { psychologyLessons, getNextPsychologyLessonId } from './data/psychologyLessons.js';
import { advancedLessons, getNextAdvancedLessonId } from './data/advancedLessons.js';
import { lessonPages } from './pages/registry.js';
import favicon from './assets/Fav.png';
import { auth, db } from './firebase.js';
import './styles/memberArea.css';
import {
  fetchUserProfile,
  saveSession,
  loadSession,
  clearSession,
  logoutUser,
  markLessonDone,
  getUserPlan,
} from './data/auth.js';
import {
  subscribeToNotifications,
  registerNotificationServiceWorker,
} from './services/pushNotificationService.js';
import { startNewsWatcher } from './services/newsNotificationService.js';
import { submitFeedback } from './data/feedback.js';
import {
  getPersistedNavState,
  savePersistedNavState,
  clearPersistedNavState,
  useScrollPersistence,
} from './utils/statePersistence.js';

const NAV_KEY = 'gzt_nav';

// Lazy-loaded secondary sections & auth pages so initial Homepage load stays fast and light
const CategoryHome = lazy(() => import('./components/CategoryHome.jsx'));
const Home = lazy(() => import('./components/Home.jsx'));
const AppsHome = lazy(() => import('./components/AppsHome.jsx'));
const BacktestHome = lazy(() => import('./components/BacktestHome.jsx'));
const PsychologyHome = lazy(() => import('./components/PsychologyHome.jsx'));
const NewProductHome = lazy(() => import('./components/NewProductHome.jsx'));
const AdvancedHome = lazy(() => import('./components/AdvancedHome.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const Profile = lazy(() => import('./components/Profile.jsx'));
const NewsPage = lazy(() => import('./components/NewsPage.jsx'));
const AITradingPage = lazy(() => import('./components/AITradingPage.jsx'));
const ContactPage = lazy(() => import('./components/ContactPage.jsx'));
const AboutPage = lazy(() => import('./components/InfoPages.jsx').then((m) => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('./components/InfoPages.jsx').then((m) => ({ default: m.BlogPage })));
const TermsPage = lazy(() => import('./components/InfoPages.jsx').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./components/InfoPages.jsx').then((m) => ({ default: m.PrivacyPage })));
const MemberArea = lazy(() => import('./pages/MemberArea.jsx'));

// Pages that get the animated lesson background.
const LESSON_SECTIONS = ['categories', 'technical', 'advanced', 'psychology', 'apps', 'backtest'];

function BootScreen() {
  return (
    <div className="app-boot-screen">
      <img src={favicon} alt="GenZ Trader" className="app-boot-logo" />
      <span className="app-boot-spinner" />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => loadSession());
  const [authView, setAuthView] = useState(() => (new URLSearchParams(window.location.search).get('mode') === 'resetPassword' ? 'login' : null)); // null | 'login' | 'signup'
  const [pendingVerification, setPendingVerification] = useState(null); // { uid, email, name }
  // { email, token } when the URL is a password-reset email link
  // (?mode=resetPassword&token=&email=) — checked once on first mount,
  // since genztrader-news-api builds the link with exactly these params
  // (see passwordReset.js there). Login.jsx uses this to jump straight to
  // its "set new password" screen instead of the normal login form. Must
  // be cleared once that flow is done (Login.jsx's "Back to Login" calls
  // setResetLink(null)) — otherwise this stays truthy for the rest of the
  // page session and the branch below keeps taking priority over the
  // normal logged-in app, even after a real successful login, since it
  // doesn't check `user` at all. That was the actual bug: login would
  // silently "succeed" (Firebase auth + `user` state both fine) but the
  // screen never advanced past Login until a refresh cleared this.
  const [resetLink, setResetLink] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'resetPassword') return null;
    const token = params.get('token');
    const email = params.get('email');
    return token && email ? { token, email } : null;
  });
  // Scrubs the token out of the address bar immediately — it's already
  // captured in `resetLink` above, so it doesn't need to keep sitting in
  // the URL where it could be re-shared/bookmarked or reused after a
  // refresh (the server-side token is single-use anyway, but no reason to
  // leave a sensitive value visible there).
  useEffect(() => {
    if (resetLink) window.history.replaceState({}, '', window.location.pathname);
  }, [resetLink]);
  // Only block on the network round-trip to Firebase when there's no
  // cached session to show in the meantime — a returning user (the common
  // case) sees the app immediately with their last-known data, while
  // onAuthStateChanged below still re-confirms it in the background and
  // corrects state if it turns out stale (e.g. logged out elsewhere).
  // Without this, switching networks (WiFi <-> mobile data) mid-check could
  // hang that request for the better part of a minute — Firebase's SDK
  // waiting to notice the network change and reconnect — during which the
  // whole app sat behind a blank screen for no real reason, since the
  // cached `user` above was sitting right there the whole time.
  const [checkingSession, setCheckingSession] = useState(() => !loadSession());
  const initialNav = getPersistedNavState();
  const [section, setSection] = useState(() => initialNav?.section || 'home');
  const [view, setView] = useState(() => initialNav?.view || 'home');
  useScrollPersistence(`app_${section}_${view}`);
  const [doneMap, setDoneMap] = useState({});
  // { lessonId, lessonTitle } while the post-lesson feedback prompt is open, else null.
  const [feedbackPrompt, setFeedbackPrompt] = useState(null);
  const [globalNotifToast, setGlobalNotifToast] = useState(null);

  // Register push notification service worker on mount
  useEffect(() => {
    registerNotificationServiceWorker();
  }, []);

  // Live news watcher is for paid members while the site is open. The Railway
  // API sends background pushes when the site is closed.
  useEffect(() => {
    const canReceivePush = Boolean(
      user &&
      (user.role === 'admin' || user.role === 'dev' || getUserPlan(user) !== 'free')
    );
    if (!canReceivePush) return undefined;

    const stopNewsWatcher = startNewsWatcher((newsAlert) => {
      setGlobalNotifToast(newsAlert);
      const timer = setTimeout(() => setGlobalNotifToast(null), 9000);
      return () => clearTimeout(timer);
    }, 60000);
    return () => stopNewsWatcher();
  }, [user?.uid, user?.role, user?.plan, user?.tier, user?.subscription, user?.membership]);

  // Signals are now produced by the always-on server scanner (genztrader-news-api/trading/scanner.js).
  // The old browser-based auto-publisher was removed: each open staff tab raised its own duplicate setups.

  // Site-wide real-time live trading signal notification stream + local custom event listener
  useEffect(() => {
    const canReceiveSignalNotifications = Boolean(
      user &&
      (user.role === 'admin' || user.role === 'dev' || getUserPlan(user) !== 'free')
    );

    function handleCustomAlert(e) {
      if (e?.detail) {
        // News alerts and interactive Pip Machine scans are displayed directly; automated signal alerts are paid-only.
        if (e.detail.type !== 'news' && !e.detail.isPipScan && !canReceiveSignalNotifications) return;
        setGlobalNotifToast(e.detail);
        const timer = setTimeout(() => setGlobalNotifToast(null), 9000);
        return () => clearTimeout(timer);
      }
    }
    window.addEventListener('genz_signal_notification', handleCustomAlert);

    if (!canReceiveSignalNotifications) {
      return () => window.removeEventListener('genz_signal_notification', handleCustomAlert);
    }

    const unsubscribe = subscribeToNotifications((notif) => {
      setGlobalNotifToast(notif);
      const timer = setTimeout(() => {
        setGlobalNotifToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    });

    return () => {
      window.removeEventListener('genz_signal_notification', handleCustomAlert);
      unsubscribe();
    };
  }, [user?.uid, user?.role, user?.plan, user?.tier, user?.subscription, user?.membership]);
  // Once opened, the gold chart section stays mounted (just hidden via the
  // .view/.view.active CSS toggle) instead of being unmounted on every
  // navigation away — TradingView's embedded widget has no account/session
  // to save drawings to, so the only way anything drawn on it survives
  // leaving the section is keeping that same widget instance alive in
  // memory for the rest of this browser tab. Doesn't survive an actual page
  // refresh or reopening the site — nothing free from TradingView does.
  const [hasVisitedNewProduct, setHasVisitedNewProduct] = useState(false);
  useEffect(() => {
    if (section === 'new-product') setHasVisitedNewProduct(true);
  }, [section]);

  // Whenever any video starts playing anywhere in the app, pause any other
  // video that is currently playing so audio never overlaps.
  useEffect(() => {
    function handlePlay(e) {
      if (e.target && e.target.tagName === 'VIDEO') {
        if (e.target.classList.contains('auth-bg-video')) return;
        document.querySelectorAll('video').forEach((v) => {
          if (v !== e.target && !v.paused && !v.classList.contains('auth-bg-video')) {
            v.pause();
          }
        });
      }
    }
    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);
  // Bumped every time a pending (not-approved) user clicks a nav item that's
  // blocked for them (e.g. News) — passed to CategoryHome so it re-opens its
  // "contact admin" modal even when the user was already sitting on the
  // category picker (where switching `section` to 'categories' again is a
  // no-op and wouldn't otherwise remount/re-trigger it).
  const [pendingNoticeTick, setPendingNoticeTick] = useState(0);
  const [aiTradingReferralTick, setAiTradingReferralTick] = useState(0);
  // 'approved' | 'vip' | null — set by the live listener below the instant
  // an admin grants access while this tab is open (or on next visit if it
  // wasn't); AccessGrantedModal renders it.
  const [accessAlert, setAccessAlert] = useState(null);
  // Preserve whether admin was viewing the site or admin dashboard on refresh
  const [adminViewingSite, setAdminViewingSite] = useState(() => (initialNav?.adminViewingSite !== undefined ? initialNav.adminViewingSite : true));
  // While a Login/VerifyOtp page owns its own zoom-then-handoff transition
  // (see handleAuthSuccess), this stops the listener below from swapping
  // `user` out from under it the instant Firebase's sign-in resolves —
  // which used to unmount the page before its animation ever got to play.
  const manualAuthRef = useRef(false);

  // Firebase is the source of truth for status/emailVerified — re-check it on
  // load instead of trusting whatever was last cached in localStorage, since
  // an admin may have approved the account while it wasn't open.
  //
  // createUserWithEmailAndPassword auto-signs the new account in, which
  // fires this listener mid-signup — before the OTP has been entered. Route
  // an unverified account straight to the OTP screen here too (not just in
  // Login.jsx) so that race can never skip verification.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (manualAuthRef.current) return;
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
        if (profile && profile.emailVerified) {
          setUser(profile);
          saveSession(profile);
          setDoneMap(profile.progress || {});
        } else if (profile) {
          setUser(null);
          clearSession();
          setPendingVerification({ uid: profile.uid, email: profile.email, name: profile.name });
        }
        // else: profile doc not written yet (signup still in flight) — leave
        // state as-is, Signup.jsx's own success callback takes over shortly.
      } else {
        setUser(null);
        clearSession();
      }
      setCheckingSession(false);
    });
    return unsubscribe;
  }, []);

  // Live-watches this account's own Firestore doc so an admin approving them
  // (or upgrading to VIP) takes effect immediately — no logout/login or
  // refresh needed — and fires the celebratory AccessGrantedModal the moment
  // it happens. The auth-state-changed effect above only re-checks Firestore
  // once, at login/refresh, so without this a tab left open through an
  // approval would stay stuck showing the old locked state.
  const prevAccessRef = useRef({ status: null, tier: null });
  useEffect(() => {
    if (!user?.uid) return;
    // Seed the baseline from what's already loaded — we only ever want to
    // alert on a change detected *after* this listener attaches, never on
    // its first snapshot (which just reflects what they already had).
    prevAccessRef.current = { status: user.status, tier: user.tier, plan: user.plan };

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const prev = prevAccessRef.current;

      const gotApproved = prev.status !== 'approved' && data.status === 'approved';
      const gotVip = (prev.status === 'approved' || data.status === 'approved') && (
        (prev.tier !== 'vip' && data.tier === 'vip') ||
        (prev.plan !== data.plan && data.plan && data.plan !== 'free')
      );
      if (gotApproved) setAccessAlert('approved');
      else if (gotVip) setAccessAlert('vip');

      prevAccessRef.current = { status: data.status, tier: data.tier, plan: data.plan };

      setUser((current) => {
        if (!current) return current;
        const updated = { ...current, ...data };
        saveSession(updated);
        return updated;
      });
      setDoneMap(data.progress || {});
    });
    return unsubscribe;
  }, [user?.uid]);

  // Synchronize active navigation state to localStorage and clean URL query params
  useEffect(() => {
    savePersistedNavState({ section, view, adminViewingSite });
  }, [section, view, adminViewingSite]);

  // Support browser back/forward buttons with persistent state sync
  useEffect(() => {
    function handlePopState() {
      const nav = getPersistedNavState();
      if (nav) {
        if (nav.section) setSection(nav.section);
        if (nav.view) setView(nav.view);
        if (typeof nav.adminViewingSite === 'boolean') setAdminViewingSite(nav.adminViewingSite);
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section, view, user]);

  // 'home' or a lesson id — every nav action (lesson card, back link,
  // prev-lesson link) goes through this one function.
  function navigate(id) {
    setView(id);
  }

  // Marks the current lesson complete and advances to the next one in its
  // track (src/data/lessons.js for 'l*' ids, src/data/appsLessons.js for
  // 'a*' ids, src/data/backtestLessons.js for 'bt*' ids,
  // src/data/psychologyLessons.js for 'psy*' ids), or back home if it was
  // the last lesson in that track. Also persisted to the user's Firestore
  // profile, so completed lessons (and therefore what's unlocked) survive
  // logout/login and follow the account across devices, not just this
  // browser session.
  function markDone(id) {
    setDoneMap((prev) => ({ ...prev, [id]: true }));
    if (user?.uid) markLessonDone(user.uid, id).catch(() => {});
    const next = id.startsWith('bt')
      ? getNextBacktestLessonId(id)
      : id.startsWith('psy')
        ? getNextPsychologyLessonId(id)
        : id.startsWith('adv')
          ? getNextAdvancedLessonId(id)
          : id.startsWith('a')
            ? getNextAppsLessonId(id)
            : getNextLessonId(id);
    setView(next ?? 'home');
    setFeedbackPrompt({ lessonId: id, lessonTitle: findLessonTitle(id) });
  }

  function findLessonTitle(id) {
    const all = [...lessons, ...appsLessons, ...backtestLessons, ...psychologyLessons, ...advancedLessons];
    return all.find((l) => l.id === id)?.title ?? null;
  }

  function handleFeedbackSubmit(rating, comment) {
    if (feedbackPrompt && user) {
      submitFeedback({
        uid: user.uid,
        name: user.name,
        email: user.email,
        lessonId: feedbackPrompt.lessonId,
        lessonTitle: feedbackPrompt.lessonTitle,
        rating,
        comment,
      }).catch(() => {});
    }
    setFeedbackPrompt(null);
  }

  // 'technical', 'apps', 'backtest', and 'psychology' are lesson tracks;
  // 'new-product' is a single approved-gated page (no lessons/doneMap,
  // same shape as 'news'/'contact'). The other category cards are
  // rendered locked and don't call this.
  function selectCategory(id) {
    if (
      id === 'technical' ||
      id === 'apps' ||
      id === 'backtest' ||
      id === 'psychology' ||
      id === 'ai-trading' ||
      id === 'new-product' ||
      id === 'advanced'
    ) {
      setSection(id);
    }
  }

  function backToCategories() {
    setSection('categories');
    setView('home');
  }

  function handleAuthSuccess(loggedInUser) {
    manualAuthRef.current = false;
    saveSession(loggedInUser);
    setUser(loggedInUser);
    setDoneMap(loggedInUser.progress || {});
    setPendingVerification(null);
    setAdminViewingSite(true);
    setSection('home');
    setView('home');
    try {
      localStorage.setItem('gzt_term_timeframe', JSON.stringify('15'));
    } catch {}
  }

  // Called synchronously right before Login calls signInWithEmailAndPassword
  // (which is what actually fires the listener above) — see manualAuthRef.
  function beginManualAuth() {
    manualAuthRef.current = true;
  }

  // Releases the guard when a login attempt doesn't end in
  // handleAuthSuccess after all (wrong password, or routed to the OTP
  // screen instead) — otherwise the listener above would stay disabled for
  // the rest of the session.
  function cancelManualAuth() {
    manualAuthRef.current = false;
  }

  function handleNeedVerification(pending) {
    setPendingVerification(pending);
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setPendingVerification(null);
    setAuthView(null);
    setSection('home');
    setView('home');
    setAdminViewingSite(true);
    setAccessAlert(null);
    clearPersistedNavState();
  }

  // Takes priority over everything else below, logged in or not — clicking
  // a password-reset link should always be able to set a new password,
  // regardless of whatever session state this browser happens to be in.
  if (resetLink) {
    return (
      <Suspense fallback={<BootScreen />}>
        <Login
          resetLink={resetLink}
          onExitResetFlow={() => setResetLink(null)}
          onLogin={handleAuthSuccess}
          onAuthStart={beginManualAuth}
          onAuthCancel={cancelManualAuth}
          onNeedVerification={handleNeedVerification}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      </Suspense>
    );
  }

  if (checkingSession) {
    return <BootScreen />;
  }

  if (pendingVerification) {
    return (
      <Suspense fallback={<BootScreen />}>
        <VerifyOtp
          pending={pendingVerification}
          onAuthStart={beginManualAuth}
          onVerified={handleAuthSuccess}
          onCancel={async () => {
            await logoutUser();
            setPendingVerification(null);
          }}
        />
      </Suspense>
    );
  }

  if (!user && authView === 'login') {
    return (
      <Suspense fallback={<BootScreen />}>
        <Login
          onLogin={handleAuthSuccess}
          onAuthStart={beginManualAuth}
          onAuthCancel={cancelManualAuth}
          onNeedVerification={handleNeedVerification}
          onSwitchToSignup={() => setAuthView('signup')}
          onBackToHome={() => setAuthView(null)}
        />
      </Suspense>
    );
  }

  if (!user && authView === 'signup') {
    return (
      <Suspense fallback={<BootScreen />}>
        <Signup
          onNeedVerification={handleNeedVerification}
          onSwitchToLogin={() => setAuthView('login')}
          onBackToHome={() => setAuthView(null)}
        />
      </Suspense>
    );
  }

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'dev'));

  const renderGlobalToast = () => {
    if (!globalNotifToast) return null;
    return (
      <div
        className={`notif-toast-banner ${globalNotifToast.type === 'news' ? 'news' : globalNotifToast.direction === 'sell' ? 'sell' : 'buy'}`}
        onClick={() => {
          if (globalNotifToast.type === 'news') {
            if (isAdmin && !adminViewingSite) setAdminViewingSite(true);
            setSection('news');
          } else if (isAdmin) {
            if (!adminViewingSite) setAdminViewingSite(true);
            setSection('ai-trading');
          } else {
            setSection('categories');
          }
          setGlobalNotifToast(null);
        }}
        style={{ cursor: 'pointer', zIndex: 99999 }}
      >
        <span className="notif-toast-icon">
          {globalNotifToast.type === 'news' ? '📰' : '⚡'}
        </span>
        <div className="notif-toast-text">
          <strong>{globalNotifToast.title}</strong>
          <span>{globalNotifToast.body}</span>
        </div>
        <button
          className="notif-toast-close"
          onClick={(e) => {
            e.stopPropagation();
            setGlobalNotifToast(null);
          }}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    );
  };

  // Same login for everyone — an admin (or dev) account goes straight to the
  // dashboard instead of the lesson site, unless they've clicked through to
  // browse the site (adminViewingSite). Admin and dev see the same
  // dashboard; only dev additionally gets the Videos panel (see isDev in
  // AdminDashboard.jsx).
  if (isAdmin && !adminViewingSite) {
    return (
      <Suspense fallback={<BootScreen />}>
        <AdminDashboard admin={user} onLogout={handleLogout} onViewSite={() => setAdminViewingSite(true)} />
        {renderGlobalToast()}
      </Suspense>
    );
  }

  // Verified but not yet approved — logged in and can see the category
  // picker, but every lesson in every track stays locked (no free preview)
  // until an admin approves the account / flips status to 'approved' in
  // Firestore. An admin or dev browsing the site gets full access regardless
  // of their own status.
  const subscriptionExpired = Boolean(
    user && Number.isFinite(user.subscriptionExpiresAt) && user.subscriptionExpiresAt <= Date.now()
  );
  const approved = Boolean(
    user && (((user.status === 'approved' && !subscriptionExpired) || user.role === 'admin' || user.role === 'dev'))
  );

  // VIP is a separate tier from approved/admin — it only gates VIP-only
  // tracks (e.g. Advanced), set via Admin Dashboard's per-user Role dropdown
  // (data/auth.js: setUserAccess). An admin or dev always counts as VIP too.
  const userPlan = getUserPlan(user);
  // Every signed-in user can open the AI Trading tab and view the plans;
  // the paid member terminal remains gated by hasActivePlan below.
  const canAccessAITrading = true;
  const isVip = Boolean(user && ((user.tier === 'vip' || userPlan !== 'free') && !subscriptionExpired)) || isAdmin;

  // Users with an active VIP subscription plan ('starter', 'pro', 'elite'),
  // or assigned VIP tier, or admin/dev accounts skip the pricing/payment section
  // and go directly into the VIP Member Terminal.
  const hasActivePlan = Boolean(
    isAdmin ||
    (!subscriptionExpired && (user?.tier === 'vip' || userPlan !== 'free'))
  );
  // An admin/dev account ignores allowedLessons entirely — that override
  // exists to restrict/grant lessons for regular accounts, and should never
  // end up locking out an admin or dev themselves.
  const allowedLessons = !isAdmin && user && Array.isArray(user.allowedLessons) ? user.allowedLessons : null;

  // Lessons within a track unlock one at a time in order (lesson N+1 needs
  // lesson N done) — except for an admin/dev, who always sees every lesson
  // in every track unlocked, and an account with an explicit allowedLessons
  // override, which is order-independent by design.
  const TRACK_LESSONS = {
    technical: lessons,
    apps: appsLessons,
    backtest: backtestLessons,
    psychology: psychologyLessons,
    advanced: advancedLessons,
  };

  function isLessonLocked(id) {
    if (isAdmin) return false;
    if (allowedLessons) return !allowedLessons.includes(id);
    if (!approved) return true;
    const trackLessons = TRACK_LESSONS[section];
    const idx = trackLessons ? trackLessons.findIndex((l) => l.id === id) : -1;
    if (idx <= 0) return false; // first lesson in the track, or an unrecognized id
    return !doneMap[trackLessons[idx - 1].id];
  }

  // Falls back to the lesson list if the restored `view` doesn't match any
  // known lesson (e.g. an old deep-link from before a lesson was renamed),
  // or if it's a lesson the account isn't (or no longer is) allowed to open
  // — e.g. an admin revoked access while this lesson was still open in a tab.
  const requestedLesson = view !== 'home' ? lessonPages[view] : null;
  const lessonBlocked =
    requestedLesson &&
    (section === 'technical' ||
      section === 'apps' ||
      section === 'backtest' ||
      section === 'psychology' ||
      section === 'advanced') &&
    isLessonLocked(view);
  const CurrentLesson = lessonBlocked ? null : requestedLesson;
  const effectiveView = CurrentLesson ? view : 'home';

  return (
    <>
      <Navbar
        onLogoClick={() => {
          setSection('home');
          setView('home');
        }}
        activeSection={section}
        onNavHome={() => {
          setSection('home');
          setView('home');
        }}
        onNavLessons={() => {
          setSection('categories');
          setView('home');
        }}
        onNavNews={
          approved
            ? () => setSection('news')
            : () => {
                if (!user) {
                  setAuthView('signup');
                } else {
                  backToCategories();
                  setPendingNoticeTick((n) => n + 1);
                }
              }
        }
        onNavAITrading={() => {
          if (!user) {
            setAuthView('signup');
          } else {
            setSection('ai-trading');
            if (!hasActivePlan) {
              setAiTradingReferralTick((n) => n + 1);
            }
          }
        }}
        onNavMemberPreview={() => setSection('member-preview')}
        onNavContact={() => setSection('contact')}
        onNavProfile={user ? () => setSection('profile') : undefined}
        onLoginClick={() => setAuthView('login')}
        onSignupClick={() => setAuthView('signup')}
        user={user}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        canAccessAITrading={canAccessAITrading}
        hasActivePlan={hasActivePlan}
        onNavAdmin={() => setAdminViewingSite(false)}
        approved={approved}
      />
      {section === 'home' ? (
        <LandingHome
          onGetStarted={() => {
            setSection('categories');
            setView('home');
          }}
          onLogin={() => setAuthView('login')}
          onExploreLessons={() => {
            setSection('categories');
            setView('home');
          }}
          onNavNews={() => {
            if (!user) {
              setAuthView('signup');
            } else if (approved) {
              setSection('news');
            } else {
              setSection('categories');
              setPendingNoticeTick((n) => n + 1);
            }
          }}
          onNavPricing={() => {
            if (!user) {
              setAuthView('signup');
            } else {
              setSection('ai-trading');
              if (!hasActivePlan) {
                setAiTradingReferralTick((n) => n + 1);
              }
            }
          }}
          user={user}
        />
      ) : (
        <Suspense fallback={<BootScreen />}>
          {LESSON_SECTIONS.includes(section) && <LessonBackdrop />}
          <div className={`wrap${LESSON_SECTIONS.includes(section) ? ' wrap-lessons' : ''}${(section === 'member-preview' || (canAccessAITrading && section === 'ai-trading')) ? ' wrap-terminal' : ''}${section === 'member-preview' ? ' wrap-member-area' : ''}`}>
          {section === 'categories' && (
            <CategoryHome
              onSelectCategory={selectCategory}
              approved={approved}
              isVip={isVip}
              noticeTick={pendingNoticeTick}
              user={user}
              onRequireAuth={() => setAuthView('signup')}
            />
          )}
          {!approved && user && ['news', 'new-product'].includes(section) && (
            <CategoryHome
              onSelectCategory={selectCategory}
              approved={approved}
              isVip={isVip}
              noticeTick={pendingNoticeTick}
              user={user}
              onRequireAuth={() => setAuthView('signup')}
            />
          )}
          {approved && section === 'news' && (
            <NewsPage onBack={backToCategories} />
          )}
          {section === 'ai-trading' && (
            <AITradingPage
              onBack={() => {
                setSection('home');
                setView('home');
              }}
              user={user}
              hasActivePlan={hasActivePlan}
              referralNoticeTick={aiTradingReferralTick}
              onOpenTerminal={() => setSection('member-preview')}
              onActivated={(activatedPlan) => {
                if (user && activatedPlan) {
                  setUser((prev) => ({
                    ...prev,
                    plan: activatedPlan?.id || activatedPlan,
                    tier: 'vip',
                    status: 'approved',
                  }));
                }
              }}
            />
          )}
          {section === 'member-preview' && (
            // Everyone gets the Coming Soon page (MemberArea gates the real area to
            // admin/dev only), so don't block unapproved users with a sign-in wall.
            <MemberArea
              user={user}
              doneMap={doneMap}
              onExit={backToCategories}
              onViewProfile={() => setSection('profile')}
              onExploreAI={() => setSection('ai-trading')}
              onViewAdmin={() => setAdminViewingSite(false)}
            />
          )}
          {section === 'contact' && (
            <ContactPage onBack={backToCategories} />
          )}
          {section === 'about' && <AboutPage onBack={backToCategories} />}
          {section === 'blog' && <BlogPage onBack={backToCategories} />}
          {section === 'terms' && <TermsPage onBack={backToCategories} />}
          {section === 'privacy' && <PrivacyPage onBack={backToCategories} />}
          {approved && hasVisitedNewProduct && (
            <NewProductHome onBack={backToCategories} isActive={section === 'new-product'} />
          )}
          {user && section === 'profile' && (
            <Profile
              onBack={backToCategories}
              uid={user.uid}
              user={user}
              doneMap={doneMap}
              onSelectCategory={approved ? selectCategory : undefined}
              calendarOnly={!approved}
              hideFooter={!approved}
            />
          )}
          {section === 'technical' && effectiveView === 'home' && (
            <Home
              doneMap={doneMap}
              onSelectLesson={navigate}
              onBack={backToCategories}
              approved={approved}
              allowedLessons={allowedLessons}
              isAdmin={isAdmin}
            />
          )}
          {section === 'apps' && effectiveView === 'home' && (
            <AppsHome
              doneMap={doneMap}
              onSelectLesson={navigate}
              onBack={backToCategories}
              approved={approved}
              allowedLessons={allowedLessons}
              isAdmin={isAdmin}
            />
          )}
          {section === 'backtest' && effectiveView === 'home' && (
            <BacktestHome
              doneMap={doneMap}
              onSelectLesson={navigate}
              onBack={backToCategories}
              approved={approved}
              allowedLessons={allowedLessons}
              isAdmin={isAdmin}
            />
          )}
          {section === 'psychology' && effectiveView === 'home' && (
            <PsychologyHome
              doneMap={doneMap}
              onSelectLesson={navigate}
              onBack={backToCategories}
              approved={approved}
              allowedLessons={allowedLessons}
              isAdmin={isAdmin}
            />
          )}
          {section === 'advanced' && effectiveView === 'home' && (
            <AdvancedHome
              doneMap={doneMap}
              onSelectLesson={navigate}
              onBack={backToCategories}
              approved={approved}
              allowedLessons={allowedLessons}
              isAdmin={isAdmin}
            />
          )}
          {(section === 'technical' ||
            section === 'apps' ||
            section === 'backtest' ||
            section === 'psychology' ||
            section === 'advanced') &&
            CurrentLesson && (
              <CurrentLesson onNavigate={navigate} onDone={() => markDone(view)} />
            )}
          </div>
        </Suspense>
      )}

      <AccessGrantedModal kind={accessAlert} onClose={() => setAccessAlert(null)} />
      {feedbackPrompt && (
        <LessonFeedbackModal
          lessonTitle={feedbackPrompt.lessonTitle}
          onSubmit={handleFeedbackSubmit}
          onSkip={() => setFeedbackPrompt(null)}
        />
      )}

      {renderGlobalToast()}
    </>
  );
}
