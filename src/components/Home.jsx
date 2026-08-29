import { useState } from 'react';
import { lessons } from '../data/lessons.js';
import LessonCard from './LessonCard.jsx';
import Footer from './Footer.jsx';
import { LockIcon } from './ui/CategoryIcons.jsx';

export default function Home({ doneMap, onSelectLesson, onBack, approved }) {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const total = lessons.length;
  const count = Object.keys(doneMap).length;
  const pct = Math.round((count / total) * 100);
  const showProgress = count > 0;

  return (
    <div className="view active" id="v-home">
      <button className="back" onClick={onBack}>
        ← ផ្នែកសិក្សា
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">Technical for Beginner</div>
        <h2>មូលដ្ឋាន Smart Money សម្រាប់អ្នកចាប់ផ្តើម</h2>
        <p>Market Structure · BOS/CHoCH · Order Block · FVG · Liquidity · EMA — រៀនតាមលំដាប់ ជាជំហានៗ</p>
      </div>

      <div id="prog-outer" style={{ display: showProgress ? 'block' : 'none' }}>
        <div className="prog-info">
          <span>វឌ្ឍនភាព</span>
          <span>
            {count} / {total}
          </span>
        </div>
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: pct + '%' }}></div>
        </div>
      </div>

      <p className="sec-label sg" style={{ marginTop: 8 }}>
        មេរៀន
      </p>

      {lessons.map((lesson, i) => {
        // A pending (not-yet-approved) account is locked out of every
        // lesson, including the first — an approved account unlocks them
        // the normal way, one at a time as each prior lesson is finished.
        const prevDone = i === 0 || !!doneMap[lessons[i - 1].id];
        const needsApproval = !approved;
        const locked = needsApproval || !prevDone;
        return (
          <LessonCard
            key={lesson.id}
            index={i + 1}
            lesson={lesson}
            done={!!doneMap[lesson.id]}
            locked={locked}
            lockedReason={needsApproval ? 'ត្រូវការការអនុម័តពី Admin' : 'ត្រូវបញ្ចប់មេរៀនមុនសិន'}
            onClick={() => {
              if (needsApproval) {
                setShowAccessModal(true);
                return;
              }
              if (!prevDone) return;
              onSelectLesson(lesson.id);
            }}
          />
        );
      })}

      <Footer />

      {showAccessModal && (
        <div className="modal-overlay" onClick={() => setShowAccessModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">ត្រូវការសិទ្ធិចូលប្រើ</h3>
            <p className="modal-text">
              គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័តពី Admin។ សូមទាក់ទង Admin ដើម្បីទទួលបានសិទ្ធិចូលរៀនមេរៀននេះ។
            </p>
            <button className="modal-btn" onClick={() => setShowAccessModal(false)}>
              យល់ព្រម
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
