import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar.jsx';
import CategoryHome from './components/CategoryHome.jsx';
import Home from './components/Home.jsx';
import AppsHome from './components/AppsHome.jsx';
import BacktestHome from './components/BacktestHome.jsx';
import PsychologyHome from './components/PsychologyHome.jsx';
import NewProductHome from './components/NewProductHome.jsx';
import AdvancedHome from './components/AdvancedHome.jsx';
import NewsPage from './components/NewsPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import PricingPage from './components/PricingPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { lessons, getNextLessonId } from './data/lessons.js';
import { appsLessons, getNextAppsLessonId } from './data/appsLessons.js';
import { backtestLessons, getNextBacktestLessonId } from './data/backtestLessons.js';
import { psychologyLessons, getNextPsychologyLessonId } from './data/psychologyLessons.js';
import { lessonPages } from './pages/registry.js';
import { auth } from './firebase.js';
import {
  fetchUserProfile,
  saveSession,
  loadSession,
  clearSession,
  logoutUser,
  markLessonDone,
  markPaymentClicked,
} from './data/auth.js';

const NAV_KEY = 'gzt_nav';

// Where the user was (category picker / lesson list / a specific lesson) —
// restored on mount so an F5 refresh doesn't dump them back on the category
// picker mid-lesson.
function loadNav() {
  try {
    const saved = JSON.parse(localStorage.getItem(NAV_KEY));
    if (saved && typeof saved.section === 'string' && typeof saved.view === 'string') {
      return saved;
    }
  } catch {
    // ignore malformed value
  }
  return { section: 'categories', view: 'home' };
}

