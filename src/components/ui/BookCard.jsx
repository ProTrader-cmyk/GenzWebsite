import { BookIcon } from './CategoryIcons.jsx';

// The book-info pill shown on the Psychology track's list page (under the
// header) and again on each chapter's lesson page — kept as one shared
// component so both stay visually identical.
export default function BookCard({ title, author, chapterTag, style }) {
  return (
    <div className="box box-g" style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: 'var(--bg2)',
          border: '1px solid var(--gline)',
          color: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <BookIcon width="22" height="22" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>{author}</div>
      </div>
      {chapterTag && (
        <span className="badge bg" style={{ marginLeft: 'auto', flex: 'none' }}>
          {chapterTag}
        </span>
      )}
    </div>
  );
}
