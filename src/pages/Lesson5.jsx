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
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ label, src }) {
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
        {label}
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
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

const meta = getLessonMeta('l5');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagram, media) stays identical across languages — only
// this content swaps. Trading terms (Liquidity, BSL/SSL, Sweep, Stop Hunt,
// CHoCH/BOS, etc.) are kept in English in every language since that's the
// universal jargon traders use, in Khmer-language trading communities too.
const CONTENT = {
  kh: {
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>Liquidity (LQ)</strong> គឺជាតំបន់លើ Chart ដែលមាន <strong>Order ជាច្រើនប្រមូលផ្ដុំគ្នា</strong> —
        ភាគច្រើនជា Stop Loss របស់ Trader ដែលកំពុងកាន់ Position ស្រាប់ បូកនឹង Order ថ្មីរបស់ Trader ដែលរង់ចាំ
        Breakout។ Smart Money ច្រើនតែរុញ Price ទៅកាន់តំបន់ទាំងនេះ <strong>ដើម្បីទាញយក Liquidity</strong> មុននឹង
        បន្តទិសពិតរបស់វា។
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Stop Loss របស់ Trader តូចៗ គឺដូចជា <strong>"ត្រីតូចៗ" ប្រមូលផ្ដុំគ្នា</strong>{' '}
        នៅត្រង់ Swing High/Low ។ Smart Money ដូចជា <strong>"ត្រីធំ"</strong> ដែលហែលចូលទៅ "ស៊ី" ត្រីតូចទាំងនោះ
        (ចាក់ Wick ចូល Zone ទាញ Stop Loss) មុននឹងហែលចេញទៅទិសផ្ទុយវិញ។ នេះហើយជាមូលហេតុដែល Price ច្រើនតែ "ចាក់" លើស
        Swing មួយភ្លែត មុននឹងបត់ត្រឡប់។
      </p>
    ),
    keywordsHeading: 'ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន',
    kw1Label: 'Liquidity Sweep / Stop Hunt',
    kw1Body: 'ពេល Price ចាក់ Wick ចូលទៅក្នុងតំបន់ Liquidity មួយភ្លែត ដើម្បីទាញ Order (Stop Loss) រួចបដិសេធត្រឡប់មកវិញ ។',
    kw2Label: 'Equal High / Equal Low (EQH/EQL)',
    kw2Body: 'Swing High ឬ Swing Low ចំនួន ២ ឬច្រើន ដែលនៅកម្រិតជិតគ្នា/ដូចគ្នា — កន្លែងដែល Stop Loss ប្រមូលផ្ដុំច្រើនបំផុត ។',
    rule1Title: 'Liquidity Sweep ≠ Reversal Signal ដោយខ្លួនឯង',
    rule1Body: 'តែងតែរង់ចាំ BOS ឬ CHoCH កើតឡើងបន្ទាប់ពី Sweep សិន មុននឹងសន្និដ្ឋានទិស',
    bslVideoLabel: '🎥 ឧទាហរណ៍ BSL',
    sslVideoLabel: '🎥 ឧទាហរណ៍ SSL',
    lqRunVideoLabel: '🎥 ឧទាហរណ៍ LQ Run',
    lqSweepVideoLabel: '🎥 ឧទាហរណ៍ LQ Sweep',
    h1: '១. Buy-side Liquidity (BSL)',
    bslBox: (
      <p>
        <strong>BSL</strong> ស្ថិតនៅ <strong>ខាងលើ Swing High / Equal High</strong> — ជាកន្លែងដែល Sell Stop
        Loss (របស់ Seller ដែលកាន់ Short) និង Buy Stop Order (របស់ Trader រង់ចាំ Breakout ឡើង) ប្រមូលផ្ដុំគ្នា។
        ពេល Price ចាក់ឡើងលើតំបន់នេះ រួច Reject ចុះមកវិញ គេហៅថា <strong>BSL Sweep</strong> — ជាទូទៅជាសញ្ញា
        Bearish។
      </p>
    ),
    h2: '២. Sell-side Liquidity (SSL)',
    sslBox: (
      <p>
        <strong>SSL</strong> ស្ថិតនៅ <strong>ខាងក្រោម Swing Low / Equal Low</strong> — ជាកន្លែងដែល Buy Stop
        Loss (របស់ Buyer ដែលកាន់ Long) និង Sell Stop Order ប្រមូលផ្ដុំគ្នា។ ពេល Price ចាក់ចុះក្រោមតំបន់នេះ រួច
        Reject ឡើងវិញ គេហៅថា <strong>SSL Sweep</strong> — ជាទូទៅជាសញ្ញា Bullish។
      </p>
    ),
    bslSweepLabel: 'BSL Sweep ⬇',
    bslSweepBody: 'Price ចាក់លើស Equal High → Wick Reject → រង់ចាំ Bearish CHoCH/BOS បញ្ជាក់ → Bias Sell ។',
    sslSweepLabel: 'SSL Sweep ⬆',
    sslSweepBody: 'Price ចាក់ក្រោម Equal Low → Wick Reject → រង់ចាំ Bullish CHoCH/BOS បញ្ជាក់ → Bias Buy ។',
    figCaption: (
      <>
        ខាងឆ្វេង៖ Price ចាក់ Wick ក្រោម <strong style={{ color: '#6FA8FF' }}>SSL (Equal Lows)</strong> ទាញ Stop
        Loss រួច Reject ឡើង + CHoCH = <strong style={{ color: '#3EC97A' }}>Bullish</strong> · ខាងស្ដាំ៖ ចាក់
        Wick លើស <strong style={{ color: '#6FA8FF' }}>BSL (Equal Highs)</strong> រួច Reject ចុះ + CHoCH ={' '}
        <strong style={{ color: '#E05555' }}>Bearish</strong>
      </>
    ),
    quiz1: {
      question: 'Price ចាក់ Wick ក្រោម Equal Low ២ ចំណុច រួច Close ត្រឡប់ឡើងលើវិញភ្លាមៗ — តើនេះជាអ្វី?',
      options: [
        { label: 'BSL Sweep — សញ្ញា Bearish', type: 'no' },
        { label: 'SSL Sweep — សញ្ញាដំបូងអាចជា Bullish', type: 'ok' },
        { label: 'FVG', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! ចាក់ក្រោម Equal Low (SSL) រួច Reject ឡើង = SSL Sweep — សញ្ញាដំបូងអាចនាំទៅ Bullish (ត្រូវរង់ចាំ CHoCH/BOS បញ្ជាក់)។',
        no: '✗ ចាក់ក្រោម Equal Low ជា SSL (Sell-side) មិនមែន BSL ទេ — SSL Sweep ជាទូទៅនាំទៅ Bullish។',
      },
    },
    runVsSweepHeading: '៣. LQ Run Vs Sweep',
    runVsSweepIntro: 'Trader ជាច្រើនច្រឡំរវាង LQ Run និង Liquidity Sweep ព្រោះមើលទៅស្រដៀងគ្នា — ទាំងពីរសុទ្ធតែពាក់ព័ន្ធនឹង Price ឆ្លងកាត់ Liquidity Zone ប៉ុន្តែឥរិយាបថ Price និងអត្ថន័យខុសគ្នាទាំងស្រុង។',
    runLabel: 'LQ Run',
    runBody: 'Price ឆ្លងកាត់ Zone ដោយមាន Candle Body Close នៅខាងក្រៅ (មិនមែនត្រឹម Wick ទេ) — ជាទូទៅជាសញ្ញា Continuation មិនមែន Reversal ។ Structure នៅតែបន្តទិសដើម ។',
    sweepLabel2: 'Liquidity Sweep',
    sweepBody2: 'Price គ្រាន់តែ Wick ចាក់ចូល Zone រហ័សៗ រួច Reject ត្រឡប់មកវិញភ្លាមៗ ដោយគ្មាន Body Close នៅខាងក្រៅ — ជាទូទៅនាំឲ្យមាន CHoCH/BOS ក្នុងទិសផ្ទុយ (Reversal) ។',
    runSweepRuleTitle: 'របៀបសម្គាល់ងាយៗ',
    runSweepRuleBody: 'មើលថា Candle Close នៅឯណា — Close នៅខាងក្រៅ Zone = Run (បន្ត) · Close ត្រឡប់ចូលក្នុង Zone វិញ = Sweep (អាចប្រែទិស)',
    h3: '៤. របៀបសម្គាល់ Liquidity Sweep ជាជំហានៗ',
    steps1: [
      <>
        រកមើល <strong>Equal High/Low</strong> ឬ Swing ដែលហាក់ដូចជា "ជាប់គ្នា" លើ Chart ។
      </>,
      'រង់ចាំ Price ចាក់ Wick ចូលហួសកម្រិតនោះមួយភ្លែត (ជាទូទៅលឿន និងមិនមាន Body Close នៅទីនោះ)',
      <>
        ពិនិត្យ <strong>Reaction</strong> — តើ Price Reject ត្រឡប់មកវិញលឿនប៉ុនណា ។
      </>,
      <>
        រង់ចាំ <strong>BOS ឬ CHoCH</strong> កើតឡើងក្នុងទិសផ្ទុយ ដើម្បីបញ្ជាក់ថា Sweep នេះជា Reversal ពិត (ត្រលប់ទៅមេរៀនទី ២ បើភ្លេច)
      </>,
    ],
    quiz2: {
      question: 'បន្ទាប់ពីឃើញ Liquidity Sweep តើជំហានបន្ទាប់ត្រូវធ្វើអ្វី?',
      options: [
        { label: 'ចូល Trade ភ្លាមៗលើ Wick', type: 'no' },
        { label: 'រង់ចាំ BOS/CHoCH ក្នុងទិសផ្ទុយបញ្ជាក់សិន', type: 'ok' },
        { label: 'បិទ Chart ចាំថ្ងៃក្រោយ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Sweep ជា Context មិនមែន Entry Signal ដោយខ្លួនឯងទេ — ត្រូវការ Structure Confirmation បន្ថែម។',
        no: '✗ ចូល Trade ភ្លាមៗលើ Wick មានហានិភ័យខ្ពស់ — សូមរង់ចាំ BOS/CHoCH បញ្ជាក់ទិសសិន។',
      },
    },
    h4: '៥. Liquidity + Structure + OB — ភ្ជាប់គ្នា',
    confluenceBox: (
      <p>
        <strong>Setup ខ្លាំង</strong> ជាទូទៅមកពី Confluence ច្រើនស្រទាប់៖ SSL Sweep (មេរៀននេះ) + Bullish CHoCH
        (មេរៀនទី ២) + Bullish Order Block ដែលបង្កើត Displacement នោះ (មេរៀនទី ៣) + FVG ក្នុងចលនាដដែល (មេរៀនទី
        ៤)។ កាន់តែច្រើន Confluence ត្រូវគ្នា — Setup កាន់តែគួរឱ្យទុកចិត្ត។
      </p>
    ),
    h5: '៦. កំហុសដែល Beginner ជួបញឹកញាប់',
    mistake1: (
      <>
        <strong>ហៅរាល់ Wick តូចៗថា Liquidity Sweep</strong> — Sweep ពិតត្រូវឆ្លងកាត់ Equal High/Low ឬ Swing
        សំខាន់ ជាមួយ Reaction ច្បាស់លាស់ មិនមែន Wick ធម្មតារាល់ Candle ។
      </>
    ),
    mistake2: (
      <>
        <strong>ចូល Trade ភ្លាមៗលើ Sweep ដោយគ្មាន Confirmation</strong> — Sweep អាចបន្តទិសដើមក៏បាន (False
        Signal) ត្រូវរង់ចាំ BOS/CHoCH ។
      </>
    ),
    mistake3: (
      <>
        <strong>មិនគិតពី Higher Timeframe Liquidity</strong> — Zone នៅ Timeframe ធំ (H4, Daily) មានទម្ងន់ខ្ពស់
        ជាង Zone នៅ Timeframe តូច ។
      </>
    ),
    rule2Title: 'ច្បាប់ងាយចាំ',
    rule2Body: 'Sweep = ការទាញ Order មិនមែន Signal ចូល Trade ភ្លាមៗ — រង់ចាំ Structure បញ្ជាក់សិន',
    h6: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView ៖',
    steps2: [
      'រកមើល Equal High ឬ Equal Low យ៉ាងហោចណាស់ ១ ចំណុចលើ Chart',
      'ពិនិត្យថា Price ធ្លាប់ចាក់ Wick ហួសកម្រិតនោះ ហើយ Reject ត្រឡប់មកវិញដែរឬទេ',
      'បើមាន សូមមើលថា BOS/CHoCH កើតឡើងបន្ទាប់ពី Sweep នោះដែរឬអត់',
    ],
    h7: 'Quiz — សាកល្បងចំណេះដឹង',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Buy-side Liquidity (BSL) ជាទូទៅស្ថិតនៅឯណា?',
        options: [
          { label: 'ខាងលើ Swing High / Equal High', correct: true },
          { label: 'ខាងក្រោម Swing Low / Equal Low', correct: false },
          { label: 'ចំកណ្ដាល Range', correct: false },
        ],
        feedbackOk: '✓ ត្រឹមត្រូវ! Buy Stop និង Sell Stop Loss ប្រមូលផ្ដុំគ្នានៅខាងលើ Swing High។',
      },
      {
        question: 'Liquidity Sweep (Stop Hunt) មានលក្ខណៈបែបណា?',
        options: [
          { label: 'Candle Body Close ឆ្លងកាត់ Zone ដោយស្ងប់ស្ងាត់', correct: false },
          { label: 'Wick ចាក់ចូល Zone រហ័ស រួច Price បដិសេធត្រឡប់មកវិញ', correct: true },
          { label: 'Price ធ្វើចលនាដូចគ្នារាល់ថ្ងៃ', correct: false },
        ],
        feedbackOk: '✓ ត្រឹមត្រូវ! Sweep ជាទូទៅជា Wick ចាក់ចូល រួច Reject មិនមែន Close ស្ថិតស្ថេរនៅទីនោះទេ។',
      },
      {
        question: 'ហេតុអ្វី Equal High/Low (EQH/EQL) ជា Liquidity Zone ខ្លាំង?',
        options: [
          { label: 'ព្រោះ Trader ជាច្រើនដាក់ Stop នៅកម្រិតដូចគ្នា — ប្រមូលផ្ដុំគ្នាច្រើន', correct: true },
          { label: 'ព្រោះវាមាន Candle ពណ៌ស្អាត', correct: false },
          { label: 'ព្រោះវាកើតឡើងតែម្ដងគត់ក្នុងមួយឆ្នាំ', correct: false },
        ],
        feedbackOk: '✓ ត្រឹមត្រូវ! កម្រិតតម្លៃដដែលៗទាក់ទាញ Order ប្រមូលផ្ដុំច្រើន។',
      },
      {
        question: 'តើគួរធ្វើដូចម្ដេចបន្ទាប់ពីឃើញ Liquidity Sweep?',
        options: [
          { label: 'ចូល Trade ភ្លាមៗពេលឃើញ Wick', correct: false },
          { label: 'រង់ចាំ BOS/CHoCH បញ្ជាក់ទិសបន្ទាប់ពី Sweep សិន', correct: true },
          { label: 'មិនចាំបាច់ធ្វើអ្វីទាំងអស់', correct: false },
        ],
        feedbackOk: '✓ ត្រឹមត្រូវ! Sweep ម្នាក់ឯង មិនទាន់ជា Signal ពេញលេញ ត្រូវការ Confirmation បន្ថែម។',
      },
    ],
  },
  en: {
    feedbackNo: '✗ Not correct — please try again.',
    finishLocked: (p, t) => `🔒 Finish lesson (${p}/${t})`,
    finishUnlocked: '✓ Finish lesson',
    intro: (
      <>
        <strong>Liquidity (LQ)</strong> is an area on the chart where <strong>lots of orders cluster
        together</strong> — mostly the Stop Losses of traders already holding a position, plus new orders
        from traders waiting for a breakout. Smart Money often pushes price toward these areas{' '}
        <strong>to grab that Liquidity</strong> before continuing in its true direction.
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 Think of it this way:</strong> Imagine small traders' Stop Losses are like a cluster of{' '}
        <strong>"little fish"</strong> sitting right at the Swing High/Low. Smart Money is like a{' '}
        <strong>"big fish"</strong> that swims in to "eat" those little fish (poking a wick into the zone to
        grab the Stop Losses) before swimming off in the opposite direction. This is exactly why price often
        "spikes" briefly past a swing before turning back.
      </p>
    ),
    keywordsHeading: 'Key Terms to Know Before This Lesson',
    kw1Label: 'Liquidity Sweep / Stop Hunt',
    kw1Body: 'When price pokes a wick briefly into a Liquidity zone to grab orders (Stop Losses), then rejects back the other way.',
    kw2Label: 'Equal High / Equal Low (EQH/EQL)',
    kw2Body: 'Two or more Swing Highs or Swing Lows sitting at nearly the same/identical level — the spot where Stop Losses cluster the most.',
    rule1Title: 'A Liquidity Sweep ≠ a Reversal Signal by Itself',
    rule1Body: 'Always wait for a BOS or CHoCH to happen after the Sweep first, before concluding a direction',
    bslVideoLabel: '🎥 BSL example',
    sslVideoLabel: '🎥 SSL example',
    lqRunVideoLabel: '🎥 LQ Run example',
    lqSweepVideoLabel: '🎥 LQ Sweep example',
    h1: '1. Buy-side Liquidity (BSL)',
    bslBox: (
      <p>
        <strong>BSL</strong> sits <strong>above the Swing High / Equal High</strong> — the spot where Sell
        Stop Losses (from sellers holding a Short) and Buy Stop orders (from traders waiting for an upside
        breakout) cluster together. When price spikes above this zone and then rejects back down, it's
        called a <strong>BSL Sweep</strong> — generally a Bearish signal.
      </p>
    ),
    h2: '2. Sell-side Liquidity (SSL)',
    sslBox: (
      <p>
        <strong>SSL</strong> sits <strong>below the Swing Low / Equal Low</strong> — the spot where Buy Stop
        Losses (from buyers holding a Long) and Sell Stop orders cluster together. When price spikes below
        this zone and then rejects back up, it's called an <strong>SSL Sweep</strong> — generally a Bullish
        signal.
      </p>
    ),
    bslSweepLabel: 'BSL Sweep ⬇',
    bslSweepBody: 'Price spikes above Equal High → wick rejects → wait for a Bearish CHoCH/BOS to confirm → Bias Sell.',
    sslSweepLabel: 'SSL Sweep ⬆',
    sslSweepBody: 'Price spikes below Equal Low → wick rejects → wait for a Bullish CHoCH/BOS to confirm → Bias Buy.',
    figCaption: (
      <>
        Left: Price pokes a wick below <strong style={{ color: '#6FA8FF' }}>SSL (Equal Lows)</strong>,
        grabbing Stop Losses, then rejects upward + CHoCH ={' '}
        <strong style={{ color: '#3EC97A' }}>Bullish</strong> · Right: pokes a wick above{' '}
        <strong style={{ color: '#6FA8FF' }}>BSL (Equal Highs)</strong>, then rejects downward + CHoCH ={' '}
        <strong style={{ color: '#E05555' }}>Bearish</strong>
      </>
    ),
    quiz1: {
      question: 'Price pokes a wick below 2 Equal Low points, then immediately closes back up — what is this?',
      options: [
        { label: 'BSL Sweep — a Bearish signal', type: 'no' },
        { label: 'SSL Sweep — could initially be a Bullish signal', type: 'ok' },
        { label: 'FVG', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Spiking below Equal Low (SSL) then rejecting upward = SSL Sweep — this could initially lead to Bullish (you still need to wait for CHoCH/BOS confirmation).',
        no: '✗ Spiking below Equal Low is SSL (Sell-side), not BSL — an SSL Sweep generally leads to Bullish.',
      },
    },
    runVsSweepHeading: '3. LQ Run Vs Sweep',
    runVsSweepIntro: 'Traders often confuse an LQ Run with a Liquidity Sweep because they look similar — both involve price passing through a Liquidity Zone, but the price behavior and meaning are completely different.',
    runLabel: 'LQ Run',
    runBody: 'Price passes through the zone with a Candle Body Close outside it (not just a wick) — this is generally a Continuation signal, not a Reversal. Structure keeps going in its original direction.',
    sweepLabel2: 'Liquidity Sweep',
    sweepBody2: 'Price only pokes a wick briefly into the zone, then immediately rejects back, with no Body Close staying outside — this generally leads to a CHoCH/BOS in the opposite direction (Reversal).',
    runSweepRuleTitle: 'Easy Way to Tell',
    runSweepRuleBody: 'Look at where the candle closes — Close outside the zone = Run (continuation) · Close back inside the zone = Sweep (possible reversal)',
    h3: '4. How to Spot a Liquidity Sweep, Step by Step',
    steps1: [
      <>
        Look for an <strong>Equal High/Low</strong> or a Swing that looks "stuck together" on the chart.
      </>,
      'Wait for price to poke a wick briefly past that level (usually fast, with no Body Close staying there)',
      <>
        Check the <strong>Reaction</strong> — how quickly does price reject back.
      </>,
      <>
        Wait for a <strong>BOS or CHoCH</strong> to happen in the opposite direction to confirm this Sweep is
        a real Reversal (go back to Lesson 2 if you've forgotten)
      </>,
    ],
    quiz2: {
      question: 'After spotting a Liquidity Sweep, what should you do next?',
      options: [
        { label: 'Enter a trade immediately on the wick', type: 'no' },
        { label: 'Wait for a BOS/CHoCH in the opposite direction to confirm first', type: 'ok' },
        { label: 'Close the chart and check back the next day', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A Sweep is Context, not an Entry Signal by itself — it needs additional Structure Confirmation.',
        no: '✗ Entering a trade immediately on the wick is high-risk — wait for a BOS/CHoCH to confirm direction first.',
      },
    },
    h4: '5. Liquidity + Structure + OB — Putting It Together',
    confluenceBox: (
      <p>
        A <strong>strong Setup</strong> usually comes from stacking multiple layers of Confluence: an SSL
        Sweep (this lesson) + a Bullish CHoCH (Lesson 2) + the Bullish Order Block that created that
        Displacement (Lesson 3) + an FVG in the same move (Lesson 4). The more Confluence lines up, the more
        trustworthy the Setup.
      </p>
    ),
    h5: '6. Common Mistakes Beginners Make',
    mistake1: (
      <>
        <strong>Calling every tiny wick a Liquidity Sweep</strong> — a real Sweep needs to cross an
        important Equal High/Low or Swing with a clear Reaction, not just an ordinary wick on any candle.
      </>
    ),
    mistake2: (
      <>
        <strong>Entering a trade immediately on a Sweep without Confirmation</strong> — the Sweep could
        just continue in the original direction (a False Signal); you need to wait for BOS/CHoCH.
      </>
    ),
    mistake3: (
      <>
        <strong>Ignoring Higher Timeframe Liquidity</strong> — a zone on a larger timeframe (H4, Daily)
        carries more weight than a zone on a smaller timeframe.
      </>
    ),
    rule2Title: 'Easy Rule to Remember',
    rule2Body: 'Sweep = grabbing orders, not a signal to enter a trade immediately — wait for Structure confirmation first',
    h6: '📝 Practice Exercise',
    practiceIntro: 'Before doing the Quiz below, practice on your own real chart on TradingView:',
    steps2: [
      'Find at least 1 Equal High or Equal Low point on the chart',
      'Check whether price has poked a wick past that level and rejected back before',
      "If so, check whether a BOS/CHoCH happened after that Sweep",
    ],
    h7: 'Quiz — Test Your Knowledge',
    finalTestIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson
        — if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Where is Buy-side Liquidity (BSL) generally located?',
        options: [
          { label: 'Above the Swing High / Equal High', correct: true },
          { label: 'Below the Swing Low / Equal Low', correct: false },
          { label: 'In the middle of the Range', correct: false },
        ],
        feedbackOk: '✓ Correct! Buy Stop and Sell Stop Loss orders cluster above the Swing High.',
      },
      {
        question: 'What does a Liquidity Sweep (Stop Hunt) look like?',
        options: [
          { label: 'Candle Body closes calmly beyond the zone', correct: false },
          { label: 'A wick quickly pokes into the zone, then price rejects back', correct: true },
          { label: 'Price moves the same way every day', correct: false },
        ],
        feedbackOk: '✓ Correct! A Sweep is generally a wick poking in and then rejecting — not a candle closing and staying there.',
      },
      {
        question: 'Why is Equal High/Low (EQH/EQL) a strong Liquidity Zone?',
        options: [
          { label: 'Because many traders place their Stops at the same level — they cluster heavily together', correct: true },
          { label: 'Because it has nicely colored candles', correct: false },
          { label: 'Because it only happens once a year', correct: false },
        ],
        feedbackOk: '✓ Correct! The same repeated price level attracts a lot of clustered orders.',
      },
      {
        question: 'What should you do after spotting a Liquidity Sweep?',
        options: [
          { label: 'Enter a trade immediately upon seeing the wick', correct: false },
          { label: 'Wait for a BOS/CHoCH to confirm direction after the Sweep first', correct: true },
          { label: 'No need to do anything at all', correct: false },
        ],
        feedbackOk: '✓ Correct! A Sweep alone is not yet a complete Signal — it needs additional Confirmation.',
      },
    ],
  },
  zh: {
    feedbackNo: '✗ 不正确，请再试一次。',
    finishLocked: (p, t) => `🔒 完成课程 (${p}/${t})`,
    finishUnlocked: '✓ 完成课程',
    intro: (
      <>
        <strong>Liquidity（LQ，流动性）</strong>是图表上<strong>大量订单聚集</strong>的区域——主要是已经持仓的
        交易者的 Stop Loss，加上等待 Breakout 的交易者的新订单。Smart Money 经常将价格推向这些区域
        <strong>以吸取 Liquidity</strong>，然后再延续其真实方向。
      </>
    ),
    thinkBox: (
      <p>
        <strong>🧠 简单来想：</strong>把小交易者的 Stop Loss 想象成聚集在 Swing High/Low 处的一群
        <strong>"小鱼"</strong>。Smart Money 就像一条<strong>"大鱼"</strong>，游过去"吃掉"这些小鱼
        （用 Wick 扎进 Zone 抓取 Stop Loss），然后再游向相反的方向。这正是为什么价格经常会在 Swing 处短暂
        "扎"一下，然后再掉头。
      </p>
    ),
    keywordsHeading: '进入本课前需要掌握的关键词',
    kw1Label: 'Liquidity Sweep / Stop Hunt',
    kw1Body: '当价格用 Wick 短暂扎入 Liquidity 区域以吸取订单（Stop Loss），然后又反转回去时。',
    kw2Label: 'Equal High / Equal Low (EQH/EQL)',
    kw2Body: '两个或以上的 Swing High 或 Swing Low 位于相近/相同的水平——Stop Loss 聚集最多的地方。',
    rule1Title: 'Liquidity Sweep 本身 ≠ 反转信号',
    rule1Body: '务必先等待 Sweep 之后出现 BOS 或 CHoCH，再判断方向',
    bslVideoLabel: '🎥 BSL 示例',
    sslVideoLabel: '🎥 SSL 示例',
    lqRunVideoLabel: '🎥 LQ Run 示例',
    lqSweepVideoLabel: '🎥 LQ Sweep 示例',
    h1: '1. Buy-side Liquidity (BSL)',
    bslBox: (
      <p>
        <strong>BSL</strong> 位于<strong>Swing High / Equal High 上方</strong>——这是持有 Short 的卖方的
        Sell Stop Loss，以及等待向上 Breakout 的交易者的 Buy Stop 订单聚集的地方。当价格扎穿这个区域上方，
        然后又反转向下时，就称为 <strong>BSL Sweep</strong>——通常是 Bearish 信号。
      </p>
    ),
    h2: '2. Sell-side Liquidity (SSL)',
    sslBox: (
      <p>
        <strong>SSL</strong> 位于<strong>Swing Low / Equal Low 下方</strong>——这是持有 Long 的买方的 Buy
        Stop Loss，以及 Sell Stop 订单聚集的地方。当价格扎穿这个区域下方，然后又反转向上时，就称为{' '}
        <strong>SSL Sweep</strong>——通常是 Bullish 信号。
      </p>
    ),
    bslSweepLabel: 'BSL Sweep ⬇',
    bslSweepBody: '价格扎穿 Equal High → Wick 反转 → 等待 Bearish CHoCH/BOS 确认 → Bias Sell。',
    sslSweepLabel: 'SSL Sweep ⬆',
    sslSweepBody: '价格扎穿 Equal Low → Wick 反转 → 等待 Bullish CHoCH/BOS 确认 → Bias Buy。',
    figCaption: (
      <>
        左侧：价格用 Wick 扎入 <strong style={{ color: '#6FA8FF' }}>SSL（Equal Lows）</strong>下方，吸取 Stop
        Loss 后向上反转 + CHoCH = <strong style={{ color: '#3EC97A' }}>Bullish</strong> · 右侧：用 Wick 扎穿{' '}
        <strong style={{ color: '#6FA8FF' }}>BSL（Equal Highs）</strong>上方后向下反转 + CHoCH ={' '}
        <strong style={{ color: '#E05555' }}>Bearish</strong>
      </>
    ),
    quiz1: {
      question: '价格用 Wick 扎穿 2 个 Equal Low 点位下方，然后立即收盘反转向上——这是什么？',
      options: [
        { label: 'BSL Sweep——Bearish 信号', type: 'no' },
        { label: 'SSL Sweep——初步信号可能是 Bullish', type: 'ok' },
        { label: 'FVG', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！扎穿 Equal Low（SSL）下方后向上反转 = SSL Sweep——初步信号可能导向 Bullish（仍需等待 CHoCH/BOS 确认）。',
        no: '✗ 扎穿 Equal Low 下方属于 SSL（Sell-side），不是 BSL——SSL Sweep 通常导向 Bullish。',
      },
    },
    runVsSweepHeading: '3. LQ Run Vs Sweep',
    runVsSweepIntro: '交易者经常把 LQ Run 和 Liquidity Sweep 搞混，因为两者看起来很相似——都涉及价格穿过 Liquidity Zone，但价格的行为和含义完全不同。',
    runLabel: 'LQ Run',
    runBody: '价格穿过该区域，并且 Candle Body 收盘在区域外（不只是 Wick）——这通常是 Continuation（延续）信号，而非 Reversal。Structure 仍延续原方向。',
    sweepLabel2: 'Liquidity Sweep',
    sweepBody2: '价格只是用 Wick 短暂扎入该区域，然后立即反转回去，没有 Body Close 停留在区域外——这通常会导致相反方向出现 CHoCH/BOS（Reversal）。',
    runSweepRuleTitle: '简单判断法',
    runSweepRuleBody: '看蜡烛收盘在哪里——收盘在区域外 = Run（延续） · 收盘又回到区域内 = Sweep（可能反转）',
    h3: '4. 如何逐步识别 Liquidity Sweep',
    steps1: [
      <>
        在图上寻找看起来"紧靠在一起"的 <strong>Equal High/Low</strong> 或 Swing。
      </>,
      '等待价格用 Wick 短暂扎穿该水平（通常很快，且没有 Body Close 停留在那里）',
      <>
        观察 <strong>Reaction</strong>——价格反转回去的速度有多快。
      </>,
      <>
        等待 <strong>BOS 或 CHoCH</strong> 在相反方向出现，以确认这个 Sweep 是真正的 Reversal（如果忘记了可以回顾第 2 课）
      </>,
    ],
    quiz2: {
      question: '发现 Liquidity Sweep 之后，下一步该做什么？',
      options: [
        { label: '立即在 Wick 上进场交易', type: 'no' },
        { label: '先等待相反方向的 BOS/CHoCH 确认', type: 'ok' },
        { label: '关闭图表，改天再看', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Sweep 只是 Context，本身并非 Entry Signal——还需要额外的 Structure Confirmation。',
        no: '✗ 立即在 Wick 上进场风险很高——请先等待 BOS/CHoCH 确认方向。',
      },
    },
    h4: '5. Liquidity + Structure + OB —— 综合运用',
    confluenceBox: (
      <p>
        强 <strong>Setup</strong> 通常来自多层 Confluence 的叠加：SSL Sweep（本课）+ Bullish CHoCH（第 2 课）
        + 产生该 Displacement 的 Bullish Order Block（第 3 课）+ 同一波动中的 FVG（第 4 课）。对齐的
        Confluence 越多，Setup 就越值得信赖。
      </p>
    ),
    h5: '6. 初学者常犯的错误',
    mistake1: (
      <>
        <strong>把每一个小 Wick 都称为 Liquidity Sweep</strong>——真正的 Sweep 必须穿越重要的 Equal High/Low
        或 Swing，并伴有明显的 Reaction，而不是任意蜡烛上的普通 Wick。
      </>
    ),
    mistake2: (
      <>
        <strong>没有 Confirmation 就立即在 Sweep 上进场</strong>——Sweep 也可能只是延续原方向（False
        Signal），必须等待 BOS/CHoCH。
      </>
    ),
    mistake3: (
      <>
        <strong>忽略 Higher Timeframe 的 Liquidity</strong>——大周期（H4、Daily）上的 Zone 权重高于小周期上的
        Zone。
      </>
    ),
    rule2Title: '简单记忆法则',
    rule2Body: 'Sweep = 吸取订单，并非立即进场的信号——请先等待 Structure 确认',
    h6: '📝 实践练习',
    practiceIntro: '在做下面的 Quiz 之前，请先在 TradingView 上用你自己的实盘图表练习：',
    steps2: [
      '在图表上找出至少 1 个 Equal High 或 Equal Low 点',
      '检查价格是否曾经用 Wick 扎穿该水平，并反转回去',
      '如果有，请查看该 Sweep 之后是否出现了 BOS/CHoCH',
    ],
    h7: 'Quiz —— 检测你的知识',
    finalTestIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Buy-side Liquidity (BSL) 通常位于哪里？',
        options: [
          { label: 'Swing High / Equal High 上方', correct: true },
          { label: 'Swing Low / Equal Low 下方', correct: false },
          { label: 'Range 的中间', correct: false },
        ],
        feedbackOk: '✓ 正确！Buy Stop 和 Sell Stop Loss 聚集在 Swing High 上方。',
      },
      {
        question: 'Liquidity Sweep（Stop Hunt）具有什么特征？',
        options: [
          { label: 'Candle Body 平静地收盘穿过该 Zone', correct: false },
          { label: 'Wick 快速扎入 Zone，随后价格反转回去', correct: true },
          { label: '价格每天都以相同方式波动', correct: false },
        ],
        feedbackOk: '✓ 正确！Sweep 通常是 Wick 扎入后反转，而不是收盘并稳定停留在那里。',
      },
      {
        question: '为什么 Equal High/Low (EQH/EQL) 是很强的 Liquidity Zone？',
        options: [
          { label: '因为许多交易者把 Stop 设在同一水平——大量聚集在一起', correct: true },
          { label: '因为它的蜡烛颜色好看', correct: false },
          { label: '因为它一年只出现一次', correct: false },
        ],
        feedbackOk: '✓ 正确！重复出现的相同价格水平会吸引大量订单聚集。',
      },
      {
        question: '发现 Liquidity Sweep 之后应该怎么做？',
        options: [
          { label: '一看到 Wick 就立即进场交易', correct: false },
          { label: '先等待 Sweep 之后的 BOS/CHoCH 确认方向', correct: true },
          { label: '完全不需要做任何事', correct: false },
        ],
        feedbackOk: '✓ 正确！单独的 Sweep 还不算完整的 Signal，还需要额外的 Confirmation。',
      },
    ],
  },
};

