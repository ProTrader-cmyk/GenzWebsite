import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import Rule from '../components/ui/Rule.jsx';
import BookCard from '../components/ui/BookCard.jsx';
import { getPsychologyLessonMeta } from '../data/psychologyLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ src, caption }) {
  // Skip the block entirely until its URL is set, instead of showing an
  // empty/broken player.
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        preload="metadata"
        style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
      >
        <source src={src} type="video/mp4" />
      </video>
      {caption && <div className="cap">{caption}</div>}
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
    intro: '📖 រកកន្លែងស្រួល ហើយចាប់ផ្តើមចូលមេរៀននេះ — វាដាក់មូលដ្ឋានគ្រឹះសម្រាប់អ្វីៗគ្រប់យ៉ាងដែលនៅសល់ក្នុងសៀវភៅនេះ។',
    caption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — ចំណុចមួយចំនួននៅទីនេះអាចផ្លាស់ប្តូររបៀបដែលអ្នកគិតអំពី Trading ។',
    doneTitle: '🌱 ធ្វើបានល្អ!',
    doneBody: 'ចិត្តវិទ្យា Trading មិនមែនប្រណាំងទេ — ចំណាយពេលឲ្យបានគ្រប់គ្រាន់ដើម្បីយល់ច្បាស់មុននឹងបន្ត។',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'by Mark Douglas',
    chapterTag: 'Chapter 1',
    chapterHeading: 'Road to Success',
    intro: "📖 Grab something comfy and get settled in — this chapter lays the groundwork for everything else in the book.",
    caption: "Listen closely — a few ideas here can genuinely change how you think about trading.",
    doneTitle: '🌱 Nice work!',
    doneBody: "Trading psychology isn't a race — take the time you need to let it sink in before moving on.",
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'Mark Douglas 著',
    chapterTag: '第一章',
    chapterHeading: '通往成功之路',
    intro: '📖 找个舒服的地方坐下来，开始学习这一章 — 它为整本书打下基础。',
    caption: '用心聆听 — 这里的一些观点可能会真正改变你对交易的看法。',
    doneTitle: '🌱 做得好！',
    doneBody: '交易心理学不是比赛 — 花点时间消化理解，再继续下一步。',
  },
};

export default function Psychology1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['psy-ch1']?.url;

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

      <Box variant="g">{t.intro}</Box>

      <LessonVideo src={src} caption={t.caption} />

      {src && <Rule title={t.doneTitle}>{t.doneBody}</Rule>}
    </LessonLayout>
  );
}
