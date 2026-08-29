// Bottom prev/next bar for a lesson page. Pass `onPrev` only when there is
// an actual previous lesson to link to — omit it (as lesson 1 does) to
// render the original disabled "← ដើម" state instead of a clickable link.
// Pass `nextDisabled` when the lesson gates completion behind something
// (e.g. a FinalTest) — the button renders locked and inert until cleared.
export default function LessonNav({ prevLabel, onPrev, nextLabel, onNext, nextDisabled }) {
  return (
    <div className="navend">
      {onPrev ? <a onClick={onPrev}>{prevLabel}</a> : <span className="dis">{prevLabel}</span>}
      <button className={`nbtn${nextDisabled ? ' locked' : ''}`} onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </button>
    </div>
  );
}
