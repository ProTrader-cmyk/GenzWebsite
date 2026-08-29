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

const meta = getLessonMeta('l4');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagram) stays identical across languages — only this
// content swaps. Trading terms (FVG, Imbalance, Bullish/Bearish FVG, Fill,
// Order Block, etc.) are kept in English in every language since that's the
// universal jargon traders use, in Khmer-language trading communities too.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>FVG (Fair Value Gap)</strong> គឺជា <strong>Imbalance</strong> ដែលអាចមើលឃើញតាមរយៈ Pattern នៃ{' '}
        <strong>3 Candles</strong>។ នៅពេល Price move ខ្លាំង មានតំបន់មួយដែលការជួញដូររវាង Wick របស់ Candle ទី 1 និង
        Candle ទី 3 មិន overlap គ្នា។ Trader ប្រើតំបន់នេះដើម្បីសិក្សាថា Price អាចត្រឡប់មក Fill ឬ React នៅទីនោះ។
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Price ដូចជាមនុស្សដើររហ័សពេក រហូតលោត <strong>រំលងជណ្ដើរខ្លះ</strong>{' '}
        (Candle ២ ដែលនៅចន្លោះ ១ និង ៣) ។ ចន្លោះដែលលោតរំលងនោះហៅថា <strong>Imbalance</strong> — ជាតំបន់ដែល
        "មិនទាន់មានការជួញដូរស្មើគ្នា" ហើយពេលខ្លះ Price នឹងវិលត្រឡប់មកបំពេញ (Fill) ចន្លោះនោះនៅពេលក្រោយ។
      </p>
    ),
    h1: 'ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន',
    imbalanceLabel: 'Imbalance',
    imbalanceBody: 'តំបន់ Price ដែលមិនមាន Buyer/Seller ស្មើគ្នាគ្រប់គ្រាន់ (ព្រោះ Price រុញលឿនពេក) — FVG ជាវិធីមួយសម្គាល់តំបន់នេះ ។',
    fillLabel: 'Fill',
    fillBody: 'ពេល Price ត្រឡប់មកដើរកាត់ (ឬពេញ) តំបន់ FVG ម្ដងទៀត — Fill មិនមែនន័យថា Price ត្រូវឈប់ត្រង់នោះទេ វាគ្រាន់តែជាព្រឹត្តិការណ៍មួយ ។',
    rule1Title: 'FVG = Imbalance មិនមែន Guaranteed Entry',
    rule1Body: 'ត្រូវមើល FVG ជាមួយ Structure, Displacement និង Context',
    h2: '១. Bullish FVG',
    bullishDef: (
      <p>
        ក្នុង <strong>Bullish FVG</strong> មាន Strong Bullish Move ហើយ{' '}
        <strong>Low របស់ Candle ទី 3 នៅខ្ពស់ជាង High របស់ Candle ទី 1</strong>។ ចន្លោះរវាងកម្រិតទាំងពីរនេះគឺ FVG
        Zone។
      </p>
    ),
    bullishFvgLabel: 'Bullish FVG ⬆',
    bullishFvgBody: (
      <>
        Candle 1 High {'<'} Candle 3 Low → មានចន្លោះ (Gap/Imbalance) នៅចន្លោះទាំងពីរនេះ ។
      </>
    ),
    watchLabel: 'គួរសង្កេតអ្វី',
    watchBody: 'បើ Price ត្រឡប់ចូលទៅក្នុង FVG វិញ សូមសង្កេត Reaction និង Structure ជុំវិញ — កុំសន្និដ្ឋានថា Buy ដោយស្វ័យប្រវត្តិ ។',
    h3: '២. Bearish FVG',
    bearishDef: (
      <p>
        ក្នុង <strong>Bearish FVG</strong> មាន Strong Bearish Move ហើយ{' '}
        <strong>High របស់ Candle ទី 3 នៅទាបជាង Low របស់ Candle ទី 1</strong>។ ចន្លោះរវាងកម្រិតទាំងពីរគឺ Bearish FVG
        Zone។
      </p>
    ),
    bearishFvgLabel: 'Bearish FVG ⬇',
    bearishFvgBody: (
      <>
        Candle 1 Low {'>'} Candle 3 High → មានចន្លោះ (Gap/Imbalance) នៅចន្លោះទាំងពីរនេះ ។
      </>
    ),
    keyPointLabel: 'ចំណុចសំខាន់',
    keyPointBody: 'ការត្រឡប់មកកាន់ Gap អាចប្រាប់ព័ត៌មានអំពី Price Reaction ប៉ុន្តែមិនមែនជា Guarantee ថានឹង Reverse ឬអាច Entry បានទេ — ត្រូវរង់ចាំ Confirmation ។',
    figCaption: (
      <>
        ខាងឆ្វេង៖ Low របស់ Candle 3 <strong style={{ color: '#3EC97A' }}>ខ្ពស់ជាង</strong> High របស់ Candle 1 =
        Bullish FVG · ខាងស្ដាំ៖ High របស់ Candle 3 <strong style={{ color: '#E05555' }}>ទាបជាង</strong> Low
        របស់ Candle 1 = Bearish FVG — តំបន់ចាំង (Shaded) ជា Gap Zone
      </>
    ),
    quiz1: {
      question: 'Candle 1 High = 2,000 · Candle 3 Low = 2,010 (Gold XAUUSD) — តើនេះជា FVG ប្រភេទណា?',
      options: [
        { label: 'Bullish FVG', type: 'ok' },
        { label: 'Bearish FVG', type: 'no' },
        { label: 'មិនមែន FVG ទេ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Candle 3 Low (2,010) ខ្ពស់ជាង Candle 1 High (2,000) = Bullish FVG។',
        no: '✗ Candle 3 Low ខ្ពស់ជាង Candle 1 High = Bullish FVG (មិនមែន Bearish ឬអត់មាន Gap ទេ)។',
      },
    },
    h4: '៣. របៀបសម្គាល់ FVG ជាជំហានៗ',
    steps1: [
      <>
        រកមើល <strong>3-Candle Pattern</strong>។
      </>,
      'កំណត់ Candle ទី 1 និង Candle ទី 3 ដែលមាន Wick មិន Overlap តាម Direction របស់ Move។',
      <>
        Mark ចន្លោះរវាង Levels ទាំងពីរជា <strong>FVG Zone</strong>។
      </>,
      <>
        ពិនិត្យ <strong>Structure + Displacement + Context</strong> មុនពេលប្រើ FVG។
      </>,
      'បើ Price ត្រឡប់មក Zone សូមរង់ចាំ Reaction/Confirmation មុន Entry។',
    ],
    h5: '៤. FVG vs Order Block',
    obLabel: 'Order Block',
    obBody: (
      <>
        <strong>Zone</strong> ដែលភ្ជាប់ទៅនឹង Candle/Area មុន Strong Displacement និង Structure Context។
      </>
    ),
    fvgLabel: 'FVG',
    fvgBody: (
      <>
        <strong>Imbalance</strong> ដែលសម្គាល់តាម 3-Candle relationship និង Non-overlap តាម Direction របស់ Move។
      </>
    ),
    comboBox: (
      <p>
        <strong>អាចប្រើជាមួយគ្នា:</strong> បើ OB និង FVG មាន Context ដូចគ្នា ហើយស្ថិតនៅកន្លែងដែលសមហេតុផលតាម
        Structure នោះវាអាចជួយឱ្យ Analysis មាន Confluence បន្ថែម។ តែ Confluence មិនមែន Guarantee ទេ។
      </p>
    ),
    h6: '៥. កំហុស Beginner',
    mistakeLi1: (
      <>
        <strong>ឃើញ Gap តូចៗគ្រប់កន្លែង ហើយហៅថា FVG ដោយមិនពិនិត្យ 3-Candle Structure</strong> — ត្រូវផ្ទៀងផ្ទាត់
        Wick របស់ Candle 1 និង 3 ថាពិតជាមិន Overlap មែន មិនមែនគ្រាន់តែមើលដោយភ្នែក។
      </>
    ),
    mistakeLi2: (
      <>
        <strong>គិតថា FVG ត្រូវ Fill 100% រាល់ពេល</strong> — FVG ជាច្រើនអាចមិនត្រូវបាន Fill ភ្លាមៗ ឬមិន Fill ទាំង
        ស្រុងក៏មាន Price អាចបន្តទៅមុខដោយមិនវិលមកវិញ។
      </>
    ),
    mistakeLi3: (
      <>
        <strong>ចូល Trade ដោយគ្មាន Structure និង Confirmation</strong> — FVG តែឯង មិនគ្រប់គ្រាន់ជា Signal ត្រូវ
        ផ្សំជាមួយ Market Structure និង Order Block ។
      </>
    ),
    mistakeLi4: (
      <>
        <strong>ប្រើ FVG ដាច់ដោយឡែកពី Market Context</strong> — FVG ក្នុងទិស Trend មានតម្លៃខ្ពស់ជាង FVG ដែលផ្ទុយ
        ពី Trend ធំ។
      </>
    ),
    rule2Title: 'ច្បាប់ងាយចាំ',
    rule2Body: '3 Candles → Find Imbalance → Mark FVG → Check Context → Wait for Reaction',
    h7: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'មុននឹងធ្វើ Quiz ខាងក្រោម សូមព្យាយាមផ្សំចំណេះដឹងទាំង ៤ មេរៀនចូលគ្នាលើ Chart ពិតរបស់អ្នក ៖',
    steps2: [
      'កំណត់ Market Structure (មេរៀនទី ១) — Bullish, Bearish ឬ Sideways',
      'រកមើល BOS/CHoCH (មេរៀនទី ២) ថ្មីៗនៅលើ Chart',
      'រកមើល Order Block (មេរៀនទី ៣) ដែលភ្ជាប់ជាមួយ Displacement នោះ',
      'រកមើល FVG ដែលកើតឡើងក្នុងចលនាដដែល — សង្កេតថាតើវាស្ថិតក្នុង/ជិត Order Block ដែរឬអត់',
      'កត់ត្រា Zone ទាំងអស់ ហើយប្រៀបធៀបជាមួយវីដេអូក្នុងមេរៀន ដើម្បីត្រួតពិនិត្យខ្លួនឯង',
    ],
    h8: 'Quiz — សាកល្បងចំណេះដឹង',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'FVG ត្រូវបានសម្គាល់ជាទូទៅតាមអ្វី?',
        options: [
          { label: '3-Candle relationship ដែលបង្កើត Imbalance', correct: true },
          { label: 'Candle តែមួយ', correct: false },
          { label: 'RSI តែមួយ', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! FVG គឺ 3-Candle Imbalance concept។' },
      },
      {
        question: 'Bullish FVG កើតឡើងនៅពេលណា?',
        options: [
          { label: 'Candle 3 Low ខ្ពស់ជាង Candle 1 High', correct: true },
          { label: 'Candle 3 High ទាបជាង Candle 1 Low', correct: false },
          { label: 'Candle 1 និង 3 ត្រូវតែមានពណ៌ដូចគ្នា', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ!' },
      },
      {
        question: 'តើ FVG ត្រូវ Fill 100% រាល់ពេលឬទេ?',
        options: [
          { label: 'បាទ/ចាស 100%', correct: false },
          { label: 'ទេ វាមិនមែនជា Guarantee ទេ', correct: true },
          { label: 'តែពេល Market Sideways', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! FVG គឺជា Zone សម្រាប់ Analysis មិនមែនការធានា។' },
      },
      {
        question: 'អ្វីជាវិធីល្អសម្រាប់ប្រើ FVG?',
        options: [
          { label: 'ចូល Trade ភ្លាមៗពេលឃើញ FVG', correct: false },
          { label: 'ពិនិត្យ Structure + Displacement + Context និងរង់ចាំ Reaction', correct: true },
          { label: 'ប្រើ FVG ដោយមិនចាំបាច់មើល Trend', correct: false },
        ],
        feedback: { ok: '✓ ត្រឹមត្រូវ! Context ជាផ្នែកសំខាន់នៃ Analysis។' },
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
        <strong>FVG (Fair Value Gap)</strong> is an <strong>Imbalance</strong> that can be spotted through a{' '}
        <strong>3-Candle</strong> pattern. When price moves strongly, there's a zone where the wicks of Candle
        1 and Candle 3 don't overlap. Traders use this zone to study whether price might come back to Fill it
        or React there.
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 Simple way to think about it:</strong> Imagine price is like a person walking so fast they
        end up <strong>skipping a step</strong> (Candle 2, sitting between Candle 1 and Candle 3). The gap
        they skip over is called <strong>Imbalance</strong> — a zone where "trading hasn't happened evenly
        yet," and sometimes price will come back later to fill (Fill) that gap.
      </p>
    ),
    h1: 'Key Terms to Know Before This Lesson',
    imbalanceLabel: 'Imbalance',
    imbalanceBody: "A price zone where Buyers and Sellers weren't evenly matched (because price pushed too fast) — FVG is one way to mark this zone.",
    fillLabel: 'Fill',
    fillBody: "When price comes back and trades through (or fills) the FVG zone again — Fill doesn't mean price has to stop right there, it's just an event that happens.",
    rule1Title: 'FVG = Imbalance, Not a Guaranteed Entry',
    rule1Body: 'Always read FVG together with Structure, Displacement, and Context',
    h2: '1. Bullish FVG',
    bullishDef: (
      <p>
        In a <strong>Bullish FVG</strong> there's a Strong Bullish Move, and{' '}
        <strong>Candle 3's Low is higher than Candle 1's High</strong>. The gap between these two levels is
        the FVG Zone.
      </p>
    ),
    bullishFvgLabel: 'Bullish FVG ⬆',
    bullishFvgBody: (
      <>
        Candle 1 High {'<'} Candle 3 Low → there's a gap (Gap/Imbalance) between these two levels.
      </>
    ),
    watchLabel: 'What to Watch For',
    watchBody: "If price comes back into the FVG, watch the Reaction and the Structure around it — don't automatically assume it's a Buy.",
    h3: '2. Bearish FVG',
    bearishDef: (
      <p>
        In a <strong>Bearish FVG</strong> there's a Strong Bearish Move, and{' '}
        <strong>Candle 3's High is lower than Candle 1's Low</strong>. The gap between these two levels is the
        Bearish FVG Zone.
      </p>
    ),
    bearishFvgLabel: 'Bearish FVG ⬇',
    bearishFvgBody: (
      <>
        Candle 1 Low {'>'} Candle 3 High → there's a gap (Gap/Imbalance) between these two levels.
      </>
    ),
    keyPointLabel: 'Key Point',
    keyPointBody: "Price coming back to the Gap can give information about a Price Reaction, but it's not a Guarantee that it will Reverse or that you can Entry there — wait for Confirmation.",
    figCaption: (
      <>
        Left: Candle 3's Low is <strong style={{ color: '#3EC97A' }}>higher than</strong> Candle 1's High =
        Bullish FVG · Right: Candle 3's High is <strong style={{ color: '#E05555' }}>lower than</strong>{' '}
        Candle 1's Low = Bearish FVG — the shaded zone is the Gap Zone
      </>
    ),
    quiz1: {
      question: 'Candle 1 High = 2,000 · Candle 3 Low = 2,010 (Gold XAUUSD) — what type of FVG is this?',
      options: [
        { label: 'Bullish FVG', type: 'ok' },
        { label: 'Bearish FVG', type: 'no' },
        { label: 'Not an FVG', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Candle 3 Low (2,010) is higher than Candle 1 High (2,000) = Bullish FVG.',
        no: '✗ Candle 3 Low higher than Candle 1 High = Bullish FVG (not Bearish, and it does have a Gap).',
      },
    },
    h4: '3. How to Identify FVG Step by Step',
    steps1: [
      <>
        Look for a <strong>3-Candle Pattern</strong>.
      </>,
      "Identify Candle 1 and Candle 3 whose wicks don't overlap, in the direction of the move.",
      <>
        Mark the gap between the two levels as the <strong>FVG Zone</strong>.
      </>,
      <>
        Check <strong>Structure + Displacement + Context</strong> before using the FVG.
      </>,
      'If price returns to the Zone, wait for a Reaction/Confirmation before Entry.',
    ],
    h5: '4. FVG vs Order Block',
    obLabel: 'Order Block',
    obBody: (
      <>
        A <strong>Zone</strong> tied to the Candle/Area right before a Strong Displacement, within a Structure
        Context.
      </>
    ),
    fvgLabel: 'FVG',
    fvgBody: (
      <>
        An <strong>Imbalance</strong> identified through a 3-Candle relationship and Non-overlap in the
        direction of the move.
      </>
    ),
    comboBox: (
      <p>
        <strong>Can be used together:</strong> If OB and FVG share the same Context and sit in a place that
        makes sense within the Structure, they can add extra Confluence to your Analysis. But Confluence is
        not a Guarantee.
      </p>
    ),
    h6: '5. Common Beginner Mistakes',
    mistakeLi1: (
      <>
        <strong>Seeing tiny gaps everywhere and calling them FVG without checking the 3-Candle Structure</strong>{' '}
        — you need to verify that Candle 1 and Candle 3's wicks truly don't overlap, not just eyeball it.
      </>
    ),
    mistakeLi2: (
      <>
        <strong>Thinking FVG must always be Filled 100% of the time</strong> — many FVGs never get Filled
        right away, or don't get Filled completely at all; price can just keep moving forward without ever
        returning.
      </>
    ),
    mistakeLi3: (
      <>
        <strong>Entering a Trade without Structure and Confirmation</strong> — FVG alone is not enough of a
        Signal; it needs to be combined with Market Structure and Order Block.
      </>
    ),
    mistakeLi4: (
      <>
        <strong>Using FVG in isolation from the Market Context</strong> — an FVG in the direction of the Trend
        is much more valuable than an FVG that goes against the bigger Trend.
      </>
    ),
    rule2Title: 'Easy Rule to Remember',
    rule2Body: '3 Candles → Find Imbalance → Mark FVG → Check Context → Wait for Reaction',
    h7: '📝 Practice Exercise',
    practiceIntro: "Before doing the Quiz below, try combining what you've learned across all 4 lessons on your own real chart:",
    steps2: [
      'Identify the Market Structure (Lesson 1) — Bullish, Bearish, or Sideways',
      'Find a recent BOS/CHoCH (Lesson 2) on the chart',
      'Find the Order Block (Lesson 3) linked to that Displacement',
      'Find the FVG that formed within that same move — check whether it sits inside/near the Order Block',
      'Note down all the Zones and compare them with the lesson videos to check yourself',
    ],
    h8: 'Quiz — Test Your Understanding',
    finalTestIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'What is FVG generally identified by?',
        options: [
          { label: 'A 3-Candle relationship that creates an Imbalance', correct: true },
          { label: 'A single Candle', correct: false },
          { label: 'A single RSI reading', correct: false },
        ],
        feedback: { ok: '✓ Correct! FVG is a 3-Candle Imbalance concept.' },
      },
      {
        question: 'When does a Bullish FVG occur?',
        options: [
          { label: 'When Candle 3 Low is higher than Candle 1 High', correct: true },
          { label: 'When Candle 3 High is lower than Candle 1 Low', correct: false },
          { label: 'When Candle 1 and 3 must be the same color', correct: false },
        ],
        feedback: { ok: '✓ Correct!' },
      },
      {
        question: 'Does FVG have to be Filled 100% of the time?',
        options: [
          { label: 'Yes, always 100%', correct: false },
          { label: "No, it's not a Guarantee", correct: true },
          { label: 'Only when the Market is Sideways', correct: false },
        ],
        feedback: { ok: '✓ Correct! FVG is a Zone for Analysis, not a guarantee.' },
      },
      {
        question: 'What is a good way to use FVG?',
        options: [
          { label: 'Enter a Trade immediately when you see an FVG', correct: false },
          { label: 'Check Structure + Displacement + Context and wait for a Reaction', correct: true },
          { label: 'Use FVG without needing to look at the Trend', correct: false },
        ],
        feedback: { ok: '✓ Correct! Context is an important part of the Analysis.' },
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
        <strong>FVG（Fair Value Gap，公允价值缺口）</strong>是一种可以通过<strong>3根蜡烛</strong>的形态识别出来的{' '}
        <strong>Imbalance（失衡）</strong>。当价格强势移动时，会出现一个区域，使得第 1 根和第 3 根蜡烛的影线
        （Wick）之间不发生 overlap（重叠）。交易者利用这个区域来研究价格是否可能回来 Fill（填补）或在那里
        React（反应）。
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 简单理解：</strong>想象价格就像一个人走得太快，以至于<strong>跳过了一级台阶</strong>
        （夹在第1根和第3根之间的第2根蜡烛）。被跳过的那段空隙就叫做 <strong>Imbalance</strong>——一个
        "交易还没有均衡发生"的区域，价格有时会在之后回来填补（Fill）这段空隙。
      </p>
    ),
    h1: '进入本课前需要记住的关键词',
    imbalanceLabel: 'Imbalance',
    imbalanceBody: '价格没有充分实现 Buyer/Seller 均衡的区域（因为价格推进得太快）——FVG 是标记这个区域的一种方式。',
    fillLabel: 'Fill',
    fillBody: '当价格再次回来穿过（或填满）FVG 区域时——Fill 并不意味着价格必须在那里停下，它只是一个会发生的事件。',
    rule1Title: 'FVG = Imbalance，并非保证进场信号',
    rule1Body: '必须结合 Structure、Displacement 和 Context 一起看 FVG',
    h2: '1. Bullish FVG',
    bullishDef: (
      <p>
        在 <strong>Bullish FVG</strong> 中会出现 Strong Bullish Move（强势上涨），并且{' '}
        <strong>第 3 根蜡烛的 Low 高于第 1 根蜡烛的 High</strong>。这两个价位之间的空隙就是 FVG Zone。
      </p>
    ),
    bullishFvgLabel: 'Bullish FVG ⬆',
    bullishFvgBody: (
      <>
        Candle 1 High {'<'} Candle 3 Low → 这两个价位之间存在空隙（Gap/Imbalance）。
      </>
    ),
    watchLabel: '需要注意什么',
    watchBody: '如果价格回到 FVG 内部，请观察周围的 Reaction 和 Structure——不要自动认定就该 Buy。',
    h3: '2. Bearish FVG',
    bearishDef: (
      <p>
        在 <strong>Bearish FVG</strong> 中会出现 Strong Bearish Move（强势下跌），并且{' '}
        <strong>第 3 根蜡烛的 High 低于第 1 根蜡烛的 Low</strong>。这两个价位之间的空隙就是 Bearish FVG Zone。
      </p>
    ),
    bearishFvgLabel: 'Bearish FVG ⬇',
    bearishFvgBody: (
      <>
        Candle 1 Low {'>'} Candle 3 High → 这两个价位之间存在空隙（Gap/Imbalance）。
      </>
    ),
    keyPointLabel: '重点',
    keyPointBody: '价格回到 Gap 可以提供关于 Price Reaction 的信息，但并不能保证一定会 Reverse 或可以 Entry——必须等待 Confirmation。',
    figCaption: (
      <>
        左图：第 3 根蜡烛的 Low <strong style={{ color: '#3EC97A' }}>高于</strong>第 1 根蜡烛的 High = Bullish
        FVG · 右图：第 3 根蜡烛的 High <strong style={{ color: '#E05555' }}>低于</strong>第 1 根蜡烛的 Low =
        Bearish FVG — 阴影区域（Shaded）即为 Gap Zone
      </>
    ),
    quiz1: {
      question: 'Candle 1 High = 2,000 · Candle 3 Low = 2,010（Gold XAUUSD）——这属于哪一种 FVG？',
      options: [
        { label: 'Bullish FVG', type: 'ok' },
        { label: 'Bearish FVG', type: 'no' },
        { label: '不是 FVG', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Candle 3 Low (2,010) 高于 Candle 1 High (2,000) = Bullish FVG。',
        no: '✗ Candle 3 Low 高于 Candle 1 High = Bullish FVG（不是 Bearish，而且确实存在 Gap）。',
      },
    },
    h4: '3. 逐步识别 FVG 的方法',
    steps1: [
      <>
        寻找 <strong>3-Candle Pattern</strong>（三根蜡烛形态）。
      </>,
      '确定 Candle 1 和 Candle 3，它们的 Wick 沿着 Move 的方向不发生 Overlap（重叠）。',
      <>
        将这两个价位之间的空隙标记为 <strong>FVG Zone</strong>。
      </>,
      <>
        在使用 FVG 之前，先检查 <strong>Structure + Displacement + Context</strong>。
      </>,
      '如果价格回到该 Zone，请在 Entry 之前等待 Reaction/Confirmation。',
    ],
    h5: '4. FVG 与 Order Block 的对比',
    obLabel: 'Order Block',
    obBody: (
      <>
        与 Strong Displacement 之前的 Candle/Area 相关联的一个 <strong>Zone</strong>，并结合 Structure
        Context。
      </>
    ),
    fvgLabel: 'FVG',
    fvgBody: (
      <>
        通过 3-Candle relationship 和沿 Move 方向的 Non-overlap 来识别的 <strong>Imbalance</strong>。
      </>
    ),
    comboBox: (
      <p>
        <strong>可以一起使用：</strong>如果 OB 和 FVG 具有相同的 Context，并且位于符合 Structure 逻辑的位置，
        那么它们可以为 Analysis 增加额外的 Confluence。但 Confluence 并不是 Guarantee。
      </p>
    ),
    h6: '5. 新手常见错误',
    mistakeLi1: (
      <>
        <strong>看到到处都是小 Gap 就称之为 FVG，而不检查 3-Candle Structure</strong>
        ——必须验证第 1 根和第 3 根蜡烛的 Wick 是否真的不 Overlap，而不是仅凭肉眼判断。
      </>
    ),
    mistakeLi2: (
      <>
        <strong>认为 FVG 每次都一定会被 100% Fill</strong>
        ——很多 FVG 并不会马上被 Fill，甚至根本不会完全被 Fill，价格完全可能一路前进而不再回来。
      </>
    ),
    mistakeLi3: (
      <>
        <strong>在没有 Structure 和 Confirmation 的情况下就进场 Trade</strong>
        ——单独的 FVG 不足以构成 Signal，必须结合 Market Structure 和 Order Block。
      </>
    ),
    mistakeLi4: (
      <>
        <strong>脱离 Market Context 单独使用 FVG</strong>
        ——顺着 Trend 方向的 FVG，其价值远高于逆着大 Trend 方向的 FVG。
      </>
    ),
    rule2Title: '好记的规则',
    rule2Body: '3 Candles → Find Imbalance → Mark FVG → Check Context → Wait for Reaction',
    h7: '📝 实践练习',
    practiceIntro: '在做下面的 Quiz 之前，请尝试把这 4 课学到的内容结合起来，运用到你自己的真实 Chart 上：',
    steps2: [
      '判断 Market Structure（第 1 课）——Bullish、Bearish 还是 Sideways',
      '在 Chart 上寻找最近的 BOS/CHoCH（第 2 课）',
      '寻找与该 Displacement 相关联的 Order Block（第 3 课）',
      '寻找同一波行情中出现的 FVG——观察它是否位于/靠近 Order Block',
      '记录所有 Zone，并与课程中的视频进行对比，自我检查',
    ],
    h8: 'Quiz — 知识测验',
    finalTestIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'FVG 通常是通过什么来识别的？',
        options: [
          { label: '形成 Imbalance 的 3-Candle relationship', correct: true },
          { label: '单独一根 Candle', correct: false },
          { label: '单独的 RSI', correct: false },
        ],
        feedback: { ok: '✓ 正确！FVG 是一个 3-Candle Imbalance 概念。' },
      },
      {
        question: 'Bullish FVG 什么时候出现？',
        options: [
          { label: '当 Candle 3 的 Low 高于 Candle 1 的 High 时', correct: true },
          { label: '当 Candle 3 的 High 低于 Candle 1 的 Low 时', correct: false },
          { label: '当 Candle 1 和 3 必须是相同颜色时', correct: false },
        ],
        feedback: { ok: '✓ 正确！' },
      },
      {
        question: 'FVG 是否每次都必须被 100% Fill？',
        options: [
          { label: '是的，每次都是 100%', correct: false },
          { label: '不是，这不是 Guarantee', correct: true },
          { label: '只有在 Market Sideways 时才会', correct: false },
        ],
        feedback: { ok: '✓ 正确！FVG 是用于 Analysis 的 Zone，并不是保证。' },
      },
      {
        question: '使用 FVG 的良好方式是什么？',
        options: [
          { label: '一看到 FVG 就立即进场 Trade', correct: false },
          { label: '检查 Structure + Displacement + Context 并等待 Reaction', correct: true },
          { label: '使用 FVG 而不需要看 Trend', correct: false },
        ],
        feedback: { ok: '✓ 正确！Context 是 Analysis 中重要的一部分。' },
      },
    ],
  },
};

export default function Lesson4({ onNavigate, onDone }) {
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
      id="l4"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <p>{t.intro}</p>

      <Box variant="g">{t.thinkBox}</Box>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.imbalanceLabel}>
          {t.imbalanceBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.fillLabel}>
          {t.fillBody}
        </GridItem>
      </div>

      <Rule title={t.rule1Title}>{t.rule1Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="u">{t.bullishDef}</Box>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.bullishFvgLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bullishFvgBody}
        </GridItem>
        <GridItem label={t.watchLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.watchBody}
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="d">{t.bearishDef}</Box>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.bearishFvgLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bearishFvgBody}
        </GridItem>
        <GridItem label={t.keyPointLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.keyPointBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.figCaption}>
        <svg viewBox="0 0 700 200">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BULLISH FVG</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BEARISH FVG</text>
          <line x1="350" y1="10" x2="350" y2="195" stroke="#2A2A35" strokeWidth="1" />

          <rect x="45" y="55" width="130" height="45" fill="rgba(46,124,246,0.14)" stroke="#5B9BD5" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="110" y="50" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>FVG ZONE</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="60" y1="90" x2="60" y2="140" stroke="#3EC97A" strokeWidth="1.4" /><rect x="54" y="98" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="60" y="155" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Candle 1</text>
          <text x="35" y="94" textAnchor="end" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>High</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="115" y1="45" x2="115" y2="105" stroke="#3EC97A" strokeWidth="1.6" /><rect x="107" y="52" width="16" height="48" rx="1" fill="#3EC97A" /></g>
          <text x="115" y="120" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>Candle 2</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="170" y1="20" x2="170" y2="60" stroke="#3EC97A" strokeWidth="1.4" /><rect x="164" y="25" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <text x="170" y="72" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Candle 3</text>
          <text x="192" y="58" textAnchor="start" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Low</text>

          <rect x="395" y="95" width="130" height="45" fill="rgba(224,85,85,0.14)" stroke="#E05555" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="460" y="153" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>FVG ZONE</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="410" y1="55" x2="410" y2="100" stroke="#E05555" strokeWidth="1.4" /><rect x="404" y="60" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="410" y="45" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Candle 1</text>
          <text x="385" y="102" textAnchor="end" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Low</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="465" y1="90" x2="465" y2="150" stroke="#E05555" strokeWidth="1.6" /><rect x="457" y="98" width="16" height="48" rx="1" fill="#E05555" /></g>
          <text x="465" y="165" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>Candle 2</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="520" y1="135" x2="520" y2="175" stroke="#E05555" strokeWidth="1.4" /><rect x="514" y="140" width="12" height="28" rx="1" fill="#E05555" /></g>
          <text x="520" y="190" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Candle 3</text>
          <text x="542" y="138" textAnchor="start" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>High</text>
        </svg>
      </AnimatedFig>

      <Quiz
        question={t.quiz1.question}
        options={t.quiz1.options}
        feedback={t.quiz1.feedback}
      />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Steps items={t.steps1} />

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <div className="g2">
        <GridItem label={t.obLabel}>{t.obBody}</GridItem>
        <GridItem label={t.fvgLabel}>{t.fvgBody}</GridItem>
      </div>
      <Box variant="b">{t.comboBox}</Box>

      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="d">
        <ul>
          <li>{t.mistakeLi1}</li>
          <li>{t.mistakeLi2}</li>
          <li>{t.mistakeLi3}</li>
          <li>{t.mistakeLi4}</li>
        </ul>
      </Box>
      <Rule title={t.rule2Title}>{t.rule2Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.steps2} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.h8}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
