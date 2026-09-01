import LessonLayout from '../components/LessonLayout.jsx';
import { getPsychologyLessonMeta } from '../data/psychologyLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ label, src }) {
  // Skip the block entirely until its URL is set, instead of showing an
  // empty/broken player.
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
        {label}
      </div>
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
    videoLabel: 'ជំពូកទី ១៖ ផ្លូវទៅកាន់ជោគជ័យ',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    videoLabel: 'Chapter 1: Road to Success',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    videoLabel: '第一章：通往成功之路',
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
      <LessonVideo label={t.videoLabel} src={videos['psy-ch1']?.url} />
    </LessonLayout>
  );
}
