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
import { getLessonMeta } from '../data/lessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';
import swingExample from '../assets/swing-example.jpg';
import chartA from '../assets/chart-a.jpg';
import chartB from '../assets/chart-b.jpg';

const meta = getLessonMeta('l1');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagrams, media) stays identical across languages — only
// this content swaps. Trading terms (High/Low, BOS, HH/HL/LH/LL, etc.) are
// kept in English in every language since that's the universal jargon
// traders use, in Khmer-language trading communities too.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>Market Structure (រចនាសម្ព័ន្ធទីផ្សារ)</strong> ជា <strong>មូលដ្ឋានគ្រឹះដំបូងគេ</strong> ដែល
        Trader ត្រូវរៀនមុនអ្វីទាំងអស់ — វាប្រាប់យើងថា Price កំពុងផ្លាស់ទីតាមទិសណា ដោយសិក្សាពីរបៀបដែល{' '}
        <strong>Swing High</strong> (កំពូល) និង <strong>Swing Low</strong> (បាត) ត្រូវបានបង្កើតឡើងជាបន្តបន្ទាប់។
        Market Structure មាន <strong>៣ ប្រភេទ</strong> គឺ Bullish, Bearish និង Sideways។
      </>
    ),
    h1: 'Market Structure ៣ ប្រភេទ',
    bullishLabel: 'Bullish ⬆',
    bullishBody: (
      <>
        Structure <strong style={{ color: 'var(--up)' }}>ឡើង</strong>
        <br />
        Higher High (HH)
        <br />
        Higher Low (HL)
        <br />
        <strong>→ Bias Buy</strong>
      </>
    ),
    bearishLabel: 'Bearish ⬇',
    bearishBody: (
      <>
        Structure <strong style={{ color: 'var(--dn)' }}>ចុះ</strong>
        <br />
        Lower High (LH)
        <br />
        Lower Low (LL)
        <br />
        <strong>→ Bias Sell</strong>
      </>
    ),
    sidewaysLabel: 'Sideways ↔',
    sidewaysBody: (
      <>
        Structure <strong style={{ color: 'var(--blue)' }}>រង</strong>
        <br />
        Equal High (EQH)
        <br />
        Equal Low (EQL)
        <br />
        <strong>→ រង់ចាំ Breakout</strong>
      </>
    ),
    h2: 'Swing High & Swing Low',
    swingIntro: (
      <>
        មុននឹងចេះមើល Market Structure ត្រូវចេះមើល <strong>Swing High</strong> និង <strong>Swing Low</strong>{' '}
        ជាមុនសិន — ព្រោះ Swing Point ទាំងនេះជា "ឆ្អឹងខ្នង" ដែលប្រើសម្រាប់កំណត់ HH, HL, LH, LL និង BOS ទាំងអស់ ។
      </>
    ),
    swingHighLabel: 'Swing High',
    swingHighBody: (
      <>
        Candle ណាមួយ ដែលមាន <strong>High ខ្ពស់ជាង</strong> Candle ខាងឆ្វេង និងខាងស្ដាំវាភ្លាមៗ (យ៉ាងហោចណាស់ម្ខាង
        ១ Candle) ។ វាបង្ហាញពីចំណុចកំពូលមួយ មុននឹង Price ត្រឡប់ចុះមកវិញ ។
      </>
    ),
    swingLowLabel: 'Swing Low',
    swingLowBody: (
      <>
        Candle ណាមួយ ដែលមាន <strong>Low ទាបជាង</strong> Candle ខាងឆ្វេង និងខាងស្ដាំវាភ្លាមៗ ។ វាបង្ហាញពីចំណុចបាតមួយ
        មុននឹង Price ត្រឡប់ឡើងលើវិញ ។
      </>
    ),
    h3: 'របៀបមើលលើ Candle ដើម្បីកំណត់',
    steps: [
      'សម្គាល់ Candle ចំកណ្ដាល ១ គូ ជាមួយ Candle ២ ខាង (ឆ្វេង-ស្ដាំ)',
      <>
        បើ High របស់ Candle កណ្ដាល <strong>ខ្ពស់ជាង</strong> High ទាំង ២ ខាង → នោះជា{' '}
        <strong style={{ color: 'var(--up)' }}>Swing High</strong>
      </>,
      <>
        បើ Low របស់ Candle កណ្ដាល <strong>ទាបជាង</strong> Low ទាំង ២ ខាង → នោះជា{' '}
        <strong style={{ color: 'var(--dn)' }}>Swing Low</strong>
      </>,
      'អូសបន្តទៅមុខ Candle មួយៗ ដើម្បីរក Swing High/Low បន្ទាប់ៗទៀត',
    ],
    swingExampleLabel: '📊 ឧទាហរណ៍ពិត — XAUUSD (TradingView)',
    swingExampleCaption: 'Swing High = កំពូល Candle ដែលខ្ពស់ជាងជុំវិញ · Swing Low = បាត Candle ដែលទាបជាងជុំវិញ',
    ruleTitle: 'ច្បាប់ចងចាំ',
    rule1: 'Swing High/Low ត្រូវការ Candle ២ ខាង "បញ្ជាក់" ជានិច្ច — គ្មាន Candle ខាងស្ដាំគ្រប់គ្រាន់ទេ មិនទាន់អាចកំណត់ថាជា Swing Point ពិតប្រាកដបានឡើយ',
    h4: '1. Bullish Market Structure',
    bullishDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Price បង្កើត <strong>Higher High (HH)</strong> និង{' '}
        <strong>Higher Low (HL)</strong> ជាបន្តបន្ទាប់ — រាល់ Swing High ថ្មី <strong>ខ្ពស់ជាង</strong> Swing
        High ចាស់ ហើយរាល់ Swing Low ថ្មី <strong>ខ្ពស់ជាង</strong> Swing Low ចាស់ ។ នេះជាភស្ដុតាងថា{' '}
        <strong>Buyer កំពុងគ្រប់គ្រង</strong> ទីផ្សារ ។
      </p>
    ),
    videoLabel: '🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView',
    bullishFigCaption: (
      <>
        Low 1 ធ្វើ BOS ទម្លុះ High 1 → Price Close លើ Swing High ចាស់ → បង្កើត{' '}
        <strong style={{ color: '#3EC97A' }}>Higher High (HH)</strong> ថ្មី — Structure ក្លាយជា Bullish
      </>
    ),
    h5: '2. Bearish Market Structure',
    bearishDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Price បង្កើត <strong>Lower High (LH)</strong> និង{' '}
        <strong>Lower Low (LL)</strong> ជាបន្តបន្ទាប់ — រាល់ Swing High ថ្មី <strong>ទាបជាង</strong> Swing High
        ចាស់ ហើយរាល់ Swing Low ថ្មី <strong>ទាបជាង</strong> Swing Low ចាស់ ។ នេះជាភស្ដុតាងថា{' '}
        <strong>Seller កំពុងគ្រប់គ្រង</strong> ទីផ្សារ ។
      </p>
    ),
    bearishFigCaption: (
      <>
        High 1 ធ្វើ BOS ទម្លុះ Low 1 → Price Close ក្រោម Swing Low ចាស់ → បង្កើត{' '}
        <strong style={{ color: '#E05555' }}>Lower Low (LL)</strong> ថ្មី — Structure ក្លាយជា Bearish
      </>
    ),
    h6: '3. Sideways Market Structure',
    sidewaysDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Price ធ្វើចលនាចុះឡើងក្នុង <strong>Range</strong> មួយ — គ្មាន HH/HL ច្បាស់
        ក៏គ្មាន LH/LL ច្បាស់ដែរ ។ High-Low ស្មើៗគ្នា (Equal High / Equal Low) ។ Trader ជាទូទៅ{' '}
        <strong>រង់ចាំ Breakout</strong> មុននឹង Trade ។
      </p>
    ),
    sidewaysFigCaption: 'Equal High / Equal Low → Range → រង់ចាំ Breakout ច្បាស់លាស់',
    h7: 'BOS — Break of Structure',
    bosDef: (
      <p>
        <strong>BOS (Break of Structure)</strong> = ពេល Candle <strong>Close</strong> ឆ្លងកាត់ Swing High
        ចាស់ (Bullish BOS ↑) ឬ Swing Low ចាស់ (Bearish BOS ↓) ។ BOS ជាភស្ដុតាងបញ្ជាក់ថា Market Structure
        កំពុង <strong>បន្ត</strong> ទិសដើម ។
      </p>
    ),
    bosLi1: (
      <>
        ត្រូវការ <strong>Candle Body Close</strong> ឆ្លងកាត់ — Wick ឆ្លងតែមួយភ្លែត{' '}
        <strong>មិនមែន BOS</strong> (ជា False Break)
      </>
    ),
    bosLi2: 'BOS ↑ = Bullish Continuation · BOS ↓ = Bearish Continuation',
    h8: 'របៀបសម្គាល់ HH, HL, LH, LL លើ Swing Point',
    hhIntro: (
      <>
        នេះជា <strong>គំនិតសំខាន់បំផុត</strong> ក្នុងការអាន Market Structure — យើងគ្រាន់តែប្រៀបធៀប{' '}
        <strong>Swing High/Low ថ្មី</strong> ជាមួយ <strong>Swing High/Low ចាស់</strong> ដើម្បីដឹងថា Structure
        កំពុងឡើង ឬចុះ ។
      </>
    ),
    bearishStructureLabel: 'Bearish Structure',
    bearishStructureBody: (
      <>
        Swing High ថ្មី <strong>ទាបជាង</strong> Swing High ចាស់ → <strong style={{ color: 'var(--dn)' }}>Lower High (LH)</strong> ។
        Swing Low ថ្មី <strong>ទាបជាង</strong> Swing Low ចាស់ → <strong style={{ color: 'var(--dn)' }}>Lower Low (LL)</strong> ។
        BOS ↓ កើតឡើងពេល Price Close ក្រោម Swing Low ចាស់ ។
      </>
    ),
    bullishStructureLabel: 'Bullish Structure',
    bullishStructureBody: (
      <>
        Swing High ថ្មី <strong>ខ្ពស់ជាង</strong> Swing High ចាស់ → <strong style={{ color: 'var(--up)' }}>Higher High (HH)</strong> ។
        Swing Low ថ្មី <strong>ខ្ពស់ជាង</strong> Swing Low ចាស់ → <strong style={{ color: 'var(--up)' }}>Higher Low (HL)</strong> ។
        BOS ↑ កើតឡើងពេល Price Close លើ Swing High ចាស់ ។
      </>
    ),
    rule2: (
      <>
        <strong>HH + HL</strong> = Bullish Structure (Buyer កំពុងគ្រប់គ្រង) · <strong>LH + LL</strong> = Bearish
        Structure (Seller កំពុងគ្រប់គ្រង)
      </>
    ),
    whyImportant: (
      <p>
        <strong>💡 ហេតុអ្វីវាសំខាន់ ៖</strong> Swing Point មុន BOS (ឧ. Low មុន BOS ↑ ឬ High មុន BOS ↓)
        ភាគច្រើនជា <strong>Zone ដែល Smart Money ទុក Order</strong> — ពេល Price ត្រឡប់មកតំបន់នេះម្ដងទៀត
        វាច្រើនតែជា <strong>Entry Zone ល្អ</strong> សម្រាប់បន្ត Trend ។
      </p>
    ),
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'ក្នុង Bearish Market Structure — Swing Low ថ្មី ដែលទាបជាង Swing Low ចាស់ ត្រូវហៅថាអ្វី?',
      options: [
        { label: 'Higher Low (HL)', type: 'no' },
        { label: 'Lower Low (LL)', type: 'ok' },
        { label: 'Equal Low (EQL)', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Swing Low ថ្មី ទាបជាង Swing Low ចាស់ = Lower Low (LL) ។',
        no: '✗ Swing Low ថ្មី ដែលទាបជាង Swing Low ចាស់ ត្រូវហៅថា Lower Low (LL) ។',
      },
    },
    quiz2: {
      question: 'Swing High ថ្មី ដែលខ្ពស់ជាង Swing High ចាស់ ត្រូវហៅថាអ្វី?',
      options: [
        { label: 'Higher High (HH)', type: 'ok' },
        { label: 'Lower High (LH)', type: 'no' },
        { label: 'Equal High (EQH)', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Swing High ថ្មី ខ្ពស់ជាង Swing High ចាស់ = Higher High (HH) ។',
        no: '✗ Swing High ថ្មី ដែលខ្ពស់ជាង Swing High ចាស់ ត្រូវហៅថា Higher High (HH) ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ១',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងកំណត់ដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: (
      <>
        តើនេះជា <strong>Bullish</strong> ឬ <strong>Bearish</strong> Market Structure?
      </>
    ),
    homeworkLi2: (
      <>
        សម្គាល់ចំណុច <strong>BOS</strong> (Break of Structure) នៅត្រង់ណា?
      </>
    ),
    homeworkLi3: (
      <>
        សម្គាល់ថា Swing ថ្មីនោះជា <strong>HH, HL, LH ឬ LL</strong>?
      </>
    ),
    chartALabel: 'Chart A',
    chartARevealLabel: '👁 មើលចម្លើយ Chart A',
    chartAAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Chart A ជា <strong>Bearish Market Structure</strong> ។ Low 1 (candle
        ដំបូង) → High 1 (candle ទី ៣, Swing High) → BOS ↓ កើតឡើងត្រង់ candle ទី ៦ ដែល Close ក្រោម Low 1
        (Swing Low ចាស់) · candle ចុងក្រោយបំផុត បង្កើត <strong>Lower Low (LL)</strong> ថ្មី — Structure នេះជា
        Bearish ព្រោះមាន Lower High (LH) និង Lower Low (LL) ។
      </p>
    ),
    chartBLabel: 'Chart B',
    chartBRevealLabel: '👁 មើលចម្លើយ Chart B',
    chartBAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Chart B ជា <strong>Bullish Market Structure</strong> ។ High 1 (candle
        ដំបូង) → Low 1 (candle ទី ៣, Swing Low) → BOS ↑ កើតឡើងត្រង់ candle ទី ៦ ដែល Close លើ High 1 (Swing
        High ចាស់) · candle ចុងក្រោយបំផុត បង្កើត <strong>Higher High (HH)</strong> ថ្មី — Structure នេះជា
        Bullish ព្រោះមាន Higher High (HH) និង Higher Low (HL) ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> បើកយក Chart ពិតរបស់អ្នកលើ TradingView (គូ Forex/Gold/Crypto
        ណាមួយ) រួច Mark ដោយខ្លួនឯងនូវ Swing High/Low, BOS, HH, HL, LH, LL ។ ថតរូបផ្ញើមក Mentor
        ដើម្បីត្រួតពិនិត្យក្នុងវគ្គបន្ទាប់ ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៥ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Swing High គឺជា Candle ណាមួយ ដែល...?',
        options: [
          { label: 'Low ទាបជាង Candle ២ខាង', correct: false },
          { label: 'High ខ្ពស់ជាង Candle ២ខាង', correct: true },
          { label: 'Body ធំជាងគេក្នុង Chart', correct: false },
        ],
      },
      {
        question: 'BOS (Break of Structure) កើតឡើងនៅពេលណា?',
        options: [
          { label: 'ពេល Wick ឆ្លងកាត់ Swing High/Low ចាស់ភ្លាមៗ', correct: false },
          { label: 'ពេល Candle Body Close ឆ្លងកាត់ Swing High/Low ចាស់', correct: true },
          { label: 'ពេល Candle ប្ដូរពណ៌ក្រហម/បៃតង', correct: false },
        ],
      },
      {
        question: 'Structure មាន Higher High (HH) និង Higher Low (HL) ជាបន្តបន្ទាប់ — ជា Structure អ្វី?',
        options: [
          { label: 'Bullish', correct: true },
          { label: 'Bearish', correct: false },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: 'Structure មាន Lower High (LH) និង Lower Low (LL) ជាបន្តបន្ទាប់ — ជា Structure អ្វី?',
        options: [
          { label: 'Bullish', correct: false },
          { label: 'Bearish', correct: true },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: 'Price ធ្វើចលនាក្នុង Range ដោយគ្មាន HH/HL ឬ LH/LL ច្បាស់លាស់ — គេហៅថា Structure អ្វី?',
        options: [
          { label: 'Sideways', correct: true },
          { label: 'Breakout', correct: false },
          { label: 'BOS', correct: false },
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
        <strong>Market Structure</strong> is the <strong>very first foundation</strong> every trader needs to
        learn — it tells us which direction price is moving by studying how{' '}
        <strong>Swing High</strong> (peaks) and <strong>Swing Low</strong> (troughs) form one after another.
        Market Structure comes in <strong>3 types</strong>: Bullish, Bearish, and Sideways.
      </>
    ),
    h1: '3 Types of Market Structure',
    bullishLabel: 'Bullish ⬆',
    bullishBody: (
      <>
        Structure <strong style={{ color: 'var(--up)' }}>rising</strong>
        <br />
        Higher High (HH)
        <br />
        Higher Low (HL)
        <br />
        <strong>→ Bias Buy</strong>
      </>
    ),
    bearishLabel: 'Bearish ⬇',
    bearishBody: (
      <>
        Structure <strong style={{ color: 'var(--dn)' }}>falling</strong>
        <br />
        Lower High (LH)
        <br />
        Lower Low (LL)
        <br />
        <strong>→ Bias Sell</strong>
      </>
    ),
    sidewaysLabel: 'Sideways ↔',
    sidewaysBody: (
      <>
        Structure <strong style={{ color: 'var(--blue)' }}>ranging</strong>
        <br />
        Equal High (EQH)
        <br />
        Equal Low (EQL)
        <br />
        <strong>→ Wait for Breakout</strong>
      </>
    ),
    h2: 'Swing High & Swing Low',
    swingIntro: (
      <>
        Before you can read Market Structure, you need to be able to spot <strong>Swing High</strong> and{' '}
        <strong>Swing Low</strong> first — these Swing Points are the "backbone" used to identify HH, HL, LH,
        LL, and BOS.
      </>
    ),
    swingHighLabel: 'Swing High',
    swingHighBody: (
      <>
        Any candle with a <strong>higher High</strong> than the candles immediately to its left and right (at
        least 1 candle each side). It marks a peak before price turns back down.
      </>
    ),
    swingLowLabel: 'Swing Low',
    swingLowBody: (
      <>
        Any candle with a <strong>lower Low</strong> than the candles immediately to its left and right. It
        marks a trough before price turns back up.
      </>
    ),
    h3: 'How to Spot It on the Candles',
    steps: [
      'Pick a middle candle together with one candle on each side (left-right)',
      <>
        If the middle candle's High is <strong>higher than</strong> both sides' Highs → that's a{' '}
        <strong style={{ color: 'var(--up)' }}>Swing High</strong>
      </>,
      <>
        If the middle candle's Low is <strong>lower than</strong> both sides' Lows → that's a{' '}
        <strong style={{ color: 'var(--dn)' }}>Swing Low</strong>
      </>,
      'Slide forward candle by candle to find the next Swing High/Low',
    ],
    swingExampleLabel: '📊 Real example — XAUUSD (TradingView)',
    swingExampleCaption: 'Swing High = the peak candle higher than its surroundings · Swing Low = the trough candle lower than its surroundings',
    ruleTitle: 'Rule to remember',
    rule1: 'A Swing High/Low always needs a candle on both sides to "confirm" it — without a right-side candle yet, you can\'t confirm it as a real Swing Point.',
    h4: '1. Bullish Market Structure',
    bullishDef: (
      <p>
        <strong>Definition:</strong> Price makes a series of <strong>Higher High (HH)</strong> and{' '}
        <strong>Higher Low (HL)</strong> — every new Swing High is <strong>higher than</strong> the previous
        one, and every new Swing Low is <strong>higher than</strong> the previous one. This is evidence that{' '}
        <strong>buyers are in control</strong> of the market.
      </p>
    ),
    videoLabel: '🎥 Real example video from TradingView',
    bullishFigCaption: (
      <>
        Low 1 makes a BOS breaking High 1 → price closes above the old Swing High → forms a new{' '}
        <strong style={{ color: '#3EC97A' }}>Higher High (HH)</strong> — Structure becomes Bullish
      </>
    ),
    h5: '2. Bearish Market Structure',
    bearishDef: (
      <p>
        <strong>Definition:</strong> Price makes a series of <strong>Lower High (LH)</strong> and{' '}
        <strong>Lower Low (LL)</strong> — every new Swing High is <strong>lower than</strong> the previous
        one, and every new Swing Low is <strong>lower than</strong> the previous one. This is evidence that{' '}
        <strong>sellers are in control</strong> of the market.
      </p>
    ),
    bearishFigCaption: (
      <>
        High 1 makes a BOS breaking Low 1 → price closes below the old Swing Low → forms a new{' '}
        <strong style={{ color: '#E05555' }}>Lower Low (LL)</strong> — Structure becomes Bearish
      </>
    ),
    h6: '3. Sideways Market Structure',
    sidewaysDef: (
      <p>
        <strong>Definition:</strong> Price moves up and down within a <strong>Range</strong> — no clear
        HH/HL, and no clear LH/LL either. Highs and Lows are roughly equal (Equal High / Equal Low). Traders
        generally <strong>wait for a Breakout</strong> before trading.
      </p>
    ),
    sidewaysFigCaption: 'Equal High / Equal Low → Range → waiting for a clear Breakout',
    h7: 'BOS — Break of Structure',
    bosDef: (
      <p>
        <strong>BOS (Break of Structure)</strong> = when a candle <strong>closes</strong> beyond the old
        Swing High (Bullish BOS ↑) or old Swing Low (Bearish BOS ↓). BOS is evidence that Market Structure is{' '}
        <strong>continuing</strong> in its original direction.
      </p>
    ),
    bosLi1: (
      <>
        Requires a <strong>candle body close</strong> beyond the level — a wick briefly crossing over is{' '}
        <strong>not a BOS</strong> (it's a False Break)
      </>
    ),
    bosLi2: 'BOS ↑ = Bullish Continuation · BOS ↓ = Bearish Continuation',
    h8: 'How to Label HH, HL, LH, LL on Swing Points',
    hhIntro: (
      <>
        This is the <strong>single most important idea</strong> in reading Market Structure — we simply
        compare the <strong>new Swing High/Low</strong> with the <strong>previous Swing High/Low</strong> to
        know whether Structure is rising or falling.
      </>
    ),
    bearishStructureLabel: 'Bearish Structure',
    bearishStructureBody: (
      <>
        New Swing High <strong>lower than</strong> previous Swing High → <strong style={{ color: 'var(--dn)' }}>Lower High (LH)</strong>.
        New Swing Low <strong>lower than</strong> previous Swing Low → <strong style={{ color: 'var(--dn)' }}>Lower Low (LL)</strong>.
        BOS ↓ happens when price closes below the previous Swing Low.
      </>
    ),
    bullishStructureLabel: 'Bullish Structure',
    bullishStructureBody: (
      <>
        New Swing High <strong>higher than</strong> previous Swing High → <strong style={{ color: 'var(--up)' }}>Higher High (HH)</strong>.
        New Swing Low <strong>higher than</strong> previous Swing Low → <strong style={{ color: 'var(--up)' }}>Higher Low (HL)</strong>.
        BOS ↑ happens when price closes above the previous Swing High.
      </>
    ),
    rule2: (
      <>
        <strong>HH + HL</strong> = Bullish Structure (buyers in control) · <strong>LH + LL</strong> = Bearish
        Structure (sellers in control)
      </>
    ),
    whyImportant: (
      <p>
        <strong>💡 Why it matters:</strong> The Swing Point right before a BOS (e.g. the Low before a BOS ↑,
        or the High before a BOS ↓) is usually a <strong>zone where Smart Money left orders</strong> — when
        price returns to this zone, it's often a <strong>good Entry Zone</strong> to continue the trend.
      </p>
    ),
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'In a Bearish Market Structure — a new Swing Low that is lower than the previous Swing Low is called what?',
      options: [
        { label: 'Higher Low (HL)', type: 'no' },
        { label: 'Lower Low (LL)', type: 'ok' },
        { label: 'Equal Low (EQL)', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A new Swing Low lower than the previous Swing Low = Lower Low (LL).',
        no: '✗ A new Swing Low that is lower than the previous Swing Low is called Lower Low (LL).',
      },
    },
    quiz2: {
      question: 'A new Swing High that is higher than the previous Swing High is called what?',
      options: [
        { label: 'Higher High (HH)', type: 'ok' },
        { label: 'Lower High (LH)', type: 'no' },
        { label: 'Equal High (EQH)', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A new Swing High higher than the previous Swing High = Higher High (HH).',
        no: '✗ A new Swing High that is higher than the previous Swing High is called Higher High (HH).',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 1',
    homeworkIntro: 'Look at the chart below and try to work it out yourself before clicking "Show Answer":',
    homeworkLi1: (
      <>
        Is this a <strong>Bullish</strong> or <strong>Bearish</strong> Market Structure?
      </>
    ),
    homeworkLi2: (
      <>
        Where is the <strong>BOS</strong> (Break of Structure) point?
      </>
    ),
    homeworkLi3: (
      <>
        Is the new Swing an <strong>HH, HL, LH, or LL</strong>?
      </>
    ),
    chartALabel: 'Chart A',
    chartARevealLabel: '👁 Show Answer — Chart A',
    chartAAnswer: (
      <p>
        <strong>Answer:</strong> Chart A is a <strong>Bearish Market Structure</strong>. Low 1 (first candle)
        → High 1 (3rd candle, Swing High) → BOS ↓ happens at the 6th candle, which closes below Low 1 (the
        old Swing Low) · the very last candle forms a new <strong>Lower Low (LL)</strong> — this Structure is
        Bearish because it has a Lower High (LH) and Lower Low (LL).
      </p>
    ),
    chartBLabel: 'Chart B',
    chartBRevealLabel: '👁 Show Answer — Chart B',
    chartBAnswer: (
      <p>
        <strong>Answer:</strong> Chart B is a <strong>Bullish Market Structure</strong>. High 1 (first
        candle) → Low 1 (3rd candle, Swing Low) → BOS ↑ happens at the 6th candle, which closes above High 1
        (the old Swing High) · the very last candle forms a new <strong>Higher High (HH)</strong> — this
        Structure is Bullish because it has a Higher High (HH) and Higher Low (HL).
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Open your own chart on TradingView (any Forex/Gold/Crypto pair)
        and mark the Swing High/Low, BOS, HH, HL, LH, LL yourself. Screenshot it and send it to your Mentor
        for review in the next session.
      </p>
    ),
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You must answer <strong>all 5 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'A Swing High is any candle that...?',
        options: [
          { label: 'Has a Low lower than the 2 surrounding candles', correct: false },
          { label: 'Has a High higher than the 2 surrounding candles', correct: true },
          { label: 'Has the biggest body on the chart', correct: false },
        ],
      },
      {
        question: 'When does BOS (Break of Structure) happen?',
        options: [
          { label: 'When a wick briefly crosses the old Swing High/Low', correct: false },
          { label: "When a candle's body closes beyond the old Swing High/Low", correct: true },
          { label: 'When a candle switches from red to green', correct: false },
        ],
      },
      {
        question: 'Structure with a series of Higher High (HH) and Higher Low (HL) — what structure is that?',
        options: [
          { label: 'Bullish', correct: true },
          { label: 'Bearish', correct: false },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: 'Structure with a series of Lower High (LH) and Lower Low (LL) — what structure is that?',
        options: [
          { label: 'Bullish', correct: false },
          { label: 'Bearish', correct: true },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: 'Price moving in a Range with no clear HH/HL or LH/LL — what is that structure called?',
        options: [
          { label: 'Sideways', correct: true },
          { label: 'Breakout', correct: false },
          { label: 'BOS', correct: false },
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
        <strong>Market Structure（市场结构）</strong>是每位交易者最先要学的<strong>基础</strong>——它通过研究{' '}
        <strong>Swing High</strong>（高点）和 <strong>Swing Low</strong>（低点）如何连续形成，来告诉我们价格正在朝哪个方向运动。
        Market Structure 分为<strong>三种类型</strong>：Bullish、Bearish 和 Sideways。
      </>
    ),
    h1: 'Market Structure 的三种类型',
    bullishLabel: 'Bullish ⬆',
    bullishBody: (
      <>
        Structure <strong style={{ color: 'var(--up)' }}>上升</strong>
        <br />
        Higher High (HH)
        <br />
        Higher Low (HL)
        <br />
        <strong>→ 偏多 Buy</strong>
      </>
    ),
    bearishLabel: 'Bearish ⬇',
    bearishBody: (
      <>
        Structure <strong style={{ color: 'var(--dn)' }}>下降</strong>
        <br />
        Lower High (LH)
        <br />
        Lower Low (LL)
        <br />
        <strong>→ 偏空 Sell</strong>
      </>
    ),
    sidewaysLabel: 'Sideways ↔',
    sidewaysBody: (
      <>
        Structure <strong style={{ color: 'var(--blue)' }}>盘整</strong>
        <br />
        Equal High (EQH)
        <br />
        Equal Low (EQL)
        <br />
        <strong>→ 等待 Breakout</strong>
      </>
    ),
    h2: 'Swing High 与 Swing Low',
    swingIntro: (
      <>
        在学会看 Market Structure 之前，必须先学会识别 <strong>Swing High</strong> 和 <strong>Swing Low</strong>
        ——这些 Swing Point 是判断 HH、HL、LH、LL 和 BOS 的"骨架"。
      </>
    ),
    swingHighLabel: 'Swing High',
    swingHighBody: (
      <>
        任何一根 High <strong>高于</strong>左右两侧相邻蜡烛（每边至少 1 根）的蜡烛。它标志着价格反转向下之前的一个高点。
      </>
    ),
    swingLowLabel: 'Swing Low',
    swingLowBody: (
      <>
        任何一根 Low <strong>低于</strong>左右两侧相邻蜡烛的蜡烛。它标志着价格反转向上之前的一个低点。
      </>
    ),
    h3: '如何在蜡烛图上判断',
    steps: [
      '在图上选一根中间蜡烛，并配上左右各一根蜡烛',
      <>
        如果中间蜡烛的 High <strong>高于</strong>两侧的 High → 那就是{' '}
        <strong style={{ color: 'var(--up)' }}>Swing High</strong>
      </>,
      <>
        如果中间蜡烛的 Low <strong>低于</strong>两侧的 Low → 那就是{' '}
        <strong style={{ color: 'var(--dn)' }}>Swing Low</strong>
      </>,
      '逐根蜡烛向前推移，寻找下一个 Swing High/Low',
    ],
    swingExampleLabel: '📊 真实案例 — XAUUSD（TradingView）',
    swingExampleCaption: 'Swing High = 高于周围的顶部蜡烛 · Swing Low = 低于周围的底部蜡烛',
    ruleTitle: '记住这条规则',
    rule1: 'Swing High/Low 始终需要两侧蜡烛来"确认"——如果右侧蜡烛还不够，就还不能确定这是真正的 Swing Point。',
    h4: '1. Bullish Market Structure（多头结构）',
    bullishDef: (
      <p>
        <strong>定义：</strong>价格连续形成 <strong>Higher High (HH)</strong> 和 <strong>Higher Low (HL)</strong>
        ——每个新的 Swing High 都<strong>高于</strong>前一个 Swing High，每个新的 Swing Low 都
        <strong>高于</strong>前一个 Swing Low。这证明<strong>买方正在主导</strong>市场。
      </p>
    ),
    videoLabel: '🎥 来自 TradingView 的真实案例视频',
    bullishFigCaption: (
      <>
        Low 1 做出 BOS 突破 High 1 → 价格收盘价高于旧的 Swing High → 形成新的{' '}
        <strong style={{ color: '#3EC97A' }}>Higher High (HH)</strong> — Structure 转为 Bullish
      </>
    ),
    h5: '2. Bearish Market Structure（空头结构）',
    bearishDef: (
      <p>
        <strong>定义：</strong>价格连续形成 <strong>Lower High (LH)</strong> 和 <strong>Lower Low (LL)</strong>
        ——每个新的 Swing High 都<strong>低于</strong>前一个 Swing High，每个新的 Swing Low 都
        <strong>低于</strong>前一个 Swing Low。这证明<strong>卖方正在主导</strong>市场。
      </p>
    ),
    bearishFigCaption: (
      <>
        High 1 做出 BOS 突破 Low 1 → 价格收盘价低于旧的 Swing Low → 形成新的{' '}
        <strong style={{ color: '#E05555' }}>Lower Low (LL)</strong> — Structure 转为 Bearish
      </>
    ),
    h6: '3. Sideways Market Structure（盘整结构）',
    sidewaysDef: (
      <p>
        <strong>定义：</strong>价格在一个<strong>区间（Range）</strong>内上下波动——没有明显的 HH/HL，也没有明显的
        LH/LL。高点与低点大致相等（Equal High / Equal Low）。交易者通常会<strong>等待 Breakout</strong>
        再进场交易。
      </p>
    ),
    sidewaysFigCaption: 'Equal High / Equal Low → Range → 等待明确的 Breakout',
    h7: 'BOS — Break of Structure（结构突破）',
    bosDef: (
      <p>
        <strong>BOS (Break of Structure)</strong> = 当蜡烛<strong>收盘价</strong>突破旧的 Swing High（Bullish
        BOS ↑）或旧的 Swing Low（Bearish BOS ↓）时。BOS 是 Market Structure 正在<strong>延续</strong>原方向的证据。
      </p>
    ),
    bosLi1: (
      <>
        必须是 <strong>Candle Body 收盘价</strong> 突破——如果只是影线短暂穿过，
        <strong>不算 BOS</strong>（属于 False Break）
      </>
    ),
    bosLi2: 'BOS ↑ = Bullish Continuation（多头延续） · BOS ↓ = Bearish Continuation（空头延续）',
    h8: '如何在 Swing Point 上标注 HH、HL、LH、LL',
    hhIntro: (
      <>
        这是理解 Market Structure <strong>最重要的概念</strong>——我们只需将<strong>新的 Swing High/Low</strong>
        与<strong>旧的 Swing High/Low</strong> 比较，就能知道 Structure 正在上升还是下降。
      </>
    ),
    bearishStructureLabel: 'Bearish Structure',
    bearishStructureBody: (
      <>
        新 Swing High <strong>低于</strong>旧 Swing High → <strong style={{ color: 'var(--dn)' }}>Lower High (LH)</strong>。
        新 Swing Low <strong>低于</strong>旧 Swing Low → <strong style={{ color: 'var(--dn)' }}>Lower Low (LL)</strong>。
        当价格收盘价低于旧 Swing Low 时，即发生 BOS ↓。
      </>
    ),
    bullishStructureLabel: 'Bullish Structure',
    bullishStructureBody: (
      <>
        新 Swing High <strong>高于</strong>旧 Swing High → <strong style={{ color: 'var(--up)' }}>Higher High (HH)</strong>。
        新 Swing Low <strong>高于</strong>旧 Swing Low → <strong style={{ color: 'var(--up)' }}>Higher Low (HL)</strong>。
        当价格收盘价高于旧 Swing High 时，即发生 BOS ↑。
      </>
    ),
    rule2: (
      <>
        <strong>HH + HL</strong> = Bullish Structure（买方主导） · <strong>LH + LL</strong> = Bearish
        Structure（卖方主导）
      </>
    ),
    whyImportant: (
      <p>
        <strong>💡 为什么重要：</strong>BOS 之前的 Swing Point（例如 BOS ↑ 之前的 Low，或 BOS ↓ 之前的
        High）通常是 <strong>Smart Money 留下挂单的区域</strong>——当价格再次回到这个区域时，往往是延续趋势的
        <strong>优质 Entry Zone</strong>。
      </p>
    ),
    quizHeading: '知识检测',
    quiz1: {
      question: '在 Bearish Market Structure 中——低于旧 Swing Low 的新 Swing Low 称为什么？',
      options: [
        { label: 'Higher Low (HL)', type: 'no' },
        { label: 'Lower Low (LL)', type: 'ok' },
        { label: 'Equal Low (EQL)', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！低于旧 Swing Low 的新 Swing Low = Lower Low (LL)。',
        no: '✗ 低于旧 Swing Low 的新 Swing Low 应称为 Lower Low (LL)。',
      },
    },
    quiz2: {
      question: '高于旧 Swing High 的新 Swing High 称为什么？',
      options: [
        { label: 'Higher High (HH)', type: 'ok' },
        { label: 'Lower High (LH)', type: 'no' },
        { label: 'Equal High (EQH)', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！高于旧 Swing High 的新 Swing High = Higher High (HH)。',
        no: '✗ 高于旧 Swing High 的新 Swing High 应称为 Higher High (HH)。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 1 课',
    homeworkIntro: '观察下方图表，在点击"查看答案"之前先自己尝试判断：',
    homeworkLi1: (
      <>
        这是 <strong>Bullish</strong> 还是 <strong>Bearish</strong> Market Structure？
      </>
    ),
    homeworkLi2: (
      <>
        <strong>BOS</strong>（Break of Structure）出现在哪个位置？
      </>
    ),
    homeworkLi3: (
      <>
        这个新的 Swing 属于 <strong>HH、HL、LH 还是 LL</strong>？
      </>
    ),
    chartALabel: 'Chart A',
    chartARevealLabel: '👁 查看答案 — Chart A',
    chartAAnswer: (
      <p>
        <strong>答案：</strong>Chart A 是 <strong>Bearish Market Structure</strong>。Low 1（第一根蜡烛）→
        High 1（第 3 根蜡烛，Swing High）→ BOS ↓ 出现在第 6 根蜡烛，其收盘价低于 Low 1（旧 Swing Low）
        ·最后一根蜡烛形成新的 <strong>Lower Low (LL)</strong> ——因为存在 Lower High (LH) 和 Lower Low
        (LL)，所以这是 Bearish Structure。
      </p>
    ),
    chartBLabel: 'Chart B',
    chartBRevealLabel: '👁 查看答案 — Chart B',
    chartBAnswer: (
      <p>
        <strong>答案：</strong>Chart B 是 <strong>Bullish Market Structure</strong>。High 1（第一根蜡烛）→
        Low 1（第 3 根蜡烛，Swing Low）→ BOS ↑ 出现在第 6 根蜡烛，其收盘价高于 High 1（旧 Swing High）
        ·最后一根蜡烛形成新的 <strong>Higher High (HH)</strong> ——因为存在 Higher High (HH) 和 Higher Low
        (HL)，所以这是 Bullish Structure。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 附加作业：</strong>在 TradingView 上打开你自己的图表（任意 Forex/Gold/Crypto 货币对），
        自行标出 Swing High/Low、BOS、HH、HL、LH、LL。截图发给 Mentor，在下节课进行检查。
      </p>
    ),
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        必须<strong>全部 5 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Swing High 是指哪一根蜡烛...？',
        options: [
          { label: 'Low 比两侧蜡烛都低', correct: false },
          { label: 'High 比两侧蜡烛都高', correct: true },
          { label: '图表中 Body 最大的蜡烛', correct: false },
        ],
      },
      {
        question: 'BOS (Break of Structure) 在什么时候发生？',
        options: [
          { label: '影线短暂穿过旧 Swing High/Low 时', correct: false },
          { label: '蜡烛 Body 收盘价突破旧 Swing High/Low 时', correct: true },
          { label: '蜡烛从红色变绿色时', correct: false },
        ],
      },
      {
        question: '连续出现 Higher High (HH) 和 Higher Low (HL) 的结构，属于什么 Structure？',
        options: [
          { label: 'Bullish', correct: true },
          { label: 'Bearish', correct: false },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: '连续出现 Lower High (LH) 和 Lower Low (LL) 的结构，属于什么 Structure？',
        options: [
          { label: 'Bullish', correct: false },
          { label: 'Bearish', correct: true },
          { label: 'Sideways', correct: false },
        ],
      },
      {
        question: '价格在 Range 内波动，没有明确的 HH/HL 或 LH/LL — 这种结构叫什么？',
        options: [
          { label: 'Sideways', correct: true },
          { label: 'Breakout', correct: false },
          { label: 'BOS', correct: false },
        ],
      },
    ],
  },
};

export default function Lesson1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const bullishVideo = videos['l1-bullish']?.url;
  const bearishVideo = videos['l1-bearish']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q, i) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="l1"
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
      <div className="g3">
        <GridItem labelColor="var(--up)" label={t.bullishLabel}>
          {t.bullishBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.bearishLabel}>
          {t.bearishBody}
        </GridItem>
        <GridItem labelColor="var(--blue)" label={t.sidewaysLabel}>
          {t.sidewaysBody}
        </GridItem>
      </div>

      {/* ===== SWING HIGH / SWING LOW ===== */}
      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <p>{t.swingIntro}</p>

      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.swingHighLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.swingHighBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.swingLowLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.swingLowBody}
        </GridItem>
      </div>

      <h3 style={{ marginTop: 20 }}>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Steps items={t.steps} />

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          {t.swingExampleLabel}
        </div>
        <img
          src={swingExample}
          alt="Swing High Swing Low XAUUSD"
          style={{ width: '100%', borderRadius: 8, display: 'block' }}
        />
        <div className="cap">{t.swingExampleCaption}</div>
      </div>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== BULLISH MARKET STRUCTURE ===== */}
      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Box variant="u">{t.bullishDef}</Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--up)', marginBottom: 8 }}>
          {t.videoLabel}
        </div>
        <video
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={bullishVideo} type="video/mp4" />
        </video>
      </div>

      <AnimatedFig caption={t.bullishFigCaption}>
        <svg viewBox="0 0 700 210">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            BULLISH MARKET STRUCTURE
          </text>

          <line x1="40" y1="70" x2="465" y2="70" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="40" y1="70" x2="40" y2="105" stroke="#E05555" strokeWidth="1.4" /><rect x="34" y="75" width="12" height="25" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="82.5" y1="94.75" x2="82.5" y2="116.75" stroke="#E05555" strokeWidth="1" /><rect x="78.5" y="98.75" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="125" y1="100" x2="125" y2="145" stroke="#E05555" strokeWidth="1.4" /><rect x="119" y="108" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.33s' }}><line x1="167.5" y1="126.5" x2="167.5" y2="148.5" stroke="#E05555" strokeWidth="1" /><rect x="163.5" y="130.5" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="210" y1="140" x2="210" y2="160" stroke="#E05555" strokeWidth="1.4" /><rect x="204" y="145" width="12" height="12" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.48s' }}><line x1="252.5" y1="133.5" x2="252.5" y2="155.5" stroke="#3EC97A" strokeWidth="1" /><rect x="248.5" y="137.5" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="295" y1="118" x2="295" y2="158" stroke="#3EC97A" strokeWidth="1.4" /><rect x="289" y="122" width="12" height="32" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.63s' }}><line x1="337.5" y1="112" x2="337.5" y2="134" stroke="#3EC97A" strokeWidth="1" /><rect x="333.5" y="116" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.7s' }}><line x1="380" y1="90" x2="380" y2="125" stroke="#3EC97A" strokeWidth="1.4" /><rect x="374" y="94" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.78s' }}><line x1="445" y1="71.9" x2="445" y2="93.9" stroke="#3EC97A" strokeWidth="1" /><rect x="441" y="75.9" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.85s' }}><line x1="465" y1="55" x2="465" y2="95" stroke="#3EC97A" strokeWidth="1.4" /><rect x="459" y="60" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.93s' }}><line x1="507.5" y1="49.5" x2="507.5" y2="69.5" stroke="#3EC97A" strokeWidth="1" /><rect x="503.5" y="53.5" width="8" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1s' }}><line x1="550" y1="25" x2="550" y2="62" stroke="#3EC97A" strokeWidth="1.4" /><rect x="544" y="30" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.08s' }}><line x1="585" y1="39.5" x2="585" y2="59.5" stroke="#E05555" strokeWidth="1" /><rect x="581" y="43.5" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.15s' }}><line x1="620" y1="40" x2="620" y2="70" stroke="#E05555" strokeWidth="1.4" /><rect x="614" y="45" width="12" height="20" rx="1" fill="#E05555" /></g>

          <g className="ac" style={{ animationDelay: '.1s' }}><circle cx="40" cy="70" r="4" fill="#2E7CF6" /><text x="40" y="55" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">High 1</text></g>
          <text x="410" y="64" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '1.3s' }}>Swing High</text>

          <g className="ac" style={{ animationDelay: '.4s' }}><circle cx="210" cy="160" r="4" fill="#2E7CF6" /><text x="210" y="178" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">Low 1</text></g>
          <text x="210" y="194" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '1.4s' }}>Swing Low</text>

          <text x="465" y="45" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1.1s' }}>BOS ↑</text>
          <g className="ac" style={{ animationDelay: '1s' }}><circle cx="550" cy="25" r="4" fill="#3EC97A" /><text x="550" y="14" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">HH</text></g>
        </svg>
      </AnimatedFig>

      {/* ===== BEARISH MARKET STRUCTURE ===== */}
      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="d">{t.bearishDef}</Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--dn)', marginBottom: 8 }}>
          {t.videoLabel}
        </div>
        <video
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={bearishVideo} type="video/mp4" />
        </video>
      </div>

      <AnimatedFig caption={t.bearishFigCaption}>
        <svg viewBox="0 0 700 230">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            BEARISH MARKET STRUCTURE
          </text>

          <line x1="40" y1="160" x2="465" y2="160" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="40" y1="140" x2="40" y2="165" stroke="#3EC97A" strokeWidth="1.4" /><rect x="34" y="145" width="12" height="15" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="82.5" y1="127.75" x2="82.5" y2="149.75" stroke="#3EC97A" strokeWidth="1" /><rect x="78.5" y="131.75" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="125" y1="100" x2="125" y2="148" stroke="#3EC97A" strokeWidth="1.4" /><rect x="119" y="105" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.33s' }}><line x1="167.5" y1="92" x2="167.5" y2="114" stroke="#3EC97A" strokeWidth="1" /><rect x="163.5" y="96" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="210" y1="70" x2="210" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="204" y="75" width="12" height="12" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.48s' }}><line x1="252.5" y1="85" x2="252.5" y2="107" stroke="#E05555" strokeWidth="1" /><rect x="248.5" y="89" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="295" y1="90" x2="295" y2="130" stroke="#E05555" strokeWidth="1.4" /><rect x="289" y="95" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.63s' }}><line x1="337.5" y1="112.5" x2="337.5" y2="134.5" stroke="#E05555" strokeWidth="1" /><rect x="333.5" y="116.5" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.7s' }}><line x1="380" y1="115" x2="380" y2="155" stroke="#E05555" strokeWidth="1.4" /><rect x="374" y="120" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.78s' }}><line x1="440" y1="147.24" x2="440" y2="169.24" stroke="#E05555" strokeWidth="1" /><rect x="436" y="151.24" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.85s' }}><line x1="465" y1="140" x2="465" y2="185" stroke="#E05555" strokeWidth="1.4" /><rect x="459" y="150" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.93s' }}><line x1="507.5" y1="169.25" x2="507.5" y2="189.25" stroke="#E05555" strokeWidth="1" /><rect x="503.5" y="173.25" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1s' }}><line x1="550" y1="170" x2="550" y2="210" stroke="#E05555" strokeWidth="1.4" /><rect x="544" y="175" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.08s' }}><line x1="585" y1="180.5" x2="585" y2="200.5" stroke="#3EC97A" strokeWidth="1" /><rect x="581" y="184.5" width="8" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.15s' }}><line x1="620" y1="175" x2="620" y2="205" stroke="#3EC97A" strokeWidth="1.4" /><rect x="614" y="180" width="12" height="20" rx="1" fill="#3EC97A" /></g>

          <g className="ac" style={{ animationDelay: '.1s' }}><circle cx="40" cy="160" r="4" fill="#2E7CF6" /><text x="40" y="182" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">Low 1</text></g>
          <text x="410" y="153" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '1.3s' }}>Swing Low</text>

          <g className="ac" style={{ animationDelay: '.4s' }}><circle cx="210" cy="70" r="4" fill="#2E7CF6" /><text x="210" y="58" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">High 1</text></g>
          <text x="210" y="45" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '1.4s' }}>Swing High</text>

          <text x="465" y="200" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1.1s' }}>BOS ↓</text>
          <g className="ac" style={{ animationDelay: '1s' }}><circle cx="550" cy="210" r="4" fill="#E05555" /><text x="550" y="224" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">LL</text></g>
        </svg>
      </AnimatedFig>

      {/* ===== SIDEWAYS ===== */}
      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="b">{t.sidewaysDef}</Box>

      <AnimatedFig caption={t.sidewaysFigCaption}>
        <svg viewBox="0 0 700 160">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            SIDEWAYS — RANGE
          </text>
          <line x1="30" y1="45" x2="670" y2="45" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />
          <line x1="30" y1="110" x2="670" y2="110" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="20" y="49" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>EQH</text>
          <text x="20" y="114" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>EQL</text>
          <g className="ac" style={{ animationDelay: '.35s' }}><line x1="90" y1="48" x2="90" y2="95" stroke="#3EC97A" strokeWidth="1.4" /><rect x="84" y="55" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.425s' }}><line x1="132.5" y1="68" x2="132.5" y2="80" stroke="#E05555" strokeWidth="1" /><rect x="129.5" y="71" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.5s' }}><line x1="175" y1="60" x2="175" y2="108" stroke="#E05555" strokeWidth="1.4" /><rect x="169" y="68" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.575s' }}><line x1="217.5" y1="66.5" x2="217.5" y2="84.5" stroke="#3EC97A" strokeWidth="1" /><rect x="214.5" y="69.5" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="260" y1="45" x2="260" y2="92" stroke="#3EC97A" strokeWidth="1.4" /><rect x="254" y="52" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.725s' }}><line x1="302.5" y1="66" x2="302.5" y2="84" stroke="#E05555" strokeWidth="1" /><rect x="299.5" y="69" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.8s' }}><line x1="345" y1="58" x2="345" y2="110" stroke="#E05555" strokeWidth="1.4" /><rect x="339" y="66" width="12" height="34" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.875s' }}><line x1="387.5" y1="67" x2="387.5" y2="85" stroke="#3EC97A" strokeWidth="1" /><rect x="384.5" y="70" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.95s' }}><line x1="430" y1="47" x2="430" y2="94" stroke="#3EC97A" strokeWidth="1.4" /><rect x="424" y="54" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.025s' }}><line x1="472.5" y1="68" x2="472.5" y2="86" stroke="#E05555" strokeWidth="1" /><rect x="469.5" y="71" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.1s' }}><line x1="515" y1="62" x2="515" y2="108" stroke="#E05555" strokeWidth="1.4" /><rect x="509" y="70" width="12" height="30" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.175s' }}><line x1="557.5" y1="67.5" x2="557.5" y2="85.5" stroke="#3EC97A" strokeWidth="1" /><rect x="554.5" y="70.5" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.25s' }}><line x1="600" y1="46" x2="600" y2="93" stroke="#3EC97A" strokeWidth="1.4" /><rect x="594" y="53" width="12" height="30" rx="1" fill="#3EC97A" /></g>
        </svg>
      </AnimatedFig>

      {/* ===== BOS ===== */}
      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <Box variant="g">
        {t.bosDef}
        <ul>
          <li>{t.bosLi1}</li>
          <li>{t.bosLi2}</li>
        </ul>
      </Box>

      {/* ===== HH / HL / LH / LL ===== */}
      <h3>
        <span className="bar"></span>
        {t.h8}
      </h3>
      <p>{t.hhIntro}</p>

      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.bearishStructureLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bearishStructureBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.bullishStructureLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bullishStructureBody}
        </GridItem>
      </div>

      <Rule title={t.ruleTitle}>{t.rule2}</Rule>

      <Box variant="g">{t.whyImportant}</Box>

      {/* QUIZ */}
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

      <div className="fig" style={{ marginTop: 16 }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          {t.chartALabel}
        </div>
        <img src={chartA} alt="Chart A — XAUUSD" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      </div>
      <AnswerReveal label={t.chartARevealLabel} variant="d">
        {t.chartAAnswer}
      </AnswerReveal>

      <div className="fig" style={{ marginTop: 20 }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          {t.chartBLabel}
        </div>
        <img src={chartB} alt="Chart B — XAUUSD" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      </div>
      <AnswerReveal label={t.chartBRevealLabel} variant="u">
        {t.chartBAnswer}
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
