import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import Quiz from '../components/ui/Quiz.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getLessonMeta } from '../data/lessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const meta = getLessonMeta('l7');

// This is the capstone lesson — it doesn't teach a new concept, it shows how
// to combine all 6 previous lessons into one repeatable process. Trading
// terms stay in English in every language, same convention as Lessons 1-6.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់ Course (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់ Course',
    intro: (
      <>
        មេរៀនទី ១-៦ បង្រៀនអ្នកនូវ <strong>បំណែកនីមួយៗ</strong> ដាច់ដោយឡែក — Market Structure, BOS/CHoCH, Order
        Block, FVG, Liquidity, និង EMA ។ មេរៀននេះនឹងបង្ហាញពីរបៀប <strong>ផ្សំបំណែកទាំងអស់នេះចូលគ្នា</strong>{' '}
        ជា Process តែមួយ ដែលអ្នកអាចប្រើឡើងវិញបានរាល់ពេល Trade — នេះហើយជាចំណុចប្រែក្លាយពី "ដឹងទ្រឹស្ដី" ទៅជា{' '}
        <strong>"ក្លាយជា Trader"</strong> ។
      </>
    ),
    h1: 'ដំណើរការវិភាគបែប Top-Down',
    processIntro: 'នេះជា Process ៥ ជំហាន ដែល Trader ជាច្រើនប្រើដើម្បីរក Setup ពី Timeframe ធំទៅតូច ៖',
    step1: (
      <>
        <strong>ជំហានទី ១ — កំណត់ Bias លើ Timeframe ធំ (H4/D1)</strong> ៖ មើល Market Structure (មេរៀនទី ១)
        និងទិស EMA (មេរៀនទី ៦) — តើ Structure Bullish ឬ Bearish? EMA50/100/200 តម្រៀបទិសណា?
      </>
    ),
    step2: (
      <>
        <strong>ជំហានទី ២ — សម្គាល់ Liquidity Zone</strong> ៖ រក BSL/SSL, Equal High/Low (មេរៀនទី ៥)
        ដែល Price អាចនឹងទៅទាញ (Sweep) មុននឹងបន្តទិសដែលអ្នកគិត
      </>
    ),
    step3: (
      <>
        <strong>ជំហានទី ៣ — រង់ចាំ Sweep + Confirmation</strong> ៖ រង់ចាំ Liquidity Sweep កើតឡើង រួចមាន BOS ឬ
        CHoCH (មេរៀនទី ២) ក្នុងទិសដែលស្របនឹង Bias ធំរបស់អ្នក
      </>
    ),
    step4: (
      <>
        <strong>ជំហានទី ៤ —ចុះទៅ Timeframe តូច (M15/H1) រក Entry Zone</strong> ៖ រក Order Block (មេរៀនទី ៣)
        ឬ FVG (មេរៀនទី ៤) ដែលបណ្ដាលឱ្យមាន BOS/CHoCH នោះ — នេះជាតំបន់ដែល Price ទំនងជា Pullback មកប៉ះ
      </>
    ),
    step5: (
      <>
        <strong>ជំហានទី ៥ — កំណត់ Entry, SL, TP</strong> ៖ Entry នៅជិត Order Block/FVG · SL ដាក់ហួស Zone ឬ
        Structure សំខាន់ · TP នៅត្រង់ Liquidity ឬ Structure កម្រិតបន្ទាប់
      </>
    ),
    quiz1: {
      question: 'តាម Process Top-Down តើគួរចាប់ផ្តើមពីជំហានណាមុនគេ?',
      options: [
        { label: 'រក Order Block លើ Timeframe តូច', type: 'no' },
        { label: 'កំណត់ Bias លើ Timeframe ធំ (H4/D1)', type: 'ok' },
        { label: 'កំណត់ TP ភ្លាមៗ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! ត្រូវចាប់ផ្តើមពី Timeframe ធំ ដើម្បីកំណត់ Bias ជាមុនសិន មុននឹងចុះទៅរក Entry លម្អិត។',
        no: '✗ Process Top-Down ត្រូវចាប់ផ្តើមពី Timeframe ធំបំផុតជាមុន (កំណត់ Bias) មិនមែនចាប់ផ្តើមពី Entry ទេ។',
      },
    },
    h2: 'Confluence Checklist',
    checklistIntro: 'មុននឹងចុច Buy/Sell សូមឆ្លងកាត់បញ្ជីនេះជានិច្ច — Confluence កាន់តែច្រើន Setup កាន់តែជឿទុកចិត្តបាន ៖',
    check1: '☑ Bias លើ H4/D1 (Structure + EMA) ច្បាស់លាស់',
    check2: '☑ Liquidity Sweep កើតឡើងស្របនឹង Bias',
    check3: '☑ BOS/CHoCH បញ្ជាក់ក្នុងទិសដូចគ្នា',
    check4: '☑ មាន Order Block ឬ FVG ជា Entry Zone ច្បាស់លាស់',
    check5: '☑ SL/TP កំណត់រួច ជាមួយ Risk:Reward យ៉ាងហោចណាស់ 1:2',
    ruleChecklist: 'បើមិនគ្រប់ចំណុចក្នុង Checklist ទេ — កុំបង្ខំចូល Trade ។ រង់ចាំ Setup ក្រោយ តែងតែមាន Setup ថ្មីមកទៀត',
    h3: 'Risk Management មូលដ្ឋាន',
    riskBox: (
      <p>
        <strong>កុំដាក់ហានិភ័យលើសពី 1-2%</strong> នៃគណនីរបស់អ្នកក្នុងមួយ Trade — ប្រើ Lot Size (មេរៀន App &
        Website) ដើម្បីគណនាទំហំ Position ត្រឹមត្រូវតាម SL Distance ។ រកមើល <strong>Risk:Reward</strong> យ៉ាងហោចណាស់{' '}
        <strong>1:2</strong> មុននឹងចូល Trade — មានន័យថា ប្រសិនបើអ្នកខាតបង់ $10 អ្នកគួរមានឱកាសចំណេញយ៉ាងហោចណាស់ $20 ។
      </p>
    ),
    riskQuiz: {
      question: 'តើគួរដាក់ហានិភ័យប៉ុន្មាន % នៃគណនីក្នុងមួយ Trade?',
      options: [
        { label: '20-30%', type: 'no' },
        { label: '1-2%', type: 'ok' },
        { label: 'គ្មានកំណត់', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! 1-2% ជា Standard ការពារគណនីពី Drawdown ធំពេក សូម្បីតែពេលមាន Trade ខាតបង់ជាបន្តបន្ទាប់ក៏ដោយ។',
        no: '✗ ការដាក់ហានិភ័យខ្ពស់ពេក (ដូចជា 20-30%) អាចធ្វើឱ្យគណនីខូចខាតធ្ងន់ធ្ងរបានលឿន — Trader ជោគជ័យប្រើ 1-2% ជាទូទៅ។',
      },
    },
    h4: 'Trading Plan & Journal',
    journalIntro: 'Trader ជោគជ័យ Trade ដូចជា Business មួយ — មិនមែន Gambling ទេ ។ គន្លឹះមូលដ្ឋាន ៖',
    journalStep1: 'កត់ត្រារាល់ Trade — ហេតុអ្វីចូល (Confluence អ្វីខ្លះ), លទ្ធផល, និងអារម្មណ៍ពេលនោះ',
    journalStep2: 'ពិនិត្យ Journal ជាប្រចាំសប្តាហ៍ — មើលថា Setup ប្រភេទណាដែលដំណើរការល្អបំផុតសម្រាប់អ្នក',
    journalStep3: 'កុំប្តូរ Strategy ញឹកញាប់ពេក — សាកល្បង Process មួយឱ្យបានយូរគ្រប់គ្រាន់ (យ៉ាងហោចណាស់ 30-50 Trade) មុននឹងវាយតម្លៃ',
    ruleMindset: 'ជោគជ័យក្នុង Trading មិនមែនមកពី Trade ត្រូវរាល់ដង — ប៉ុន្តែមកពី Process ដដែលៗ + Risk Management ល្អ + វិន័យ',
    h5: '📝 លំហាត់អនុវត្តចុងក្រោយ',
    practiceIntro: 'នេះជាមេរៀនចុងក្រោយនៃ Course — មុននឹងធ្វើ Quiz ចុងក្រោយ សូមអនុវត្ត Process ពេញលេញនេះលើ Chart ពិត ៖',
    practiceSteps: [
      'បើក Chart XAUUSD ឬគូ Forex ណាមួយលើ TradingView',
      'កំណត់ Bias លើ H4/D1 (Structure + EMA)',
      'សម្គាល់ Liquidity Zone ដែលអាចនឹងត្រូវ Sweep',
      'រង់ចាំ ឬស្វែងរកឧទាហរណ៍ Sweep + BOS/CHoCH ពីអតីតកាល',
      'រកមើល Order Block/FVG ដែលអាចជា Entry Zone',
      'សរសេរចេញ Entry, SL, TP ព្រមទាំង Risk:Reward របស់ Setup នោះ',
    ],
    h6: 'Quiz — សាកល្បងចំណេះដឹង',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៥ សំណួរ</strong> ដើម្បីបញ្ចប់ Course — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
        សូមអបអរសាទរជាមុន — នេះជាមេរៀនចុងក្រោយ!
      </>
    ),
    finalTestLockedHint: 'ត្រូវត្រូវទាំងអស់ដើម្បីបញ្ចប់ Course',
    finalTestQuestions: [
      {
        question: 'ក្នុង Process Top-Down តើជំហានទី ២ ត្រូវធ្វើអ្វី?',
        options: [
          { label: 'សម្គាល់ Liquidity Zone ដែលអាចត្រូវ Sweep', correct: true },
          { label: 'ចូល Trade ភ្លាមៗ', correct: false },
          { label: 'បិទ Chart', correct: false },
        ],
      },
      {
        question: 'ហេតុអ្វី Order Block/FVG សំខាន់ក្នុងជំហានចុងក្រោយ?',
        options: [
          { label: 'ព្រោះវាជា Zone ដែល Price ទំនងជា Pullback មកប៉ះ សម្រាប់ Entry', correct: true },
          { label: 'ព្រោះវាកំណត់ Bias លើ Timeframe ធំ', correct: false },
          { label: 'ព្រោះវាមិនទាក់ទងអ្វីនឹង Entry ទេ', correct: false },
        ],
      },
      {
        question: 'តើគួរដាក់ហានិភ័យប៉ុន្មាន % នៃគណនីជាទូទៅក្នុងមួយ Trade?',
        options: [
          { label: '1-2%', correct: true },
          { label: '10-15%', correct: false },
          { label: '50%', correct: false },
        ],
      },
      {
        question: 'Risk:Reward 1:2 មានន័យថាដូចម្ដេច?',
        options: [
          { label: 'ខាតបង់ $10 ត្រូវមានឱកាសចំណេញយ៉ាងហោចណាស់ $20', correct: true },
          { label: 'ខាតបង់ $10 ចំណេញ $10 ស្មើគ្នា', correct: false },
          { label: 'មិនទាក់ទងនឹង Lot Size ទេ', correct: false },
        ],
      },
      {
        question: 'ហេតុអ្វី Trading Journal សំខាន់?',
        options: [
          { label: 'ដើម្បីត្រួតពិនិត្យមើលថា Setup ណាដំណើរការល្អបំផុត ហើយកែលម្អ Process', correct: true },
          { label: 'ព្រោះវាធានាថា Trade រាល់ដងនឹងឈ្នះ', correct: false },
          { label: 'វាមិនចាំបាច់ទេ សម្រាប់ Trader ជោគជ័យ', correct: false },
        ],
      },
    ],
  },
  en: {
    feedbackOk: '✓ Correct!',
    feedbackNo: '✗ Not quite — try again.',
    finishLocked: (p, t) => `🔒 Finish Course (${p}/${t})`,
    finishUnlocked: '✓ Finish Course',
    intro: (
      <>
        Lessons 1-6 taught you <strong>individual pieces</strong> on their own — Market Structure, BOS/CHoCH,
        Order Block, FVG, Liquidity, and EMA. This lesson shows how to{' '}
        <strong>combine all of those pieces</strong> into one process you can reuse every time you trade —
        this is the point where "knowing the theory" turns into <strong>"becoming a trader."</strong>
      </>
    ),
    h1: 'The Top-Down Analysis Process',
    processIntro: 'This is the 5-step process many traders use to find a setup, working from a larger timeframe down to a smaller one:',
    step1: (
      <>
        <strong>Step 1 — Set your Bias on the Higher Timeframe (H4/D1)</strong>: Look at Market Structure
        (Lesson 1) and the EMA direction (Lesson 6) — is Structure Bullish or Bearish? Which way are the
        EMA50/100/200 lined up?
      </>
    ),
    step2: (
      <>
        <strong>Step 2 — Mark the Liquidity Zones</strong>: Find the BSL/SSL, Equal High/Low (Lesson 5) that
        price might sweep before continuing in the direction you expect
      </>
    ),
    step3: (
      <>
        <strong>Step 3 — Wait for a Sweep + Confirmation</strong>: Wait for a Liquidity Sweep to happen, then
        a BOS or CHoCH (Lesson 2) in the direction that matches your bigger Bias
      </>
    ),
    step4: (
      <>
        <strong>Step 4 — Drop to a Lower Timeframe (M15/H1) to Find an Entry Zone</strong>: Find the Order
        Block (Lesson 3) or FVG (Lesson 4) that caused that BOS/CHoCH — this is the zone price is likely to
        pull back and react at
      </>
    ),
    step5: (
      <>
        <strong>Step 5 — Set Entry, SL, TP</strong>: Entry near the Order Block/FVG · SL placed beyond the
        zone or important Structure · TP at the next Liquidity or Structure level
      </>
    ),
    quiz1: {
      question: 'In the Top-Down process, which step should you start with?',
      options: [
        { label: 'Finding an Order Block on a lower timeframe', type: 'no' },
        { label: 'Setting your Bias on the Higher Timeframe (H4/D1)', type: 'ok' },
        { label: 'Setting your TP right away', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! You start on the higher timeframe to set your Bias first, before dropping down to find a precise entry.',
        no: "✗ The Top-Down process starts on the biggest timeframe first (setting your Bias) — not at Entry.",
      },
    },
    h2: 'The Confluence Checklist',
    checklistIntro: 'Always run through this checklist before clicking Buy/Sell — the more Confluence lines up, the more trustworthy the setup:',
    check1: '☑ Bias on H4/D1 (Structure + EMA) is clear',
    check2: '☑ A Liquidity Sweep happened that matches your Bias',
    check3: '☑ A BOS/CHoCH confirms the same direction',
    check4: '☑ There\'s a clear Order Block or FVG as the Entry Zone',
    check5: '☑ SL/TP are set with at least a 1:2 Risk:Reward',
    ruleChecklist: "If not every box on the checklist is ticked — don't force the trade. Wait for the next setup, there's always another one coming",
    h3: 'Risk Management Basics',
    riskBox: (
      <p>
        <strong>Never risk more than 1-2%</strong> of your account on a single trade — use Lot Size (from the
        App & Website lesson) to calculate the correct position size based on your SL distance. Look for at
        least a <strong>1:2 Risk:Reward</strong> before entering — meaning if you could lose $10, you should
        have a chance to make at least $20.
      </p>
    ),
    riskQuiz: {
      question: 'What percentage of your account should you generally risk per trade?',
      options: [
        { label: '20-30%', type: 'no' },
        { label: '1-2%', type: 'ok' },
        { label: 'No limit', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! 1-2% is the standard — it protects your account from a huge drawdown even through a losing streak.',
        no: '✗ Risking too much (like 20-30%) can badly damage your account quickly — successful traders generally use 1-2%.',
      },
    },
    h4: 'Trading Plan & Journal',
    journalIntro: 'Successful traders treat trading like a business — not gambling. The basics:',
    journalStep1: 'Log every trade — why you entered (which Confluence), the result, and how you felt at the time',
    journalStep2: "Review your Journal weekly — see which type of setup works best for you",
    journalStep3: "Don't switch strategy too often — give one process enough time (at least 30-50 trades) before judging it",
    ruleMindset: "Success in trading doesn't come from winning every trade — it comes from a repeatable process + good Risk Management + discipline",
    h5: '📝 Final Practice Exercise',
    practiceIntro: 'This is the last lesson of the Course — before taking the final Quiz, practice this whole process on a real chart:',
    practiceSteps: [
      'Open a XAUUSD chart, or any Forex pair, on TradingView',
      'Set your Bias on H4/D1 (Structure + EMA)',
      'Mark the Liquidity Zones that might get swept',
      'Look for a past example of a Sweep + BOS/CHoCH',
      'Find the Order Block/FVG that could serve as an Entry Zone',
      'Write out the Entry, SL, TP, and the Risk:Reward of that setup',
    ],
    h6: 'Quiz — Test Your Knowledge',
    finalTestIntro: (
      <>
        You must answer <strong>all 5 questions correctly</strong> to finish the Course — if you answer
        wrong, you can try again with no limit. Congratulations in advance — this is the final lesson!
      </>
    ),
    finalTestLockedHint: 'Answer all of them correctly to finish the Course',
    finalTestQuestions: [
      {
        question: 'In the Top-Down process, what happens in Step 2?',
        options: [
          { label: 'Marking the Liquidity Zones that might get swept', correct: true },
          { label: 'Entering a trade immediately', correct: false },
          { label: 'Closing the chart', correct: false },
        ],
      },
      {
        question: 'Why does the Order Block/FVG matter in the final step?',
        options: [
          { label: "It's the zone price is likely to pull back and react at, for your Entry", correct: true },
          { label: 'It sets your Bias on the higher timeframe', correct: false },
          { label: "It has nothing to do with Entry", correct: false },
        ],
      },
      {
        question: 'What percentage of your account should you generally risk per trade?',
        options: [
          { label: '1-2%', correct: true },
          { label: '10-15%', correct: false },
          { label: '50%', correct: false },
        ],
      },
      {
        question: 'What does a 1:2 Risk:Reward mean?',
        options: [
          { label: "If you could lose $10, you should have a chance to make at least $20", correct: true },
          { label: 'You lose $10 and gain $10 — equal amounts', correct: false },
          { label: 'It has nothing to do with Lot Size', correct: false },
        ],
      },
      {
        question: 'Why does a Trading Journal matter?',
        options: [
          { label: 'To review which setups work best for you and improve your process', correct: true },
          { label: 'It guarantees every trade will win', correct: false },
          { label: "It's not necessary for a successful trader", correct: false },
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
        第 1-6 课分别教会了你<strong>各自独立的知识点</strong>——Market Structure、BOS/CHoCH、Order Block、
        FVG、Liquidity 和 EMA。本课将展示如何把<strong>所有这些知识点组合</strong>成一套你每次交易都能重复使用的
        流程——这正是从"懂理论"转变为<strong>"成为一名交易者"</strong>的关键一步。
      </>
    ),
    h1: 'Top-Down 分析流程',
    processIntro: '这是许多交易者用来寻找 Setup 的 5 步流程，从大周期逐步分析到小周期：',
    step1: (
      <>
        <strong>第 1 步 —— 在 Higher Timeframe (H4/D1) 确定 Bias</strong>：查看 Market Structure（第 1 课）
        和 EMA 方向（第 6 课）——Structure 是 Bullish 还是 Bearish？EMA50/100/200 的排列方向如何？
      </>
    ),
    step2: (
      <>
        <strong>第 2 步 —— 标记 Liquidity Zone</strong>：找出可能会被 Sweep 的 BSL/SSL、Equal High/Low
        （第 5 课），之后价格才会延续你预期的方向
      </>
    ),
    step3: (
      <>
        <strong>第 3 步 —— 等待 Sweep + 确认</strong>：等待 Liquidity Sweep 出现，之后出现与你的大方向 Bias
        一致的 BOS 或 CHoCH（第 2 课）
      </>
    ),
    step4: (
      <>
        <strong>第 4 步 —— 切换到 Lower Timeframe (M15/H1) 寻找 Entry Zone</strong>：找出导致该 BOS/CHoCH 的
        Order Block（第 3 课）或 FVG（第 4 课）——这就是价格很可能回踩反应的区域
      </>
    ),
    step5: (
      <>
        <strong>第 5 步 —— 设置 Entry、SL、TP</strong>：Entry 设在 Order Block/FVG 附近 · SL 设在该区域或
        重要 Structure 之外 · TP 设在下一个 Liquidity 或 Structure 水平
      </>
    ),
    quiz1: {
      question: '在 Top-Down 流程中，应该从哪一步开始？',
      options: [
        { label: '在小周期上寻找 Order Block', type: 'no' },
        { label: '在 Higher Timeframe (H4/D1) 确定 Bias', type: 'ok' },
        { label: '立即设置 TP', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！应先在更高周期上确定 Bias，之后再切换到小周期寻找精确的 Entry。',
        no: '✗ Top-Down 流程应先从最大的周期开始（确定 Bias），而不是从 Entry 开始。',
      },
    },
    h2: 'Confluence Checklist（确认清单）',
    checklistIntro: '在点击 Buy/Sell 之前，务必先过一遍这份清单——对齐的 Confluence 越多，Setup 越值得信赖：',
    check1: '☑ H4/D1 上的 Bias（Structure + EMA）清晰明确',
    check2: '☑ 出现了与 Bias 方向一致的 Liquidity Sweep',
    check3: '☑ 有同方向的 BOS/CHoCH 确认',
    check4: '☑ 有明确的 Order Block 或 FVG 作为 Entry Zone',
    check5: '☑ SL/TP 已设置，且 Risk:Reward 至少为 1:2',
    ruleChecklist: '如果清单没有全部满足——不要强行进场。耐心等待下一个 Setup，机会总会再来',
    h3: 'Risk Management 基础',
    riskBox: (
      <p>
        <strong>单笔交易的风险不要超过账户的 1-2%</strong>——使用 Lot Size（来自 App & Website 课程）根据你的
        SL 距离计算正确的仓位大小。进场前请确保至少有 <strong>1:2 的 Risk:Reward</strong>——也就是说，如果你
        可能亏损 $10，就应该有机会至少赚到 $20。
      </p>
    ),
    riskQuiz: {
      question: '单笔交易通常应该承担账户的多少百分比风险？',
      options: [
        { label: '20-30%', type: 'no' },
        { label: '1-2%', type: 'ok' },
        { label: '没有限制', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！1-2% 是标准做法——即使连续亏损，也能保护账户不出现巨大回撤。',
        no: '✗ 风险过高（例如 20-30%）会很快严重损害账户——成功的交易者通常使用 1-2%。',
      },
    },
    h4: 'Trading Plan 与 Journal（交易日志）',
    journalIntro: '成功的交易者把交易当作一门生意来经营——而不是赌博。基本要点：',
    journalStep1: '记录每一笔交易——进场原因（有哪些 Confluence）、结果，以及当时的心态',
    journalStep2: '每周回顾你的 Journal——看看哪种类型的 Setup 最适合你',
    journalStep3: '不要太频繁更换策略——给一套流程足够的时间（至少 30-50 笔交易）再做评估',
    ruleMindset: '交易的成功并非来自每笔都赢——而是来自可重复的流程 + 良好的 Risk Management + 纪律',
    h5: '📝 最终实践练习',
    practiceIntro: '这是本课程的最后一课——在做最终 Quiz 之前，请在真实图表上完整实践这套流程：',
    practiceSteps: [
      '在 TradingView 上打开 XAUUSD 图表，或任意 Forex 货币对',
      '在 H4/D1 上确定 Bias（Structure + EMA）',
      '标记可能会被 Sweep 的 Liquidity Zone',
      '寻找过去出现过的 Sweep + BOS/CHoCH 案例',
      '找出可以作为 Entry Zone 的 Order Block/FVG',
      '写下该 Setup 的 Entry、SL、TP 以及 Risk:Reward',
    ],
    h6: 'Quiz —— 检测你的知识',
    finalTestIntro: (
      <>
        必须<strong>全部 5 题答对</strong>才能完成本课程——如果答错，可以无限次重新尝试。提前恭喜你——这是最后
        一课！
      </>
    ),
    finalTestLockedHint: '全部答对才能完成课程',
    finalTestQuestions: [
      {
        question: '在 Top-Down 流程中，第 2 步要做什么？',
        options: [
          { label: '标记可能会被 Sweep 的 Liquidity Zone', correct: true },
          { label: '立即进场交易', correct: false },
          { label: '关闭图表', correct: false },
        ],
      },
      {
        question: '为什么 Order Block/FVG 在最后一步很重要？',
        options: [
          { label: '因为它是价格很可能回踩反应、可用于 Entry 的区域', correct: true },
          { label: '因为它决定了更高周期上的 Bias', correct: false },
          { label: '因为它与 Entry 无关', correct: false },
        ],
      },
      {
        question: '单笔交易通常应该承担账户的多少百分比风险？',
        options: [
          { label: '1-2%', correct: true },
          { label: '10-15%', correct: false },
          { label: '50%', correct: false },
        ],
      },
      {
        question: '1:2 的 Risk:Reward 是什么意思？',
        options: [
          { label: '如果可能亏损 $10，就应该有机会至少赚到 $20', correct: true },
          { label: '亏损 $10，盈利也是 $10——金额相等', correct: false },
          { label: '与 Lot Size 无关', correct: false },
        ],
      },
      {
        question: '为什么 Trading Journal 很重要？',
        options: [
          { label: '用来回顾哪种 Setup 最适合自己，并改进流程', correct: true },
          { label: '它能保证每笔交易都会赢', correct: false },
          { label: '对成功的交易者来说这不是必需的', correct: false },
        ],
      },
    ],
  },
};

export default function Lesson7({ onNavigate, onDone }) {
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
      id="l7"
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
      <p>{t.processIntro}</p>
      <Steps items={[t.step1, t.step2, t.step3, t.step4, t.step5]} />

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="b">
        <p>{t.checklistIntro}</p>
        <ul>
          <li>{t.check1}</li>
          <li>{t.check2}</li>
          <li>{t.check3}</li>
          <li>{t.check4}</li>
          <li>{t.check5}</li>
        </ul>
      </Box>
      <Rule title="💡">{t.ruleChecklist}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="g">{t.riskBox}</Box>

      <Quiz question={t.riskQuiz.question} options={t.riskQuiz.options} feedback={t.riskQuiz.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <p>{t.journalIntro}</p>
      <div className="g3">
        <GridItem labelColor="var(--gold)" label="1">
          {t.journalStep1}
        </GridItem>
        <GridItem labelColor="var(--gold)" label="2">
          {t.journalStep2}
        </GridItem>
        <GridItem labelColor="var(--gold)" label="3">
          {t.journalStep3}
        </GridItem>
      </div>
      <Rule title="💡">{t.ruleMindset}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.practiceSteps} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} lockedHint={t.finalTestLockedHint} />
    </LessonLayout>
  );
}
