import { useEffect, useState } from 'react';

/**
 * Mirrors the original vanilla-JS behaviour: the SVG's .ac children fade/slide
 * in via the .anim.go CSS animation. It plays once on mount (matching the
 * original "show()" restart-on-navigate behaviour, since navigating away
 * unmounts this component) and can be replayed on demand.
 */
export default function AnimatedFig({ style, caption, children }) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    setGo(true);
  }, []);

  function replay() {
    setGo(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
  }

  return (
    <>
      <div className={`fig anim${go ? ' go' : ''}`} style={style}>
        {children}
        {caption && <div className="cap">{caption}</div>}
      </div>
      <button className="replay-btn" onClick={replay}>
        ▶ ចាក់ម្ដងទៀត
      </button>
    </>
  );
}
