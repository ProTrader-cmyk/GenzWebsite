import { useState } from 'react';

/**
 * options: [{ label, type: 'ok' | 'no' }]
 * feedback: { ok: node, no: node }
 */
export default function Quiz({ question, options, feedback }) {
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [resultType, setResultType] = useState(null);

  function handleClick(idx, type) {
    if (answered) return;
    setAnswered(true);
    setSelectedIdx(idx);
    setResultType(type);
  }

  return (
    <div className="quiz">
      <div className="quiz-q">{question}</div>
      {options.map((opt, idx) => (
        <div
          key={idx}
          className={`qo${answered && idx === selectedIdx ? ' ' + resultType : ''}`}
          style={{ pointerEvents: answered ? 'none' : 'auto' }}
          onClick={() => handleClick(idx, opt.type)}
        >
          {opt.label}
        </div>
      ))}
      <div className={`qfb ok${resultType === 'ok' ? ' show' : ''}`}>{feedback.ok}</div>
      <div className={`qfb no${resultType === 'no' ? ' show' : ''}`}>{feedback.no}</div>
    </div>
  );
}
