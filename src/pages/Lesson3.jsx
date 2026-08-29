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

const meta = getLessonMeta('l3');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagram) stays identical across languages — only this
// content swaps. Trading terms (Order Block, Displacement, Retest, BOS,
// CHoCH, Structure, etc.) are kept in English in every language since
// that's the universal jargon traders use, in Khmer-language trading
// communities too.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>Order Block (OB)</strong> គឺជាតំបន់ Price ដែល Trader ប្រើដើម្បីសម្គាល់តំបន់មួយដែលមាន{' '}
        <strong>Strong Displacement</strong> ចេញពីវា ហើយបន្ទាប់មក Price អាចត្រឡប់មក <strong>Retest</strong> និង React
        ម្តងទៀត។ សម្រាប់ Beginner ត្រូវមើល OB ជា <strong>Zone</strong> (តំបន់មួយចន្លោះ) មិនមែនជាចំណុច Entry តែមួយឡើយ។
      </>
    ),
    thinkEasy: (
      <p>
        <strong>🧠 គិតឲ្យងាយ ៖</strong> Order Block ដូចជា <strong>"កន្លែងចុងក្រោយ" ដែល Smart Money ទិញ/លក់ធំៗ</strong>{' '}
        មុននឹង Price រុញខ្លាំង។ ដូច្នេះពេល Price ត្រឡប់មកកន្លែងនោះម្ដងទៀត វាមានឱកាសខ្ពស់ថា Order ធំៗនៅសល់ត្រង់នោះ
        អាចរុញ Price បន្តទិសដដែល — ប៉ុន្តែមិនមែនធានា ១០០% ទេ ត្រូវរង់ចាំសញ្ញាបញ្ជាក់ជានិច្ច។
      </p>
    ),
    h1: 'ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន',
    displacementLabel: 'Displacement',
    displacementBody: 'ចលនា Price ដ៏ខ្លាំង និងលឿន (Candle Body ធំៗជាប់ៗគ្នា) ដែលបង្ហាញថា Order ធំចូលទីផ្សារ — ជាភស្ដុតាងសំខាន់ បង្កើត Order Block ។',
    retestLabel: 'Retest',
    retestBody: 'ពេល Price ត្រឡប់មកកន្តាល Zone ដែលបានកន្លងទៅម្ដងទៀត មុននឹងសម្រេចថានឹងបន្ត ឬបដិសេធ Zone នោះ ។',
    ruleTitle: 'Order Block = Zone + Displacement + Context',
    rule1: 'កុំ Mark Candle ណាមួយជា OB ដោយគ្មាន Movement និង Structure បញ្ជាក់',
    h2: '១. Bullish Order Block',
    bullishDef: (
      <p>
        ជាទូទៅ <strong>Bullish OB</strong> គឺតំបន់ Candle bearish ចុងក្រោយ មុនពេល Price មាន{' '}
        <strong>Strong Bullish Displacement</strong> ដែលអាចបង្កើត BOS ឬបង្ហាញពីការផ្លាស់ប្តូរ Structure។ តំបន់នេះអាចក្លាយជា
        Demand Zone នៅពេល Price ត្រឡប់មក Retest។
      </p>
    ),
    bullishObLabel: 'Bullish OB ⬆',
    bullishObBody: 'Candle bearish (ក្រហម) → Strong Displacement ឡើងលើ → Break Structure → Price ត្រឡប់មក Retest → រង់ចាំ Reaction ឡើងវិញ ។',
    whereMarkLabel: 'តើគួរ Mark ត្រង់ណា?',
    whereMarkBody: (
      <>
        Mark តំបន់ Candle bearish ចុងក្រោយ <strong>មុន</strong> Displacement ចាប់ផ្ដើម ។ អ្នកអាចប្រើ Candle Body
        ឬ Wick ទាំងមូល — សំខាន់គឺជ្រើសរើសមួយ ហើយប្រើឲ្យស្មើគ្នារាល់ពេល កុំប្តូរវិធីពាក់កណ្ដាល Chart ។
      </>
    ),
    h3: '២. Bearish Order Block',
    bearishDef: (
      <p>
        ជាទូទៅ <strong>Bearish OB</strong> គឺតំបន់ Candle bullish ចុងក្រោយ មុនពេល Price មាន{' '}
        <strong>Strong Bearish Displacement</strong> ដែលអាចបង្កើត BOS ឬបង្ហាញពីការផ្លាស់ប្តូរ Structure។ Price
        អាចត្រឡប់មក Retest តំបន់នេះ ហើយ React ចុះ។
      </p>
    ),
    bearishObLabel: 'Bearish OB ⬇',
    bearishObBody: 'Candle bullish (បៃតង) → Strong Displacement ចុះក្រោម → Break Structure → Price ត្រឡប់មក Retest → រង់ចាំ Reaction ចុះវិញ ។',
    keyPointLabel: 'ចំណុចសំខាន់',
    keyPointBody: (
      <>
        Displacement កាន់តែខ្លាំង និង Context Structure កាន់តែច្បាស់ ({'>'} BOS/CHoCH ពិត) — Zone នោះកាន់តែមាន
        តម្លៃ ។ Displacement ខ្សោយឬមិនច្បាស់ Structure = Zone ខ្សោយ មិនគួរទុកចិត្ត ។
      </>
    ),
    figCaption: (
      <>
        ខាងឆ្វេង៖ Candle ក្រហមចុងក្រោយមុន Displacement ឡើងខ្លាំង = <strong style={{ color: '#3EC97A' }}>Bullish OB</strong> ·
        ខាងស្ដាំ៖ Candle បៃតងចុងក្រោយមុន Displacement ចុះខ្លាំង = <strong style={{ color: '#E05555' }}>Bearish OB</strong> —
        ក្រៅ Zone ចាំរង់ Price ត្រឡប់មក Retest មុននឹង React
      </>
    ),
    obZoneLabel: 'OB ZONE',
    retestSvgLabel: 'Retest',
    quiz1: {
      question: 'Order Block ត្រូវបានចាត់ទុកថាមាន Context ខ្លាំង នៅពេលណា?',
      options: [
        { label: 'ពេល Candle មានទំហំធំបំផុតលើ Chart', type: 'no' },
        { label: 'ពេលមាន Strong Displacement + Break Structure ច្បាស់លាស់', type: 'ok' },
        { label: 'ពេល Candle ប្តូរពណ៌', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Displacement ខ្លាំង + Structure Break ច្បាស់ = Zone មានតម្លៃខ្ពស់។',
        no: '✗ ទំហំ Candle ឬពណ៌ Candle ម្នាក់ឯង មិនប្រាប់ថា Zone ល្អទេ — ត្រូវមើល Displacement និង Structure។',
      },
    },
    h4: '៣. របៀបសម្គាល់ Order Block',
    steps1: [
      <>
        កំណត់ <strong>Market Structure</strong> និង Bias ជាមុន។
      </>,
      <>
        រកមើល <strong>Strong Displacement</strong> ដែលចេញពីតំបន់មួយ។
      </>,
      'សម្គាល់ Candle/Zone មុន Displacement ដែលមាន Context ច្បាស់។',
      <>
        រង់ចាំ Price ត្រឡប់មក <strong>Retest</strong> — កុំ Chase Price។
      </>,
      <>
        ស្វែងរក <strong>Confirmation</strong> មុន Entry និងគ្រប់គ្រង Risk ជានិច្ច។
      </>,
    ],
    h5: '៤. Order Block + BOS/CHoCH',
    bosChochBody: (
      <p>
        មេរៀនមុនយើងរៀនថា <strong>BOS</strong> ជា Continuation និង <strong>CHoCH</strong> ជា Possible Reversal។
        ឥឡូវយើងអាចប្រើ Structure នោះដើម្បីជួយ Filter OB៖{' '}
        <strong>OB ដែលបណ្តាលឱ្យមាន Strong Displacement និង Structure Break មាន Context ខ្លាំងជាង Candle ធម្មតា</strong>។
      </p>
    ),
    h6: '៥. កំហុស Beginner',
    mistake1: (
      <>
        <strong>Mark គ្រប់ Candle មុន Movement ជា Order Block</strong> — គ្មាន Displacement ខ្លាំង ក៏គ្មាន OB
        ពិត Candle ធម្មតាមួយមិនមែនស្វ័យប្រវត្តិក្លាយជា OB ទេ។
      </>
    ),
    mistake2: (
      <>
        <strong>មិនមើល Structure ឬ Displacement</strong> — OB ដែលមិនភ្ជាប់ជាមួយ BOS/CHoCH ច្បាស់ ជាទូទៅ
        ខ្សោយ និងទុកចិត្តបានតិច។
      </>
    ),
    mistake3: (
      <>
        <strong>ចូល Trade មុន Price ត្រឡប់មក Zone</strong> — "Chase" Price ដោយមិនរង់ចាំ Retest បង្កើន Risk
        ដោយមិនចាំបាច់។
      </>
    ),
    mistake4: (
      <>
        <strong>គិតថា OB ត្រូវ Hold 100% រាល់ពេល</strong> — Zone ជាច្រើនអាចត្រូវ Break ចោល (Mitigated) ត្រូវប្រើ
        Stop Loss និង Risk Management ជានិច្ច។
      </>
    ),
    ruleTitle2: 'ច្បាប់ងាយចាំ',
    rule2: 'មើល Structure → រក Displacement → Mark Zone → រង់ចាំ Retest → Seek Confirmation',
    h7: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView ៖',
    practiceSteps: [
      'រកមើល Strong Displacement Candle ចំនួន ២ កន្លែងលើ Chart',
      'សម្គាល់ Candle/Zone ចុងក្រោយ មុន Displacement ចាប់ផ្ដើម — នោះជា Order Block របស់អ្នក',
      'ពិនិត្យមើលថា តើ Zone នោះភ្ជាប់ជាមួយ BOS ឬ CHoCH ដែរឬទេ (ត្រលប់ទៅមេរៀនទី ២ បើភ្លេច)',
      'បើ Price ធ្លាប់ត្រឡប់មក Zone នោះម្ដងទៀត សូមមើលថា Price React យ៉ាងណា',
    ],
    h8: 'Quiz — សាកល្បងចំណេះដឹង',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'តើអ្វីធ្វើឱ្យ Order Block មាន Context ខ្លាំងជាង Candle ធម្មតា?',
        options: [
          { label: 'Strong Displacement និង Structure Context', correct: true },
          { label: 'ព្រោះ Candle មានពណ៌ស្អាត', correct: false },
          { label: 'ព្រោះវាជា Candle ធំបំផុតគ្រប់ពេល', correct: false },
        ],
      },
      {
        question: 'បន្ទាប់ពី Mark OB តើយើងគួរធ្វើអ្វី?',
        options: [
          { label: 'ចូល Trade ភ្លាមៗ', correct: false },
          { label: 'រង់ចាំ Price Retest Zone និងស្វែងរក Confirmation', correct: true },
          { label: 'បិទ Chart', correct: false },
        ],
      },
      {
        question: 'Bullish OB ជាទូទៅស្ថិតនៅកន្លែងណា?',
        options: [
          { label: 'តំបន់ Candle bearish មុន Strong Bullish Displacement', correct: true },
          { label: 'កន្លែងណាក៏បាននៅលើ Chart', correct: false },
          { label: 'តែនៅខាងលើ Trend ប៉ុណ្ណោះ', correct: false },
        ],
      },
      {
        question: 'តើ Order Block អាច Hold 100% រាល់ពេលឬទេ?',
        options: [
          { label: 'បាទ/ចាស', correct: false },
          { label: 'ទេ ត្រូវប្រើ Context, Confirmation និង Risk Management', correct: true },
          { label: 'តែពេលមាន Volume ខ្ពស់', correct: false },
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
        <strong>Order Block (OB)</strong> is a price zone traders use to mark an area that produced{' '}
        <strong>Strong Displacement</strong>, after which price may return to <strong>Retest</strong> it and
        react again. For beginners, treat an OB as a <strong>Zone</strong> (a range), not a single Entry
        point.
      </>
    ),
    thinkEasy: (
      <p>
        <strong>🧠 An easy way to think about it:</strong> An Order Block is like the{' '}
        <strong>"last place" where Smart Money bought/sold in size</strong> before price pushed hard. So
        when price returns to that place again, there's a high chance the large leftover orders there can
        push price to continue in the same direction — but it's not a 100% guarantee, you must always wait
        for a confirming signal.
      </p>
    ),
    h1: 'Key Terms to Know Before This Lesson',
    displacementLabel: 'Displacement',
    displacementBody: 'A strong, fast price move (a series of large-bodied candles) that shows big orders entering the market — the key evidence that forms an Order Block.',
    retestLabel: 'Retest',
    retestBody: 'When price returns to the middle of a Zone it has already passed through, before deciding whether to continue or reject that Zone.',
    ruleTitle: 'Order Block = Zone + Displacement + Context',
    rule1: "Don't mark any candle as an OB without Movement and Structure to confirm it",
    h2: '1. Bullish Order Block',
    bullishDef: (
      <p>
        A <strong>Bullish OB</strong> is generally the last bearish candle's zone before price shows{' '}
        <strong>Strong Bullish Displacement</strong> that can create a BOS or signal a shift in Structure.
        This zone can become a Demand Zone when price returns to Retest it.
      </p>
    ),
    bullishObLabel: 'Bullish OB ⬆',
    bullishObBody: 'Bearish candle (red) → Strong Displacement up → Break Structure → price returns to Retest → wait for a bullish Reaction.',
    whereMarkLabel: 'Where should you mark it?',
    whereMarkBody: (
      <>
        Mark the last bearish candle's zone <strong>before</strong> Displacement begins. You can use the
        whole candle Body or Wick — what matters is picking one method and using it consistently, don't
        switch methods halfway through the chart.
      </>
    ),
    h3: '2. Bearish Order Block',
    bearishDef: (
      <p>
        A <strong>Bearish OB</strong> is generally the last bullish candle's zone before price shows{' '}
        <strong>Strong Bearish Displacement</strong> that can create a BOS or signal a shift in Structure.
        Price may return to Retest this zone and then react downward.
      </p>
    ),
    bearishObLabel: 'Bearish OB ⬇',
    bearishObBody: 'Bullish candle (green) → Strong Displacement down → Break Structure → price returns to Retest → wait for a bearish Reaction.',
    keyPointLabel: 'Key point',
    keyPointBody: (
      <>
        The stronger the Displacement and the clearer the Context Structure ({'>'} a genuine BOS/CHoCH), the
        more valuable the Zone. Weak Displacement or unclear Structure = a weak Zone that shouldn't be
        trusted.
      </>
    ),
    figCaption: (
      <>
        Left: the last red candle before a strong upward Displacement = <strong style={{ color: '#3EC97A' }}>Bullish OB</strong> ·
        Right: the last green candle before a strong downward Displacement = <strong style={{ color: '#E05555' }}>Bearish OB</strong> —
        outside the Zone, wait for price to return to Retest it before it reacts
      </>
    ),
    obZoneLabel: 'OB ZONE',
    retestSvgLabel: 'Retest',
    quiz1: {
      question: 'When is an Order Block considered to have strong Context?',
      options: [
        { label: 'When the candle is the biggest on the chart', type: 'no' },
        { label: 'When there is Strong Displacement + a clear Break of Structure', type: 'ok' },
        { label: 'When the candle changes color', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Strong Displacement + a clear Structure Break = a high-value Zone.',
        no: "✗ Candle size or color alone doesn't tell you a Zone is good — you need to look at Displacement and Structure.",
      },
    },
    h4: '3. How to Identify an Order Block',
    steps1: [
      <>
        First determine the <strong>Market Structure</strong> and Bias.
      </>,
      <>
        Look for <strong>Strong Displacement</strong> coming out of a zone.
      </>,
      'Mark the candle/zone before the Displacement that has clear Context.',
      <>
        Wait for price to return for a <strong>Retest</strong> — don't chase price.
      </>,
      <>
        Look for <strong>Confirmation</strong> before entry, and always manage risk.
      </>,
    ],
    h5: '4. Order Block + BOS/CHoCH',
    bosChochBody: (
      <p>
        In the previous lesson we learned that <strong>BOS</strong> is Continuation and{' '}
        <strong>CHoCH</strong> is a Possible Reversal. We can now use that Structure to help filter OBs: an{' '}
        <strong>OB that causes Strong Displacement and a Structure Break has stronger Context than an
        ordinary candle</strong>.
      </p>
    ),
    h6: '5. Beginner Mistakes',
    mistake1: (
      <>
        <strong>Marking every candle before a move as an Order Block</strong> — without strong
        Displacement, there is no real OB. An ordinary candle doesn't automatically become an OB.
      </>
    ),
    mistake2: (
      <>
        <strong>Not looking at Structure or Displacement</strong> — an OB not tied to a clear BOS/CHoCH is
        generally weak and less trustworthy.
      </>
    ),
    mistake3: (
      <>
        <strong>Entering a trade before price returns to the Zone</strong> — "chasing" price without waiting
        for a Retest adds unnecessary risk.
      </>
    ),
    mistake4: (
      <>
        <strong>Thinking an OB must hold 100% of the time</strong> — many Zones can get broken through
        (Mitigated), so always use a Stop Loss and Risk Management.
      </>
    ),
    ruleTitle2: 'An Easy Rule to Remember',
    rule2: 'Look at Structure → find Displacement → mark the Zone → wait for a Retest → seek Confirmation',
    h7: '📝 Practice Exercise',
    practiceIntro: 'Before doing the Quiz below, practice on your own real chart on TradingView:',
    practiceSteps: [
      'Find 2 places on the chart with Strong Displacement candles',
      'Mark the last candle/zone before the Displacement begins — that is your Order Block',
      'Check whether that Zone is tied to a BOS or CHoCH (go back to Lesson 2 if you forget)',
      'If price has returned to that Zone again, look at how price reacted',
    ],
    h8: 'Quiz — Test Your Knowledge',
    finalTestIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson
        — if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'What gives an Order Block stronger Context than an ordinary candle?',
        options: [
          { label: 'Strong Displacement and Structure Context', correct: true },
          { label: 'Because the candle has a nice color', correct: false },
          { label: 'Because it is always the biggest candle', correct: false },
        ],
      },
      {
        question: 'After marking an OB, what should you do?',
        options: [
          { label: 'Enter a trade immediately', correct: false },
          { label: 'Wait for price to Retest the Zone and look for Confirmation', correct: true },
          { label: 'Close the chart', correct: false },
        ],
      },
      {
        question: 'Where is a Bullish OB generally located?',
        options: [
          { label: 'The bearish candle zone before Strong Bullish Displacement', correct: true },
          { label: 'Anywhere at all on the chart', correct: false },
          { label: 'Only above the trend', correct: false },
        ],
      },
      {
        question: 'Does an Order Block hold 100% of the time?',
        options: [
          { label: 'Yes', correct: false },
          { label: 'No — you must use Context, Confirmation, and Risk Management', correct: true },
          { label: 'Only when volume is high', correct: false },
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
        <strong>Order Block（OB，订单块）</strong>是交易者用来标记某个区域的价格区间——该区域产生了{' '}
        <strong>Strong Displacement（强位移）</strong>，之后价格可能会回到该区域进行 <strong>Retest（回踩）</strong>
        并再次做出反应。对初学者来说，应把 OB 看作一个 <strong>Zone（区间）</strong>，而不是单一的 Entry 点。
      </>
    ),
    thinkEasy: (
      <p>
        <strong>🧠 简单来说：</strong>Order Block 就像 <strong>Smart Money 在价格大幅推动前"最后一次"大量买入/卖出的地方</strong>
        。因此当价格再次回到那个地方时，那里剩余的大额挂单很有可能推动价格继续朝原方向运动——但这并不是
        100% 的保证，必须始终等待确认信号。
      </p>
    ),
    h1: '进入本课前必须掌握的关键术语',
    displacementLabel: 'Displacement',
    displacementBody: '一种强劲而快速的价格运动（连续出现大实体蜡烛），表明有大额订单进入市场——这是形成 Order Block 的关键证据。',
    retestLabel: 'Retest',
    retestBody: '价格再次回到此前已经经过的 Zone 中间，然后再决定是延续还是拒绝该 Zone。',
    ruleTitle: 'Order Block = Zone + Displacement + Context',
    rule1: '不要在没有 Movement 和 Structure 确认的情况下，把任何一根蜡烛标记为 OB',
    h2: '1. Bullish Order Block（多头订单块）',
    bullishDef: (
      <p>
        <strong>Bullish OB</strong> 通常是价格出现 <strong>Strong Bullish Displacement</strong>（可能形成
        BOS 或表明 Structure 转变）之前，最后一根 bearish 蜡烛所在的区域。当价格回到该区域进行 Retest 时，
        这个区域可能成为 Demand Zone。
      </p>
    ),
    bullishObLabel: 'Bullish OB ⬆',
    bullishObBody: 'Bearish 蜡烛（红色）→ 向上 Strong Displacement → Break Structure → 价格回到该区域 Retest → 等待向上 Reaction。',
    whereMarkLabel: '应该在哪里标记？',
    whereMarkBody: (
      <>
        在 Displacement 开始<strong>之前</strong>，标记最后一根 bearish 蜡烛所在的区域。你可以使用整根 Candle
        Body 或包含 Wick——重要的是选定一种方法后始终如一地使用，不要在图表中途更换标记方式。
      </>
    ),
    h3: '2. Bearish Order Block（空头订单块）',
    bearishDef: (
      <p>
        <strong>Bearish OB</strong> 通常是价格出现 <strong>Strong Bearish Displacement</strong>（可能形成
        BOS 或表明 Structure 转变）之前，最后一根 bullish 蜡烛所在的区域。价格可能回到该区域进行 Retest，
        然后向下 React。
      </p>
    ),
    bearishObLabel: 'Bearish OB ⬇',
    bearishObBody: 'Bullish 蜡烛（绿色）→ 向下 Strong Displacement → Break Structure → 价格回到该区域 Retest → 等待向下 Reaction。',
    keyPointLabel: '关键点',
    keyPointBody: (
      <>
        Displacement 越强、Context Structure 越清晰（{'>'} 真正的 BOS/CHoCH），该 Zone 就越有价值。
        Displacement 较弱或 Structure 不清晰 = 该 Zone 较弱，不宜信任。
      </>
    ),
    figCaption: (
      <>
        左侧：向上强 Displacement 前的最后一根红色蜡烛 = <strong style={{ color: '#3EC97A' }}>Bullish OB</strong> ·
        右侧：向下强 Displacement 前的最后一根绿色蜡烛 = <strong style={{ color: '#E05555' }}>Bearish OB</strong> —
        在 Zone 之外，等待价格回到该区域进行 Retest 之后再观察 React
      </>
    ),
    obZoneLabel: 'OB ZONE',
    retestSvgLabel: 'Retest',
    quiz1: {
      question: '什么时候可以认为 Order Block 具有较强的 Context？',
      options: [
        { label: '当蜡烛是图表中最大的一根时', type: 'no' },
        { label: '当出现 Strong Displacement + 清晰的 Break Structure 时', type: 'ok' },
        { label: '当蜡烛变换颜色时', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Strong Displacement + 清晰的 Structure Break = 高价值 Zone。',
        no: '✗ 仅凭蜡烛大小或颜色并不能说明 Zone 是否优质——必须观察 Displacement 和 Structure。',
      },
    },
    h4: '3. 如何识别 Order Block',
    steps1: [
      <>
        先确定 <strong>Market Structure</strong> 和 Bias。
      </>,
      <>
        寻找从某个区域出现的 <strong>Strong Displacement</strong>。
      </>,
      '标记 Displacement 之前 Context 清晰的蜡烛/区域。',
      <>
        等待价格回到该区域进行 <strong>Retest</strong> ——不要追价（Chase Price）。
      </>,
      <>
        在 Entry 之前寻找 <strong>Confirmation</strong>，并始终做好 Risk 管理。
      </>,
    ],
    h5: '4. Order Block + BOS/CHoCH',
    bosChochBody: (
      <p>
        上一课我们学到 <strong>BOS</strong> 是 Continuation，<strong>CHoCH</strong> 是 Possible Reversal。
        现在我们可以用这个 Structure 来帮助筛选 OB：{' '}
        <strong>会引发 Strong Displacement 和 Structure Break 的 OB，其 Context 比普通蜡烛更强</strong>。
      </p>
    ),
    h6: '5. 新手常犯的错误',
    mistake1: (
      <>
        <strong>把移动前的每一根蜡烛都标记为 Order Block</strong> ——没有强 Displacement 就没有真正的
        OB，普通蜡烛不会自动变成 OB。
      </>
    ),
    mistake2: (
      <>
        <strong>不观察 Structure 或 Displacement</strong> ——没有明确连接 BOS/CHoCH 的 OB 通常较弱，
        可信度较低。
      </>
    ),
    mistake3: (
      <>
        <strong>在价格回到 Zone 之前就进场交易</strong> ——不等待 Retest 就"追价"会不必要地增加风险。
      </>
    ),
    mistake4: (
      <>
        <strong>认为 OB 每次都必须 100% Hold 住</strong> ——许多 Zone 都可能被突破（Mitigated），必须始终
        使用 Stop Loss 和 Risk Management。
      </>
    ),
    ruleTitle2: '简单易记的规则',
    rule2: '观察 Structure → 寻找 Displacement → 标记 Zone → 等待 Retest → 寻求 Confirmation',
    h7: '📝 实践练习',
    practiceIntro: '在做下方 Quiz 之前，请先在 TradingView 上用你自己的真实图表进行练习：',
    practiceSteps: [
      '在图表上找出 2 处 Strong Displacement 蜡烛',
      '标记 Displacement 开始之前的最后一根蜡烛/区域——那就是你的 Order Block',
      '检查该 Zone 是否与 BOS 或 CHoCH 相连（如果忘记了请回顾第 2 课）',
      '如果价格曾经回到该 Zone，观察价格是如何 React 的',
    ],
    h8: 'Quiz — 知识测验',
    finalTestIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: '是什么让 Order Block 比普通蜡烛拥有更强的 Context？',
        options: [
          { label: 'Strong Displacement 与 Structure Context', correct: true },
          { label: '因为蜡烛颜色好看', correct: false },
          { label: '因为它永远是最大的蜡烛', correct: false },
        ],
      },
      {
        question: '标记 OB 之后，我们应该做什么？',
        options: [
          { label: '立即进场交易', correct: false },
          { label: '等待价格 Retest 该 Zone 并寻找 Confirmation', correct: true },
          { label: '关闭图表', correct: false },
        ],
      },
      {
        question: 'Bullish OB 通常位于什么位置？',
        options: [
          { label: 'Strong Bullish Displacement 之前的 bearish 蜡烛区域', correct: true },
          { label: '图表上的任何位置都可以', correct: false },
          { label: '只在 Trend 上方', correct: false },
        ],
      },
      {
        question: 'Order Block 是否每次都能 100% Hold 住？',
        options: [
          { label: '是', correct: false },
          { label: '不是，必须使用 Context、Confirmation 和 Risk Management', correct: true },
          { label: '只有在 Volume 很高时才行', correct: false },
        ],
      },
    ],
  },
};

