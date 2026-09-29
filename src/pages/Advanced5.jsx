import LessonLayout from '../components/LessonLayout.jsx';
import { getAdvancedLessonMeta } from '../data/advancedLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ src, label }) {
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 12, margin: '18px 0 20px', borderRadius: 12, background: 'var(--bg2, #111)' }}>
      {label && (
        <div className="gi-label" style={{ color: 'var(--gold, #d4af37)', marginBottom: 10, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
          {label}
        </div>
      )}
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onPlay={(e) => {
          document.querySelectorAll('video').forEach((v) => {
            if (v !== e.currentTarget && !v.paused) {
              v.pause();
            }
          });
        }}
        playsInline
        preload="metadata"
        style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

const meta = getAdvancedLessonMeta('adv5');

const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    lessonTag: 'មេរៀន ៥',
    intro: (
      <>
        A+ Trade មិនកើតចេញពីគំនិតតែមួយឡើយ — វាកើតចេញពីការផ្គុំគំនិតទាំង ៤ មេរៀនមុនចូលគ្នា ៖{' '}
        <strong>Dealing Range</strong>, <strong>Liquidity</strong>, <strong>PD Array</strong>, និង{' '}
        <strong>Time and Price</strong> ។ មេរៀននេះបង្ហាញពីរបៀបផ្គុំវាទាំងអស់ជា Checklist តែមួយ ។
      </>
    ),
    video1Label: 'Setup A + Scenario 1',
    video2Label: 'Setup B + Scenario 2',
  },
  en: {
    finishUnlocked: '✓ Finish lesson',
    lessonTag: 'Lesson 5',
    intro: (
      <>
        An A+ trade never comes from a single idea — it comes from stacking the previous 4 lessons together:{' '}
        <strong>Dealing Range</strong>, <strong>Liquidity</strong>, <strong>PD Array</strong>, and{' '}
        <strong>Time and Price</strong>. This lesson shows how to combine all four into a single checklist.
      </>
    ),
    video1Label: 'Setup A + Scenario 1',
    video2Label: 'Setup B + Scenario 2',
  },
};

export default function Advanced5({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang] ?? CONTENT.en;
  const { videos } = useVideos();
  const srcScenario1 = videos['adv5-scenario-1']?.url || videos['adv5-checklist']?.url;
  const srcScenario2 = videos['adv5-scenario-2']?.url || videos['adv5-walkthrough']?.url;

  return (
    <LessonLayout
      id="adv5"
      track="advanced"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <span className="badge bb">{t.lessonTag}</span>
      <p style={{ marginTop: 14, fontSize: '1.05rem', lineHeight: 1.65, color: 'var(--text, #e2e8f0)' }}>
        {t.intro}
      </p>

      <LessonVideo src={srcScenario1} label={t.video1Label} />
      <LessonVideo src={srcScenario2} label={t.video2Label} />
    </LessonLayout>
  );
}
