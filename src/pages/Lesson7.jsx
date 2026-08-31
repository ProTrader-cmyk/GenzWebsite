import LessonLayout from '../components/LessonLayout.jsx';
import Steps from '../components/ui/Steps.jsx';
import { getLessonMeta } from '../data/lessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import walkthroughVideo from '../assets/Lesson7.mp4';

function LessonVideo({ label, src }) {
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

const meta = getLessonMeta('l7');

// This is the capstone lesson — it doesn't teach a new concept, it shows how
// to combine all 6 previous lessons into one repeatable process. Trading
// terms stay in English in every language, same convention as Lessons 1-6.
const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់ Course',
    processIntro: 'នេះជា Process ៥ ជំហាន ដែល Trader ត្រូវធ្វើរាល់ថ្ងៃមុនសម្រចចិត្តជួញដូរ For Beginner ៖',
    step1: (
      <>
        <strong>ជំហានទី ១</strong> —​ ប្រើប្រាស់​ Timeframe 15MIN​ វិភាគថាតើទីផ្សារបច្ចុប្បន្ននេះស្ថិតនៅលំហូរណា?
        Bull/Bear/Sideway ?
      </>
    ),
    step2: (
      <>
        <strong>ជំហានទី ២</strong> —​មើលថាតើទីផ្សារមាន​ LQ កន្លែងណាខ្លះ និង​ ថាតើមាន OB/FVG​កន្លែងណា?
      </>
    ),
    step3: (
      <>
        <strong>ជំហានទី ៣</strong> —​ មើលទៀតថាខ្សែទឹក EMA+SMA កំពុងបង្ហាញយើងយ៉ាងណា?
      </>
    ),
    step4: (
      <>
        <strong>ជំហានទី ៤</strong> — រងចាំទីផ្សារមកយក OB/FVG/EMA50/100/200 ហើយទម្លាក់ Timeframe
      </>
    ),
    step5: (
      <>
        <strong>ជំហានទី ៥</strong> — កំណត់ Entry, SL, TP ៖ Entry នៅជិត Order Block/FVG · SL ដាក់ហួស Zone ឬ
        Structure សំខាន់ · TP នៅត្រង់ Liquidity ឬ Structure កម្រិតបន្ទាប់
      </>
    ),
    walkthroughVideoLabel: '🎥 វីដេអូបង្ហាញជាក់ស្តែងពេញលេញ',
  },
  en: {
    finishUnlocked: '✓ Finish Course',
    processIntro: 'This is the 5-step process a Trader should run through every day before deciding to trade — for beginners:',
    step1: (
      <>
        <strong>Step 1</strong> — Use the 15MIN Timeframe: analyze which flow the current market is in —
        Bull/Bear/Sideway?
      </>
    ),
    step2: (
      <>
        <strong>Step 2</strong> — Check where the market has LQ, and where there's OB/FVG
      </>
    ),
    step3: (
      <>
        <strong>Step 3</strong> — Also check what the EMA+SMA lines are showing us
      </>
    ),
    step4: (
      <>
        <strong>Step 4</strong> — Wait for price to reach the OB/FVG/EMA50/100/200 zone, then drop down a
        Timeframe
      </>
    ),
    step5: (
      <>
        <strong>Step 5</strong> — Set Entry, SL, TP: Entry near the Order Block/FVG · SL placed beyond the
        Zone or important Structure · TP at the next Liquidity or Structure level
      </>
    ),
    walkthroughVideoLabel: '🎥 Full walkthrough example',
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    processIntro: '这是初学者交易者在每天做交易决定之前应该执行的 5 步流程：',
    step1: (
      <>
        <strong>第 1 步</strong> —— 使用 15MIN Timeframe：分析当前市场处于哪种走势——Bull/Bear/Sideway？
      </>
    ),
    step2: (
      <>
        <strong>第 2 步</strong> —— 查看市场哪里有 LQ，以及哪里有 OB/FVG
      </>
    ),
    step3: (
      <>
        <strong>第 3 步</strong> —— 再看看 EMA+SMA 线目前显示的方向
      </>
    ),
    step4: (
      <>
        <strong>第 4 步</strong> —— 等待价格到达 OB/FVG/EMA50/100/200 区域，然后切换到更低的 Timeframe
      </>
    ),
    step5: (
      <>
        <strong>第 5 步</strong> —— 设置 Entry、SL、TP：Entry 设在 Order Block/FVG 附近 · SL 设在该 Zone 或
        重要 Structure 之外 · TP 设在下一个 Liquidity 或 Structure 水平
      </>
    ),
    walkthroughVideoLabel: '🎥 完整实操示例',
  },
};

export default function Lesson7({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];

  return (
    <LessonLayout
      id="l7"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <p>{t.processIntro}</p>
      <Steps items={[t.step1, t.step2, t.step3, t.step4, t.step5]} />

      <LessonVideo label={t.walkthroughVideoLabel} src={walkthroughVideo} />
    </LessonLayout>
  );
}