export default function Lesson3({ onNavigate, onDone }) {
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
      id="l3"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <p>{t.intro}</p>

      <Box variant="g">{t.thinkEasy}</Box>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.displacementLabel}>
          {t.displacementBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.retestLabel}>
          {t.retestBody}
        </GridItem>
      </div>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="u">{t.bullishDef}</Box>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.bullishObLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bullishObBody}
        </GridItem>
        <GridItem label={t.whereMarkLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.whereMarkBody}
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="d">{t.bearishDef}</Box>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.bearishObLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bearishObBody}
        </GridItem>
        <GridItem label={t.keyPointLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.keyPointBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.figCaption}>
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BULLISH ORDER BLOCK</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BEARISH ORDER BLOCK</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <rect x="35" y="95" width="140" height="45" fill="rgba(201,168,76,0.14)" stroke="#2E7CF6" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="105" y="90" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>OB ZONE</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="55" y1="90" x2="55" y2="130" stroke="#E05555" strokeWidth="1.4" /><rect x="49" y="98" width="12" height="28" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.28s' }}><line x1="105" y1="45" x2="105" y2="105" stroke="#3EC97A" strokeWidth="1.5" /><rect x="99" y="52" width="12" height="45" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.36s' }}><line x1="155" y1="20" x2="155" y2="55" stroke="#3EC97A" strokeWidth="1.3" /><rect x="149" y="24" width="12" height="24" rx="1" fill="#3EC97A" /></g>
          <text x="130" y="42" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.42s' }}>Displacement ↑</text>

          <line x1="175" y1="30" x2="215" y2="105" stroke="#7A7870" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <g className="ac" style={{ animationDelay: '.58s' }}><line x1="215" y1="98" x2="215" y2="133" stroke="#E05555" strokeWidth="1.2" /><rect x="209" y="104" width="12" height="22" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="260" y1="65" x2="260" y2="105" stroke="#3EC97A" strokeWidth="1.4" /><rect x="254" y="70" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="215" y="150" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Retest</text>
          <text x="260" y="60" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.75s' }}>React ↑</text>

          <rect x="385" y="40" width="140" height="45" fill="rgba(201,168,76,0.14)" stroke="#2E7CF6" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="455" y="34" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>OB ZONE</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="405" y1="45" x2="405" y2="85" stroke="#3EC97A" strokeWidth="1.4" /><rect x="399" y="50" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.28s' }}><line x1="455" y1="80" x2="455" y2="140" stroke="#E05555" strokeWidth="1.5" /><rect x="449" y="88" width="12" height="45" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.36s' }}><line x1="505" y1="140" x2="505" y2="175" stroke="#E05555" strokeWidth="1.3" /><rect x="499" y="146" width="12" height="24" rx="1" fill="#E05555" /></g>
          <text x="480" y="160" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.42s' }}>Displacement ↓</text>

          <line x1="525" y1="165" x2="565" y2="90" stroke="#7A7870" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <g className="ac" style={{ animationDelay: '.58s' }}><line x1="565" y1="60" x2="565" y2="95" stroke="#3EC97A" strokeWidth="1.2" /><rect x="559" y="65" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="610" y1="95" x2="610" y2="135" stroke="#E05555" strokeWidth="1.4" /><rect x="604" y="100" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="565" y="45" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Retest</text>
          <text x="610" y="150" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.75s' }}>React ↓</text>
        </svg>
      </AnimatedFig>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Steps items={t.steps1} />

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="b">{t.bosChochBody}</Box>

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
      <Rule title={t.ruleTitle2}>{t.rule2}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.practiceSteps} />
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
