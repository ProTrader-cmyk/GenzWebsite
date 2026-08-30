import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import Quiz from '../components/ui/Quiz.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getAppsLessonMeta } from '../data/appsLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const meta = getAppsLessonMeta('a3');

const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>TradingView</strong> ជា Website/App ដែល Trader ភាគច្រើនប្រើសម្រាប់មើល Chart និងធ្វើការវិភាគ
        បច្ចេកទេស (Technical Analysis) — រួមទាំង Chart ទាំងអស់ដែលប្រើក្នុងវគ្គ Technical Analysis for Beginner ។ មេរៀននេះ
        បង្រៀនមូលដ្ឋានចាំបាច់ដើម្បីចាប់ផ្តើមប្រើ TradingView ។
      </>
    ),
    h1: '១. របៀបរក Pair ដែលចង់ Trade',
    findSteps: [
      'បើក TradingView → ចុចលើរូប 🔍 (Search) នៅជ្រុងខាងលើឆ្វេង',
      'វាយឈ្មោះ Symbol ដែលចង់រក (ឧ. "XAUUSD" សម្រាប់ Gold ឬ "EURUSD")',
      'ជ្រើសរើស Symbol ពី Broker/Exchange ដែលបង្ហាញក្នុងបញ្ជី',
      'Chart នឹងផ្លាស់ប្តូរទៅបង្ហាញ Pair ដែលអ្នកជ្រើសរើសភ្លាមៗ',
    ],
    ruleFind: 'ប្រសិនបើមាន Symbol ដូចគ្នាច្រើនក្នុងបញ្ជី (ពី Broker ផ្សេងគ្នា) ជ្រើសរើសមួយណាក៏បាន — Price Action ជាទូទៅដូចគ្នា',
    h2: '២. តើ Candle ជាអ្វី?',
    candleIntro: (
      <>
        <strong>Candle (Candlestick)</strong> ជាវិធីបង្ហាញចលនា Price ក្នុងរយៈពេលកំណត់មួយ — មាន ២ ផ្នែកសំខាន់ ៖{' '}
        <strong>Body</strong> (ប្រអប់) និង <strong>Wick/Shadow</strong> (បន្ទាត់ស្តើងខាងលើ-ក្រោម) ។
      </>
    ),
    openCloseHeading: 'Open និង Close',
    openLabel: 'Open',
    openBody: 'តម្លៃដំបូងគេ ដែល Candle នោះចាប់ផ្តើម Trade នៅដើមរយៈពេលកំណត់ (ឧ. ដើមម៉ោង ប្រសិនបើមើល H1)',
    closeLabel: 'Close',
    closeBody: 'តម្លៃចុងក្រោយគេ ដែល Candle នោះបញ្ចប់ Trade នៅចុងរយៈពេលកំណត់ — សំខាន់ខ្លាំងសម្រាប់កំណត់ BOS/CHoCH',
    bullBearHeading: 'Bullish Candle Vs Bearish Candle',
    bullLabel: 'Bullish Candle (បៃតង/ស)',
    bullBody: 'Close ខ្ពស់ជាង Open — មានន័យថា Buyer ឈ្នះក្នុងរយៈពេលនោះ Price បិទខ្ពស់ជាងចាប់ផ្តើម',
    bearLabel: 'Bearish Candle (ក្រហម/ខ្មៅ)',
    bearBody: 'Close ទាបជាង Open — មានន័យថា Seller ឈ្នះក្នុងរយៈពេលនោះ Price បិទទាបជាងចាប់ផ្តើម',
    quiz1: {
      question: 'បើ Candle មួយមាន Close ខ្ពស់ជាង Open តើវាជា Candle ប្រភេទណា?',
      options: [
        { label: 'Bearish', type: 'no' },
        { label: 'Bullish', type: 'ok' },
        { label: 'Sideways', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Close ខ្ពស់ជាង Open = Bullish Candle (Buyer ឈ្នះ)។',
        no: '✗ Close ខ្ពស់ជាង Open ជា Bullish Candle មិនមែន Bearish ទេ។',
      },
    },
    h3: '៣. Timeframe',
    tfBox: (
      <p>
        <strong>Timeframe</strong> កំណត់ថា Candle មួយៗតំណាងឲ្យរយៈពេលប៉ុន្មាន — ឧ. M1 = ១ នាទី, M15 = ១៥ នាទី,
        H1 = ១ ម៉ោង, H4 = ៤ ម៉ោង, D1 = ១ថ្ងៃ, W1 = ១សប្តាហ៍ ។ Timeframe ខ្ពស់ (H4, D1) មាន Noise តិច
        ជឿទុកចិត្តបានច្រើនជាង — Timeframe ទាប (M1, M5) មានលម្អិតច្រើនជាង ប៉ុន្តែ Noise ក៏ច្រើនដែរ ។
      </p>
    ),
    tfSteps: [
      'នៅជ្រុងខាងលើ Chart — ចុចលើប្រអូល Timeframe (ធម្មតាសរសេរ "1D" ឬលេខផ្សេង)',
      'ជ្រើសរើស Timeframe ដែលចង់មើល (ឧ. 1H សម្រាប់ H1)',
      'អាចវាយផ្ទាល់លេខ Shortcut ដូចជា "1", "5", "15", "60", "240", "D" ក៏បាន',
    ],
    ruleTf: 'Trader ជាទូទៅមើលច្រើន Timeframe រួមគ្នា — H4/D1 សម្រាប់កំណត់ទិសធំ រួច M15/H1 សម្រាប់រក Entry ច្បាស់',
    quiz2: {
      question: 'Timeframe ណាមួយក្នុងចំណោមនេះជា Higher Timeframe ដែលមាន Noise តិចជាង?',
      options: [
        { label: 'M1', type: 'no' },
        { label: 'D1', type: 'ok' },
        { label: 'M5', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! D1 (Daily) ជា Higher Timeframe មាន Noise តិចជាង M1/M5។',
        no: '✗ D1 (Daily) ទើបជា Higher Timeframe ដែលមាន Noise តិចជាង — M1/M5 ជា Timeframe ទាបដែលមាន Noise ច្រើន។',
      },
    },
    practiceHeading: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'បើក TradingView ហើយសាកល្បង ៖',
    practiceSteps: [
      'ស្វែងរក XAUUSD ដោយប្រើ Search',
      'សម្គាល់ Candle ណាមួយថាជា Bullish ឬ Bearish ដោយមើល Open/Close',
      'ប្តូរ Timeframe ពី M15 ទៅ H4 រួចមើលថា Structure ដូចគ្នាដែរឬអត់',
    ],
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'តើប្រើអ្វីលើ TradingView ដើម្បីរក Symbol ថ្មី?',
        options: [
          { label: 'Timeframe Selector', correct: false },
          { label: 'Search (🔍)', correct: true },
          { label: 'Replay Button', correct: false },
        ],
      },
      {
        question: 'Open របស់ Candle មានន័យថាអ្វី?',
        options: [
          { label: 'តម្លៃចុងក្រោយគេនៅចុងរយៈពេលកំណត់', correct: false },
          { label: 'តម្លៃដំបូងគេនៅដើមរយៈពេលកំណត់', correct: true },
          { label: 'តម្លៃខ្ពស់បំផុតក្នុងរយៈពេលកំណត់', correct: false },
        ],
      },
      {
        question: 'Candle ដែល Close ទាបជាង Open ត្រូវហៅថាអ្វី?',
        options: [
          { label: 'Bullish Candle', correct: false },
          { label: 'Bearish Candle', correct: true },
          { label: 'Sideways Candle', correct: false },
        ],
      },
      {
        question: 'Timeframe ណាមួយអាចជួយកំណត់ទិសធំរបស់ទីផ្សារបានល្អជាង?',
        options: [
          { label: 'M1', correct: false },
          { label: 'H4 ឬ D1', correct: true },
          { label: 'M5', correct: false },
        ],
      },
    ],
  },
  en: {
    feedbackOk: '✓ Correct!',
    feedbackNo: '✗ Not quite — try again.',
    finishLocked: (p, t) => `🔒 Finish lesson (${p}/${t})`,
    finishUnlocked: '✓ Finish lesson',
    intro: (
      <>
        <strong>TradingView</strong> is the website/app most traders use to view charts and do Technical
        Analysis — including all the charts used throughout the Technical Analysis for Beginner course. This lesson
        covers the basics you need to get started with TradingView.
      </>
    ),
    h1: '1. How to Find a Pair You Want to Trade',
    findSteps: [
      'Open TradingView → click the 🔍 (Search) icon in the top-left',
      'Type the Symbol you\'re looking for (e.g. "XAUUSD" for Gold, or "EURUSD")',
      'Select the Symbol from the Broker/Exchange list that appears',
      'The chart will instantly switch to show the Pair you selected',
    ],
    ruleFind: 'If the same Symbol appears multiple times (from different brokers/exchanges), any one is fine — price action is generally the same',
    h2: '2. What Is a Candle?',
    candleIntro: (
      <>
        A <strong>Candle (Candlestick)</strong> is a way of showing price movement over a fixed period of
        time — it has 2 main parts: the <strong>Body</strong> and the <strong>Wick/Shadow</strong> (the thin
        lines above and below).
      </>
    ),
    openCloseHeading: 'Open and Close',
    openLabel: 'Open',
    openBody: 'The very first price traded when that candle\'s period begins (e.g. the start of the hour, if you\'re on H1)',
    closeLabel: 'Close',
    closeBody: 'The very last price traded when that candle\'s period ends — critically important for identifying BOS/CHoCH',
    bullBearHeading: 'Bullish Candle vs Bearish Candle',
    bullLabel: 'Bullish Candle (green/white)',
    bullBody: 'Close is higher than Open — meaning buyers won that period, price closed higher than it started',
    bearLabel: 'Bearish Candle (red/black)',
    bearBody: 'Close is lower than Open — meaning sellers won that period, price closed lower than it started',
    quiz1: {
      question: 'If a candle has a Close higher than its Open, what type of candle is it?',
      options: [
        { label: 'Bearish', type: 'no' },
        { label: 'Bullish', type: 'ok' },
        { label: 'Sideways', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Close higher than Open = a Bullish Candle (buyers won).',
        no: '✗ Close higher than Open is a Bullish candle, not Bearish.',
      },
    },
    h3: '3. Timeframe',
    tfBox: (
      <p>
        <strong>Timeframe</strong> sets how much time each candle represents — e.g. M1 = 1 minute, M15 = 15
        minutes, H1 = 1 hour, H4 = 4 hours, D1 = 1 day, W1 = 1 week. Higher timeframes (H4, D1) have less
        noise and are more reliable — lower timeframes (M1, M5) show more detail, but also more noise.
      </p>
    ),
    tfSteps: [
      "At the top of the chart — click the Timeframe box (usually shows \"1D\" or another value)",
      'Choose the timeframe you want to view (e.g. 1H for H1)',
      'You can also type a shortcut directly, like "1", "5", "15", "60", "240", or "D"',
    ],
    ruleTf: 'Traders generally check multiple timeframes together — H4/D1 to read the bigger direction, then M15/H1 to find a precise entry',
    quiz2: {
      question: 'Which of these is a Higher Timeframe with less noise?',
      options: [
        { label: 'M1', type: 'no' },
        { label: 'D1', type: 'ok' },
        { label: 'M5', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! D1 (Daily) is a Higher Timeframe with less noise than M1/M5.',
        no: '✗ D1 (Daily) is the Higher Timeframe with less noise — M1/M5 are lower timeframes with more noise.',
      },
    },
    practiceHeading: '📝 Practice Exercise',
    practiceIntro: 'Open TradingView and try this:',
    practiceSteps: [
      'Search for XAUUSD using Search',
      'Pick out a candle and identify whether it\'s Bullish or Bearish by looking at Open/Close',
      'Switch the timeframe from M15 to H4 and check whether the Structure still looks the same',
    ],
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'What do you use on TradingView to find a new Symbol?',
        options: [
          { label: 'The Timeframe Selector', correct: false },
          { label: 'Search (🔍)', correct: true },
          { label: 'The Replay Button', correct: false },
        ],
      },
      {
        question: "What does a candle's Open mean?",
        options: [
          { label: 'The last price traded at the end of the period', correct: false },
          { label: 'The first price traded at the start of the period', correct: true },
          { label: 'The highest price during the period', correct: false },
        ],
      },
      {
        question: 'A candle whose Close is lower than its Open is called what?',
        options: [
          { label: 'Bullish Candle', correct: false },
          { label: 'Bearish Candle', correct: true },
          { label: 'Sideways Candle', correct: false },
        ],
      },
      {
        question: 'Which timeframe better helps you read the bigger market direction?',
        options: [
          { label: 'M1', correct: false },
          { label: 'H4 or D1', correct: true },
          { label: 'M5', correct: false },
        ],
      },
    ],
  },
  zh: {
    feedbackOk: '✓ 正确！',
    feedbackNo: '✗ 不正确，请再试一次。',
    finishLocked: (p, t) => `🔒 完成课程 (${p}/${t})`,
    finishUnlocked: '✓ 完成课程',
    intro: (
      <>
        <strong>TradingView</strong> 是大多数交易者用来看图和做 Technical Analysis 的网站/App——Technical for
        Beginner 课程中使用的所有图表都来自这里。本课讲解开始使用 TradingView 所需的基础操作。
      </>
    ),
    h1: '1. 如何找到你想交易的 Pair',
    findSteps: [
      '打开 TradingView → 点击左上角的 🔍（Search）图标',
      '输入想查找的 Symbol（例如 Gold 的 "XAUUSD"，或 "EURUSD"）',
      '从弹出的 Broker/Exchange 列表中选择该 Symbol',
      '图表会立即切换显示你选择的 Pair',
    ],
    ruleFind: '如果同一个 Symbol 在列表中出现多个（来自不同 Broker/Exchange），选哪一个都可以——价格走势通常一致',
    h2: '2. 什么是 Candle（蜡烛）？',
    candleIntro: (
      <>
        <strong>Candle（Candlestick，蜡烛图）</strong>是用来展示某个固定时间段内价格变动的方式——它有 2 个主要
        部分：<strong>Body</strong>（实体）和 <strong>Wick/Shadow</strong>（上下两端的细线）。
      </>
    ),
    openCloseHeading: 'Open 与 Close',
    openLabel: 'Open（开盘价）',
    openBody: '该蜡烛周期开始时成交的第一个价格（例如，如果你在看 H1，就是该小时开始时的价格）',
    closeLabel: 'Close（收盘价）',
    closeBody: '该蜡烛周期结束时成交的最后一个价格——对判断 BOS/CHoCH 极其重要',
    bullBearHeading: 'Bullish Candle 与 Bearish Candle',
    bullLabel: 'Bullish Candle（阳线，绿色/白色）',
    bullBody: 'Close 高于 Open——意味着买方在这段时间获胜，价格收盘高于开盘',
    bearLabel: 'Bearish Candle（阴线，红色/黑色）',
    bearBody: 'Close 低于 Open——意味着卖方在这段时间获胜，价格收盘低于开盘',
    quiz1: {
      question: '如果一根蜡烛的 Close 高于 Open，它属于哪种蜡烛？',
      options: [
        { label: 'Bearish', type: 'no' },
        { label: 'Bullish', type: 'ok' },
        { label: 'Sideways', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Close 高于 Open = Bullish Candle（买方获胜）。',
        no: '✗ Close 高于 Open 是 Bullish Candle，而不是 Bearish。',
      },
    },
    h3: '3. Timeframe（时间周期）',
    tfBox: (
      <p>
        <strong>Timeframe</strong> 决定每根蜡烛代表多长时间——例如 M1 = 1 分钟，M15 = 15 分钟，H1 = 1 小时，
        H4 = 4 小时，D1 = 1 天，W1 = 1 周。较高的 Timeframe（H4、D1）噪音更少、更可靠——较低的 Timeframe
        （M1、M5）细节更多，但噪音也更多。
      </p>
    ),
    tfSteps: [
      '在图表顶部——点击 Timeframe 方框（通常显示 "1D" 或其他数值）',
      '选择想查看的 Timeframe（例如 1H 表示 H1）',
      '也可以直接输入快捷键，例如 "1"、"5"、"15"、"60"、"240" 或 "D"',
    ],
    ruleTf: '交易者通常会结合多个 Timeframe 一起看——用 H4/D1 判断大方向，再用 M15/H1 寻找精确的 Entry',
    quiz2: {
      question: '以下哪个是噪音较少的 Higher Timeframe？',
      options: [
        { label: 'M1', type: 'no' },
        { label: 'D1', type: 'ok' },
        { label: 'M5', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！D1（Daily）是噪音比 M1/M5 更少的 Higher Timeframe。',
        no: '✗ D1（Daily）才是噪音更少的 Higher Timeframe——M1/M5 是噪音较多的低周期。',
      },
    },
    practiceHeading: '📝 实践练习',
    practiceIntro: '打开 TradingView，尝试以下操作：',
    practiceSteps: [
      '使用 Search 搜索 XAUUSD',
      '挑选一根蜡烛，通过 Open/Close 判断它是 Bullish 还是 Bearish',
      '把 Timeframe 从 M15 切换到 H4，看看 Structure 是否仍然一致',
    ],
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: '在 TradingView 上，用什么来查找新的 Symbol？',
        options: [
          { label: 'Timeframe Selector', correct: false },
          { label: 'Search（🔍）', correct: true },
          { label: 'Replay Button', correct: false },
        ],
      },
      {
        question: '蜡烛的 Open 是什么意思？',
        options: [
          { label: '该周期结束时的最后成交价', correct: false },
          { label: '该周期开始时的第一个成交价', correct: true },
          { label: '该周期内的最高价', correct: false },
        ],
      },
      {
        question: 'Close 低于 Open 的蜡烛称为什么？',
        options: [
          { label: 'Bullish Candle', correct: false },
          { label: 'Bearish Candle', correct: true },
          { label: 'Sideways Candle', correct: false },
        ],
      },
      {
        question: '哪个 Timeframe 更有助于判断市场的大方向？',
        options: [
          { label: 'M1', correct: false },
          { label: 'H4 或 D1', correct: true },
          { label: 'M5', correct: false },
        ],
      },
    ],
  },
};

export default function AppsLesson3({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="a3"
      track="apps"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <p>{t.intro}</p>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Steps items={t.findSteps} />
      <Rule title="💡">{t.ruleFind}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <p>{t.candleIntro}</p>

      <p className="sec-label sg" style={{ marginTop: 8 }}>
        {t.openCloseHeading}
      </p>
      <div className="g2">
        <GridItem labelColor="var(--blue)" label={t.openLabel}>
          {t.openBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.closeLabel}>
          {t.closeBody}
        </GridItem>
      </div>

      <p className="sec-label sg" style={{ marginTop: 16 }}>
        {t.bullBearHeading}
      </p>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.bullLabel}>
          {t.bullBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.bearLabel}>
          {t.bearBody}
        </GridItem>
      </div>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="g">{t.tfBox}</Box>
      <Steps items={t.tfSteps} />
      <Rule title="💡">{t.ruleTf}</Rule>

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      <h3>
        <span className="bar"></span>
        {t.practiceHeading}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.practiceSteps} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.finalTestHeading}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
