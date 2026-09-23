import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import AnimatedFig from '../components/ui/AnimatedFig.jsx';
import Quiz from '../components/ui/Quiz.jsx';
import AnswerReveal from '../components/ui/AnswerReveal.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getAdvancedLessonMeta } from '../data/advancedLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ src, caption }) {
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

const meta = getAdvancedLessonMeta('adv5');

// ICT terminology is kept in English across all three languages — same
// convention as the rest of the Advanced and Technical tracks. This lesson
// ties Lessons 1-4 (Dealing Range, Liquidity, PD Array, Time and Price)
// together into one combined top-down checklist.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, tt) => `🔒 បញ្ចប់មេរៀន (${p}/${tt})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    ruleTitle: 'ច្បាប់ចងចាំ',
    lessonTag: 'មេរៀន ៥',
    intro: (
      <>
        A+ Trade មិនកើតចេញពីគំនិតតែមួយឡើយ — វាកើតចេញពីការផ្គុំគំនិតទាំង ៤ មេរៀនមុនចូលគ្នា ៖{' '}
        <strong>Dealing Range</strong>, <strong>Liquidity</strong>, <strong>PD Array</strong>, និង{' '}
        <strong>Time and Price</strong> ។ មេរៀននេះបង្ហាញពីរបៀបផ្គុំវាទាំងអស់ជា Checklist តែមួយ ។
      </>
    ),
    videoCaption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — កុំប្រញាប់ចូល Trade ប្រសិនបើមិនទាន់មានគ្រប់ជំហានទាំង ៥ នេះ Confluence គ្នា ។',
    h1: 'A+ Trade Checklist — ៥ ជំហាន',
    steps: [
      <>
        <strong>Dealing Range (មេរៀន ១) ៖</strong> តើ Price កំពុងនៅ Premium ឬ Discount លើ HTF? កំណត់ Bias
        ចេញពីទីនេះ (Buy ពី Discount, Sell ពី Premium) ។
      </>,
      <>
        <strong>Time and Price (មេរៀន ៤) ៖</strong> តើឥឡូវជា Killzone ត្រឹមត្រូវឬទេ? រង់ចាំ AMD Cycle — កុំ Trade
        ក្នុង Accumulation ។
      </>,
      <>
        <strong>Liquidity (មេរៀន ២) ៖</strong> តើមាន ERL (BSL/SSL, EQH/EQL) ត្រូវបាន Sweep ហើយឬនៅ (Manipulation)?
        នេះជាសញ្ញាដំបូងថា Trend ពិតជិតកើតឡើង ។
      </>,
      <>
        <strong>PD Array (មេរៀន ៣) ៖</strong> ក្រោយ Sweep, តើ Price ត្រឡប់ចូល IRL (FVG/OB/Breaker) ណាមួយឬទេ ក្នុង
        តំបន់ OTE (61.8%–79%)?
      </>,
      <>
        <strong>Confluence Check ៖</strong> តើជំហានទាំង ៤ ខាងលើ Confluence គ្នាទាំងអស់ឬទេ? បើ "បាទ/ចាស" ចំពោះ
        ទាំងអស់ — នេះជា A+ Setup ។
      </>,
    ],
    diagramCaption: 'រឿងរ៉ាវពេញលេញ ៖ Accumulation ក្នុង Asia → Manipulation Sweep SSL → Distribution ចេញពី OB/FVG ក្នុង OTE Zone ។',
    rule1: (
      <>
        បើជំហានណាមួយក្នុង ៥ នេះខ្វះ — Setup នោះ <strong>មិនមែន A+</strong> ទេ ។ វិន័យក្នុងការរង់ចាំគ្រប់ជំហាន
        សំខាន់ជាងល្បឿននៃការចូល Trade ។
      </>
    ),
    h2: 'កំហុសទូទៅដែលបំផ្លាញ A+ Setup',
    mistake1: (
      <>
        Trade ផ្ទុយពី HTF Bias — Buy ក្នុងតំបន់ <strong>Premium</strong> ឬ Sell ក្នុងតំបន់ <strong>Discount</strong>
        ។
      </>
    ),
    mistake2: (
      <>
        ចូល Trade <strong>មុន</strong> Liquidity Sweep កើតឡើង — Entry ព្រៀនពេក មុនពេល Smart Money បញ្ចប់ការប្រមូល
        Order ។
      </>
    ),
    mistake3: (
      <>
        មិនអើពើ Killzone — Setup ស្រដៀងគ្នា ប៉ុន្តែកើតឡើងក្រៅ Killzone មាន Probability ទាបជាង ។
      </>
    ),
    mistake4: <>ចូល Trade ដោយគ្មាន Confluence ច្រើនជាង ១ (ឧ. OTE តែម្នាក់ឯង គ្មាន PD Array ត្រួតគ្នា) ។</>,
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'តាម A+ Checklist — តើអ្វីត្រូវកើតឡើងមុននឹងរកមើល Entry ចូល IRL?',
      options: [
        { label: 'Liquidity Sweep (ERL) ត្រូវកើតឡើងសិន', type: 'ok' },
        { label: 'Session New York ត្រូវចប់សិន', type: 'no' },
        { label: 'FinalTest ត្រូវឆ្លើយត្រូវសិន', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Liquidity Sweep (ERL) ត្រូវកើតឡើងសិន មុននឹងរង់ចាំ Price ត្រឡប់ចូល IRL ។',
        no: '✗ តាម Checklist, Liquidity Sweep (ERL) ត្រូវកើតឡើងសិន មុននឹងរង់ចាំ Entry ចូល IRL ។',
      },
    },
    quiz2: {
      question: 'តើអ្វីជាកំហុសទូទៅមួយ ដែលបំផ្លាញ A+ Setup?',
      options: [
        { label: 'រង់ចាំគ្រប់ជំហានទាំង ៥ Confluence គ្នា', type: 'no' },
        { label: 'Buy ក្នុងតំបន់ Premium ខណៈពេលដែល Bias ជា Bullish', type: 'ok' },
        { label: 'ត្រួតពិនិត្យ Killzone មុននឹង Entry', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Buy ក្នុងតំបន់ Premium (ផ្ទុយពី Discount ដែលត្រូវរង់ចាំ) ជាកំហុសទូទៅមួយ ។',
        no: '✗ Buy ក្នុងតំបន់ Premium ខណៈពេលដែលគួរ Buy ពី Discount ជាកំហុសទូទៅមួយ ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ៥ (Capstone)',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងដាក់ឈ្មោះជំហានទាំង ៥ ដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: <>តើផ្នែកណាជា Accumulation, Manipulation, និង Distribution?</>,
    homeworkLi2: <>តើ ERL ណាមួយត្រូវបាន Sweep?</>,
    homeworkLi3: <>តើ IRL (PD Array) ណាមួយស្ថិតនៅក្នុង OTE Zone ដែល Price ត្រឡប់ចូល?</>,
    homeworkCaption: 'Chart នេះមិនទាន់មាន Label ទេ — សាកល្បងកំណត់ដោយខ្លួនឯងសិន ។',
    homeworkRevealLabel: '👁 មើលចម្លើយ',
    homeworkAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Candle 1-4 ជា <strong>Accumulation</strong> (Range តូចក្នុង Asia) ។ Candle 5
        Sweep SSL ក្រោម Range នោះជា <strong>Manipulation</strong> ។ Candle 6 ជា <strong>Bullish OB</strong> ។
        Candle 7-8 Retrace ចូល <strong>OTE Zone (61.8%–79%)</strong> ដែលត្រួតគ្នាជាមួយ OB នោះ (Confluence ពិត) ។
        Candle 9-10 ជា <strong>Distribution</strong> ដែលបញ្ជាក់ Entry — នេះជា A+ Setup ពិតប្រាកដ ព្រោះជំហានទាំង
        ៥ Confluence គ្នាទាំងអស់ ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> ស្វែងរក A+ Setup ១ ដែលពិតប្រាកដ លើ Chart ផ្ទាល់ខ្លួន ដោយប្រើ Checklist
        ទាំង ៥ ជំហាន ។ សរសេរពន្យល់មូលហេតុនីមួយៗ ហើយផ្ញើមក Mentor ដើម្បីត្រួតពិនិត្យ — នេះជាការបញ្ចប់ Advanced
        Track ទាំងមូល ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់វគ្គ Advanced',
    finalTestIntro: (
      <>
        នេះជា Final Test សម្រាប់ Advanced Track ទាំងមូល — ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៨ សំណួរ</strong> ដើម្បីបញ្ចប់
        Course នេះ ។ បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'តាម A+ Checklist, ជំហានទី ១ គឺជាអ្វី?',
        options: [
          { label: 'កំណត់ Bias ពី Dealing Range (Premium/Discount)', correct: true },
          { label: 'ចូល Trade ភ្លាមៗ', correct: false },
          { label: 'រង់ចាំ FinalTest', correct: false },
        ],
      },
      {
        question: 'ហេតុអ្វី Time and Price សំខាន់ក្នុង A+ Setup?',
        options: [
          { label: 'Setup ក្នុង Killzone មាន Probability ខ្ពស់ជាង Setup ក្រៅ Killzone', correct: true },
          { label: 'វាមិនប៉ះពាល់អ្វីទាល់តែសោះ', correct: false },
          { label: 'វាសំខាន់តែថ្ងៃសុក្រ', correct: false },
        ],
      },
      {
        question: 'តាម Sequence ត្រឹមត្រូវ, តើអ្វីកើតឡើងមុន — Liquidity Sweep ឬ Entry ចូល IRL?',
        options: [
          { label: 'Entry ចូល IRL កើតឡើងមុន', correct: false },
          { label: 'Liquidity Sweep (ERL) កើតឡើងមុន', correct: true },
          { label: 'ទាំង ២ កើតឡើងដំណាលគ្នា', correct: false },
        ],
      },
      {
        question: 'OTE Zone ត្រូវប្រើផ្គុំជាមួយអ្វី ដើម្បីបង្កើន Confluence?',
        options: [
          { label: 'PD Array (ដូចជា OB ឬ FVG) ត្រួតគ្នាក្នុង OTE', correct: true },
          { label: 'Candle ណាមួយក៏បាន', correct: false },
          { label: 'ថ្ងៃនៃសប្តាហ៍', correct: false },
        ],
      },
      {
        question: 'ក្នុង Bullish Bias, គួររកមើល Buy នៅតំបន់ណា?',
        options: [
          { label: 'Premium', correct: false },
          { label: 'Discount', correct: true },
          { label: 'កន្លែងណាក៏បាន', correct: false },
        ],
      },
      {
        question: 'Manipulation Phase ក្នុង AMD ត្រូវនឹងគំនិតណាក្នុងមេរៀនទី ២?',
        options: [
          { label: 'Liquidity Sweep (ERL)', correct: true },
          { label: 'Dealing Range High', correct: false },
          { label: 'BPR', correct: false },
        ],
      },
      {
        question: 'Breaker Block ខុសពី Order Block ធម្មតាត្រង់ណា?',
        options: [
          { label: 'Breaker ជា OB ចាស់ដែលបរាជ័យ ហើយប្តូរតួនាទីផ្ទុយ', correct: true },
          { label: 'ពួកវាដូចគ្នាទាំងស្រុង', correct: false },
          { label: 'Breaker តែងតែធំជាង OB', correct: false },
        ],
      },
      {
        question: 'តើអ្វីជាកំហុសទូទៅមួយដែលបំផ្លាញ A+ Setup?',
        options: [
          { label: 'ចូល Trade មុន Liquidity Sweep កើតឡើង', correct: true },
          { label: 'រង់ចាំគ្រប់ ៥ ជំហាន Confluence គ្នា', correct: false },
          { label: 'ត្រួតពិនិត្យ Killzone', correct: false },
        ],
      },
    ],
  },
  en: {
    feedbackOk: '✓ Correct!',
    feedbackNo: '✗ Not quite — try again.',
    finishLocked: (p, tt) => `🔒 Finish lesson (${p}/${tt})`,
    finishUnlocked: '✓ Finish lesson',
    ruleTitle: 'Rule to remember',
    lessonTag: 'Lesson 5',
    intro: (
      <>
        An A+ trade never comes from a single idea — it comes from stacking the previous 4 lessons together:{' '}
        <strong>Dealing Range</strong>, <strong>Liquidity</strong>, <strong>PD Array</strong>, and{' '}
        <strong>Time and Price</strong>. This lesson shows how to combine all four into a single checklist.
      </>
    ),
    videoCaption: "Listen closely — don't rush into a trade unless all 5 steps below line up together.",
    h1: 'The A+ Trade Checklist — 5 Steps',
    steps: [
      <>
        <strong>Dealing Range (Lesson 1):</strong> Is price trading at a Premium or a Discount on the higher
        timeframe? Set your bias from here (buy from Discount, sell from Premium).
      </>,
      <>
        <strong>Time and Price (Lesson 4):</strong> Are you inside the correct Killzone right now? Wait through
        the AMD cycle — don't trade during Accumulation.
      </>,
      <>
        <strong>Liquidity (Lesson 2):</strong> Has an ERL (BSL/SSL, EQH/EQL) already been swept (Manipulation)?
        That's the first sign the real trend is close.
      </>,
      <>
        <strong>PD Array (Lesson 3):</strong> After the sweep, has price returned into an IRL (FVG/OB/Breaker)
        sitting inside the OTE zone (61.8%–79%)?
      </>,
      <>
        <strong>Confluence check:</strong> Do all 4 steps above line up together? If yes to every single one —
        that's an A+ setup.
      </>,
    ],
    diagramCaption: 'The full story: Accumulation during Asia → Manipulation sweeps the SSL → Distribution launches from an OB/FVG inside the OTE zone.',
    rule1: (
      <>
        If even one of these 5 steps is missing, the setup is <strong>not an A+</strong>. The discipline to wait
        for every step matters more than the speed of entering.
      </>
    ),
    h2: 'Common Mistakes That Ruin an A+ Setup',
    mistake1: (
      <>
        Trading against the HTF bias — buying inside a <strong>Premium</strong> zone or selling inside a{' '}
        <strong>Discount</strong> zone.
      </>
    ),
    mistake2: (
      <>
        Entering <strong>before</strong> the liquidity sweep happens — jumping in too early, before Smart Money
        has finished collecting its orders.
      </>
    ),
    mistake3: <>Ignoring the Killzone — an identical-looking setup outside a Killzone carries much lower probability.</>,
    mistake4: <>Entering without more than one confluence factor (e.g. OTE alone, with no PD array overlapping it).</>,
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'According to the A+ Checklist, what needs to happen before you look for an entry into the IRL?',
      options: [
        { label: 'A liquidity sweep (ERL) needs to happen first', type: 'ok' },
        { label: 'The New York session needs to end first', type: 'no' },
        { label: 'The FinalTest needs to be passed first', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A liquidity sweep (ERL) needs to happen first, before waiting for price to return to an IRL.',
        no: '✗ According to the checklist, a liquidity sweep (ERL) needs to happen first, before looking for an entry into the IRL.',
      },
    },
    quiz2: {
      question: 'What is a common mistake that ruins an A+ setup?',
      options: [
        { label: 'Waiting for all 5 steps to line up together', type: 'no' },
        { label: 'Buying inside a Premium zone while the bias is bullish', type: 'ok' },
        { label: 'Checking the Killzone before entering', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Buying inside a Premium zone (instead of waiting for a Discount) is a common mistake.',
        no: '✗ Buying inside a Premium zone when you should be buying from a Discount is a common mistake.',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 5 (Capstone)',
    homeworkIntro: 'Study the chart below and try to name all 5 steps yourself before clicking "Show Answer":',
    homeworkLi1: <>Which part is Accumulation, Manipulation, and Distribution?</>,
    homeworkLi2: <>Which ERL gets swept?</>,
    homeworkLi3: <>Which IRL (PD array) sits inside the OTE zone that price returns into?</>,
    homeworkCaption: "This chart isn't labeled yet — try to work it out yourself first.",
    homeworkRevealLabel: '👁 Show Answer',
    homeworkAnswer: (
      <p>
        <strong>Answer:</strong> Candles 1-4 are the <strong>Accumulation</strong> (a tight range during Asia).
        Candle 5 sweeps the SSL below that range — the <strong>Manipulation</strong>. Candle 6 is a{' '}
        <strong>Bullish OB</strong>. Candles 7-8 retrace into the <strong>OTE Zone (61.8%–79%)</strong>, which
        overlaps that OB (real confluence). Candles 9-10 are the <strong>Distribution</strong> confirming the
        entry — a genuine A+ setup, because all 5 steps line up together.
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Find one real A+ setup on your own chart, using all 5 steps of the
        checklist. Write out the reasoning for each step and send it to your mentor to review — this completes
        the entire Advanced track.
      </p>
    ),
    finalTestHeading: '🔒 Advanced Track Final Test',
    finalTestIntro: (
      <>
        This is the final test for the whole Advanced track — you need to answer{' '}
        <strong>all 8 questions correctly</strong> to complete the course. Wrong answers can be retried an
        unlimited number of times.
      </>
    ),
    finalTestQuestions: [
      {
        question: "What's Step 1 of the A+ Checklist?",
        options: [
          { label: 'Set your bias from the Dealing Range (Premium/Discount)', correct: true },
          { label: 'Enter the trade immediately', correct: false },
          { label: 'Wait for the FinalTest', correct: false },
        ],
      },
      {
        question: 'Why does Time and Price matter for an A+ setup?',
        options: [
          { label: 'A setup inside a Killzone carries higher probability than one outside it', correct: true },
          { label: 'It has no effect at all', correct: false },
          { label: 'It only matters on Fridays', correct: false },
        ],
      },
      {
        question: 'In the correct sequence, which happens first — the liquidity sweep, or the entry into the IRL?',
        options: [
          { label: 'The entry into the IRL happens first', correct: false },
          { label: 'The liquidity sweep (ERL) happens first', correct: true },
          { label: 'They both happen at the same time', correct: false },
        ],
      },
      {
        question: 'What should the OTE zone be combined with for extra confluence?',
        options: [
          { label: 'A PD array (like an OB or FVG) overlapping the OTE', correct: true },
          { label: 'Any random candle', correct: false },
          { label: 'The day of the week', correct: false },
        ],
      },
      {
        question: 'In a bullish bias, where should you look to buy?',
        options: [
          { label: 'Premium', correct: false },
          { label: 'Discount', correct: true },
          { label: 'Anywhere at all', correct: false },
        ],
      },
      {
        question: 'The Manipulation phase of AMD matches which Lesson 2 concept?',
        options: [
          { label: 'A liquidity sweep (ERL)', correct: true },
          { label: 'The Dealing Range High', correct: false },
          { label: 'A BPR', correct: false },
        ],
      },
      {
        question: 'How is a Breaker Block different from a regular Order Block?',
        options: [
          { label: "It's an old OB that failed and flipped to the opposite role", correct: true },
          { label: "They're exactly the same thing", correct: false },
          { label: "A Breaker is always bigger than an OB", correct: false },
        ],
      },
      {
        question: 'What is a common mistake that ruins an A+ setup?',
        options: [
          { label: 'Entering before the liquidity sweep happens', correct: true },
          { label: 'Waiting for all 5 steps to line up', correct: false },
          { label: 'Checking the Killzone', correct: false },
        ],
      },
    ],
  },
  zh: {
    feedbackOk: '✓ 正确！',
    feedbackNo: '✗ 不正确，请再试一次。',
    finishLocked: (p, tt) => `🔒 完成课程 (${p}/${tt})`,
    finishUnlocked: '✓ 完成课程',
    ruleTitle: '记住这条规则',
    lessonTag: '第 5 课',
    intro: (
      <>
        A+ 级交易从来不是靠单一的想法形成的 — 而是把前面 4 节课叠加在一起：<strong>Dealing Range</strong>、
        <strong>流动性</strong>、<strong>PD Array</strong>，以及<strong>时间与价格</strong>。本课展示如何把
        这四者合并为一份检查清单。
      </>
    ),
    videoCaption: '用心聆听 — 如果下面这 5 个步骤没有同时对齐，就不要急着进场。',
    h1: 'A+ 交易检查清单 — 5 个步骤',
    steps: [
      <>
        <strong>Dealing Range（第 1 课）：</strong>价格在更高周期上处于 Premium 还是 Discount？由此确定你的
        偏向（从 Discount 买入，从 Premium 卖出）。
      </>,
      <>
        <strong>Time and Price（第 4 课）：</strong>现在是否处于正确的 Killzone？耐心等待 AMD 循环 — 不要在
        Accumulation 阶段交易。
      </>,
      <>
        <strong>流动性（第 2 课）：</strong>是否已经有 ERL（BSL/SSL、EQH/EQL）被扫荡（Manipulation）？这是真正
        趋势即将出现的第一个信号。
      </>,
      <>
        <strong>PD Array（第 3 课）：</strong>扫荡之后，价格是否回到位于 OTE 区域（61.8%–79%）内的 IRL
        （FVG/OB/Breaker）？
      </>,
      <>
        <strong>共振检查：</strong>以上 4 个步骤是否全部同时成立？如果每一项都是"是"— 那就是一次 A+ 级交易
        机会。
      </>,
    ],
    diagramCaption: '完整故事：亚洲时段的 Accumulation → Manipulation 扫荡 SSL → 从 OTE 区域内的 OB/FVG 展开 Distribution。',
    rule1: (
      <>
        只要这 5 个步骤中缺了任何一个，这个形态就<strong>不是</strong> A+ 级 — 耐心等待每一个步骤，比快速
        进场更重要。
      </>
    ),
    h2: '毁掉 A+ 级交易机会的常见错误',
    mistake1: (
      <>
        逆着高周期偏向交易 — 在<strong>Premium</strong>区域买入，或在<strong>Discount</strong>区域卖出。
      </>
    ),
    mistake2: <>在流动性扫荡发生<strong>之前</strong>就入场 — 在机构资金完成收集订单之前就过早进场。</>,
    mistake3: <>忽略 Killzone — 在 Killzone 之外形成的、外观一样的形态，胜率要低得多。</>,
    mistake4: <>在没有多个共振因素的情况下入场（例如只有 OTE，却没有 PD array 与其重叠）。</>,
    quizHeading: '知识检测',
    quiz1: {
      question: '按照 A+ 检查清单，在寻找进入 IRL 的入场机会之前，必须先发生什么？',
      options: [
        { label: '必须先发生一次流动性扫荡（ERL）', type: 'ok' },
        { label: '纽约时段必须先结束', type: 'no' },
        { label: '必须先通过 FinalTest', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！必须先发生流动性扫荡（ERL），再等待价格回到 IRL。',
        no: '✗ 按照检查清单，必须先发生流动性扫荡（ERL），才能寻找进入 IRL 的入场机会。',
      },
    },
    quiz2: {
      question: '什么是毁掉 A+ 级交易机会的常见错误？',
      options: [
        { label: '等待全部 5 个步骤同时对齐', type: 'no' },
        { label: '在看涨偏向下，却在 Premium 区域买入', type: 'ok' },
        { label: '入场前检查 Killzone', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！在应该等待 Discount 时却在 Premium 区域买入，是一个常见错误。',
        no: '✗ 在应该从 Discount 买入时却在 Premium 区域买入，是一个常见错误。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 5 课（综合总结）',
    homeworkIntro: '先自己尝试说出这 5 个步骤，再点击"查看答案"：',
    homeworkLi1: <>哪一部分是 Accumulation、Manipulation 与 Distribution？</>,
    homeworkLi2: <>哪个 ERL 被扫荡了？</>,
    homeworkLi3: <>价格回归的 OTE 区域内，是哪一个 IRL（PD array）？</>,
    homeworkCaption: '这张图还没有标注 — 先自己试着判断。',
    homeworkRevealLabel: '👁 查看答案',
    homeworkAnswer: (
      <p>
        <strong>答案：</strong>1-4 号蜡烛是 <strong>Accumulation</strong>（亚洲时段内的狭窄区间）。5 号蜡烛
        扫荡了该区间下方的 SSL — 即 <strong>Manipulation</strong>。6 号蜡烛是一个<strong>看涨 OB</strong>。
        7-8 号蜡烛回撤进入 <strong>OTE 区域（61.8%–79%）</strong>，恰好与该 OB 重叠（真正的共振）。9-10 号
        蜡烛是确认入场的 <strong>Distribution</strong> — 这是一次真正的 A+ 级交易机会，因为全部 5 个步骤
        同时对齐。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 额外作业：</strong>在自己的图表上，用这 5 个步骤的检查清单找出一次真实的 A+ 级交易机会。
        写下每个步骤的判断依据，发给导师复盘 — 这将完成整个进阶课程。
      </p>
    ),
    finalTestHeading: '🔒 进阶课程结业总测验',
    finalTestIntro: (
      <>
        这是整个进阶课程的最终测验 — 需要<strong>全部 8 题都答对</strong>才能完成本课程。答错可以无限次重试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'A+ 检查清单的第 1 步是什么？',
        options: [
          { label: '根据 Dealing Range（Premium/Discount）确定偏向', correct: true },
          { label: '立即进场', correct: false },
          { label: '等待 FinalTest', correct: false },
        ],
      },
      {
        question: '为什么 Time and Price 对 A+ 级交易机会很重要？',
        options: [
          { label: 'Killzone 内形成的形态，胜率高于 Killzone 之外的形态', correct: true },
          { label: '完全没有任何影响', correct: false },
          { label: '只在星期五才重要', correct: false },
        ],
      },
      {
        question: '按正确顺序，流动性扫荡与进入 IRL 的入场，哪一个先发生？',
        options: [
          { label: '进入 IRL 的入场先发生', correct: false },
          { label: '流动性扫荡（ERL）先发生', correct: true },
          { label: '两者同时发生', correct: false },
        ],
      },
      {
        question: 'OTE 区域应该与什么结合，才能获得额外的共振？',
        options: [
          { label: '与 OTE 重叠的 PD array（如 OB 或 FVG）', correct: true },
          { label: '任意一根蜡烛', correct: false },
          { label: '星期几', correct: false },
        ],
      },
      {
        question: '在看涨偏向下，应该在哪里寻找买入？',
        options: [
          { label: 'Premium', correct: false },
          { label: 'Discount', correct: true },
          { label: '任何位置都可以', correct: false },
        ],
      },
      {
        question: 'AMD 中的 Manipulation 阶段对应第 2 课的哪个概念？',
        options: [
          { label: '流动性扫荡（ERL）', correct: true },
          { label: 'Dealing Range High', correct: false },
          { label: 'BPR', correct: false },
        ],
      },
      {
        question: 'Breaker Block 与普通 Order Block 有什么不同？',
        options: [
          { label: '它是失效并反转为相反角色的旧 OB', correct: true },
          { label: '它们完全相同', correct: false },
          { label: 'Breaker 总是比 OB 更大', correct: false },
        ],
      },
      {
        question: '什么是毁掉 A+ 级交易机会的常见错误？',
        options: [
          { label: '在流动性扫荡发生之前就入场', correct: true },
          { label: '等待全部 5 个步骤对齐', correct: false },
          { label: '检查 Killzone', correct: false },
        ],
      },
    ],
  },
};

export default function Advanced5({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['adv5']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="adv5"
      track="advanced"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <span className="badge bb">{t.lessonTag}</span>
      <p style={{ marginTop: 10 }}>{t.intro}</p>

      <LessonVideo src={src} caption={t.videoCaption} />

      {/* ===== A+ CHECKLIST ===== */}
      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Steps items={t.steps} />

      <AnimatedFig caption={t.diagramCaption}>
        <svg viewBox="0 0 700 260">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#D9B25F" fontWeight="700" fontFamily="Space Grotesk,sans-serif">A+ TRADE — FULL STORY</text>

          {/* fib grid for OTE context */}
          <line x1="20" y1="180" x2="650" y2="180" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.05s' }} />
          <line x1="20" y1="215" x2="650" y2="215" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.05s' }} />
          <rect x="20" y="180" width="630" height="35" fill="#5B9BD5" opacity="0.12" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="655" y="184" fontSize="8" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>61.8%</text>
          <text x="655" y="219" fontSize="8" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>79%</text>

          {/* Accumulation */}
          <rect x="30" y="100" width="150" height="45" fill="#5B9BD5" opacity="0.1" className="ac" style={{ animationDelay: '.15s' }} />
          <text x="105" y="95" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>1. Accumulation</text>
          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="55" y1="110" x2="55" y2="135" stroke="#3EC97A" strokeWidth="1.2" /><rect x="49" y="114" width="12" height="17" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.31s' }}><line x1="90" y1="115" x2="90" y2="138" stroke="#E05555" strokeWidth="1.2" /><rect x="84" y="119" width="12" height="15" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.37s' }}><line x1="125" y1="108" x2="125" y2="132" stroke="#3EC97A" strokeWidth="1.2" /><rect x="119" y="112" width="12" height="16" rx="1" fill="#3EC97A" /></g>

          {/* Manipulation sweep */}
          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="200" y1="120" x2="200" y2="175" stroke="#E05555" strokeWidth="1.6" /><rect x="192" y="125" width="16" height="35" rx="1" fill="#E05555" /></g>
          <text x="200" y="190" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>2. Manipulation — Sweep SSL</text>

          {/* Bullish OB inside OTE */}
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="250" y1="155" x2="250" y2="200" stroke="#3EC97A" strokeWidth="1.6" /><rect x="242" y="160" width="16" height="35" rx="1" fill="#3EC97A" /></g>
          <rect x="242" y="160" width="16" height="35" fill="none" stroke="#D9B25F" strokeWidth="1" strokeDasharray="2 2" className="ac" style={{ animationDelay: '.65s' }} />
          <text x="250" y="235" textAnchor="middle" fontSize="9" fill="#D9B25F" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>3. Bullish OB inside OTE</text>

          {/* Distribution */}
          <g className="ac" style={{ animationDelay: '.8s' }}><line x1="320" y1="120" x2="320" y2="160" stroke="#3EC97A" strokeWidth="1.4" /><rect x="314" y="125" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.88s' }}><line x1="370" y1="80" x2="370" y2="125" stroke="#3EC97A" strokeWidth="1.4" /><rect x="364" y="85" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.96s' }}><line x1="420" y1="40" x2="420" y2="85" stroke="#3EC97A" strokeWidth="1.4" /><rect x="414" y="45" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="420" y="30" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1s' }}>4. Distribution ↑</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== COMMON MISTAKES ===== */}
      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="d">
        <ul>
          <li>{t.mistake1}</li>
          <li>{t.mistake2}</li>
          <li>{t.mistake3}</li>
          <li>{t.mistake4}</li>
        </ul>
      </Box>

      {/* ===== QUIZ ===== */}
      <h3>
        <span className="bar"></span>
        {t.quizHeading}
      </h3>
      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />
      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      {/* ===== HOMEWORK ===== */}
      <h3>
        <span className="bar"></span>
        {t.homeworkHeading}
      </h3>
      <Box variant="g">
        <p>{t.homeworkIntro}</p>
        <ul>
          <li>{t.homeworkLi1}</li>
          <li>{t.homeworkLi2}</li>
          <li>{t.homeworkLi3}</li>
        </ul>
      </Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <svg viewBox="0 0 700 260">
          <line x1="20" y1="180" x2="650" y2="180" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="20" y1="215" x2="650" y2="215" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />

          <g><line x1="55" y1="110" x2="55" y2="135" stroke="#3EC97A" strokeWidth="1.2" /><rect x="49" y="114" width="12" height="17" rx="1" fill="#3EC97A" /></g>
          <text x="55" y="150" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">1</text>

          <g><line x1="90" y1="115" x2="90" y2="138" stroke="#E05555" strokeWidth="1.2" /><rect x="84" y="119" width="12" height="15" rx="1" fill="#E05555" /></g>
          <text x="90" y="153" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">2</text>

          <g><line x1="125" y1="108" x2="125" y2="132" stroke="#3EC97A" strokeWidth="1.2" /><rect x="119" y="112" width="12" height="16" rx="1" fill="#3EC97A" /></g>
          <text x="125" y="147" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">3</text>

          <g><line x1="160" y1="100" x2="160" y2="125" stroke="#E05555" strokeWidth="1.2" /><rect x="154" y="104" width="12" height="16" rx="1" fill="#E05555" /></g>
          <text x="160" y="140" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">4</text>

          <g><line x1="200" y1="120" x2="200" y2="175" stroke="#E05555" strokeWidth="1.6" /><rect x="192" y="125" width="16" height="35" rx="1" fill="#E05555" /></g>
          <text x="200" y="190" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">5</text>

          <g><line x1="250" y1="155" x2="250" y2="200" stroke="#3EC97A" strokeWidth="1.6" /><rect x="242" y="160" width="16" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="250" y="215" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">6</text>

          <g><line x1="320" y1="120" x2="320" y2="160" stroke="#3EC97A" strokeWidth="1.4" /><rect x="314" y="125" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="320" y="175" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">7</text>

          <g><line x1="370" y1="80" x2="370" y2="125" stroke="#3EC97A" strokeWidth="1.4" /><rect x="364" y="85" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="370" y="140" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">8</text>

          <g><line x1="420" y1="40" x2="420" y2="85" stroke="#3EC97A" strokeWidth="1.4" /><rect x="414" y="45" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="420" y="100" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">9</text>

          <g><line x1="470" y1="10" x2="470" y2="45" stroke="#3EC97A" strokeWidth="1.4" /><rect x="464" y="15" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <text x="470" y="60" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">10</text>
        </svg>
        <div className="cap">{t.homeworkCaption}</div>
      </div>
      <AnswerReveal label={t.homeworkRevealLabel} variant="d">
        {t.homeworkAnswer}
      </AnswerReveal>

      <Box variant="b" style={{ marginTop: 20 }}>
        {t.bonusHomework}
      </Box>

      {/* ===== FINAL TEST — LOCK GATE ===== */}
      <h3>
        <span className="bar"></span>
        {t.finalTestHeading}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
