import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

// Fired by App.jsx's markDone right after a lesson completes — lets the user
// rate the lesson (and leave an optional comment) before it navigates on.
// Skippable at any time; only submits when a star rating was picked.
export default function LessonFeedbackModal({ lessonTitle, onSubmit, onSkip }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).feedback;
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rating || submitting) return;
    setSubmitting(true);
    await onSubmit(rating, comment.trim());
    setSubmitting(false);
  }

  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal-box fb-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" aria-label={t.skip} onClick={onSkip}>
          ×
        </button>
        <h3 className="modal-title">{t.title}</h3>
        {lessonTitle && (
          <p className="modal-text fb-modal-sub">
            {t.subPrefix} <b>{lessonTitle}</b>
          </p>
        )}

        <div className="fb-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`fb-star${n <= (hoverRating || rating) ? ' filled' : ''}`}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="fb-textarea"
          placeholder={t.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="fb-actions">
          <button className="modal-btn" onClick={handleSubmit} disabled={!rating || submitting}>
            {submitting ? t.submitting : t.submit}
          </button>
          <button type="button" className="fb-skip" onClick={onSkip}>
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