export default function App() {
  const [user, setUser] = useState(() => loadSession());
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [pendingVerification, setPendingVerification] = useState(null); // { uid, email, name }
  const [checkingSession, setCheckingSession] = useState(true);
  // 'categories' (top-level track picker), 'technical' (lesson list + lesson
  // pages), 'news', or 'contact'.
  const [section, setSection] = useState(() => loadNav().section);
  const [view, setView] = useState(() => loadNav().view);
  const [doneMap, setDoneMap] = useState({});
  // Bumped every time a pending (not-approved) user clicks a nav item that's
  // blocked for them (e.g. News) — passed to CategoryHome so it re-opens its
  // "contact admin" modal even when the user was already sitting on the
  // category picker (where switching `section` to 'categories' again is a
  // no-op and wouldn't otherwise remount/re-trigger it).
  const [pendingNoticeTick, setPendingNoticeTick] = useState(0);
  // An admin account defaults to the dashboard; this flips to true when they
  // click "Go back to website" so they can browse the site like any user.
  const [adminViewingSite, setAdminViewingSite] = useState(false);
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section, view, user]);

  useEffect(() => {
    localStorage.setItem(NAV_KEY, JSON.stringify({ section, view }));
  }, [section, view]);

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
    markLessonDone(user.uid, id).catch(() => {});
    const next = id.startsWith('bt')
      ? getNextBacktestLessonId(id)
      : id.startsWith('psy')
        ? getNextPsychologyLessonId(id)
        : id.startsWith('a')
          ? getNextAppsLessonId(id)
          : getNextLessonId(id);
    setView(next ?? 'home');
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
    setSection('categories');
    setView('home');
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

  // Persisted to Firestore (not just local state) so a user who's clicked
  // Pay isn't sent back to the Pricing gate on refresh or after logging
  // back in — see markPaymentClicked in data/auth.js.
  function handlePaySuccess() {
    markPaymentClicked(user.uid).catch(() => {});
    const updated = { ...user, clickedPay: true };
    setUser(updated);
    saveSession(updated);
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setPendingVerification(null);
    setAuthView('login');
    setSection('categories');
    setView('home');
    setAdminViewingSite(false);
    localStorage.removeItem(NAV_KEY);
  }

  if (checkingSession) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }

  if (pendingVerification) {
    return (
      <VerifyOtp
        pending={pendingVerification}
        onAuthStart={beginManualAuth}
        onVerified={handleAuthSuccess}
        onCancel={async () => {
          await logoutUser();
          setPendingVerification(null);
        }}
      />
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login
        onLogin={handleAuthSuccess}
        onAuthStart={beginManualAuth}
        onAuthCancel={cancelManualAuth}
        onNeedVerification={handleNeedVerification}
        onSwitchToSignup={() => setAuthView('signup')}
      />
    ) : (
      <Signup
        onNeedVerification={handleNeedVerification}
        onSwitchToLogin={() => setAuthView('login')}
      />
    );
  }

  // Same login for everyone — an admin account goes straight to the
  // dashboard instead of the lesson site, unless they've clicked through to
  // browse the site (adminViewingSite).
  if (user.role === 'admin' && !adminViewingSite) {
    return <AdminDashboard admin={user} onLogout={handleLogout} onViewSite={() => setAdminViewingSite(true)} />;
  }

  // Verified but not paid/approved — logged in and can see the category
  // picker, but every lesson in every track stays locked (no free preview)
  // until either an admin approves the account / flips status to
  // 'approved' in Firestore, or the account pays on the Pricing page
  // (which also sets status: 'approved', see genztrader-news-api/payment.js).
  // An admin browsing the site gets full access regardless of their own
  // status.
  const approved = user.status === 'approved' || user.role === 'admin';

  // VIP is a separate tier from approved/admin — it only gates VIP-only
  // tracks (e.g. Advanced), set via Admin Dashboard's per-user Tier
  // dropdown (data/auth.js: setUserTier). An admin always counts as VIP too.
  const isVip = user.tier === 'vip' || user.role === 'admin';

  // Not-yet-approved accounts go straight into the category picker like
  // everyone else — every track stays locked (isLessonLocked below) and
  // CategoryHome shows its own "contact admin" modal automatically. The
  // Pricing page is no longer forced on first sign-up; it's still reachable
  // from the nav for anyone who wants to pay directly.

  // An admin can grant a specific list of lesson ids per user (Admin
  // Dashboard "Permissions"), overriding the default approved/pending rule
  // entirely for that account — across both tracks. Absent (not an array)
  // means "no override", so the default rule below applies as before.
  const allowedLessons = Array.isArray(user.allowedLessons) ? user.allowedLessons : null;
  const isAdmin = user.role === 'admin';

  // Lessons within a track unlock one at a time in order (lesson N+1 needs
  // lesson N done) — except for an admin, who always sees every lesson in
  // every track unlocked, and an account with an explicit allowedLessons
  // override, which is order-independent by design.
  const TRACK_LESSONS = { technical: lessons, apps: appsLessons, backtest: backtestLessons, psychology: psychologyLessons };

  function isLessonLocked(id) {
    if (allowedLessons) return !allowedLessons.includes(id);
    if (!approved) return true;
    if (isAdmin) return false;
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
    (section === 'technical' || section === 'apps' || section === 'backtest' || section === 'psychology') &&
    isLessonLocked(view);
  const CurrentLesson = lessonBlocked ? null : requestedLesson;
  const effectiveView = CurrentLesson ? view : 'home';

  return (
    <>
      <Navbar
        onLogoClick={backToCategories}
        activeSection={section}
        onNavHome={backToCategories}
        onNavNews={
          approved
            ? () => setSection('news')
            : () => {
                backToCategories();
                setPendingNoticeTick((n) => n + 1);
              }
        }
        onNavContact={() => setSection('contact')}
        user={user}
        onLogout={handleLogout}
        isAdmin={user.role === 'admin'}
        onNavAdmin={() => setAdminViewingSite(false)}
        approved={approved}
      />
      <div className="wrap">
        {section === 'categories' && (
          <CategoryHome
            onSelectCategory={selectCategory}
            approved={approved}
            isVip={isVip}
            noticeTick={pendingNoticeTick}
          />
        )}
        {section === 'news' && <NewsPage onBack={backToCategories} />}
        {section === 'pricing' && <PricingPage onBack={backToCategories} onPay={handlePaySuccess} />}
        {section === 'contact' && <ContactPage onBack={backToCategories} />}
        {section === 'new-product' && <NewProductHome onBack={backToCategories} isAdmin={isAdmin} />}
        {section === 'advanced' && <AdvancedHome onBack={backToCategories} />}
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
        {(section === 'technical' || section === 'apps' || section === 'backtest' || section === 'psychology') &&
          CurrentLesson && <CurrentLesson onNavigate={navigate} onDone={() => markDone(view)} />}
      </div>
    </>
  );
}