export default function Lesson5({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const bslVideo = videos['l5-bsl']?.url;
  const sslVideo = videos['l5-ssl']?.url;
  const lqRunVideo = videos['l5-lq-run']?.url;
  const lqSweepVideo = videos['l5-lq-sweep']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: q.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="l5"
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
        {t.keywordsHeading}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.kw1Label}>
          {t.kw1Body}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.kw2Label}>
          {t.kw2Body}
        </GridItem>
      </div>

      <Rule title={t.rule1Title}>{t.rule1Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Box variant="d">{t.bslBox}</Box>
      <LessonVideo label={t.bslVideoLabel} src={bslVideo} />

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="u">{t.sslBox}</Box>
      <LessonVideo label={t.sslVideoLabel} src={sslVideo} />

      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.bslSweepLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bslSweepBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.sslSweepLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.sslSweepBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.figCaption}>
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">SELL-SIDE LIQUIDITY SWEEP</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BUY-SIDE LIQUIDITY SWEEP</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <line x1="20" y1="150" x2="330" y2="150" stroke="#6FA8FF" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="24" y="144" fontSize="9" fill="#6FA8FF" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>SSL (Equal Lows)</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="50" y1="100" x2="50" y2="145" stroke="#E05555" strokeWidth="1.3" /><rect x="44" y="108" width="12" height="30" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="95" y1="90" x2="95" y2="135" stroke="#3EC97A" strokeWidth="1.2" /><rect x="89" y="95" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="140" y1="100" x2="140" y2="152" stroke="#E05555" strokeWidth="1.3" /><rect x="134" y="108" width="12" height="35" rx="1" fill="#E05555" /></g>
          <circle cx="140" cy="150" r="3" fill="#6FA8FF" className="ac" style={{ animationDelay: '.35s' }} />
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="185" y1="95" x2="185" y2="178" stroke="#E05555" strokeWidth="1.4" /><rect x="179" y="105" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="185" y="192" textAnchor="middle" fontSize="10" fill="#6FA8FF" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Sweep ↓</text>
          <g className="ac" style={{ animationDelay: '.5s' }}><line x1="230" y1="55" x2="230" y2="110" stroke="#3EC97A" strokeWidth="1.4" /><rect x="224" y="60" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <text x="230" y="48" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>CHoCH ↑</text>
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="275" y1="25" x2="275" y2="70" stroke="#3EC97A" strokeWidth="1.3" /><rect x="269" y="28" width="12" height="30" rx="1" fill="#3EC97A" /></g>

          <line x1="370" y1="60" x2="680" y2="60" stroke="#6FA8FF" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="374" y="54" fontSize="9" fill="#6FA8FF" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>BSL (Equal Highs)</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="400" y1="65" x2="400" y2="110" stroke="#3EC97A" strokeWidth="1.3" /><rect x="394" y="72" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="445" y1="75" x2="445" y2="120" stroke="#E05555" strokeWidth="1.2" /><rect x="439" y="90" width="12" height="25" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="490" y1="58" x2="490" y2="110" stroke="#3EC97A" strokeWidth="1.3" /><rect x="484" y="67" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <circle cx="490" cy="60" r="3" fill="#6FA8FF" className="ac" style={{ animationDelay: '.35s' }} />
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="535" y1="32" x2="535" y2="115" stroke="#3EC97A" strokeWidth="1.4" /><rect x="529" y="85" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="535" y="22" textAnchor="middle" fontSize="10" fill="#6FA8FF" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Sweep ↑</text>
          <g className="ac" style={{ animationDelay: '.5s' }}><line x1="580" y1="100" x2="580" y2="155" stroke="#E05555" strokeWidth="1.4" /><rect x="574" y="110" width="12" height="40" rx="1" fill="#E05555" /></g>
          <text x="580" y="168" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>CHoCH ↓</text>
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="625" y1="140" x2="625" y2="185" stroke="#E05555" strokeWidth="1.3" /><rect x="619" y="152" width="12" height="30" rx="1" fill="#E05555" /></g>
        </svg>
      </AnimatedFig>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.runVsSweepHeading}
      </h3>
      <p>{t.runVsSweepIntro}</p>
      <div className="g2">
        <GridItem labelColor="var(--blue)" label={t.runLabel}>
          {t.runBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.sweepLabel2}>
          {t.sweepBody2}
        </GridItem>
      </div>
      <div className="g2">
        <LessonVideo label={t.lqRunVideoLabel} src={lqRunVideo} />
        <LessonVideo label={t.lqSweepVideoLabel} src={lqSweepVideo} />
      </div>
      <Rule title={t.runSweepRuleTitle}>{t.runSweepRuleBody}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Steps items={t.steps1} />

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Box variant="b">{t.confluenceBox}</Box>

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="d">
        <ul>
          <li>{t.mistake1}</li>
          <li>{t.mistake2}</li>
          <li>{t.mistake3}</li>
        </ul>
      </Box>
      <Rule title={t.rule2Title}>{t.rule2Body}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.steps2} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
