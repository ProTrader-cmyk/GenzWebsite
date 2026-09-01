import LessonLayout from '../components/LessonLayout.jsx';
import { getPsychologyLessonMeta } from '../data/psychologyLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';
import { BookIcon } from '../components/ui/CategoryIcons.jsx';

function BookCard({ title, author, chapterTag }) {
  return (
    <div className="box box-g" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
      <span className="badge bg" style={{ marginLeft: 'auto', flex: 'none' }}>
        {chapterTag}
      </span>
    </div>
  );
}

function LessonVideo({ src }) {
  // Skip the block entirely until its URL is set, instead of showing an
  // empty/broken player.
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <video controls playsInline preload="metadata" style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

const meta = getPsychologyLessonMeta('psy1');

const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'និពន្ធដោយ Mark Douglas',
    chapterTag: 'ជំពូកទី ១',
    chapterHeading: 'ផ្លូវទៅកាន់ជោគជ័យ',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'by Mark Douglas',
    chapterTag: 'Chapter 1',
    chapterHeading: 'Road to Success',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'Mark Douglas 著',
    chapterTag: '第一章',
    chapterHeading: '通往成功之路',
  },
};

export default function Psychology1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();

  return (
    <LessonLayout
      id="psy1"
      track="psychology"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <BookCard title={t.bookTitle} author={t.bookAuthor} chapterTag={t.chapterTag} />

      <h3>
        <span className="bar"></span>
        {t.chapterHeading}
      </h3>

      <LessonVideo src={videos['psy-ch1']?.url} />
    </LessonLayout>
  );
}
