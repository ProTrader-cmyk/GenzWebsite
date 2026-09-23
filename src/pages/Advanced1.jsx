import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
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

const meta = getAdvancedLessonMeta('adv1');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagrams) stays identical across languages — only this
// content swaps. ICT terminology (Dealing Range, OTE, Premium/Discount,
// Fibo, etc.) is kept in English in every language, same convention as the
// Technical track (Order Block, FVG, BOS, etc.).
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, tt) => `🔒 បញ្ចប់មេរៀន (${p}/${tt})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    ruleTitle: 'ច្បាប់ចងចាំ',
    lessonTag: 'មេរៀន ១',
    intro: (
      <>
        <strong>Dealing Range</strong> គឺជា <strong>មូលដ្ឋានគ្រឹះដំបូងគេ</strong> នៃគំនិត ICT កម្រិតខ្ពស់ទាំងអស់ —
        វាជាប្រអប់ (Box) ដែល Trader ប្រើសម្រាប់គូរ Fibonacci ដើម្បីដឹងថា Price កំពុងនៅតំបន់{' '}
        <strong>Premium</strong> (ថ្លៃ) ឬ <strong>Discount</strong> (ថោក) ។ គំនិតទាំង ៣ ក្នុងមេរៀននេះ — Dealing
        Range, OTE Fibo, និង Premium/Discount — តែងតែប្រើរួមគ្នាជានិច្ច ។
      </>
    ),
    videoCaption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — ការគូរ Dealing Range ឲ្យត្រឹមត្រូវ គឺជាជំហានដំបូងបំផុតសម្រាប់រាល់ការវិភាគ ICT ។',
    h1: 'តើ Dealing Range ជាអ្វី?',
    drDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Dealing Range គឺជា <strong>ចន្លោះតម្លៃ</strong> រវាងចំណុចខ្ពស់ និងចំណុចទាបរបស់
        Leg ចលនាមួយដែលមានលក្ខណៈច្បាស់លាស់ (Displacement / Expansion) ។ ចំណុចទាំង ២ នេះ ក្លាយជា{' '}
        <strong>Anchor</strong> សម្រាប់គូរ Fibonacci Retracement ដើម្បីរក OTE និងកំណត់ Premium/Discount ។
      </p>
    ),
    drHighLabel: 'Dealing Range High',
    drHighBody: (
      <>
        ចំណុចខ្ពស់បំផុតនៃ Leg ចលនា — ចំណុច <strong>0%</strong> នៅពេលគូរ Fibo សម្រាប់ Setup Bearish, ឬ{' '}
        <strong>100%</strong> សម្រាប់ Setup Bullish ។
      </>
    ),
    drLowLabel: 'Dealing Range Low',
    drLowBody: (
      <>
        ចំណុចទាបបំផុតនៃ Leg ចលនា — ចំណុច <strong>100%</strong> នៅពេលគូរ Fibo សម្រាប់ Setup Bearish, ឬ{' '}
        <strong>0%</strong> សម្រាប់ Setup Bullish ។
      </>
    ),
    h2: 'របៀបកំណត់ Dealing Range',
    steps: [
      <>
        រក <strong>Displacement / Expansion Leg</strong> ដ៏ច្បាស់លាស់មួយ — ចលនាដែល Candle បន្តគ្នាទៅមុខមួយទិស
        ដោយស្ទើរតែគ្មាន Overlap ។
      </>,
      <>
        Mark <strong>Dealing Range High</strong> នៅត្រង់ Wick ខ្ពស់បំផុតនៃ Leg នោះ ។
      </>,
      <>
        Mark <strong>Dealing Range Low</strong> នៅត្រង់ Wick ទាបបំផុតនៃ Leg នោះ ។
      </>,
      <>
        ចន្លោះទាំងអស់រវាង High និង Low ទាំង ២ នេះ ក្លាយជា <strong>Dealing Range</strong> របស់អ្នក — មូលដ្ឋានសម្រាប់
        គូរ Fibo នៅជំហានបន្ទាប់ ។
      </>,
    ],
    diagram1Caption: (
      <>
        Leg ចលនា Bullish ពី Candle 1 (Dealing Range Low) ដល់ Candle 9 (Dealing Range High) — ប្រអប់ពណ៌ខៀវ
        តំណាងឲ្យ Dealing Range ទាំងមូល ។
      </>
    ),
    rule1: (
      <>
        ជ្រើសរើស Leg ដែលមាន <strong>Displacement</strong> ពិតប្រាកដតែប៉ុណ្ណោះ — កុំយក High/Low ចៃដន្យណាមួយមក
        Mark ព្រោះ Dealing Range ខុស នាំឲ្យ Fibo, OTE, Premium/Discount ខុសទាំងអស់ ។
      </>
    ),
    h3: 'OTE — Optimal Trade Entry (Fibo)',
    oteDef: (
      <p>
        <strong>OTE (Optimal Trade Entry)</strong> គឺជាតំបន់ Retracement រវាង <strong>61.8%</strong> ទៅ{' '}
        <strong>79%</strong> នៃ Fibonacci ដែលគូរពី Dealing Range Low ទៅ Dealing Range High (ឬផ្ទុយវិញ) ។ Trader
        ICT រង់ចាំ Price ត្រឡប់ចូលទៅតំបន់នេះ មុននឹងចាប់ Entry តាមទិស Leg ដើម ។
      </p>
    ),
    oteSteps: [
      <>
        សម្រាប់ Setup <strong>Bullish</strong>, គូរ Fibonacci ពី Dealing Range Low (0%) ទៅ Dealing Range High
        (100%) ។
      </>,
      <>
        រង់ចាំ Price Retrace ចុះមកវិញចូលតំបន់ <strong>61.8%–79%</strong> — នេះជា OTE Zone ។
      </>,
      <>
        រកមើលថាតើមាន <strong>PD Array</strong> (ដូចជា OB ឬ FVG) ស្ថិតនៅក្នុង OTE Zone នេះដែរឬទេ ដើម្បីបង្កើន
        Confluence មុននឹង Entry ។
      </>,
    ],
    diagram2Caption: (
      <>
        Price ឡើងដល់ Dealing Range High រួច Retrace ចូល OTE Zone (61.8%–79%) មុននឹង Reverse ឡើងបំបែក High ចាស់
        — នេះជា OTE Entry ។
      </>
    ),
    rule2: (
      <>
        OTE តែម្នាក់ឯង <strong>មិនគ្រប់គ្រាន់</strong> ទេ — កំលាំងបំផុតកើតឡើងនៅពេល OTE Zone Overlap ជាមួយ PD Array
        ផ្សេងទៀត (OB, FVG, Breaker) ។
      </>
    ),
    h4: 'Premium and Discount (Fibo Only)',
    premiumLabel: 'Premium (ថ្លៃ)',
    premiumBody: (
      <>
        Price នៅ <strong>លើ 50%</strong> នៃ Dealing Range
        <br />
        តំបន់ "ថ្លៃ" ធៀបនឹង Range
        <br />
        <strong>→ រកមើល Sell</strong> (ក្នុង Bearish Bias)
      </>
    ),
    discountLabel: 'Discount (ថោក)',
    discountBody: (
      <>
        Price នៅ <strong>ក្រោម 50%</strong> នៃ Dealing Range
        <br />
        តំបន់ "ថោក" ធៀបនឹង Range
        <br />
        <strong>→ រកមើល Buy</strong> (ក្នុង Bullish Bias)
      </>
    ),
    diagram3Caption: (
      <>
        50% (Equilibrium) បែងចែក Dealing Range ជា ២ — លើ Equilibrium ជា Premium, ក្រោម Equilibrium ជា Discount ។
      </>
    ),
    whyImportant: (
      <p>
        <strong>💡 ហេតុអ្វីវាសំខាន់ ៖</strong> Premium/Discount ជួយកុំឲ្យអ្នក Buy ខ្ពស់ពេក ឬ Sell ទាបពេក ។ ក្នុង
        Bullish Bias, រកមើល Buy តែនៅ <strong>Discount</strong> ប៉ុណ្ណោះ ។ ក្នុង Bearish Bias, រកមើល Sell តែនៅ{' '}
        <strong>Premium</strong> ប៉ុណ្ណោះ — កុំធ្វើផ្ទុយពី Draw on Liquidity ។
      </p>
    ),
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'OTE តំណាងឲ្យអ្វី ហើយស្ថិតនៅចន្លោះ Fibo ណា?',
      options: [
        { label: 'Optimal Trade Entry — ចន្លោះ 61.8%–79%', type: 'ok' },
        { label: 'Overall Trend Estimate — ចន្លោះ 0%–23.6%', type: 'no' },
        { label: 'Order Type Execution — តែត្រង់ 100%', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! OTE = Optimal Trade Entry ស្ថិតនៅចន្លោះ 61.8%–79% នៃ Fibonacci ។',
        no: '✗ OTE = Optimal Trade Entry ស្ថិតនៅចន្លោះ 61.8%–79% នៃ Fibonacci ។',
      },
    },
    quiz2: {
      question: 'Price កំពុងនៅលើ 50% (Equilibrium) នៃ Dealing Range — តើវាស្ថិតនៅតំបន់អ្វី ហើយគួរធ្វើអ្វី?',
      options: [
        { label: 'Discount — រកមើល Buy', type: 'no' },
        { label: 'Premium — រកមើល Sell', type: 'ok' },
        { label: 'Equilibrium — មិនធ្វើអ្វីទាំងអស់', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! លើ 50% = Premium ដែលជាតំបន់រកមើល Sell (ក្នុង Bearish Bias) ។',
        no: '✗ Price ដែលនៅលើ 50% របស់ Dealing Range ស្ថិតនៅតំបន់ Premium — រកមើល Sell ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ១',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងឆ្លើយសំណួរដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: (
      <>
        តើ Candle លេខប៉ុន្មាន ជា <strong>Dealing Range Low</strong> ហើយលេខប៉ុន្មាន ជា{' '}
        <strong>Dealing Range High</strong>?
      </>
    ),
    homeworkLi2: (
      <>
        តើ Candle លេខប៉ុន្មាន ដែល Wick ចូលទៅក្នុង <strong>OTE Zone (61.8%–79%)</strong>?
      </>
    ),
    homeworkLi3: (
      <>
        តំបន់ដែល Candle Retrace ចុះទៅនោះ ស្ថិតនៅក្នុង <strong>Premium ឬ Discount</strong> នៃ Dealing Range ដើម?
      </>
    ),
    homeworkCaption: 'Chart នេះមិនទាន់មាន Label ទេ — សាកល្បងកំណត់ដោយខ្លួនឯងសិន ។',
    homeworkRevealLabel: '👁 មើលចម្លើយ',
    homeworkAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Candle 1 ជា <strong>Dealing Range Low</strong> ហើយ Candle 5 ជា{' '}
        <strong>Dealing Range High</strong> ។ បន្ទាប់ពីនោះ Price Retrace ចុះ — Candle 7 និង Candle 8 មាន Wick
        ចូលទៅក្នុង <strong>OTE Zone (61.8%–79%)</strong>, ដែលក៏ស្ថិតនៅក្នុងតំបន់ <strong>Discount</strong> នៃ
        Dealing Range ដើមផងដែរ (ក្រោម 50%) — នេះជា Entry Zone ដ៏ល្អសម្រាប់ Buy មុន Candle 9 បំបែក High ចាស់ ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> បើកយក Chart ពិតរបស់អ្នកលើ TradingView រួច Mark Dealing Range, គូរ
        Fibonacci ដើម្បីរក OTE Zone, ហើយសម្គាល់ថាតើ Price បច្ចុប្បន្នកំពុងស្ថិតនៅ Premium ឬ Discount ។ ថតរូបផ្ញើ
        មក Mentor ដើម្បីត្រួតពិនិត្យក្នុងវគ្គបន្ទាប់ ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៥ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បង
        ម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Dealing Range ត្រូវបាន Anchor រវាង...?',
        options: [
          { label: 'Candle ២ ចុងក្រោយបំផុត', correct: false },
          { label: 'High និង Low នៃ Leg ចលនាដែលមាន Displacement ច្បាស់លាស់', correct: true },
          { label: 'តម្លៃបើក និងតម្លៃបិទថ្ងៃនេះ', correct: false },
        ],
      },
      {
        question: 'ចំណុច 50% (Equilibrium) នៃ Dealing Range បែងចែកអ្វី?',
        options: [
          { label: 'Candle ឡើង និង Candle ចុះ', correct: false },
          { label: 'Premium (លើ) និង Discount (ក្រោម)', correct: true },
          { label: 'BOS និង CHoCH', correct: false },
        ],
      },
      {
        question: 'OTE Zone ស្ថិតនៅចន្លោះ Fibonacci Level ណាខ្លះ?',
        options: [
          { label: '0% និង 23.6%', correct: false },
          { label: '61.8% និង 79%', correct: true },
          { label: '50% និង 100%', correct: false },
        ],
      },
      {
        question: 'ក្នុង Bullish Dealing Range តើគួររកមើល Buy នៅតំបន់ណា?',
        options: [
          { label: 'តំបន់ Premium', correct: false },
          { label: 'តំបន់ Discount', correct: true },
          { label: 'កន្លែងណាក៏បានលើ 50%', correct: false },
        ],
      },
      {
        question: 'តើអ្វីជួយបង្កើន Confluence ដល់ OTE Entry?',
        options: [
          { label: 'PD Array (ដូចជា FVG ឬ OB) ស្ថិតនៅក្នុង OTE Zone', correct: true },
          { label: 'Candle នោះជា Doji', correct: false },
          { label: 'Entry កើតឡើងនៅថ្ងៃសុក្រ', correct: false },
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
    lessonTag: 'Lesson 1',
    intro: (
      <>
        The <strong>Dealing Range</strong> is the very first foundation every advanced ICT concept builds on —
        it's the box traders use to draw Fibonacci and figure out whether price is trading at a{' '}
        <strong>Premium</strong> (expensive) or a <strong>Discount</strong> (cheap). All three ideas in this
        lesson — Dealing Range, OTE Fibo, and Premium/Discount — always work together.
      </>
    ),
    videoCaption: 'Listen closely — drawing the Dealing Range correctly is the very first step behind every ICT analysis.',
    h1: 'What Is a Dealing Range?',
    drDef: (
      <p>
        <strong>Definition:</strong> A Dealing Range is the <strong>price interval</strong> between the high and
        low of a clear, decisive move (a <strong>Displacement</strong> or <strong>Expansion</strong> leg). Those
        two points become the <strong>anchors</strong> you use to draw a Fibonacci retracement, which is how you
        find OTE and define Premium/Discount.
      </p>
    ),
    drHighLabel: 'Dealing Range High',
    drHighBody: (
      <>
        The highest point of the move — <strong>0%</strong> when drawing Fibo for a bearish setup, or{' '}
        <strong>100%</strong> for a bullish setup.
      </>
    ),
    drLowLabel: 'Dealing Range Low',
    drLowBody: (
      <>
        The lowest point of the move — <strong>100%</strong> when drawing Fibo for a bearish setup, or{' '}
        <strong>0%</strong> for a bullish setup.
      </>
    ),
    h2: 'How to Identify a Dealing Range',
    steps: [
      <>
        Find a clear <strong>Displacement / Expansion leg</strong> — a decisive move where candles push in one
        direction with almost no overlap.
      </>,
      <>
        Mark the <strong>Dealing Range High</strong> at the highest wick of that leg.
      </>,
      <>
        Mark the <strong>Dealing Range Low</strong> at the lowest wick of that leg.
      </>,
      <>
        Everything between those two anchors becomes your <strong>Dealing Range</strong> — the base you'll draw
        Fibonacci on in the next step.
      </>,
    ],
    diagram1Caption: (
      <>
        A bullish leg from Candle 1 (Dealing Range Low) to Candle 9 (Dealing Range High) — the blue box marks the
        full Dealing Range.
      </>
    ),
    rule1: (
      <>
        Only anchor a leg with genuine <strong>Displacement</strong> — don't mark just any random high/low, since
        a wrong Dealing Range throws off your Fibo, OTE, and Premium/Discount entirely.
      </>
    ),
    h3: 'OTE — Optimal Trade Entry (Fibo)',
    oteDef: (
      <p>
        <strong>OTE (Optimal Trade Entry)</strong> is the retracement zone between <strong>61.8%</strong> and{' '}
        <strong>79%</strong> of a Fibonacci drawn from the Dealing Range Low to the Dealing Range High (or the
        reverse). ICT traders wait for price to pull back into this zone before entering in the direction of the
        original leg.
      </p>
    ),
    oteSteps: [
      <>
        For a <strong>bullish</strong> setup, draw the Fibonacci tool from the Dealing Range Low (0%) up to the
        Dealing Range High (100%).
      </>,
      <>
        Wait for price to retrace back down into the <strong>61.8%–79%</strong> zone — that's the OTE.
      </>,
      <>
        Check whether a <strong>PD array</strong> (like an OB or FVG) sits inside that OTE zone, for extra
        confluence before entering.
      </>,
    ],
    diagram2Caption: (
      <>
        Price rallies to the Dealing Range High, retraces into the OTE zone (61.8%–79%), then reverses and breaks
        the old high — that retrace is the OTE entry.
      </>
    ),
    rule2: (
      <>
        OTE <strong>on its own isn't enough</strong> — the highest-probability entries happen when the OTE zone
        overlaps with another PD array (OB, FVG, Breaker).
      </>
    ),
    h4: 'Premium and Discount (Fibo Only)',
    premiumLabel: 'Premium (Expensive)',
    premiumBody: (
      <>
        Price is <strong>above the 50%</strong> of the Dealing Range
        <br />
        The "expensive" half of the range
        <br />
        <strong>→ Look to sell</strong> (in a bearish bias)
      </>
    ),
    discountLabel: 'Discount (Cheap)',
    discountBody: (
      <>
        Price is <strong>below the 50%</strong> of the Dealing Range
        <br />
        The "cheap" half of the range
        <br />
        <strong>→ Look to buy</strong> (in a bullish bias)
      </>
    ),
    diagram3Caption: 'The 50% (Equilibrium) splits the Dealing Range in two — above it is Premium, below it is Discount.',
    whyImportant: (
      <p>
        <strong>💡 Why it matters:</strong> Premium/Discount keeps you from buying too high or selling too low.
        In a bullish bias, only look to buy from the <strong>Discount</strong> half. In a bearish bias, only look
        to sell from the <strong>Premium</strong> half — never trade against the draw on liquidity.
      </p>
    ),
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'What does OTE stand for, and which Fibonacci zone does it cover?',
      options: [
        { label: 'Optimal Trade Entry — the 61.8%–79% zone', type: 'ok' },
        { label: 'Overall Trend Estimate — the 0%–23.6% zone', type: 'no' },
        { label: 'Order Type Execution — the 100% level only', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! OTE = Optimal Trade Entry, the 61.8%–79% Fibonacci zone.',
        no: '✗ OTE = Optimal Trade Entry, the 61.8%–79% Fibonacci zone.',
      },
    },
    quiz2: {
      question: 'Price is trading right at the 50% (Equilibrium) of the Dealing Range. What zone is it in, and what should you be looking to do?',
      options: [
        { label: 'Discount — look to buy', type: 'no' },
        { label: 'Premium — look to sell', type: 'ok' },
        { label: 'Equilibrium — do nothing at all', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Above 50% is Premium — the zone to look for sells (in a bearish bias).',
        no: '✗ Price sitting above the 50% of a Dealing Range is in the Premium zone — the zone to look for sells.',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 1',
    homeworkIntro: 'Study the chart below and try to answer for yourself before clicking "Show Answer":',
    homeworkLi1: (
      <>
        Which candle number is the <strong>Dealing Range Low</strong>, and which is the{' '}
        <strong>Dealing Range High</strong>?
      </>
    ),
    homeworkLi2: (
      <>
        Which candle numbers have a wick reaching into the <strong>OTE Zone (61.8%–79%)</strong>?
      </>
    ),
    homeworkLi3: (
      <>
        Is the zone price retraces into sitting in the <strong>Premium or Discount</strong> half of the original
        Dealing Range?
      </>
    ),
    homeworkCaption: "This chart isn't labeled yet — try to work it out yourself first.",
    homeworkRevealLabel: '👁 Show Answer',
    homeworkAnswer: (
      <p>
        <strong>Answer:</strong> Candle 1 is the <strong>Dealing Range Low</strong> and Candle 5 is the{' '}
        <strong>Dealing Range High</strong>. Price then retraces — Candle 7 and Candle 8 both have wicks reaching
        into the <strong>OTE Zone (61.8%–79%)</strong>, which also sits inside the <strong>Discount</strong> half
        of the original Dealing Range (below 50%) — a solid entry zone for a buy before Candle 9 breaks the old
        high.
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Open a real chart on TradingView, mark a Dealing Range, draw
        Fibonacci to find the OTE zone, and note whether price is currently trading at a Premium or a Discount.
        Screenshot it and send it to your mentor to review next session.
      </p>
    ),
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You need to answer <strong>all 5 questions correctly</strong> to unlock and move on to the next lesson —
        wrong answers can be retried an unlimited number of times.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'A Dealing Range is anchored between...?',
        options: [
          { label: 'The 2 most recent candles', correct: false },
          { label: 'The high and low of a clear Displacement leg', correct: true },
          { label: "Today's opening and closing price", correct: false },
        ],
      },
      {
        question: 'The 50% (Equilibrium) of a Dealing Range separates...?',
        options: [
          { label: 'Bullish candles from bearish candles', correct: false },
          { label: 'Premium (above) from Discount (below)', correct: true },
          { label: 'BOS from CHoCH', correct: false },
        ],
      },
      {
        question: 'The OTE zone sits between which two Fibonacci levels?',
        options: [
          { label: '0% and 23.6%', correct: false },
          { label: '61.8% and 79%', correct: true },
          { label: '50% and 100%', correct: false },
        ],
      },
      {
        question: 'In a bullish Dealing Range, where should you generally look to buy?',
        options: [
          { label: 'In the Premium zone', correct: false },
          { label: 'In the Discount zone', correct: true },
          { label: 'Anywhere above 50%', correct: false },
        ],
      },
      {
        question: 'What adds confluence to an OTE entry?',
        options: [
          { label: 'A PD array (like an FVG or OB) sitting inside the OTE zone', correct: true },
          { label: 'The candle being a Doji', correct: false },
          { label: 'The entry happening on a Friday', correct: false },
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
    lessonTag: '第 1 课',
    intro: (
      <>
        <strong>Dealing Range</strong> 是所有 ICT 进阶概念最基础的起点 — 它是交易者用来画 Fibonacci 的区间框，
        借此判断价格目前处于 <strong>Premium</strong>（溢价，偏贵）还是 <strong>Discount</strong>（折价，偏
        便宜）。本课的三个概念 — Dealing Range、OTE Fibo、Premium/Discount — 永远是配合在一起使用的。
      </>
    ),
    videoCaption: '用心聆听 — 正确画出 Dealing Range，是每一次 ICT 分析最开始的一步。',
    h1: '什么是 Dealing Range？',
    drDef: (
      <p>
        <strong>定义：</strong>Dealing Range 是一段明确、果断的行情（<strong>Displacement</strong>／
        <strong>Expansion</strong> 推动段）最高点与最低点之间的<strong>价格区间</strong>。这两个点会成为你画
        Fibonacci 回撤的<strong>锚点</strong>，据此找出 OTE 并划分 Premium/Discount。
      </p>
    ),
    drHighLabel: 'Dealing Range High',
    drHighBody: (
      <>
        该行情的最高点 — 画 Fibo 时，若是看跌设置则为 <strong>0%</strong>，若是看涨设置则为{' '}
        <strong>100%</strong>。
      </>
    ),
    drLowLabel: 'Dealing Range Low',
    drLowBody: (
      <>
        该行情的最低点 — 画 Fibo 时，若是看跌设置则为 <strong>100%</strong>，若是看涨设置则为{' '}
        <strong>0%</strong>。
      </>
    ),
    h2: '如何识别 Dealing Range',
    steps: [
      <>
        找到一段明确的 <strong>Displacement / Expansion 推动段</strong> — 蜡烛线连续朝一个方向推进，几乎没有
        重叠。
      </>,
      <>
        在该推动段的最高影线处标出 <strong>Dealing Range High</strong>。
      </>,
      <>
        在该推动段的最低影线处标出 <strong>Dealing Range Low</strong>。
      </>,
      <>
        这两个锚点之间的整个区间，就是你的 <strong>Dealing Range</strong> — 下一步画 Fibonacci 的基础。
      </>,
    ],
    diagram1Caption: '从 1 号蜡烛（Dealing Range Low）到 9 号蜡烛（Dealing Range High）的看涨推动段 — 蓝色方框标示整个 Dealing Range。',
    rule1: (
      <>
        只锚定真正具有 <strong>Displacement</strong> 的推动段 — 不要随便拿任意高低点来标记，因为一个错误的
        Dealing Range 会让你的 Fibo、OTE、Premium/Discount 全部出错。
      </>
    ),
    h3: 'OTE — 最佳交易入场点（Fibo）',
    oteDef: (
      <p>
        <strong>OTE（Optimal Trade Entry）</strong>是从 Dealing Range Low 画到 Dealing Range High（或反向）的
        Fibonacci 中，<strong>61.8%</strong> 到 <strong>79%</strong> 之间的回撤区域。ICT 交易者会等待价格回撤到
        这个区域，再沿着原推动段的方向入场。
      </p>
    ),
    oteSteps: [
      <>
        对于<strong>看涨</strong>设置，从 Dealing Range Low（0%）向上画 Fibonacci 到 Dealing Range High
        （100%）。
      </>,
      <>
        等待价格回撤进入 <strong>61.8%–79%</strong> 区域 — 这就是 OTE。
      </>,
      <>
        检查该 OTE 区域内是否有 <strong>PD array</strong>（例如 OB 或 FVG）叠加，以获得更高的共振
        （confluence）后再入场。
      </>,
    ],
    diagram2Caption: '价格上涨至 Dealing Range High 后回撤进入 OTE 区域（61.8%–79%），随后反转并突破前高 — 这次回撤就是 OTE 入场点。',
    rule2: (
      <>
        仅凭 OTE <strong>还不够</strong> — 当 OTE 区域与另一个 PD array（OB、FVG、Breaker）重叠时，才是胜率最高
        的入场机会。
      </>
    ),
    h4: 'Premium and Discount（仅限 Fibo）',
    premiumLabel: 'Premium（溢价）',
    premiumBody: (
      <>
        价格处于 Dealing Range 的 <strong>50% 以上</strong>
        <br />
        区间中"偏贵"的那一半
        <br />
        <strong>→ 寻找卖出机会</strong>（看跌偏向时）
      </>
    ),
    discountLabel: 'Discount（折价）',
    discountBody: (
      <>
        价格处于 Dealing Range 的 <strong>50% 以下</strong>
        <br />
        区间中"偏便宜"的那一半
        <br />
        <strong>→ 寻找买入机会</strong>（看涨偏向时）
      </>
    ),
    diagram3Caption: '50%（Equilibrium，均衡线）把 Dealing Range 一分为二 — 上方是 Premium，下方是 Discount。',
    whyImportant: (
      <p>
        <strong>💡 为什么重要：</strong>Premium/Discount 能避免你买得太高或卖得太低。在看涨偏向下，只在{' '}
        <strong>Discount</strong> 一侧寻找买入；在看跌偏向下，只在 <strong>Premium</strong> 一侧寻找卖出 — 永远
        不要逆着流动性方向（draw on liquidity）交易。
      </p>
    ),
    quizHeading: '知识检测',
    quiz1: {
      question: 'OTE 代表什么？它覆盖哪个 Fibonacci 区域？',
      options: [
        { label: 'Optimal Trade Entry — 61.8%–79% 区域', type: 'ok' },
        { label: 'Overall Trend Estimate — 0%–23.6% 区域', type: 'no' },
        { label: 'Order Type Execution — 仅 100% 这一点', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！OTE = Optimal Trade Entry，位于 Fibonacci 的 61.8%–79% 区域。',
        no: '✗ OTE = Optimal Trade Entry，位于 Fibonacci 的 61.8%–79% 区域。',
      },
    },
    quiz2: {
      question: '价格正处于 Dealing Range 的 50%（Equilibrium）位置 — 这属于哪个区域，应该怎么做？',
      options: [
        { label: 'Discount — 寻找买入', type: 'no' },
        { label: 'Premium — 寻找卖出', type: 'ok' },
        { label: 'Equilibrium — 什么都不做', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！50% 以上属于 Premium — 是寻找卖出机会的区域（看跌偏向时）。',
        no: '✗ 价格处于 Dealing Range 50% 以上时属于 Premium 区域 — 应寻找卖出机会。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 1 课',
    homeworkIntro: '先自己研究下面的图表，再点击"查看答案"：',
    homeworkLi1: (
      <>
        哪根蜡烛是 <strong>Dealing Range Low</strong>？哪根是 <strong>Dealing Range High</strong>？
      </>
    ),
    homeworkLi2: (
      <>
        哪几根蜡烛的影线进入了 <strong>OTE 区域（61.8%–79%）</strong>？
      </>
    ),
    homeworkLi3: (
      <>
        价格回撤进入的区域，属于原 Dealing Range 的 <strong>Premium 还是 Discount</strong>？
      </>
    ),
    homeworkCaption: '这张图还没有标注 — 先自己试着判断。',
    homeworkRevealLabel: '👁 查看答案',
    homeworkAnswer: (
      <p>
        <strong>答案：</strong>1 号蜡烛是 <strong>Dealing Range Low</strong>，5 号蜡烛是{' '}
        <strong>Dealing Range High</strong>。之后价格回撤 — 7 号和 8 号蜡烛的影线都进入了{' '}
        <strong>OTE 区域（61.8%–79%）</strong>，同时也处于原 Dealing Range 的 <strong>Discount</strong> 半区
        （50% 以下）— 在 9 号蜡烛突破前高之前，这是一个不错的买入入场区域。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 额外作业：</strong>在 TradingView 上打开一张真实图表，标出一个 Dealing Range，画出
        Fibonacci 找到 OTE 区域，并记录当前价格处于 Premium 还是 Discount。截图发给导师，在下节课一起复盘。
      </p>
    ),
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        需要<strong>全部 5 题都答对</strong>才能解锁并进入下一课 — 答错可以无限次重试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Dealing Range 的锚点是...？',
        options: [
          { label: '最近的 2 根蜡烛', correct: false },
          { label: '一段明确 Displacement 推动段的最高点与最低点', correct: true },
          { label: '今天的开盘价与收盘价', correct: false },
        ],
      },
      {
        question: 'Dealing Range 的 50%（Equilibrium）分隔的是什么？',
        options: [
          { label: '看涨蜡烛与看跌蜡烛', correct: false },
          { label: 'Premium（上方）与 Discount（下方）', correct: true },
          { label: 'BOS 与 CHoCH', correct: false },
        ],
      },
      {
        question: 'OTE 区域位于哪两个 Fibonacci 水平之间？',
        options: [
          { label: '0% 与 23.6%', correct: false },
          { label: '61.8% 与 79%', correct: true },
          { label: '50% 与 100%', correct: false },
        ],
      },
      {
        question: '在看涨的 Dealing Range 中，通常应该在哪里寻找买入？',
        options: [
          { label: 'Premium 区域', correct: false },
          { label: 'Discount 区域', correct: true },
          { label: '50% 以上的任何位置', correct: false },
        ],
      },
      {
        question: '什么能为 OTE 入场增加共振（confluence）？',
        options: [
          { label: 'OTE 区域内叠加了 PD array（如 FVG 或 OB）', correct: true },
          { label: '那根蜡烛是十字星（Doji）', correct: false },
          { label: '入场发生在星期五', correct: false },
        ],
      },
    ],
  },
};

export default function Advanced1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['adv1']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="adv1"
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

      {/* ===== WHAT IS A DEALING RANGE ===== */}
      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Box variant="g">{t.drDef}</Box>
      <div className="g2">
        <GridItem labelColor="#2E7CF6" label={t.drHighLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.drHighBody}
        </GridItem>
        <GridItem labelColor="#2E7CF6" label={t.drLowLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.drLowBody}
        </GridItem>
      </div>

      {/* ===== HOW TO IDENTIFY ===== */}
      <h3 style={{ marginTop: 20 }}>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Steps items={t.steps} />

      <AnimatedFig caption={t.diagram1Caption}>
        <svg viewBox="0 0 700 230">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            DEALING RANGE — BULLISH EXAMPLE
          </text>

          <rect x="20" y="45" width="630" height="160" fill="#2E7CF6" opacity="0.06" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="45" x2="650" y2="45" stroke="#2E7CF6" strokeWidth="0.8" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.15s' }} />
          <line x1="20" y1="205" x2="650" y2="205" stroke="#2E7CF6" strokeWidth="0.8" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.15s' }} />
          <text x="655" y="49" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>DR High</text>
          <text x="655" y="209" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>DR Low</text>

          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="40" y1="175" x2="40" y2="205" stroke="#E05555" strokeWidth="1.4" /><rect x="34" y="182" width="12" height="18" rx="1" fill="#E05555" /></g>
          <text x="40" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>1</text>

          <g className="ac" style={{ animationDelay: '.32s' }}><line x1="75" y1="150" x2="75" y2="175" stroke="#3EC97A" strokeWidth="1" /><rect x="71" y="155" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <text x="75" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.32s' }}>2</text>

          <g className="ac" style={{ animationDelay: '.39s' }}><line x1="110" y1="120" x2="110" y2="170" stroke="#3EC97A" strokeWidth="1.4" /><rect x="104" y="125" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="110" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.39s' }}>3</text>

          <g className="ac" style={{ animationDelay: '.46s' }}><line x1="145" y1="128" x2="145" y2="148" stroke="#E05555" strokeWidth="1" /><rect x="141" y="131" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <text x="145" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.46s' }}>4</text>

          <g className="ac" style={{ animationDelay: '.53s' }}><line x1="180" y1="90" x2="180" y2="145" stroke="#3EC97A" strokeWidth="1.4" /><rect x="174" y="95" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <text x="180" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.53s' }}>5</text>

          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="215" y1="98" x2="215" y2="118" stroke="#E05555" strokeWidth="1" /><rect x="211" y="101" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <text x="215" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.6s' }}>6</text>

          <g className="ac" style={{ animationDelay: '.67s' }}><line x1="250" y1="60" x2="250" y2="115" stroke="#3EC97A" strokeWidth="1.4" /><rect x="244" y="65" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <text x="250" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.67s' }}>7</text>

          <g className="ac" style={{ animationDelay: '.74s' }}><line x1="285" y1="68" x2="285" y2="88" stroke="#E05555" strokeWidth="1" /><rect x="281" y="71" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <text x="285" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.74s' }}>8</text>

          <g className="ac" style={{ animationDelay: '.81s' }}><line x1="320" y1="45" x2="320" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="314" y="50" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="320" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.81s' }}>9</text>

          <g className="ac" style={{ animationDelay: '.88s' }}><line x1="355" y1="60" x2="355" y2="85" stroke="#E05555" strokeWidth="1" /><rect x="351" y="64" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <text x="355" y="220" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.88s' }}>10</text>

          <g className="ac" style={{ animationDelay: '.95s' }}><circle cx="40" cy="205" r="4" fill="#2E7CF6" /></g>
          <g className="ac" style={{ animationDelay: '1s' }}><circle cx="320" cy="45" r="4" fill="#2E7CF6" /></g>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== OTE FIBO ===== */}
      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="b">{t.oteDef}</Box>
      <Steps items={t.oteSteps} />

      <AnimatedFig caption={t.diagram2Caption}>
        <svg viewBox="0 0 700 260">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            OTE — FIBONACCI RETRACEMENT (61.8%–79%)
          </text>

          {/* fib grid lines: 0%=45, 23.6%=83, 50%=125, 61.8%=144, 70.5%=158, 79%=171, 100%=205 */}
          <line x1="20" y1="45" x2="650" y2="45" stroke="#2E7CF6" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="83" x2="650" y2="83" stroke="#2E7CF6" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="125" x2="650" y2="125" stroke="#2E7CF6" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />
          <rect x="20" y="144" width="630" height="27" fill="#5B9BD5" opacity="0.18" className="ac" style={{ animationDelay: '.15s' }} />
          <line x1="20" y1="144" x2="650" y2="144" stroke="#5B9BD5" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="171" x2="650" y2="171" stroke="#5B9BD5" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="205" x2="650" y2="205" stroke="#2E7CF6" strokeWidth="0.6" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.1s' }} />

          <text x="15" y="48" textAnchor="end" fontSize="8" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">0%</text>
          <text x="15" y="86" textAnchor="end" fontSize="8" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">23.6%</text>
          <text x="15" y="128" textAnchor="end" fontSize="8" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">50%</text>
          <text x="15" y="147" textAnchor="end" fontSize="8" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">61.8%</text>
          <text x="15" y="174" textAnchor="end" fontSize="8" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">79%</text>
          <text x="15" y="208" textAnchor="end" fontSize="8" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">100%</text>
          <text x="580" y="162" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.9s' }}>OTE ZONE</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="40" y1="185" x2="40" y2="205" stroke="#3EC97A" strokeWidth="1" /><rect x="36" y="188" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.28s' }}><line x1="80" y1="140" x2="80" y2="180" stroke="#3EC97A" strokeWidth="1.4" /><rect x="74" y="145" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.36s' }}><line x1="120" y1="95" x2="120" y2="140" stroke="#3EC97A" strokeWidth="1.4" /><rect x="114" y="100" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.44s' }}><line x1="160" y1="60" x2="160" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="154" y="65" width="12" height="32" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.52s' }}><line x1="200" y1="45" x2="200" y2="65" stroke="#3EC97A" strokeWidth="1.4" /><rect x="194" y="48" width="12" height="14" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.52s' }}><circle cx="200" cy="45" r="4" fill="#2E7CF6" /><text x="200" y="35" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">DR High</text></g>

          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="250" y1="48" x2="250" y2="90" stroke="#E05555" strokeWidth="1.4" /><rect x="244" y="52" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.68s' }}><line x1="290" y1="90" x2="290" y2="125" stroke="#E05555" strokeWidth="1.4" /><rect x="284" y="95" width="12" height="27" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.76s' }}><line x1="330" y1="120" x2="330" y2="156" stroke="#E05555" strokeWidth="1.4" /><rect x="324" y="128" width="12" height="24" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.84s' }}><line x1="370" y1="150" x2="370" y2="168" stroke="#E05555" strokeWidth="1.4" /><rect x="364" y="153" width="12" height="13" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.9s' }}><circle cx="370" cy="168" r="4" fill="#5B9BD5" /><text x="370" y="185" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">OTE Entry</text></g>

          <g className="ac" style={{ animationDelay: '.98s' }}><line x1="410" y1="140" x2="410" y2="165" stroke="#3EC97A" strokeWidth="1.4" /><rect x="404" y="143" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.06s' }}><line x1="450" y1="100" x2="450" y2="140" stroke="#3EC97A" strokeWidth="1.4" /><rect x="444" y="104" width="12" height="33" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.14s' }}><line x1="490" y1="60" x2="490" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="484" y="64" width="12" height="33" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.22s' }}><line x1="530" y1="28" x2="530" y2="60" stroke="#3EC97A" strokeWidth="1.4" /><rect x="524" y="33" width="12" height="24" rx="1" fill="#3EC97A" /></g>
          <text x="565" y="24" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1.3s' }}>New High — BOS ↑</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule2}</Rule>

      {/* ===== PREMIUM / DISCOUNT ===== */}
      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.premiumLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.premiumBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.discountLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.discountBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram3Caption}>
        <svg viewBox="0 0 700 220">
          <rect x="80" y="35" width="540" height="75" fill="#E05555" opacity="0.1" className="ac" style={{ animationDelay: '.1s' }} />
          <rect x="80" y="110" width="540" height="75" fill="#3EC97A" opacity="0.1" className="ac" style={{ animationDelay: '.1s' }} />
          <rect x="80" y="35" width="540" height="150" fill="none" stroke="#2E7CF6" strokeWidth="1" className="ac" style={{ animationDelay: '.05s' }} />
          <line x1="80" y1="110" x2="620" y2="110" stroke="#5B9BD5" strokeWidth="1" strokeDasharray="5 3" className="ac" style={{ animationDelay: '.2s' }} />

          <text x="350" y="65" textAnchor="middle" fontSize="13" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>PREMIUM — Look to SELL</text>
          <text x="350" y="150" textAnchor="middle" fontSize="13" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>DISCOUNT — Look to BUY</text>
          <text x="625" y="106" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>50% Equilibrium</text>
          <text x="625" y="39" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>DR High</text>
          <text x="625" y="189" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>DR Low</text>

          <polyline points="120,175 220,150 320,110 420,70 560,45" fill="none" stroke="#9aa0ab" strokeWidth="1" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.4s' }} />
          <g className="ac" style={{ animationDelay: '.5s' }}><line x1="220" y1="140" x2="220" y2="160" stroke="#3EC97A" strokeWidth="1.4" /><rect x="214" y="144" width="12" height="12" rx="1" fill="#3EC97A" /></g>
          <text x="220" y="200" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>Buy Entry</text>

          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="420" y1="60" x2="420" y2="80" stroke="#E05555" strokeWidth="1.4" /><rect x="414" y="64" width="12" height="12" rx="1" fill="#E05555" /></g>
          <text x="420" y="25" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Sell Entry</text>
        </svg>
      </AnimatedFig>

      <Box variant="g">{t.whyImportant}</Box>

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
        <svg viewBox="0 0 700 230">
          <line x1="20" y1="45" x2="650" y2="45" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="20" y1="144" x2="650" y2="144" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="20" y1="171" x2="650" y2="171" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="20" y1="205" x2="650" y2="205" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />

          <g><line x1="40" y1="185" x2="40" y2="205" stroke="#3EC97A" strokeWidth="1" /><rect x="36" y="188" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <text x="40" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">1</text>

          <g><line x1="80" y1="140" x2="80" y2="180" stroke="#3EC97A" strokeWidth="1.4" /><rect x="74" y="145" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="80" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">2</text>

          <g><line x1="120" y1="95" x2="120" y2="140" stroke="#3EC97A" strokeWidth="1.4" /><rect x="114" y="100" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="120" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">3</text>

          <g><line x1="160" y1="60" x2="160" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="154" y="65" width="12" height="32" rx="1" fill="#3EC97A" /></g>
          <text x="160" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">4</text>

          <g><line x1="200" y1="45" x2="200" y2="65" stroke="#3EC97A" strokeWidth="1.4" /><rect x="194" y="48" width="12" height="14" rx="1" fill="#3EC97A" /></g>
          <text x="200" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">5</text>

          <g><line x1="250" y1="48" x2="250" y2="90" stroke="#E05555" strokeWidth="1.4" /><rect x="244" y="52" width="12" height="35" rx="1" fill="#E05555" /></g>
          <text x="250" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">6</text>

          <g><line x1="290" y1="90" x2="290" y2="125" stroke="#E05555" strokeWidth="1.4" /><rect x="284" y="95" width="12" height="27" rx="1" fill="#E05555" /></g>
          <text x="290" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">7</text>

          <g><line x1="330" y1="120" x2="330" y2="156" stroke="#E05555" strokeWidth="1.4" /><rect x="324" y="128" width="12" height="24" rx="1" fill="#E05555" /></g>
          <text x="330" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">8</text>

          <g><line x1="370" y1="150" x2="370" y2="168" stroke="#E05555" strokeWidth="1.4" /><rect x="364" y="153" width="12" height="13" rx="1" fill="#E05555" /></g>
          <text x="370" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">9</text>

          <g><line x1="410" y1="140" x2="410" y2="165" stroke="#3EC97A" strokeWidth="1.4" /><rect x="404" y="143" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <text x="410" y="222" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">10</text>
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
