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

const meta = getLessonMeta('l2');

// All translatable text for this lesson, keyed by language. The JSX below
// (structure, SVG diagram, media) stays identical across languages — only
// this content swaps. Trading terms (BOS, CHoCH, Swing High/Low, HH/HL/LH/LL,
// Bullish/Bearish, etc.) are kept in English in every language since that's
// the universal jargon traders use, in Khmer-language trading communities too.
const CONTENT = {
  kh: {
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    svgBosCaption: 'Trend បន្តឡើងដដែល',
    svgChochCaption: 'Trend អាចកំពុងប្តូរទិស',
    intro: (
      <>
        បន្ទាប់ពីយើងយល់ពី <strong>Market Structure</strong> (មេរៀនទី ១) រួចហើយ ថ្ងៃនេះយើងនឹងរៀនអានថា ពេល Price
        Break ចេញពី Swing ចាស់មួយ តើវាមានន័យអ្វី — <strong>បន្តទិសដើម</strong> ឬ{' '}
        <strong>ចាប់ផ្តើមប្តូរទិស</strong>? នេះហើយជាតួនាទីរបស់ <strong>BOS (Break of Structure)</strong> និង{' '}
        <strong>CHoCH (Change of Character)</strong>។
      </>
    ),
    analogyBox: (
      <p>
        <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Trend ជា <strong>រថភ្លើងមួយ</strong> កំពុងរត់លើផ្លូវថេរ។ BOS
        ដូចរថភ្លើងបន្តរត់លើផ្លូវដដែល — Trend នៅតែដដែល។ ចំណែក CHoCH ដូចរថភ្លើងចាប់ផ្តើម{' '}
        <strong>បត់ចេញពីផ្លូវចាស់</strong> — មិនទាន់ដឹងច្បាស់ថាទៅទិសណា ប៉ុន្តែជាសញ្ញាដំបូងថា អ្វីមួយកំពុងផ្លាស់ប្តូរ។
      </p>
    ),
    keyTermsHeading: 'ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន',
    protectedSwingLabel: 'Protected Swing',
    protectedSwingBody: (
      <>
        Swing Point សំខាន់ដែល Trend កំពុង "ការពារ" — ឧ. HL ក្នុង Uptrend។ បើ Break Swing នេះ Trend ចាស់ចាត់ទុកថាមានបញ្ហា។
      </>
    ),
    contextLabel: 'Context',
    contextBody: (
      <>ស្ថានភាពទូទៅនៃ Chart (Trend ទិសណា, Swing នៅឯណា) មុននឹងសម្រេចថា Break មួយជា BOS ឬ CHoCH។</>
    ),
    ruleBosChochTitle: 'BOS = Continuation · CHoCH = Possible Reversal',
    ruleBosChochBody: 'មើល Context និង Swing ដែល Price Break មិនមែនមើលតែ Candlestick មួយគត់',
    hBos: '១. BOS (Break of Structure) ជាអ្វី?',
    bosDef: (
      <>
        <strong>BOS</strong> កើតឡើងនៅពេល Price <strong>Break Swing Structure សំខាន់ក្នុងទិសដើម</strong>។ វាបង្ហាញថា
        Momentum និង Structure នៅតែគាំទ្រ Trend នោះ។
      </>
    ),
    bullishBosLabel: 'Bullish BOS ⬆',
    bullishBosBody: (
      <>
        ក្នុង Uptrend មាន HH និង HL។ នៅពេល Price Break <strong>Previous Swing High</strong> → Bullish BOS → Bias
        បន្តឡើង។
      </>
    ),
    bearishBosLabel: 'Bearish BOS ⬇',
    bearishBosBody: (
      <>
        ក្នុង Downtrend មាន LH និង LL។ នៅពេល Price Break <strong>Previous Swing Low</strong> → Bearish BOS → Bias
        បន្តចុះ។
      </>
    ),
    bosKeyPointBox: (
      <p>
        <strong>ចំណុចសំខាន់:</strong> BOS មិនមានន័យថា "ចូល Trade ភ្លាមៗ" ទេ។ វាគ្រាន់តែជាសញ្ញាថា Structure កំពុងបន្តក្នុងទិសដើម។
      </p>
    ),
    bosVideoLabel: '🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView — BOS',
    quiz1: {
      question: 'ក្នុង Downtrend (LH-LL) ប្រសិនបើ Price Break Previous Swing Low តាមទិសចុះ តើនេះជាអ្វី?',
      options: [
        { label: 'Bearish BOS', type: 'ok' },
        { label: 'Bullish CHoCH', type: 'no' },
        { label: 'Order Block', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Break Swing Low តាមទិស Downtrend ដដែល = Bearish BOS (Continuation)។',
        no: '✗ Break Swing តាមទិស Trend ដដែល (ចុះបន្តចុះ) ត្រូវហៅថា Bearish BOS មិនមែន CHoCH ទេ។',
      },
    },
    hChoch: '២. CHoCH (Change of Character) ជាអ្វី?',
    chochDef: (
      <>
        <strong>CHoCH</strong> ជាសញ្ញាដំបូងថា Character របស់ Price អាចកំពុងផ្លាស់ប្តូរ។ ជាទូទៅ វាកើតឡើងនៅពេល Price{' '}
        <strong>Break Swing ដែលផ្ទុយពី Trend មុន</strong>។
      </>
    ),
    bullishChochLabel: 'Bullish CHoCH ↗',
    bullishChochBody: (
      <>
        Downtrend: LH → LL → LH → បន្ទាប់មក Price Break <strong>Previous LH</strong>។ នេះបង្ហាញថា Sellers អាចកំពុងខ្សោយ។
      </>
    ),
    bearishChochLabel: 'Bearish CHoCH ↘',
    bearishChochBody: (
      <>
        Uptrend: HH → HL → HH → បន្ទាប់មក Price Break <strong>Previous HL</strong>។ នេះបង្ហាញថា Buyers អាចកំពុងខ្សោយ។
      </>
    ),
    chochNoteBox: (
      <p>
        <strong>ចំណាំ:</strong> CHoCH ជា <strong>Possible Reversal Signal</strong> មិនមែន Confirmation ថា Trend ប្តូររួច
        100% ទេ។ Trader ត្រូវរង់ចាំ Context និង Confirmation បន្ថែម។
      </p>
    ),
    chochVideoLabel: '🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView — CHoCH',
    quiz2: {
      question: 'Uptrend មាន HH → HL → HH រួច Price ធ្លាក់ចុះ Break HL សំខាន់ — តើនេះជាសញ្ញាអ្វី?',
      options: [
        { label: 'Bullish BOS — បន្តឡើង', type: 'no' },
        { label: 'Bearish CHoCH — Buyer អាចកំពុងចុះខ្សោយ', type: 'ok' },
        { label: 'គ្មានន័យអ្វីទេ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Break HL ក្នុង Uptrend ផ្ទុយពី Trend ដើម = Bearish CHoCH (សញ្ញាដំបូងនៃការប្តូរទិស)។',
        no: '✗ Break Swing ផ្ទុយពី Trend ដើម (Uptrend ធ្លាក់ Break HL) ត្រូវហៅថា CHoCH មិនមែន BOS ទេ។',
      },
    },
    hDiff: '៣. BOS vs CHoCH — ខុសគ្នាត្រង់ណា?',
    bosCompareLabel: 'BOS',
    bosCompareBody: (
      <>
        <strong>Break តាមទិស Trend</strong>
        <br />
        បង្ហាញពី Continuation
        <br />
        ឧទាហរណ៍: Uptrend Break HH
      </>
    ),
    chochCompareLabel: 'CHoCH',
    chochCompareBody: (
      <>
        <strong>Break ផ្ទុយពី Trend មុន</strong>
        <br />
        បង្ហាញពី Possible Reversal
        <br />
        ឧទាហរណ៍: Uptrend Break HL
      </>
    ),
    animatedFigCaption: (
      <>
        ខាងឆ្វេង៖ Price Break លើ <strong style={{ color: '#3EC97A' }}>Previous High</strong> → បន្តទិសដើម ={' '}
        <strong style={{ color: '#3EC97A' }}>BOS</strong> · ខាងស្ដាំ៖ Price Break ក្រោម{' '}
        <strong style={{ color: '#5B9BD5' }}>Previous Low ដែល Trend កំពុងការពារ</strong> → ប្តូរទិស ={' '}
        <strong style={{ color: '#5B9BD5' }}>CHoCH</strong>
      </>
    ),
    hBosSteps: '៤. របៀបសម្គាល់ BOS ជាជំហានៗ',
    bosSteps: [
      <>
        កំណត់ថា Market បច្ចុប្បន្នជា <strong>Bullish</strong>, <strong>Bearish</strong> ឬ Sideways។
      </>,
      <>
        សម្គាល់ <strong>Swing High</strong> និង <strong>Swing Low</strong> ដែលសំខាន់។
      </>,
      <>
        រង់ចាំ Price Break Swing ក្នុង <strong>ទិសដូច Trend</strong>។
      </>,
      <>
        ប្រសិនបើ Break មាន Context ត្រឹមត្រូវ → អានជា <strong>BOS / Continuation</strong>។
      </>,
    ],
    hChochSteps: '៥. របៀបសម្គាល់ CHoCH ជាជំហានៗ',
    chochSteps: [
      'ស្គាល់ Trend មុនសិន — Uptrend ឬ Downtrend។',
      <>
        កំណត់ <strong>Protected Swing</strong> ឬ Swing ដែល Trend កំពុងគោរព។
      </>,
      <>
        រង់ចាំ Price Break Swing នោះ <strong>ផ្ទុយពីទិសមុន</strong>។
      </>,
      <>
        អានវាជា <strong>CHoCH</strong> ហើយរង់ចាំ Structure បន្ទាប់ដើម្បីមើលថា Reversal ត្រូវបាន Confirm ឬអត់។
      </>,
    ],
    exampleBox: (
      <p>
        <strong>Example:</strong> Uptrend មាន HH → HL → HH។ ប្រសិនបើ Price បន្ត Break HH = <strong>Bullish BOS</strong>។
        ប៉ុន្តែបើ Price ចុះ Break HL សំខាន់ = <strong>Bearish CHoCH</strong>។ បន្ទាប់មកយើងត្រូវមើល Structure បន្ត
        មុនសម្រេចថា Trend បាន Reverse ពិតប្រាកដ។
      </p>
    ),
    hMistakes: '៦. កំហុសដែល Beginner ជួបញឹកញាប់',
    mistakes: [
      <>
        <strong>ហៅ Break តូចៗគ្រប់កន្លែងថា BOS ឬ CHoCH</strong> — Wick ឆ្លងកាត់មួយភ្លែត ឬ Break ដោយគ្មាន
        Momentum មិនទាន់រាប់ជា BOS/CHoCH ពិតប្រាកដទេ ត្រូវការ Candle Body Close ច្បាស់លាស់។
      </>,
      <>
        <strong>មិនកំណត់ Trend និង Swing សំខាន់មុនពេល Mark Structure</strong> — បើមិនដឹងថា Trend បច្ចុប្បន្នជា
        អ្វី នឹងច្រឡំមិនដឹងថា Break មួយជា Continuation ឬ Reversal។
      </>,
      <>
        <strong>ឃើញ CHoCH ម្តង ហើយសន្និដ្ឋានថា Trend Reverse 100%</strong> — CHoCH គ្រាន់តែជា{' '}
        <em>សញ្ញាដំបូង</em> ត្រូវរង់ចាំ Structure បន្ទាប់ទៀត (BOS ក្នុងទិសថ្មី) ដើម្បីបញ្ជាក់។
      </>,
      <>
        <strong>ចូល Trade ដោយគ្មាន Confirmation ឬ Risk Management</strong> — សូម្បី Signal ល្អ ក៏នៅតែអាចខុសបាន
        Stop Loss និង Position Size តូចជានិច្ចត្រូវមានគ្រប់ Trade។
      </>,
    ],
    easyRuleTitle: 'ច្បាប់ងាយចាំ',
    easyRuleBody: 'Break តាម Trend = BOS · Break ផ្ទុយពី Trend = CHoCH',
    practiceHeading: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView (Timeframe ណាក៏បាន) ៖',
    practiceSteps: [
      'កំណត់ Trend បច្ចុប្បន្ន — Bullish, Bearish ឬ Sideways (ត្រលប់ទៅមេរៀនទី ១ បើភ្លេច)',
      'រកមើល BOS ចំនួន ២-៣ កន្លែងលើ Chart — Mark ដោយបន្ទាត់ផ្ដេក',
      'រកមើល CHoCH យ៉ាងហោចណាស់ ១ កន្លែង — សម្គាល់ថា Swing ណាដែលត្រូវ Break ដើម្បីកើតឡើង',
      'ថតរូបជាមួយ Mark របស់អ្នក ដើម្បីប្រៀបធៀបជាមួយវីដេអូខាងលើម្ដងទៀត',
    ],
    quizHeading: 'Quiz — សាកល្បងចំណេះដឹង',
    quizIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។
      </>
    ),
    finalTestNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finalTestQuestions: [
      {
        question: 'ក្នុង Uptrend ប្រសិនបើ Price Break Previous Swing High តាមទិសឡើង នេះជាអ្វី?',
        options: [
          { label: 'Bullish BOS', correct: true },
          { label: 'Bearish CHoCH', correct: false },
          { label: 'Sideways', correct: false },
        ],
        okFeedback: '✓ ត្រឹមត្រូវ! BOS បង្ហាញពី Continuation តាមទិស Trend។',
      },
      {
        question: 'ក្នុង Uptrend ប្រសិនបើ Price Break Previous Higher Low (HL) សំខាន់ នេះជាសញ្ញាអ្វី?',
        options: [
          { label: 'Bullish BOS', correct: false },
          { label: 'Bearish CHoCH', correct: true },
          { label: 'Bullish Trend Confirmation', correct: false },
        ],
        okFeedback: '✓ ត្រឹមត្រូវ! Break HL ផ្ទុយពី Uptrend អាចបង្ហាញពី CHoCH។',
      },
      {
        question: 'តើ CHoCH មានន័យថា Trend Reverse 100% រួចហើយឬ?',
        options: [
          { label: 'បាទ/ចាស 100%', correct: false },
          { label: 'ទេ វាជា Possible Reversal Signal ហើយត្រូវការ Confirmation បន្ថែម', correct: true },
          { label: 'CHoCH មិនពាក់ព័ន្ធនឹង Trend ទេ', correct: false },
        ],
        okFeedback: '✓ ត្រឹមត្រូវ! CHoCH ជាសញ្ញាផ្លាស់ប្តូរដំបូង មិនមែន Guarantee។',
      },
      {
        question: 'តើជំហានដំបូងមុនសម្គាល់ BOS ឬ CHoCH គឺអ្វី?',
        options: [
          { label: 'កំណត់ Trend និង Swing Structure ជាមុន', correct: true },
          { label: 'ចូល Buy/Sell ភ្លាមៗ', correct: false },
          { label: 'មើល Candlestick តែមួយ', correct: false },
        ],
        okFeedback: '✓ ត្រឹមត្រូវ! Context និង Swing Structure គឺជាមូលដ្ឋាន។',
      },
    ],
  },
  en: {
    finishLocked: (p, t) => `🔒 Finish lesson (${p}/${t})`,
    finishUnlocked: '✓ Finish lesson',
    svgBosCaption: 'Trend keeps rising',
    svgChochCaption: 'Trend may be reversing',
    intro: (
      <>
        Now that we understand <strong>Market Structure</strong> (Lesson 1), today we'll learn to read what it
        means when price breaks out of an old Swing — is it a <strong>continuation</strong> of the original
        direction, or the <strong>start of a reversal</strong>? This is exactly the role of{' '}
        <strong>BOS (Break of Structure)</strong> and <strong>CHoCH (Change of Character)</strong>.
      </>
    ),
    analogyBox: (
      <p>
        <strong>🧠 Simple way to think about it:</strong> Imagine a Trend is a <strong>train</strong> running
        on a fixed track. BOS is like the train continuing on the same track — the Trend stays the same.
        CHoCH, on the other hand, is like the train starting to <strong>veer off the old track</strong> — we
        don't yet know exactly where it's heading, but it's the first sign that something is changing.
      </p>
    ),
    keyTermsHeading: 'Key Terms to Know Before This Lesson',
    protectedSwingLabel: 'Protected Swing',
    protectedSwingBody: (
      <>
        The key Swing Point that the Trend is currently "protecting" — e.g. the HL in an Uptrend. If this
        Swing gets broken, the old Trend is considered to be in trouble.
      </>
    ),
    contextLabel: 'Context',
    contextBody: (
      <>The overall state of the chart (which way the Trend is going, where the Swings are) before deciding whether a Break is a BOS or a CHoCH.</>
    ),
    ruleBosChochTitle: 'BOS = Continuation · CHoCH = Possible Reversal',
    ruleBosChochBody: 'Look at the Context and the Swing that price is breaking — don\'t just look at a single candlestick',
    hBos: '1. What is BOS (Break of Structure)?',
    bosDef: (
      <>
        <strong>BOS</strong> happens when price <strong>breaks a key Swing Structure in the original
        direction</strong>. It shows that Momentum and Structure are still supporting that Trend.
      </>
    ),
    bullishBosLabel: 'Bullish BOS ⬆',
    bullishBosBody: (
      <>
        In an Uptrend there's HH and HL. When price breaks the <strong>Previous Swing High</strong> → Bullish
        BOS → Bias continues up.
      </>
    ),
    bearishBosLabel: 'Bearish BOS ⬇',
    bearishBosBody: (
      <>
        In a Downtrend there's LH and LL. When price breaks the <strong>Previous Swing Low</strong> → Bearish
        BOS → Bias continues down.
      </>
    ),
    bosKeyPointBox: (
      <p>
        <strong>Key point:</strong> BOS doesn't mean "enter a trade immediately." It's simply a sign that
        Structure is continuing in its original direction.
      </p>
    ),
    bosVideoLabel: '🎥 Real example video from TradingView — BOS',
    quiz1: {
      question: 'In a Downtrend (LH-LL), if price breaks the Previous Swing Low in the downward direction, what is this?',
      options: [
        { label: 'Bearish BOS', type: 'ok' },
        { label: 'Bullish CHoCH', type: 'no' },
        { label: 'Order Block', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Breaking the Swing Low in the same direction as the Downtrend = Bearish BOS (Continuation).',
        no: '✗ Breaking a Swing in the same direction as the Trend (continuing to fall) is called Bearish BOS, not CHoCH.',
      },
    },
    hChoch: '2. What is CHoCH (Change of Character)?',
    chochDef: (
      <>
        <strong>CHoCH</strong> is the first sign that price's Character might be changing. It generally
        happens when price <strong>breaks a Swing that goes against the previous Trend</strong>.
      </>
    ),
    bullishChochLabel: 'Bullish CHoCH ↗',
    bullishChochBody: (
      <>
        Downtrend: LH → LL → LH → then price breaks the <strong>Previous LH</strong>. This shows that Sellers
        might be weakening.
      </>
    ),
    bearishChochLabel: 'Bearish CHoCH ↘',
    bearishChochBody: (
      <>
        Uptrend: HH → HL → HH → then price breaks the <strong>Previous HL</strong>. This shows that Buyers
        might be weakening.
      </>
    ),
    chochNoteBox: (
      <p>
        <strong>Note:</strong> CHoCH is a <strong>Possible Reversal Signal</strong>, not confirmation that the
        Trend has 100% reversed. A trader needs to wait for more Context and Confirmation.
      </p>
    ),
    chochVideoLabel: '🎥 Real example video from TradingView — CHoCH',
    quiz2: {
      question: 'An Uptrend has HH → HL → HH, then price drops and breaks the key HL — what signal is this?',
      options: [
        { label: 'Bullish BOS — continuing up', type: 'no' },
        { label: 'Bearish CHoCH — Buyers might be weakening', type: 'ok' },
        { label: "Doesn't mean anything", type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Breaking the HL in an Uptrend, against the original Trend, = Bearish CHoCH (the first sign of a possible direction change).',
        no: '✗ Breaking a Swing against the original Trend (Uptrend dropping to break the HL) is called CHoCH, not BOS.',
      },
    },
    hDiff: "3. BOS vs CHoCH — What's the Difference?",
    bosCompareLabel: 'BOS',
    bosCompareBody: (
      <>
        <strong>Break in the direction of the Trend</strong>
        <br />
        Shows Continuation
        <br />
        Example: Uptrend breaks HH
      </>
    ),
    chochCompareLabel: 'CHoCH',
    chochCompareBody: (
      <>
        <strong>Break against the previous Trend</strong>
        <br />
        Shows Possible Reversal
        <br />
        Example: Uptrend breaks HL
      </>
    ),
    animatedFigCaption: (
      <>
        Left: Price breaks above the <strong style={{ color: '#3EC97A' }}>Previous High</strong> → continues
        the original direction = <strong style={{ color: '#3EC97A' }}>BOS</strong> · Right: Price breaks
        below the <strong style={{ color: '#5B9BD5' }}>Previous Low that the Trend is protecting</strong> →
        changes direction = <strong style={{ color: '#5B9BD5' }}>CHoCH</strong>
      </>
    ),
    hBosSteps: '4. How to Identify BOS Step by Step',
    bosSteps: [
      <>
        Determine whether the current Market is <strong>Bullish</strong>, <strong>Bearish</strong>, or
        Sideways.
      </>,
      <>
        Identify the key <strong>Swing High</strong> and <strong>Swing Low</strong>.
      </>,
      <>
        Wait for price to break a Swing in the <strong>same direction as the Trend</strong>.
      </>,
      <>
        If the Break has the right Context → read it as <strong>BOS / Continuation</strong>.
      </>,
    ],
    hChochSteps: '5. How to Identify CHoCH Step by Step',
    chochSteps: [
      'First identify the Trend — Uptrend or Downtrend.',
      <>
        Identify the <strong>Protected Swing</strong>, or the Swing the Trend is currently respecting.
      </>,
      <>
        Wait for price to break that Swing <strong>against the previous direction</strong>.
      </>,
      <>
        Read it as <strong>CHoCH</strong>, then wait for the next Structure to see whether the Reversal gets
        confirmed or not.
      </>,
    ],
    exampleBox: (
      <p>
        <strong>Example:</strong> An Uptrend has HH → HL → HH. If price continues to break the HH ={' '}
        <strong>Bullish BOS</strong>. But if price drops and breaks the key HL ={' '}
        <strong>Bearish CHoCH</strong>. After that, we still need to watch the next Structure before deciding
        that the Trend has truly reversed.
      </p>
    ),
    hMistakes: '6. Common Mistakes Beginners Make',
    mistakes: [
      <>
        <strong>Calling every small break a BOS or CHoCH</strong> — a wick briefly crossing over, or a break
        with no Momentum, doesn't yet count as a real BOS/CHoCH — you need a clear candle body close.
      </>,
      <>
        <strong>Not identifying the Trend and key Swings before marking Structure</strong> — if you don't
        know what the current Trend is, you'll get confused about whether a Break is a Continuation or a
        Reversal.
      </>,
      <>
        <strong>Seeing one CHoCH and concluding the Trend has 100% reversed</strong> — CHoCH is only a{' '}
        <em>first sign</em> — you need to wait for the next Structure (a BOS in the new direction) to
        confirm it.
      </>,
      <>
        <strong>Entering a trade with no Confirmation or Risk Management</strong> — even a good signal can
        still be wrong; every trade always needs a Stop Loss and a sensibly small Position Size.
      </>,
    ],
    easyRuleTitle: 'Easy rule to remember',
    easyRuleBody: 'Break with the Trend = BOS · Break against the Trend = CHoCH',
    practiceHeading: '📝 Practice Exercise',
    practiceIntro: 'Before doing the Quiz below, practice with your own chart on TradingView (any Timeframe):',
    practiceSteps: [
      'Identify the current Trend — Bullish, Bearish, or Sideways (go back to Lesson 1 if you forget)',
      'Find 2-3 BOS spots on the chart — mark them with a horizontal line',
      'Find at least 1 CHoCH spot — identify which Swing needed to break for it to happen',
      'Screenshot your marked chart to compare with the videos above again',
    ],
    quizHeading: 'Quiz — Test Your Understanding',
    quizIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestNo: '✗ Not quite — try again.',
    finalTestQuestions: [
      {
        question: 'In an Uptrend, if price breaks the Previous Swing High in the upward direction, what is this?',
        options: [
          { label: 'Bullish BOS', correct: true },
          { label: 'Bearish CHoCH', correct: false },
          { label: 'Sideways', correct: false },
        ],
        okFeedback: '✓ Correct! BOS shows Continuation in the direction of the Trend.',
      },
      {
        question: 'In an Uptrend, if price breaks the key Previous Higher Low (HL), what signal is this?',
        options: [
          { label: 'Bullish BOS', correct: false },
          { label: 'Bearish CHoCH', correct: true },
          { label: 'Bullish Trend Confirmation', correct: false },
        ],
        okFeedback: '✓ Correct! Breaking the HL against the Uptrend can signal a CHoCH.',
      },
      {
        question: 'Does CHoCH mean the Trend has already 100% reversed?',
        options: [
          { label: 'Yes, 100%', correct: false },
          { label: "No, it's a Possible Reversal Signal and needs further Confirmation", correct: true },
          { label: 'CHoCH has nothing to do with the Trend', correct: false },
        ],
        okFeedback: '✓ Correct! CHoCH is an initial change signal, not a guarantee.',
      },
      {
        question: 'What is the first step before identifying a BOS or CHoCH?',
        options: [
          { label: 'Identify the Trend and Swing Structure first', correct: true },
          { label: 'Enter Buy/Sell immediately', correct: false },
          { label: 'Look at just one candlestick', correct: false },
        ],
        okFeedback: '✓ Correct! Context and Swing Structure are the foundation.',
      },
    ],
  },
  zh: {
    finishLocked: (p, t) => `🔒 完成课程 (${p}/${t})`,
    finishUnlocked: '✓ 完成课程',
    svgBosCaption: 'Trend 继续上升',
    svgChochCaption: 'Trend 可能正在反转',
    intro: (
      <>
        在理解了 <strong>Market Structure</strong>（第 1 课）之后，今天我们要学习：当价格 Break 出旧的 Swing 时，
        这到底意味着<strong>延续原有方向</strong>，还是<strong>开始反转</strong>？这正是{' '}
        <strong>BOS (Break of Structure)</strong> 和 <strong>CHoCH (Change of Character)</strong> 的作用。
      </>
    ),
    analogyBox: (
      <p>
        <strong>🧠 简单理解：</strong>把 Trend 想象成一列在固定轨道上行驶的<strong>火车</strong>。BOS
        就像火车继续沿着原来的轨道行驶——Trend 保持不变。而 CHoCH 就像火车开始
        <strong>偏离原来的轨道</strong>——虽然还不确定会开往哪个方向，但这是"某些东西正在改变"的第一个信号。
      </p>
    ),
    keyTermsHeading: '进入本课前需要掌握的关键术语',
    protectedSwingLabel: 'Protected Swing',
    protectedSwingBody: (
      <>Trend 正在"保护"的关键 Swing Point——例如 Uptrend 中的 HL。如果这个 Swing 被突破，旧的 Trend 就被视为出现问题。</>
    ),
    contextLabel: 'Context',
    contextBody: (
      <>在判断某次 Break 属于 BOS 还是 CHoCH 之前，图表的整体状态（Trend 方向、Swing 位置）。</>
    ),
    ruleBosChochTitle: 'BOS = Continuation · CHoCH = Possible Reversal',
    ruleBosChochBody: '要看 Context 和价格突破的 Swing，而不是只看单根蜡烛',
    hBos: '1. 什么是 BOS（Break of Structure）？',
    bosDef: (
      <>
        当价格<strong>朝原有方向突破关键 Swing Structure</strong>时，就会发生 <strong>BOS</strong>。这表明
        Momentum 和 Structure 仍在支撑该 Trend。
      </>
    ),
    bullishBosLabel: 'Bullish BOS ⬆',
    bullishBosBody: (
      <>
        在 Uptrend 中会出现 HH 和 HL。当价格突破 <strong>Previous Swing High</strong> → Bullish BOS →
        偏向继续上涨。
      </>
    ),
    bearishBosLabel: 'Bearish BOS ⬇',
    bearishBosBody: (
      <>
        在 Downtrend 中会出现 LH 和 LL。当价格突破 <strong>Previous Swing Low</strong> → Bearish BOS →
        偏向继续下跌。
      </>
    ),
    bosKeyPointBox: (
      <p>
        <strong>重点：</strong>BOS 并不意味着"立即进场交易"。它只是表明 Structure 正在延续原有方向的信号。
      </p>
    ),
    bosVideoLabel: '🎥 来自 TradingView 的真实案例视频 — BOS',
    quiz1: {
      question: '在 Downtrend（LH-LL）中，如果价格向下突破 Previous Swing Low，这是什么？',
      options: [
        { label: 'Bearish BOS', type: 'ok' },
        { label: 'Bullish CHoCH', type: 'no' },
        { label: 'Order Block', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！沿着原有 Downtrend 方向突破 Swing Low = Bearish BOS（Continuation）。',
        no: '✗ 沿着原有 Trend 方向突破 Swing（继续下跌）应称为 Bearish BOS，而不是 CHoCH。',
      },
    },
    hChoch: '2. 什么是 CHoCH（Change of Character）？',
    chochDef: (
      <>
        <strong>CHoCH</strong> 是价格 Character 可能正在改变的第一个信号。通常发生在价格
        <strong>突破与之前 Trend 方向相反的 Swing</strong>时。
      </>
    ),
    bullishChochLabel: 'Bullish CHoCH ↗',
    bullishChochBody: (
      <>
        Downtrend：LH → LL → LH → 随后价格突破 <strong>Previous LH</strong>。这表明 Sellers 可能正在减弱。
      </>
    ),
    bearishChochLabel: 'Bearish CHoCH ↘',
    bearishChochBody: (
      <>
        Uptrend：HH → HL → HH → 随后价格突破 <strong>Previous HL</strong>。这表明 Buyers 可能正在减弱。
      </>
    ),
    chochNoteBox: (
      <p>
        <strong>注意：</strong>CHoCH 是 <strong>Possible Reversal Signal</strong>，并不能确认 Trend 已经 100%
        反转。交易者需要等待更多的 Context 和 Confirmation。
      </p>
    ),
    chochVideoLabel: '🎥 来自 TradingView 的真实案例视频 — CHoCH',
    quiz2: {
      question: 'Uptrend 出现 HH → HL → HH，之后价格下跌并突破关键 HL——这是什么信号？',
      options: [
        { label: 'Bullish BOS — 继续上涨', type: 'no' },
        { label: 'Bearish CHoCH — Buyer 可能正在减弱', type: 'ok' },
        { label: '没有任何意义', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！在 Uptrend 中突破 HL，与原有 Trend 方向相反 = Bearish CHoCH（可能转向的第一个信号）。',
        no: '✗ 与原有 Trend 方向相反地突破 Swing（Uptrend 下跌突破 HL）应称为 CHoCH，而不是 BOS。',
      },
    },
    hDiff: '3. BOS vs CHoCH — 有什么区别？',
    bosCompareLabel: 'BOS',
    bosCompareBody: (
      <>
        <strong>沿 Trend 方向的 Break</strong>
        <br />
        表示 Continuation
        <br />
        例如：Uptrend 突破 HH
      </>
    ),
    chochCompareLabel: 'CHoCH',
    chochCompareBody: (
      <>
        <strong>与之前 Trend 相反方向的 Break</strong>
        <br />
        表示 Possible Reversal
        <br />
        例如：Uptrend 突破 HL
      </>
    ),
    animatedFigCaption: (
      <>
        左侧：价格向上突破 <strong style={{ color: '#3EC97A' }}>Previous High</strong> → 延续原有方向 ={' '}
        <strong style={{ color: '#3EC97A' }}>BOS</strong> · 右侧：价格向下突破{' '}
        <strong style={{ color: '#5B9BD5' }}>Trend 正在保护的 Previous Low</strong> → 方向改变 ={' '}
        <strong style={{ color: '#5B9BD5' }}>CHoCH</strong>
      </>
    ),
    hBosSteps: '4. 如何逐步识别 BOS',
    bosSteps: [
      <>
        判断当前 Market 是 <strong>Bullish</strong>、<strong>Bearish</strong> 还是 Sideways。
      </>,
      <>
        标出关键的 <strong>Swing High</strong> 和 <strong>Swing Low</strong>。
      </>,
      <>
        等待价格朝<strong>与 Trend 相同的方向</strong>突破 Swing。
      </>,
      <>
        如果 Break 具备正确的 Context → 判读为 <strong>BOS / Continuation</strong>。
      </>,
    ],
    hChochSteps: '5. 如何逐步识别 CHoCH',
    chochSteps: [
      '先确定 Trend — Uptrend 还是 Downtrend。',
      <>
        确定 <strong>Protected Swing</strong>，即 Trend 正在遵守的 Swing。
      </>,
      <>
        等待价格朝<strong>与之前方向相反</strong>的方向突破该 Swing。
      </>,
      <>
        将其判读为 <strong>CHoCH</strong>，然后等待下一个 Structure，看 Reversal 是否得到 Confirm。
      </>,
    ],
    exampleBox: (
      <p>
        <strong>Example：</strong>Uptrend 出现 HH → HL → HH。如果价格继续突破 HH = <strong>Bullish BOS</strong>。
        但如果价格下跌并突破关键的 HL = <strong>Bearish CHoCH</strong>。之后我们仍需观察后续 Structure，
        才能确定 Trend 是否真的已经 Reverse。
      </p>
    ),
    hMistakes: '6. 初学者常见的错误',
    mistakes: [
      <>
        <strong>把到处的小 Break 都称为 BOS 或 CHoCH</strong> — 影线短暂穿过，或没有 Momentum 的 Break，
        还不能算作真正的 BOS/CHoCH，需要有明确的 Candle Body Close。
      </>,
      <>
        <strong>在标记 Structure 之前没有先确定 Trend 和关键 Swing</strong> — 如果不知道当前 Trend 是什么，
        就会分不清某次 Break 是 Continuation 还是 Reversal。
      </>,
      <>
        <strong>看到一次 CHoCH 就断定 Trend 已经 100% 反转</strong> — CHoCH 只是一个<em>初步信号</em>，
        需要等待下一个 Structure（新方向上的 BOS）来加以确认。
      </>,
      <>
        <strong>在没有 Confirmation 或 Risk Management 的情况下进场交易</strong> — 即使是好的 Signal
        也仍可能出错，每笔交易都必须始终设置 Stop Loss 并使用合理偏小的 Position Size。
      </>,
    ],
    easyRuleTitle: '简单易记的规则',
    easyRuleBody: '顺 Trend 方向的 Break = BOS · 逆 Trend 方向的 Break = CHoCH',
    practiceHeading: '📝 练习',
    practiceIntro: '在做下方 Quiz 之前，请先在 TradingView 上用你自己的图表练习（任意 Timeframe）：',
    practiceSteps: [
      '确定当前 Trend — Bullish、Bearish 还是 Sideways（忘记了可以回顾第 1 课）',
      '在图表上找出 2-3 处 BOS —— 用水平线标出',
      '至少找出 1 处 CHoCH —— 标出需要突破哪个 Swing 才会发生',
      '把你标注好的图表截图，再与上方视频对比',
    ],
    quizHeading: 'Quiz — 检验你的理解',
    quizIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestNo: '✗ 不正确，请再试一次。',
    finalTestQuestions: [
      {
        question: '在 Uptrend 中，如果价格向上突破 Previous Swing High，这是什么？',
        options: [
          { label: 'Bullish BOS', correct: true },
          { label: 'Bearish CHoCH', correct: false },
          { label: 'Sideways', correct: false },
        ],
        okFeedback: '✓ 正确！BOS 表示沿 Trend 方向的 Continuation。',
      },
      {
        question: '在 Uptrend 中，如果价格突破关键的 Previous Higher Low (HL)，这是什么信号？',
        options: [
          { label: 'Bullish BOS', correct: false },
          { label: 'Bearish CHoCH', correct: true },
          { label: 'Bullish Trend Confirmation', correct: false },
        ],
        okFeedback: '✓ 正确！逆着 Uptrend 突破 HL 可能表示 CHoCH。',
      },
      {
        question: 'CHoCH 是否意味着 Trend 已经 100% 反转？',
        options: [
          { label: '是的，100%', correct: false },
          { label: '不是，它只是 Possible Reversal Signal，还需要进一步的 Confirmation', correct: true },
          { label: 'CHoCH 与 Trend 无关', correct: false },
        ],
        okFeedback: '✓ 正确！CHoCH 只是初步的变化信号，并不是 Guarantee。',
      },
      {
        question: '在识别 BOS 或 CHoCH 之前，第一步应该是什么？',
        options: [
          { label: '先确定 Trend 和 Swing Structure', correct: true },
          { label: '立即进场 Buy/Sell', correct: false },
          { label: '只看一根蜡烛', correct: false },
        ],
        okFeedback: '✓ 正确！Context 和 Swing Structure 是基础。',
      },
    ],
  },
};

export default function Lesson2({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const bosVideo = videos['l2-bos']?.url;
  const chochVideo = videos['l2-choch']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map(({ okFeedback, ...q }) => ({
    ...q,
    feedback: { ok: okFeedback, no: t.finalTestNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="l2"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <p>{t.intro}</p>

      <Box variant="g">{t.analogyBox}</Box>

      <h3>
        <span className="bar"></span>
        {t.keyTermsHeading}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label={t.protectedSwingLabel}>
          {t.protectedSwingBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.contextLabel}>
          {t.contextBody}
        </GridItem>
      </div>

      <Rule title={t.ruleBosChochTitle}>{t.ruleBosChochBody}</Rule>

      <h3>
        <span className="bar"></span>
        {t.hBos}
      </h3>
      <p>{t.bosDef}</p>

      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.bullishBosLabel}>
          {t.bullishBosBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.bearishBosLabel}>
          {t.bearishBosBody}
        </GridItem>
      </div>

      <Box variant="u">{t.bosKeyPointBox}</Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--up)', marginBottom: 8 }}>
          {t.bosVideoLabel}
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={bosVideo} type="video/mp4" />
        </video>
      </div>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.hChoch}
      </h3>
      <p>{t.chochDef}</p>

      <div className="g2">
        <GridItem labelColor="var(--blue)" label={t.bullishChochLabel}>
          {t.bullishChochBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.bearishChochLabel}>
          {t.bearishChochBody}
        </GridItem>
      </div>

      <Box variant="b">{t.chochNoteBox}</Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--blue)', marginBottom: 8 }}>
          {t.chochVideoLabel}
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={chochVideo} type="video/mp4" />
        </video>
      </div>

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      <h3>
        <span className="bar"></span>
        {t.hDiff}
      </h3>
      <div className="g2">
        <GridItem label={t.bosCompareLabel}>{t.bosCompareBody}</GridItem>
        <GridItem label={t.chochCompareLabel}>{t.chochCompareBody}</GridItem>
      </div>

      <AnimatedFig caption={t.animatedFigCaption}>
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BOS — CONTINUATION</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">CHoCH — POSSIBLE REVERSAL</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <line x1="20" y1="70" x2="330" y2="70" stroke="#7A7870" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="24" y="65" fontSize="9" fill="#7A7870" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>Previous High</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="50" y1="95" x2="50" y2="130" stroke="#E05555" strokeWidth="1.3" /><rect x="44" y="102" width="12" height="22" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="95" y1="80" x2="95" y2="115" stroke="#3EC97A" strokeWidth="1.3" /><rect x="89" y="86" width="12" height="24" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="140" y1="35" x2="140" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="134" y="42" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="185" y1="20" x2="185" y2="50" stroke="#3EC97A" strokeWidth="1.3" /><rect x="179" y="24" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="230" y1="15" x2="230" y2="40" stroke="#3EC97A" strokeWidth="1.2" /><rect x="224" y="18" width="12" height="18" rx="1" fill="#3EC97A" /></g>
          <text x="185" y="60" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>BOS ↑</text>
          <text x="185" y="200" textAnchor="middle" fontSize="10" fill="#7A7870" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>{t.svgBosCaption}</text>

          <line x1="370" y1="140" x2="680" y2="140" stroke="#7A7870" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="374" y="153" fontSize="9" fill="#7A7870" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>Previous Low (Protected)</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="400" y1="75" x2="400" y2="105" stroke="#3EC97A" strokeWidth="1.3" /><rect x="394" y="80" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="445" y1="95" x2="445" y2="128" stroke="#E05555" strokeWidth="1.3" /><rect x="439" y="100" width="12" height="22" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="490" y1="120" x2="490" y2="172" stroke="#E05555" strokeWidth="1.4" /><rect x="484" y="128" width="12" height="38" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="535" y1="160" x2="535" y2="188" stroke="#E05555" strokeWidth="1.3" /><rect x="529" y="164" width="12" height="20" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="580" y1="172" x2="580" y2="196" stroke="#E05555" strokeWidth="1.2" /><rect x="574" y="176" width="12" height="16" rx="1" fill="#E05555" /></g>
          <text x="535" y="150" textAnchor="middle" fontSize="10" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>CHoCH ↓</text>
          <text x="535" y="206" textAnchor="middle" fontSize="10" fill="#7A7870" fontFamily="Noto Sans Khmer,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>{t.svgChochCaption}</text>
        </svg>
      </AnimatedFig>

      <h3>
        <span className="bar"></span>
        {t.hBosSteps}
      </h3>
      <Steps items={t.bosSteps} />

      <h3>
        <span className="bar"></span>
        {t.hChochSteps}
      </h3>
      <Steps items={t.chochSteps} />

      <Box variant="g">{t.exampleBox}</Box>

      <h3>
        <span className="bar"></span>
        {t.hMistakes}
      </h3>
      <Box variant="d">
        <ul>
          {t.mistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Box>

      <Rule title={t.easyRuleTitle}>{t.easyRuleBody}</Rule>

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
        {t.quizHeading}
      </h3>
      <p>{t.quizIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
