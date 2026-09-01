import LessonLayout from '../components/LessonLayout.jsx';
import { getBacktestLessonMeta } from '../data/backtestLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

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

const meta = getBacktestLessonMeta('bt4');

const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: 'អនុវត្តន៍ Backtest ជាក់ស្តែងតាមសេណារីយ៉ូនេះ។',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    intro: 'Hands-on backtesting practice for this scenario.',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    intro: '针对此场景进行实际回测练习。',
  },
};

export default function Backtest4({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();

  return (
    <LessonLayout
      id="bt4"
      track="backtest"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <p>{t.intro}</p>
      <LessonVideo src={videos['bt-scenario-4']?.url} />
    </LessonLayout>
  );
}
