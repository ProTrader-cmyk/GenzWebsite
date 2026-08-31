import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar.jsx';
import CategoryHome from './components/CategoryHome.jsx';
import Home from './components/Home.jsx';
import AppsHome from './components/AppsHome.jsx';
import NewsPage from './components/NewsPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import IndicatorPage from './components/IndicatorPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PendingBanner from './components/PendingBanner.jsx';
import { getNextLessonId } from './data/lessons.js';
import { getNextAppsLessonId } from './data/appsLessons.js';
import { lessonPages } from './pages/registry.js';
import { auth } from './firebase.js';
import { fetchUserProfile, saveSession, loadSession, clearSession, logoutUser, markLessonDone } from './data/auth.js';

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
  // An admin account defaults to the dashboard; this flips to true when they
  // click "Go back to website" so they can browse the site like any user.
  const [adminViewingSite, setAdminViewingSite] = useState(false);

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
  // 'a*' ids), or back home if it was the last lesson in that track. Also
  // persisted to the user's Firestore profile, so completed lessons (and
  // therefore what's unlocked) survive logout/login and follow the account
  // across devices, not just this browser session.
  function markDone(id) {
    setDoneMap((prev) => ({ ...prev, [id]: true }));
    markLessonDone(user.uid, id).catch(() => {});
    const next = id.startsWith('a') ? getNextAppsLessonId(id) : getNextLessonId(id);
    setView(next ?? 'home');
  }

  // 'technical' and 'apps' have content today — the other category cards
  // are rendered locked and don't call this.
  function selectCategory(id) {
    if (id === 'technical' || id === 'apps') setSection(id);
  }

  function backToCategories() {
    setSection('categories');
    setView('home');
  }

  function handleAuthSuccess(loggedInUser) {
    saveSession(loggedInUser);
    setUser(loggedInUser);
    setDoneMap(loggedInUser.progress || {});
    setPendingVerification(null);
    setSection('categories');
    setView('home');
  }

  function handleNeedVerification(pending) {
    setPendingVerification(pending);
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

  // Verified but not yet approved by an admin — logged in and can browse the
  // whole site freely, but Technical lessons stay locked until someone flips
  // status to 'approved' in Firestore. The Apps track has no such gate. An
  // admin browsing the site gets full access regardless of their own status.
  const approved = user.status === 'approved' || user.role === 'admin';

  // An admin can grant a specific list of lesson ids per user (Admin
  // Dashboard "Permissions"), overriding the default approved/pending rule
  // entirely for that account — across both tracks. Absent (not an array)
  // means "no override", so the default rule below applies as before.
  const allowedLessons = Array.isArray(user.allowedLessons) ? user.allowedLessons : null;

  function isLessonLocked(id) {
    if (allowedLessons) return !allowedLessons.includes(id);
    if (id.startsWith('l')) return !approved && id !== 'l1'; // Technical default
    return false; // Apps default: always open
  }

  // Falls back to the lesson list if the restored `view` doesn't match any
  // known lesson (e.g. an old deep-link from before a lesson was renamed),
  // or if it's a lesson the account isn't (or no longer is) allowed to open
  // — e.g. an admin revoked access while this lesson was still open in a
  // tab. Lesson 1 stays open as a preview even when pending (unless a
  // permissions override says otherwise).
  const requestedLesson = view !== 'home' ? lessonPages[view] : null;
  const lessonBlocked =
    requestedLesson && (section === 'technical' || section === 'apps') && isLessonLocked(view);
  const CurrentLesson = lessonBlocked ? null : requestedLesson;
  const effectiveView = CurrentLesson ? view : 'home';

  return (
    <>
      <Navbar
        onLogoClick={backToCategories}
        activeSection={section}
        onNavHome={backToCategories}
        onNavIndicator={() => setSection('indicator')}
        onNavNews={() => setSection('news')}
        onNavContact={() => setSection('contact')}
        user={user}
        onLogout={handleLogout}
        isAdmin={user.role === 'admin'}
        onNavAdmin={() => setAdminViewingSite(false)}
      />
      {/* Apps track has no approval gate, so the banner (which is about
          Technical being locked) would be misleading while browsing it. */}
      {!approved && section !== 'apps' && <PendingBanner name={user.name} />}
      <div className="wrap">
        {section === 'categories' && <CategoryHome onSelectCategory={selectCategory} approved={approved} />}
        {section === 'news' && <NewsPage onBack={backToCategories} />}
        {section === 'indicator' && <IndicatorPage onBack={backToCategories} />}
        {section === 'contact' && <ContactPage onBack={backToCategories} />}
        {section === 'technical' && effectiveView === 'home' && (
          <Home
            doneMap={doneMap}
            onSelectLesson={navigate}
            onBack={backToCategories}
            approved={approved}
            allowedLessons={allowedLessons}
          />
        )}
        {section === 'apps' && effectiveView === 'home' && (
          <AppsHome
            doneMap={doneMap}
            onSelectLesson={navigate}
            onBack={backToCategories}
            allowedLessons={allowedLessons}
          />
        )}
        {(section === 'technical' || section === 'apps') && CurrentLesson && (
          <CurrentLesson onNavigate={navigate} onDone={() => markDone(view)} />
        )}
      </div>
    </>
  );
}
