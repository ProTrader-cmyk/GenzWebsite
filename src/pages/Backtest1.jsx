import LessonLayout from '../components/LessonLayout.jsx';
import { getBacktestLessonMeta } from '../data/backtestLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ label, src }) {
  // Not every scenario video is uploaded yet — skip the block entirely
  // instead of showing an empty/broken player until its URL is set.
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

const meta = getBacktestLessonMeta('bt1');

// Placeholder copy for now — replace with real per-scenario explanations
// once written; the video/structure underneath doesn't need to change.
const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: 'អនុវត្តន៍ Backtest សម្រាប់អ្នកចាប់ផ្តើម — មើលវីដេអូខាងក្រោមនីមួយៗ ដើម្បីរៀនពីរបៀបធ្វើ Backtest ជាក់ស្តែងតាមសេណារីយ៉ូផ្សេងៗ។',
    scenario1: 'សេណារីយ៉ូទី ១',
    scenario2: 'សេណារីយ៉ូទី ២',
    scenario3: 'សេណារីយ៉ូទី ៣',
    scenario4: 'សេណារីយ៉ូទី ៤',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    intro: 'Backtest practice for beginners — watch each scenario below to learn how to backtest in practice.',
    scenario1: 'Scenario 1',
    scenario2: 'Scenario 2',
    scenario3: 'Scenario 3',
    scenario4: 'Scenario 4',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    intro: '初学者回测练习 — 观看以下每个场景，学习如何进行实际回测。',
    scenario1: '场景 1',
    scenario2: '场景 2',
    scenario3: '场景 3',
    scenario4: '场景 4',
  },
};

export default function Backtest1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();

  return (
    <LessonLayout
      id="bt1"
      track="backtest"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <p>{t.intro}</p>

      <LessonVideo label={t.scenario1} src={videos['bt-scenario-1']?.url} />
      <LessonVideo label={t.scenario2} src={videos['bt-scenario-2']?.url} />
      <LessonVideo label={t.scenario3} src={videos['bt-scenario-3']?.url} />
      <LessonVideo label={t.scenario4} src={videos['bt-scenario-4']?.url} />
    </LessonLayout>
  );
}
