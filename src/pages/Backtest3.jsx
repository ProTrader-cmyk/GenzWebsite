import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import Rule from '../components/ui/Rule.jsx';
import { getBacktestLessonMeta } from '../data/backtestLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ src, caption }) {
  // Skip the block entirely until its URL is set, instead of showing an
  // empty/broken player.
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <video controls playsInline preload="metadata" style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}>
        <source src={src} type="video/mp4" />
      </video>
      {caption && <div className="cap">{caption}</div>}
    </div>
  );
}

const meta = getBacktestLessonMeta('bt3');

const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    scenarioTag: 'សេណារីយ៉ូ ៣ នៃ ៤',
    intro: '🎯 ព្យាយាមទាយថាតើអ្វីនឹងកើតឡើងបន្ទាប់ មុននឹងអ្នកឃើញលទ្ធផល!',
    caption: 'ព្យួរ (Pause) វីដេអូបានគ្រប់ពេល ដើម្បីពិនិត្យមើល Candle ម្តងមួយៗ។',
    doneTitle: '✅ ធ្វើបានល្អ!',
    doneBody: 'នៅសល់តែមួយទៀត — បន្តទៅសេណារីយ៉ូចុងក្រោយ នៅពេលអ្នកត្រៀមខ្លួន!',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    scenarioTag: 'Scenario 3 of 4',
    intro: '🎯 Try to predict what happens next before you see the outcome!',
    caption: 'Pause anytime to study a candle before moving on.',
    doneTitle: '✅ Nice work!',
    doneBody: 'One more to go — the final scenario is next whenever you\'re ready!',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    scenarioTag: '场景 3 / 4',
    intro: '🎯 在看到结果之前，先试着自己预测接下来会发生什么！',
    caption: '随时可以暂停，仔细研究每一根蜡烛线。',
    doneTitle: '✅ 做得好！',
    doneBody: '只剩最后一个了 — 准备好后就可以进行最后的场景！',
  },
};

export default function Backtest3({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['bt-scenario-3']?.url;

  return (
    <LessonLayout
      id="bt3"
      track="backtest"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <span className="badge bb">{t.scenarioTag}</span>
      <Box variant="b" style={{ marginTop: 12 }}>
        {t.intro}
      </Box>

      <LessonVideo src={src} caption={t.caption} />

      {src && <Rule title={t.doneTitle}>{t.doneBody}</Rule>}
    </LessonLayout>
  );
}
