import { useEffect } from 'react';
import logo from '../assets/Fav.png';

const DURATION_MS = 1100;

// Plays once right after a successful login/signup — the logo zooms toward
// the viewer while the overlay fades, so the site feels like it's revealed
// "through" the logo instead of just popping in. Purely cosmetic: it sits
// on top of the already-rendered page and unmounts itself via onDone.
export default function IntroTransition({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="intro-overlay">
      <img src={logo} alt="" className="intro-overlay-logo" />
    </div>
  );
}
