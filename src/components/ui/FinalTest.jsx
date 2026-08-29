import { useEffect, useState } from 'react';

// Unlike Quiz (locks after the first answer), a final-test question can be
// retried indefinitely until the learner picks the correct option.
function FinalTestQuestion({ index, question, options, feedback, onAnswer }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  function handleClick(idx, correct) {
    setSelectedIdx(idx);
    setIsCorrect(correct);
    onAnswer(correct);
  }

  return (
    <div className="quiz">
      <div className="quiz-q">
        {index}. {question}
      </div>
      {options.map((opt, idx) => (
        <div
          key={idx}
          className={`qo${selectedIdx === idx ? (opt.correct ? ' ok' : ' no') : ''}`}
          onClick={() => handleClick(idx, opt.correct)}
        >
          {opt.label}
        </div>
      ))}
      {isCorrect !== null && (
        <div className={`qfb show ${isCorrect ? 'ok' : 'no'}`}>{isCorrect ? feedback.ok : feedback.no}</div>
      )}
    </div>
  );
}

// A gated quiz block: every question (`{ question, options: [{ label, correct }], feedback: { ok, no } }`)
// must be answered correctly before the lesson can be marked done. Reports
// { passed, total, unlocked } to the parent via `onProgressChange` so it can
// pass `nextDisabled`/`nextLabel` through to LessonLayout's finish button.
// `lockedHint` customizes the locked-state progress line (e.g. the final
// lesson of a course says "...to finish the Course" instead of "...to
// unlock the next lesson").
export default function FinalTest({
  questions,
  onProgressChange,
  lockedHint = 'ត្រូវត្រូវទាំងអស់ដើម្បីដោះសោមេរៀនបន្ទាប់',
}) {
  const [results, setResults] = useState({});

  const total = questions.length;
  const passed = Object.values(results).filter(Boolean).length;
  const unlocked = total > 0 && passed >= total;

  useEffect(() => {
    onProgressChange({ passed, total, unlocked });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passed, total, unlocked]);

  return (
    <>
      {questions.map((q, qi) => (
        <FinalTestQuestion
          key={qi}
          index={qi + 1}
          question={q.question}
          options={q.options}
          feedback={q.feedback}
          onAnswer={(correct) => setResults((prev) => ({ ...prev, [qi]: correct }))}
        />
      ))}
      <div className={`ftest-progress${unlocked ? ' done' : ''}`}>
        {unlocked ? `ឆ្លើយត្រូវ ${passed} / ${total} — ដោះសោរួចរាល់ហើយ ✓` : `ឆ្លើយត្រូវ ${passed} / ${total} — ${lockedHint} 🔒`}
      </div>
    </>
  );
}
