import { LockIcon } from './ui/CategoryIcons.jsx';

export default function LessonCard({ index, lesson, done, locked, onClick }) {
  return (
    <div
      className={`lcard${done ? ' done' : ''}${locked ? ' locked' : ''}`}
      onClick={() => !locked && onClick()}
    >
      <div className="lnum">{locked ? <LockIcon width="15" height="15" /> : index}</div>
      <div className="linfo">
        <div className="lt">{lesson.title}</div>
        <div className="ls">{locked ? 'ត្រូវបញ្ចប់មេរៀនមុនសិន' : lesson.subtitle}</div>
      </div>
      <div className="larr">{done ? '✓' : locked ? '' : '→'}</div>
    </div>
  );
}
