import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import AnimatedFig from '../components/ui/AnimatedFig.jsx';
import Quiz from '../components/ui/Quiz.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getLessonMeta } from '../data/lessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const meta = getLessonMeta('l6');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagrams) stays identical across languages — only this
// content swaps. Trading terms (EMA, SMA, Momentum, Bullish/Bearish, Cross,
// etc.) are kept in English in every language since that's the universal
// jargon traders use, in Khmer-language trading communities too.
const CONTENT = {
  kh: {
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <p>
        <strong>EMA (Exponential Moving Average)</strong> និង <strong>SMA (Simple Moving Average)</strong> ទាំង
        ពីរជា Indicator គូសបន្ទាត់ Average នៃ Price ក្នុងរយៈពេលកំណត់មួយ — ខុសគ្នាត្រង់ EMA{' '}
        <strong>ផ្ដល់ទម្ងន់ខ្ពស់ជាងទៅលើ Price ថ្មីៗ</strong> ធ្វើឱ្យវាប្រតិកម្មរហ័សជាង ចំណែក SMA គិត Average ស្មើ
        គ្នារាល់ Candle ធ្វើឱ្យវារលូន និងយឺតជាង។ មេរៀននេះនឹងបង្ហាញពីរបៀប{' '}
        <strong>ផ្សំ EMA និង SMA រយៈពេលដូចគ្នា (50, 100, 200)</strong> ដើម្បីអាន Bullish/Bearish Structure និង
        សម្គាល់ពេល Momentum ចាប់ផ្ដើមផ្លាស់ប្តូរ។
      </p>
    ),
    easyThink: (
      <p>
        <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃ SMA ដូចជា <strong>មិត្តដើរឆ្ងាយពីក្រោយ</strong> — ដឹងទិសយឺតៗ។ EMA
        ដូចជា <strong>មិត្តដើរជិតៗពីក្រោយ</strong> — ពេលអ្នកបត់ វាបត់តាមភ្លាមៗជាង។ ពេល "មិត្តជិត" (EMA){' '}
        <strong>ដើរលឿនហួស "មិត្តឆ្ងាយ" (SMA)</strong> នេះជាសញ្ញាថា ល្បឿនរបស់អ្នក (Momentum) កំពុងផ្លាស់ប្តូរ —
        នោះហើយជាគោលការណ៍នៃមេរៀននេះ។
      </p>
    ),
    h1: 'ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន',
    periodLabel: 'Period (Length)',
    periodBody: 'ចំនួន Candle ដែល EMA/SMA ប្រើសម្រាប់គណនា Average — ឧ. EMA50 = 50 Candle ចុងក្រោយ (ផ្ដល់ទម្ងន់ខ្ពស់ទៅ Candle ថ្មី)។',
    crossoverLabel: 'EMA-SMA Pair Crossover',
    crossoverBody: (
      <>
        ពេល EMA និង SMA <strong>រយៈពេលដូចគ្នា</strong> (ឧ. EMA50 vs SMA50) ប្រសព្វគ្នា — សញ្ញា Momentum Shift សម្រាប់ Layer នោះ។
      </>
    ),
    rule1Title: 'EMA + SMA = Tool ជំនួយ មិនមែន Signal ពេញលេញ',
    rule1Body: 'តែងតែផ្សំជាមួយ Market Structure និង Context ដទៃទៀត កុំប្រើម្នាក់ឯង',
    h2: '១. EMA/SMA ជា Trend Filter',
    trendFilterBody: (
      <p>
        វិធីសាមញ្ញបំផុតប្រើ EMA/SMA គឺជា <strong>Filter Bias</strong>៖ Price ស្ថិតនៅ <strong>លើ</strong> បន្ទាត់
        ជាទូទៅចាត់ទុកជា <strong>Bullish Bias</strong>, Price ស្ថិតនៅ <strong>ក្រោម</strong> បន្ទាត់ជាទូទៅចាត់ទុកជា{' '}
        <strong>Bearish Bias</strong>។ ប្រើផ្សំជាមួយ Market Structure (មេរៀនទី ១) ដើម្បីបញ្ជាក់ទិសបន្ថែម។
      </p>
    ),
    period50Label: '50 (EMA50 / SMA50)',
    period50Body: 'Short-Medium term — តាមដាន Momentum រយៈពេលខ្លីទៅមធ្យម ប្រតិកម្មលឿន តែងាយប្រែប្រួល។',
    period100Label: '100 (EMA100 / SMA100)',
    period100Body: 'Medium term — Balance ល្អរវាង Speed និង Reliability សម្រាប់ Swing Trading។',
    period200Label: '200 (EMA200 / SMA200)',
    period200Body: 'Long term — តំណាង Trend ធំ/Bias ស្ថាប័ន Trader ជាច្រើនប្រើជា "បន្ទាត់ព្រំដែន" Bull/Bear Market។',
    h3: '២. ផ្សំ EMA + SMA រយៈពេលដូចគ្នា — អាន Bull/Bear Structure',
    comboBody: (
      <p>
        គន្លឹះសំខាន់នៃមេរៀននេះ៖ គូស <strong>EMA និង SMA រយៈពេលដូចគ្នា</strong> នៅលើគ្នា (EMA50+SMA50, EMA100+SMA100,
        EMA200+SMA200)។ ដោយសារ EMA ប្រតិកម្មលឿនជាង SMA ជានិច្ច ទំនាក់ទំនងរវាងបន្ទាត់ទាំងពីរប្រាប់ពី{' '}
        <strong>Momentum</strong> របស់ Layer រយៈពេលនោះ៖
      </p>
    ),
    emaAboveLabel: 'EMA នៅលើ SMA ⬆',
    emaAboveBody: (
      <>
        Momentum កំពុងបង្កើនល្បឿនទៅ <strong>Bullish</strong> — Price ថ្មីៗខ្លាំងជាង Average ចាស់។
      </>
    ),
    emaBelowLabel: 'EMA នៅក្រោម SMA ⬇',
    emaBelowBody: (
      <>
        Momentum កំពុងបង្កើនល្បឿនទៅ <strong>Bearish</strong> — Price ថ្មីៗខ្សោយជាង Average ចាស់។
      </>
    ),
    fullStackBody: (
      <p>
        <strong>Full Stack Bullish ៖</strong> EMA50{'>'}SMA50 <em>ព្រម</em> EMA100{'>'}SMA100 <em>ព្រម</em> EMA200
        {'>'}SMA200 — Layer ទាំង ៣ ស្របគ្នា Bullish — Bias រឹងមាំបំផុត។ <strong>Full Stack Bearish</strong> គឺផ្ទុយ
        ពីនេះទាំងស្រុង។ ពេល Layer មិនទាន់ស្របគ្នា (ឧ. EMA50 Cross ឡើងលើ SMA50 រួច ប៉ុន្តែ EMA200 នៅតែក្រោម SMA200)
        — នេះជាសញ្ញា Momentum រយៈពេលខ្លីចាប់ផ្ដើមប្ដូរ ប៉ុន្តែ Trend ធំមិនទាន់ Confirm ត្រូវប្រុងប្រយ័ត្ន — ស្រដៀង
        គ្នានឹងគំនិត CHoCH (មេរៀនទី ២) ដែលជាសញ្ញាដំបូង មិនមែន Reversal ពេញលេញភ្លាមៗ។
      </p>
    ),
    crossFigCaption: (
      <>
        ខាងឆ្វេង៖ <strong style={{ color: '#3EC97A' }}>EMA</strong> Cross ឡើងលើ{' '}
        <strong style={{ color: '#6FA8FF' }}>SMA រយៈពេលដូចគ្នា</strong> = Momentum Shift{' '}
        <strong style={{ color: '#3EC97A' }}>Bullish</strong> · ខាងស្ដាំ៖ EMA Cross ចុះក្រោម SMA = Momentum
        Shift <strong style={{ color: '#E05555' }}>Bearish</strong> — Price ច្រើនតែត្រឡប់មកប៉ះបន្ទាត់ EMA
        (Dynamic S/R) មុននឹងបន្តទិស
      </>
    ),
    retestLabel: 'Retest EMA',
    quiz1: {
      question: 'EMA100 Cross ចុះក្រោម SMA100 (រយៈពេលដូចគ្នា) — សញ្ញាអ្វី?',
      options: [
        { label: 'Momentum Shift Bullish', type: 'no' },
        { label: 'Momentum Shift Bearish សម្រាប់ Layer 100', type: 'ok' },
        { label: 'Liquidity Sweep', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! EMA Cross ចុះក្រោម SMA រយៈពេលដូចគ្នា = Momentum Shift Bearish សម្រាប់ Layer នោះ។',
        no: '✗ Cross ចុះក្រោមមានន័យថា Momentum ចាប់ផ្ដើមខ្សោយទៅ Bearish មិនមែន Bullish ឬ Liquidity Sweep ទេ។',
      },
    },
    h4: '៣. EMA/SMA ជា Dynamic Support/Resistance',
    dynamicSrBody: (
      <p>
        ក្នុង Trend ខ្លាំង Price ច្រើនតែ <strong>Pullback មកប៉ះ EMA ឬ SMA</strong> មុននឹង React បន្តទិស Trend —
        ស្រដៀងគ្នានឹង Retest លើ Order Block (មេរៀនទី ៣) ដែរ ប៉ុន្តែ EMA/SMA ជា Zone ដែល{' '}
        <strong>ផ្លាស់ទីរាល់ថ្ងៃ</strong> មិនថេរដូច OB ទេ។
      </p>
    ),
    h5: '៤. របៀបប្រើ EMA + SMA ជាជំហានៗ',
    steps: [
      'បន្ថែម EMA និង SMA រយៈពេលដូចគ្នាទាំង ៣ ស្រទាប់ — 50, 100, 200 លើ Chart',
      'ពិនិត្យរាល់ Layer ថា EMA នៅលើ ឬក្រោម SMA របស់វា — កំណត់ Momentum នីមួយៗ',
      <>
        ប្រៀបធៀបជាមួយ <strong>Market Structure</strong> (មេរៀនទី ១) ដើម្បីមើលថា Layer ទាំង ៣ ស្របនឹង Structure ដែរឬអត់ ។
      </>,
      'បើ Layer ខ្លះស្រប ខ្លះមិនទាន់ស្រប — ចាត់ទុកជា Transition មិនមែន Full Reversal ភ្លាមៗ',
      'រង់ចាំ Price Pullback មកប៉ះ EMA/SMA ហើយ React ជា Dynamic Support/Resistance មុន Entry',
    ],
    quiz2: {
      question: 'EMA50 Cross ឡើងលើ SMA50 រួច ប៉ុន្តែ EMA200 នៅតែក្រោម SMA200 — គួរបកស្រាយយ៉ាងណា?',
      options: [
        { label: 'Trend ធំបាន Reverse ភ្លាមៗ 100%', type: 'no' },
        { label: 'Momentum រយៈពេលខ្លីចាប់ផ្ដើមប្ដូរ ប៉ុន្តែ Trend ធំមិនទាន់ Confirm — ត្រូវប្រុងប្រយ័ត្ន', type: 'ok' },
        { label: 'មិនសំខាន់ទាល់តែសោះ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Layer ខ្លីៗអាចប្ដូរមុន Layer ធំ — ត្រូវរង់ចាំ Layer ធំ (200) ស្របតាមផង មុននឹងទុកចិត្តពេញលេញ។',
        no: '✗ Layer តែមួយប្ដូរ មិនទាន់មានន័យថា Trend ធំទាំងមូល Reverse ភ្លាមៗទេ — និងវាមានសារៈសំខាន់ក្នុងការតាមដាន Momentum ។',
      },
    },
    h6: '៥. កំហុសដែល Beginner ជួបញឹកញាប់',
    mistake1: (
      <>
        <strong>ប្រើ EMA/SMA ម្នាក់ឯង ដោយគ្មាន Structure</strong> — ជា Filter/Confluence មិនមែន Complete
        Strategy ។
      </>
    ),
    mistake2: (
      <>
        <strong>ដាក់បន្ទាត់ច្រើនពេកលើ Chart</strong> — EMA/SMA ច្រើនស្រទាប់ធ្វើឱ្យ Chart ច្របូកច្របល់ លំបាកសម្រេចចិត្ត ។
      </>
    ),
    mistake3: (
      <>
        <strong>ឃើញ EMA/SMA Layer តែមួយ Cross ហើយសន្និដ្ឋានថា Trend ធំ Reverse ភ្លាមៗ</strong> — ត្រូវរង់ចាំ
        Layer ធំៗ (ជាពិសេស 200) ស្របតាមផងសិន ។
      </>
    ),
    mistake4: (
      <>
        <strong>ចូល Trade រាល់ Cross ភ្លាមៗដោយគ្មាន Confirmation</strong> — Crossover មាន Lag ជួនកាល False
        Signal ក្នុង Market Sideways ។
      </>
    ),
    rule2Title: 'ច្បាប់ងាយចាំ',
    rule2Body: 'EMA លើ SMA (រយៈពេលដូចគ្នា) = Momentum Bullish · EMA ក្រោម SMA = Momentum Bearish · Layer ធំបញ្ជាក់ Layer តូច',
    h7: '📝 លំហាត់អនុវត្ត',
    practiceIntro: (
      <p>
        មុននឹងធ្វើ Quiz ចុងក្រោយ សូមព្យាយាមផ្សំចំណេះដឹងទាំង ៦ មេរៀនចូលគ្នាលើ Chart ពិតរបស់អ្នក ៖
      </p>
    ),
    practiceSteps: [
      'បន្ថែម EMA50/SMA50, EMA100/SMA100, EMA200/SMA200 លើ Chart',
      'កត់ត្រា Layer នីមួយៗថា EMA នៅលើ ឬក្រោម SMA — Layer ណាខ្លះស្របគ្នា Bullish/Bearish',
      'ប្រៀបធៀបលទ្ធផលនោះជាមួយ Market Structure (មេរៀនទី ១) — ដូចគ្នាដែរឬទេ?',
      'រកមើល Liquidity Sweep (មេរៀនទី ៥) ដែលនាំឱ្យមាន BOS/CHoCH ថ្មី',
      'រកមើល Order Block ឬ FVG ដែលភ្ជាប់ជាមួយចលនានោះ ហើយមើលថា Price Pullback មកប៉ះ EMA/SMA ដែរឬទេ',
      'កត់ត្រា Confluence ទាំងអស់ដែលរកឃើញ — កាន់តែច្រើន កាន់តែគួរឱ្យទុកចិត្ត',
    ],
    h8: 'Quiz — សាកល្បងចំណេះដឹង',
    quizIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'ហេតុអ្វី EMA ប្រតិកម្មលឿនជាង SMA (រយៈពេលដូចគ្នា)?',
        options: [
          { label: 'EMA ផ្ដល់ទម្ងន់ខ្ពស់ជាងទៅលើ Price ថ្មីៗ', correct: true },
          { label: 'EMA ប្រើ Candle តិចជាង SMA', correct: false },
          { label: 'EMA គណនាតែពេលមាន Volume ខ្ពស់', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! ការផ្ដល់ទម្ងន់ (Weight) ខ្ពស់ទៅលើ Price ថ្មីធ្វើឱ្យ EMA រហ័សជាង SMA។' },
      },
      {
        question: 'EMA50 Cross ឡើងលើ SMA50 (រយៈពេលដូចគ្នា) មានន័យថាអ្វី?',
        options: [
          { label: 'Trend ធំទាំងមូល Reverse 100% ភ្លាមៗ', correct: false },
          { label: 'Momentum ក្នុង Layer 50 ចាប់ផ្ដើមប្ដូរទៅ Bullish', correct: true },
          { label: 'គ្មានន័យអ្វីទាំងអស់', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! EMA Cross ឡើងលើ SMA ដូចគ្នា = Momentum Shift Bullish សម្រាប់ Layer រយៈពេលនោះ។' },
      },
      {
        question: 'EMA50 > SMA50, EMA100 > SMA100, EMA200 > SMA200 ទាំងអស់ ព្រមទាំង Price នៅលើគ្រប់បន្ទាត់ — Structure ទូទៅជាអ្វី?',
        options: [
          { label: 'Full Stack Bullish — Bias ខ្លាំង', correct: true },
          { label: 'Full Stack Bearish', correct: false },
          { label: 'Sideways ពិតប្រាកដ', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! ពេល Layer ទាំង ៣ ស្របBullish ព្រម Price នៅលើគ្រប់បន្ទាត់ — Bias រឹងមាំ។' },
      },
      {
        question: 'Price Pullback មកប៉ះ EMA/SMA ហើយ Reject ត្រឡប់តាមទិស Trend — គេហៅតួនាទីនេះថាអ្វី?',
        options: [
          { label: 'Dynamic Support/Resistance', correct: true },
          { label: 'Liquidity Sweep', correct: false },
          { label: 'Fair Value Gap', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! EMA/SMA ដើរតួជា Support/Resistance ដែលផ្លាស់ទីទៅតាម Price។' },
      },
    ],
  },
  en: {
    feedbackNo: '✗ Not quite — try again.',
    finishLocked: (p, t) => `🔒 Finish lesson (${p}/${t})`,
    finishUnlocked: '✓ Finish lesson',
    intro: (
      <p>
        <strong>EMA (Exponential Moving Average)</strong> and <strong>SMA (Simple Moving Average)</strong> are
        both indicators that plot the average of Price over a set period — the difference is that EMA{' '}
        <strong>gives more weight to recent prices</strong>, making it react faster, while SMA weighs every
        candle equally, making it smoother and slower. This lesson shows you how to{' '}
        <strong>combine EMA and SMA of the same period (50, 100, 200)</strong> to read Bullish/Bearish
        Structure and spot when Momentum is starting to shift.
      </p>
    ),
    easyThink: (
      <p>
        <strong>🧠 Think of it this way:</strong> Imagine SMA as a <strong>friend walking far behind you</strong>{' '}
        — it senses direction slowly. EMA is like a <strong>friend walking close behind you</strong> — when you
        turn, it turns with you almost instantly. When the "close friend" (EMA){' '}
        <strong>starts walking faster than the "far friend" (SMA)</strong>, that's a sign your speed
        (Momentum) is changing — that's the whole idea behind this lesson.
      </p>
    ),
    h1: 'Key Terms to Know Before This Lesson',
    periodLabel: 'Period (Length)',
    periodBody: 'The number of candles EMA/SMA uses to calculate the average — e.g. EMA50 = the last 50 candles (with more weight on the newer ones).',
    crossoverLabel: 'EMA-SMA Pair Crossover',
    crossoverBody: (
      <>
        When the EMA and SMA of the <strong>same period</strong> (e.g. EMA50 vs SMA50) cross each other — a
        Momentum Shift signal for that Layer.
      </>
    ),
    rule1Title: 'EMA + SMA = a helper tool, not a complete signal',
    rule1Body: 'Always combine it with Market Structure and other context — never use it alone',
    h2: '1. EMA/SMA as a Trend Filter',
    trendFilterBody: (
      <p>
        The simplest way to use EMA/SMA is as a <strong>Bias Filter</strong>: Price sitting <strong>above</strong>{' '}
        the line is generally treated as <strong>Bullish Bias</strong>, Price sitting <strong>below</strong>{' '}
        the line is generally treated as <strong>Bearish Bias</strong>. Combine this with Market Structure
        (Lesson 1) to confirm direction further.
      </p>
    ),
    period50Label: '50 (EMA50 / SMA50)',
    period50Body: 'Short-Medium term — tracks short-to-medium term Momentum, reacts fast but is more volatile.',
    period100Label: '100 (EMA100 / SMA100)',
    period100Body: 'Medium term — a good balance between speed and reliability for Swing Trading.',
    period200Label: '200 (EMA200 / SMA200)',
    period200Body: 'Long term — represents the big Trend/Bias; many institutional traders use it as the "dividing line" between a Bull and Bear Market.',
    h3: '2. Combining EMA + SMA of the Same Period — Reading Bull/Bear Structure',
    comboBody: (
      <p>
        The key idea of this lesson: plot <strong>EMA and SMA of the same period</strong> on top of each other
        (EMA50+SMA50, EMA100+SMA100, EMA200+SMA200). Since EMA always reacts faster than SMA, the relationship
        between the two lines tells you the <strong>Momentum</strong> of that period's Layer:
      </p>
    ),
    emaAboveLabel: 'EMA above SMA ⬆',
    emaAboveBody: (
      <>
        Momentum is accelerating toward <strong>Bullish</strong> — recent prices are stronger than the older
        average.
      </>
    ),
    emaBelowLabel: 'EMA below SMA ⬇',
    emaBelowBody: (
      <>
        Momentum is accelerating toward <strong>Bearish</strong> — recent prices are weaker than the older
        average.
      </>
    ),
    fullStackBody: (
      <p>
        <strong>Full Stack Bullish:</strong> EMA50{'>'}SMA50 <em>and</em> EMA100{'>'}SMA100 <em>and</em> EMA200
        {'>'}SMA200 — all 3 Layers align Bullish — the strongest possible Bias. <strong>Full Stack Bearish</strong>{' '}
        is the complete opposite. When Layers don't yet all agree (e.g. EMA50 has already crossed above SMA50,
        but EMA200 is still below SMA200) — this signals that short-term Momentum is starting to shift, but
        the big Trend hasn't confirmed yet, so stay cautious — similar to the idea of CHoCH (Lesson 2), which
        is an early signal, not an immediate full Reversal.
      </p>
    ),
    crossFigCaption: (
      <>
        Left: <strong style={{ color: '#3EC97A' }}>EMA</strong> crosses above{' '}
        <strong style={{ color: '#6FA8FF' }}>the same-period SMA</strong> = Momentum Shift{' '}
        <strong style={{ color: '#3EC97A' }}>Bullish</strong> · Right: EMA crosses below SMA = Momentum Shift{' '}
        <strong style={{ color: '#E05555' }}>Bearish</strong> — Price often comes back to retest the EMA line
        (Dynamic S/R) before continuing its direction
      </>
    ),
    retestLabel: 'Retest EMA',
    quiz1: {
      question: 'EMA100 crosses below SMA100 (same period) — what signal is this?',
      options: [
        { label: 'Momentum Shift Bullish', type: 'no' },
        { label: 'Momentum Shift Bearish for the 100 Layer', type: 'ok' },
        { label: 'Liquidity Sweep', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! EMA crossing below the same-period SMA = Momentum Shift Bearish for that Layer.',
        no: '✗ Crossing below means Momentum is starting to weaken toward Bearish — it is not Bullish, and it is not a Liquidity Sweep.',
      },
    },
    h4: '3. EMA/SMA as Dynamic Support/Resistance',
    dynamicSrBody: (
      <p>
        In a strong Trend, Price often <strong>pulls back to touch the EMA or SMA</strong> before reacting and
        continuing in the Trend's direction — similar to a Retest on an Order Block (Lesson 3), except EMA/SMA
        is a zone that <strong>moves every day</strong>, unlike a fixed OB.
      </p>
    ),
    h5: '4. Step-by-Step: How to Use EMA + SMA',
    steps: [
      'Add EMA and SMA of the same period for all 3 layers — 50, 100, 200 — on the chart',
      'Check every Layer to see whether EMA is above or below its SMA — determine the Momentum for each',
      <>
        Compare it against <strong>Market Structure</strong> (Lesson 1) to see whether all 3 Layers align with
        the Structure.
      </>,
      'If some Layers align and some don\'t yet — treat it as a Transition, not an immediate Full Reversal',
      'Wait for Price to pull back and touch the EMA/SMA and react as Dynamic Support/Resistance before Entry',
    ],
    quiz2: {
      question: 'EMA50 has already crossed above SMA50, but EMA200 is still below SMA200 — how should you interpret this?',
      options: [
        { label: 'The big Trend has fully Reversed 100% immediately', type: 'no' },
        { label: 'Short-term Momentum is starting to shift, but the big Trend hasn\'t confirmed yet — stay cautious', type: 'ok' },
        { label: 'It doesn\'t matter at all', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Smaller Layers can shift before bigger Layers — you need to wait for the bigger Layer (200) to align too before trusting it fully.',
        no: '✗ One Layer shifting doesn\'t yet mean the whole big Trend has Reversed immediately — but it is still important to keep tracking Momentum.',
      },
    },
    h6: '5. Common Beginner Mistakes',
    mistake1: (
      <>
        <strong>Using EMA/SMA alone, without Structure</strong> — it's a Filter/Confluence, not a complete
        strategy on its own.
      </>
    ),
    mistake2: (
      <>
        <strong>Putting too many lines on the chart</strong> — too many EMA/SMA layers clutter the chart and
        make decisions harder.
      </>
    ),
    mistake3: (
      <>
        <strong>Seeing just one EMA/SMA Layer cross and concluding the big Trend has Reversed immediately</strong>{' '}
        — you need to wait for the bigger Layers (especially 200) to align first.
      </>
    ),
    mistake4: (
      <>
        <strong>Entering a trade on every Cross immediately without confirmation</strong> — Crossovers lag and
        can sometimes give False Signals in a Sideways Market.
      </>
    ),
    rule2Title: 'Easy rule to remember',
    rule2Body: 'EMA above SMA (same period) = Momentum Bullish · EMA below SMA = Momentum Bearish · the bigger Layer confirms the smaller Layer',
    h7: '📝 Practice Exercise',
    practiceIntro: (
      <p>
        Before taking the final Quiz, try combining everything you've learned across all 6 lessons on your
        own real chart:
      </p>
    ),
    practiceSteps: [
      'Add EMA50/SMA50, EMA100/SMA100, EMA200/SMA200 to the chart',
      'Note down for each Layer whether EMA is above or below SMA — which Layers align Bullish/Bearish',
      'Compare that result against Market Structure (Lesson 1) — do they match?',
      'Look for a Liquidity Sweep (Lesson 5) that leads to a new BOS/CHoCH',
      'Look for an Order Block or FVG tied to that move, and check whether Price pulled back to touch the EMA/SMA',
      'Note down every Confluence you find — the more you find, the more you can trust it',
    ],
    h8: 'Quiz — Test Your Understanding',
    quizIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Why does EMA react faster than SMA (same period)?',
        options: [
          { label: 'EMA gives more weight to recent prices', correct: true },
          { label: 'EMA uses fewer candles than SMA', correct: false },
          { label: 'EMA only calculates when Volume is high', correct: false },
        ],
        feedback: { ok: '✓ Correct! Giving more weight to recent price makes EMA faster than SMA.' },
      },
      {
        question: 'What does it mean when EMA50 crosses above SMA50 (same period)?',
        options: [
          { label: 'The entire big Trend has Reversed 100% immediately', correct: false },
          { label: 'Momentum in the 50 Layer is starting to shift Bullish', correct: true },
          { label: 'It has no meaning at all', correct: false },
        ],
        feedback: { ok: '✓ Correct! EMA crossing above the same-period SMA = Momentum Shift Bullish for that period\'s Layer.' },
      },
      {
        question: 'EMA50 > SMA50, EMA100 > SMA100, EMA200 > SMA200, all together with Price above every line — what is the overall Structure?',
        options: [
          { label: 'Full Stack Bullish — strong Bias', correct: true },
          { label: 'Full Stack Bearish', correct: false },
          { label: 'True Sideways', correct: false },
        ],
        feedback: { ok: '✓ Correct! When all 3 Layers align Bullish together with Price above every line — the Bias is strong.' },
      },
      {
        question: 'Price pulls back to touch EMA/SMA and rejects back in the Trend\'s direction — what is this role called?',
        options: [
          { label: 'Dynamic Support/Resistance', correct: true },
          { label: 'Liquidity Sweep', correct: false },
          { label: 'Fair Value Gap', correct: false },
        ],
        feedback: { ok: '✓ Correct! EMA/SMA acts as Support/Resistance that moves along with Price.' },
      },
    ],
  },
  zh: {
    feedbackNo: '✗ 不正确，请再试一次。',
    finishLocked: (p, t) => `🔒 完成本课 (${p}/${t})`,
    finishUnlocked: '✓ 完成本课',
    intro: (
      <p>
        <strong>EMA（指数移动平均线）</strong>和 <strong>SMA（简单移动平均线）</strong>都是描绘一段固定周期内
        Price 平均值的指标——区别在于 EMA <strong>对近期价格赋予更高的权重</strong>，因此反应更快；而 SMA 对每根
        Candle 一视同仁，因此更平滑、也更慢。本课将展示如何<strong>把相同周期的 EMA 与 SMA 组合在一起（50、100、
        200）</strong>来解读 Bullish/Bearish Structure，并识别 Momentum 开始转变的时刻。
      </p>
    ),
    easyThink: (
      <p>
        <strong>🧠 简单理解：</strong>把 SMA 想象成<strong>走在你身后很远的朋友</strong>——它感知方向比较慢。EMA
        就像<strong>紧跟在你身后的朋友</strong>——你一转弯，它几乎立刻跟着转。当"近的朋友"（EMA）
        <strong>开始走得比"远的朋友"（SMA）快</strong>，这就说明你的速度（Momentum）正在改变——这正是本课的核心概念。
      </p>
    ),
    h1: '进入本课前要先掌握的关键词',
    periodLabel: 'Period（周期长度）',
    periodBody: 'EMA/SMA 用来计算平均值所用的 Candle 数量——例如 EMA50 = 最近 50 根 Candle（对较新的 Candle 赋予更高权重）。',
    crossoverLabel: 'EMA-SMA 同周期 Crossover',
    crossoverBody: (
      <>
        当<strong>相同周期</strong>的 EMA 与 SMA（例如 EMA50 与 SMA50）相互交叉时——这就是该 Layer 的 Momentum
        Shift 信号。
      </>
    ),
    rule1Title: 'EMA + SMA = 辅助工具，不是完整信号',
    rule1Body: '务必与 Market Structure 及其他背景信息一起使用，不要单独使用',
    h2: '1. EMA/SMA 作为 Trend Filter',
    trendFilterBody: (
      <p>
        使用 EMA/SMA 最简单的方法是作为 <strong>Bias Filter</strong>：Price 位于线<strong>上方</strong>通常视为{' '}
        <strong>Bullish Bias</strong>，Price 位于线<strong>下方</strong>通常视为 <strong>Bearish Bias</strong>。
        搭配 Market Structure（第 1 课）一起使用，可以进一步确认方向。
      </p>
    ),
    period50Label: '50（EMA50 / SMA50）',
    period50Body: 'Short-Medium term（短到中期）——追踪短到中期的 Momentum，反应快但波动也较大。',
    period100Label: '100（EMA100 / SMA100）',
    period100Body: 'Medium term（中期）——在速度与可靠性之间取得良好平衡，适合 Swing Trading。',
    period200Label: '200（EMA200 / SMA200）',
    period200Body: 'Long term（长期）——代表大 Trend/Bias，许多机构交易者将其作为 Bull Market 与 Bear Market 的"分界线"。',
    h3: '2. 组合同周期的 EMA + SMA — 解读 Bull/Bear Structure',
    comboBody: (
      <p>
        本课的核心技巧：把<strong>相同周期的 EMA 与 SMA</strong>叠加在一起绘制（EMA50+SMA50、EMA100+SMA100、
        EMA200+SMA200）。由于 EMA 的反应始终比 SMA 快，两条线之间的关系可以反映出该周期 Layer 的
        <strong>Momentum</strong>：
      </p>
    ),
    emaAboveLabel: 'EMA 在 SMA 上方 ⬆',
    emaAboveBody: (
      <>
        Momentum 正加速转向 <strong>Bullish</strong>——近期价格比旧的平均值更强。
      </>
    ),
    emaBelowLabel: 'EMA 在 SMA 下方 ⬇',
    emaBelowBody: (
      <>
        Momentum 正加速转向 <strong>Bearish</strong>——近期价格比旧的平均值更弱。
      </>
    ),
    fullStackBody: (
      <p>
        <strong>Full Stack Bullish：</strong>EMA50{'>'}SMA50 <em>并且</em> EMA100{'>'}SMA100 <em>并且</em> EMA200
        {'>'}SMA200——三个 Layer 全部一致 Bullish——是最强的 Bias。<strong>Full Stack Bearish</strong> 则完全相反。
        当各 Layer 尚未一致时（例如 EMA50 已经上穿 SMA50，但 EMA200 仍在 SMA200 下方）——这说明短期 Momentum 已开始转变，
        但大 Trend 尚未确认，需要保持谨慎——这与 CHoCH（第 2 课）的概念类似，都是一个早期信号，而非立即发生的完整
        Reversal。
      </p>
    ),
    crossFigCaption: (
      <>
        左侧：<strong style={{ color: '#3EC97A' }}>EMA</strong> 上穿<strong style={{ color: '#6FA8FF' }}>
        同周期 SMA</strong> = Momentum Shift <strong style={{ color: '#3EC97A' }}>Bullish</strong> · 右侧：EMA
        下穿 SMA = Momentum Shift <strong style={{ color: '#E05555' }}>Bearish</strong> ——Price 往往会先回踩
        EMA 线（Dynamic S/R）再延续原方向
      </>
    ),
    retestLabel: 'Retest EMA',
    quiz1: {
      question: 'EMA100 下穿 SMA100（同周期）——这是什么信号？',
      options: [
        { label: 'Momentum Shift Bullish', type: 'no' },
        { label: '100 Layer 的 Momentum Shift Bearish', type: 'ok' },
        { label: 'Liquidity Sweep', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！EMA 下穿同周期 SMA = 该 Layer 的 Momentum Shift Bearish。',
        no: '✗ 下穿意味着 Momentum 开始走弱转向 Bearish，既不是 Bullish，也不是 Liquidity Sweep。',
      },
    },
    h4: '3. EMA/SMA 作为 Dynamic Support/Resistance',
    dynamicSrBody: (
      <p>
        在强 Trend 中，Price 经常会先<strong>回踩 EMA 或 SMA</strong>，然后再反应并延续 Trend 方向——这与
        Order Block（第 3 课）上的 Retest 类似，只是 EMA/SMA 是一个<strong>每天都在移动</strong>的区域，不像
        OB 那样固定不变。
      </p>
    ),
    h5: '4. 如何逐步使用 EMA + SMA',
    steps: [
      '在图表上添加相同周期的 EMA 与 SMA，共 3 组——50、100、200',
      '检查每个 Layer 中 EMA 是在其 SMA 上方还是下方——分别判断各自的 Momentum',
      <>
        与 <strong>Market Structure</strong>（第 1 课）进行比较，看这 3 个 Layer 是否与 Structure 一致。
      </>,
      '如果部分 Layer 一致、部分尚未一致——应视为 Transition（过渡），而不是立即的 Full Reversal',
      '在 Entry 前，等待 Price 回踩 EMA/SMA 并作为 Dynamic Support/Resistance 做出反应',
    ],
    quiz2: {
      question: 'EMA50 已经上穿 SMA50，但 EMA200 仍在 SMA200 下方——应该如何解读？',
      options: [
        { label: '大 Trend 已经立即 100% Reverse', type: 'no' },
        { label: '短期 Momentum 已开始转变，但大 Trend 尚未确认——需保持谨慎', type: 'ok' },
        { label: '完全不重要', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！较小的 Layer 可能先于较大的 Layer 转变——需要等待较大的 Layer（200）也一致后，才能完全信任这个信号。',
        no: '✗ 单个 Layer 的转变还不代表整个大 Trend 已立即 Reverse——但持续追踪 Momentum 仍然很重要。',
      },
    },
    h6: '5. 新手常犯的错误',
    mistake1: (
      <>
        <strong>脱离 Structure 单独使用 EMA/SMA</strong>——它是一个 Filter/Confluence，而不是一套完整的策略。
      </>
    ),
    mistake2: (
      <>
        <strong>在图表上叠加过多线条</strong>——过多的 EMA/SMA 层会让图表变得混乱，难以做决策。
      </>
    ),
    mistake3: (
      <>
        <strong>只看到一个 EMA/SMA Layer 交叉，就断定大 Trend 已立即 Reverse</strong>——需要先等待较大的 Layer
        （尤其是 200）也一致。
      </>
    ),
    mistake4: (
      <>
        <strong>没有确认就在每次 Cross 时立即进场</strong>——Crossover 存在滞后，在 Sideways 行情中有时会产生
        False Signal。
      </>
    ),
    rule2Title: '简单好记的规则',
    rule2Body: 'EMA 在 SMA（同周期）上方 = Momentum Bullish · EMA 在 SMA 下方 = Momentum Bearish · 大 Layer 确认小 Layer',
    h7: '📝 实践练习',
    practiceIntro: (
      <p>在做最终 Quiz 之前，请尝试在你自己的真实图表上，把前面 6 课学到的内容综合运用一遍：</p>
    ),
    practiceSteps: [
      '在图表上添加 EMA50/SMA50、EMA100/SMA100、EMA200/SMA200',
      '记录每个 Layer 中 EMA 是在 SMA 上方还是下方——哪些 Layer 一致偏 Bullish/Bearish',
      '把这个结果与 Market Structure（第 1 课）进行比较——是否一致？',
      '寻找导致新的 BOS/CHoCH 出现的 Liquidity Sweep（第 5 课）',
      '寻找与该走势相关的 Order Block 或 FVG，并观察 Price 是否回踩了 EMA/SMA',
      '记录所有找到的 Confluence——找到的越多，可信度越高',
    ],
    h8: 'Quiz — 检测你的理解',
    quizIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: '为什么 EMA 的反应比 SMA（同周期）更快？',
        options: [
          { label: 'EMA 对近期价格赋予更高的权重', correct: true },
          { label: 'EMA 使用的 Candle 比 SMA 少', correct: false },
          { label: 'EMA 只在 Volume 高时才计算', correct: false },
        ],
        feedback: { ok: '✓ 正确！对近期价格赋予更高权重，使 EMA 比 SMA 反应更快。' },
      },
      {
        question: 'EMA50 上穿 SMA50（同周期）意味着什么？',
        options: [
          { label: '整个大 Trend 已立即 100% Reverse', correct: false },
          { label: '50 Layer 的 Momentum 开始转向 Bullish', correct: true },
          { label: '完全没有意义', correct: false },
        ],
        feedback: { ok: '✓ 正确！EMA 上穿同周期 SMA = 该周期 Layer 的 Momentum Shift Bullish。' },
      },
      {
        question: 'EMA50 > SMA50、EMA100 > SMA100、EMA200 > SMA200 全部成立，且 Price 位于所有线上方——整体 Structure 是什么？',
        options: [
          { label: 'Full Stack Bullish — 强 Bias', correct: true },
          { label: 'Full Stack Bearish', correct: false },
          { label: '真正的 Sideways', correct: false },
        ],
        feedback: { ok: '✓ 正确！当 3 个 Layer 全部一致 Bullish 且 Price 位于所有线上方时——Bias 非常强。' },
      },
      {
        question: 'Price 回踩 EMA/SMA 后 Reject 并沿 Trend 方向反转——这个角色叫什么？',
        options: [
          { label: 'Dynamic Support/Resistance', correct: true },
          { label: 'Liquidity Sweep', correct: false },
          { label: 'Fair Value Gap', correct: false },
        ],
        feedback: { ok: '✓ 正确！EMA/SMA 起到了随 Price 移动的 Support/Resistance 的作用。' },
      },
    ],
  },
};

export default function Lesson6({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: q.feedback.ok, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="l6"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      {t.intro}

      <Box variant="g">{t.easyThink}</Box>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.periodLabel}>
          {t.periodBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.crossoverLabel}>
          {t.crossoverBody}
        </GridItem>
      </div>

      <Rule title={t.rule1Title}>{t.rule1Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="u">{t.trendFilterBody}</Box>

      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.period50Label}>
          {t.period50Body}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.period100Label}>
          {t.period100Body}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.period200Label}>
          {t.period200Body}
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="b">{t.comboBody}</Box>

      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.emaAboveLabel}>
          {t.emaAboveBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.emaBelowLabel}>
          {t.emaBelowBody}
        </GridItem>
      </div>

      <Box variant="g">{t.fullStackBody}</Box>

      <AnimatedFig caption={t.crossFigCaption}>
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">EMA CROSS ABOVE SMA — BULLISH</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">EMA CROSS BELOW SMA — BEARISH</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <path d="M20,120 C100,132 200,126 330,108" fill="none" stroke="#6FA8FF" strokeWidth="1.6" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="30" y="132" fontSize="9" fill="#6FA8FF" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>SMA</text>
          <path d="M20,152 C80,142 130,124 152,121 C220,92 280,72 330,55" fill="none" stroke="#3EC97A" strokeWidth="2" className="ac" style={{ animationDelay: '.25s' }} />
          <text x="30" y="165" fontSize="9" fill="#3EC97A" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>EMA</text>
          <circle cx="152" cy="121" r="4.5" fill="#0C0C0F" stroke="#3EC97A" strokeWidth="2" className="ac" style={{ animationDelay: '.4s' }} />
          <text x="152" y="140" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Cross ↑</text>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="260" y1="60" x2="260" y2="95" stroke="#3EC97A" strokeWidth="1.3" /><rect x="254" y="66" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <text x="260" y="108" textAnchor="middle" fontSize="9" fill="#6FA8FF" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.6s' }}>{t.retestLabel}</text>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="300" y1="35" x2="300" y2="65" stroke="#3EC97A" strokeWidth="1.3" /><rect x="294" y="38" width="12" height="20" rx="1" fill="#3EC97A" /></g>

          <path d="M370,90 C450,84 550,90 680,102" fill="none" stroke="#6FA8FF" strokeWidth="1.6" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="380" y="80" fontSize="9" fill="#6FA8FF" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>SMA</text>
          <path d="M370,60 C420,70 470,88 500,90 C560,120 620,142 680,158" fill="none" stroke="#E05555" strokeWidth="2" className="ac" style={{ animationDelay: '.25s' }} />
          <text x="380" y="52" fontSize="9" fill="#E05555" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>EMA</text>
          <circle cx="500" cy="90" r="4.5" fill="#0C0C0F" stroke="#E05555" strokeWidth="2" className="ac" style={{ animationDelay: '.4s' }} />
          <text x="500" y="75" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Cross ↓</text>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="600" y1="118" x2="600" y2="148" stroke="#E05555" strokeWidth="1.3" /><rect x="594" y="122" width="12" height="20" rx="1" fill="#E05555" /></g>
          <text x="600" y="160" textAnchor="middle" fontSize="9" fill="#6FA8FF" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.6s' }}>{t.retestLabel}</text>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="640" y1="148" x2="640" y2="178" stroke="#E05555" strokeWidth="1.3" /><rect x="634" y="152" width="12" height="20" rx="1" fill="#E05555" /></g>
        </svg>
      </AnimatedFig>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Box variant="b">{t.dynamicSrBody}</Box>

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Steps items={t.steps} />

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="d">
        <ul>
          <li>{t.mistake1}</li>
          <li>{t.mistake2}</li>
          <li>{t.mistake3}</li>
          <li>{t.mistake4}</li>
        </ul>
      </Box>
      <Rule title={t.rule2Title}>{t.rule2Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <Box variant="g">
        {t.practiceIntro}
        <Steps items={t.practiceSteps} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.h8}
      </h3>
      <p>{t.quizIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
