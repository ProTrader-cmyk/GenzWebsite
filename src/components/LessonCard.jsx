export default function LessonCard({ index, lesson, done, onClick }) {
  return (
    <div className={`lcard${done ? ' done' : ''}`} onClick={onClick}>
      <div className="lnum">{index}</div>
      <div className="linfo">
        <div className="lt">{lesson.title}</div>
        <div className="ls">{lesson.subtitle}</div>
      </div>
      <div className="larr">{done ? '✓' : '→'}</div>
    </div>
  );
}
