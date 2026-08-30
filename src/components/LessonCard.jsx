import { LockIcon } from './ui/CategoryIcons.jsx';

export default function LessonCard({ index, lesson, done, locked, lockedTitle, lockedReason, onClick }) {
  return (
    <div className={`lcard${done ? ' done' : ''}${locked ? ' locked' : ''}`} onClick={onClick}>
      <div className="lnum">{locked ? <LockIcon width="15" height="15" /> : index}</div>
      <div className="linfo">
        <div className="lt">{locked ? lockedTitle : lesson.title}</div>
        <div className="ls">{locked ? lockedReason : lesson.subtitle}</div>
      </div>
      <div className="larr">{done ? '✓' : locked ? '' : '→'}</div>
    </div>
  );
}
