import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar.jsx';
import CategoryHome from './components/CategoryHome.jsx';
import Home from './components/Home.jsx';
import AppsHome from './components/AppsHome.jsx';
import NewsPage from './components/NewsPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PendingBanner from './components/PendingBanner.jsx';
import { getNextLessonId } from './data/lessons.js';
import { getNextAppsLessonId } from './data/appsLessons.js';
import { lessonPages } from './pages/registry.js';
import { auth } from './firebase.js';
import { fetchUserProfile, saveSession, loadSession, clearSession, logoutUser } from './data/auth.js';

export default function App() {
  const [user, setUser] = useState(() => loadSession());
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [pendingVerification, setPendingVerification] = useState(null); // { uid, email, name }
  const [checkingSession, setCheckingSession] = useState(true);
  // 'categories' (top-level track picker), 'technical' (lesson list + lesson
  // pages), 'news', or 'contact'.
  const [section, setSection] = useState('categories');
  const [view, setView] = useState('home');
  const [doneMap, setDoneMap] = useState({});

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

  // 'home' or a lesson id — every nav action (lesson card, back link,
  // prev-lesson link) goes through this one function.
  function navigate(id) {
    setView(id);
  }

  // Marks the current lesson complete and advances to the next one in its
  // track (src/data/lessons.js for 'l*' ids, src/data/appsLessons.js for
  // 'a*' ids), or back home if it was the last lesson in that track.
  function markDone(id) {
    setDoneMap((prev) => ({ ...prev, [id]: true }));
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
  // dashboard instead of the lesson site.
  if (user.role === 'admin') {
    return <AdminDashboard admin={user} onLogout={handleLogout} />;
  }

  // Verified but not yet approved by an admin — logged in and can browse the
  // whole site freely, but Technical lessons stay locked until someone flips
  // status to 'approved' in Firestore. The Apps track has no such gate.
  const approved = user.status === 'approved';

  const CurrentLesson = view !== 'home' ? lessonPages[view] : null;

  return (
    <>
      <Navbar
        onLogoClick={backToCategories}
        activeSection={section}
        onNavNews={() => setSection('news')}
        onNavContact={() => setSection('contact')}
        user={user}
        onLogout={handleLogout}
      />
      {/* Apps track has no approval gate, so the banner (which is about
          Technical being locked) would be misleading while browsing it. */}
      {!approved && section !== 'apps' && <PendingBanner name={user.name} />}
      <div className="wrap">
        {section === 'categories' && <CategoryHome onSelectCategory={selectCategory} />}
        {section === 'news' && <NewsPage onBack={backToCategories} />}
        {section === 'contact' && <ContactPage onBack={backToCategories} />}
        {section === 'technical' && view === 'home' && (
          <Home doneMap={doneMap} onSelectLesson={navigate} onBack={backToCategories} approved={approved} />
        )}
        {section === 'apps' && view === 'home' && (
          <AppsHome doneMap={doneMap} onSelectLesson={navigate} onBack={backToCategories} />
        )}
        {(section === 'technical' || section === 'apps') && CurrentLesson && (
          <CurrentLesson onNavigate={navigate} onDone={() => markDone(view)} />
        )}
      </div>
    </>
  );
}
