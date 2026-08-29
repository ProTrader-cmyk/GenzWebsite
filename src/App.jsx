import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import { getNextLessonId } from './data/lessons.js';
import { lessonPages } from './pages/registry.js';

export default function App() {
  const [view, setView] = useState('home');
  const [doneMap, setDoneMap] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // 'home' or a lesson id — every nav action (logo, lesson card, back
  // link, prev-lesson link) goes through this one function.
  function navigate(id) {
    setView(id);
  }

  // Marks the current lesson complete and advances to the next one in
  // src/data/lessons.js, or back home if it was the last lesson. Adding a
  // new lesson to that list is all this needs to keep working.
  function markDone(id) {
    setDoneMap((prev) => ({ ...prev, [id]: true }));
    setView(getNextLessonId(id) ?? 'home');
  }

  const CurrentLesson = view !== 'home' ? lessonPages[view] : null;

  return (
    <>
      <Navbar onLogoClick={() => navigate('home')} />
      <div className="wrap">
        {view === 'home' && <Home doneMap={doneMap} onSelectLesson={navigate} />}
        {CurrentLesson && <CurrentLesson onNavigate={navigate} onDone={() => markDone(view)} />}
      </div>
    </>
  );
}
