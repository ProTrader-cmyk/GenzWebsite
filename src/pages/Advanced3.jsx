import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
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

const meta = getAdvancedLessonMeta('adv3');

// ICT terminology is kept in English across all three languages — same
// convention as the rest of the Advanced and Technical tracks.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, tt) => `🔒 បញ្ចប់មេរៀន (${p}/${tt})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    ruleTitle: 'ច្បាប់ចងចាំ',
    lessonTag: 'មេរៀន ៣',
    intro: (
      <>
        <strong>PD Array (Premium/Discount Array)</strong> គឺជាឈ្មោះទូទៅសម្រាប់ <strong>ចំណុចចាប់អារម្មណ៍</strong>{' '}
        ណាមួយដែល Price មានទំនោរនឹងត្រឡប់មក React — រួមទាំង Liquidity Pool ដែលបានរៀនក្នុងមេរៀនទី ២ ផងដែរ ។
        មេរៀននេះបង្ហាញពី PD Array ប្រភេទថ្មីៗចំនួន ១០ បន្ថែម ដែលប្រើញឹកញាប់បំផុតដោយ ICT Trader ។
      </>
    ),
    videoCaption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — PD Array នីមួយៗមានលក្ខណៈសម្គាល់ និងកម្លាំងខុសៗគ្នា កុំចាត់ទុកថាវាដូចគ្នាទាំងអស់ ។',
    h1: 'តើ PD Array ជាអ្វី?',
    recapDef: (
      <p>
        <strong>ការចាំសម្គាល់ ៖</strong> ក្នុងមេរៀនទី ២ អ្នកបានរៀនអំពី <strong>LQ Pool</strong> (BSL/SSL, EQH/EQL,
        PDH/PDL, PWH/PWL) ដែលជា PD Array ប្រភេទដំបូង ។ PD Array ទាំងអស់ខាងក្រោមនេះ ស្ថិតនៅ <strong>ក្នុង</strong>{' '}
        Dealing Range (IRL) ជាទូទៅ ផ្ទុយពី LQ Pool ដែលច្រើននៅក្រៅ Range (ERL) ។
      </p>
    ),
    h2: 'FVG — Fair Value Gap',
    fvgDef: (
      <p>
        <strong>និយមន័យ ៖</strong> FVG កើតឡើងនៅពេល Candle ៣ ជាប់គ្នា ធ្វើចលនាលឿនរហ័ស ដល់ថ្នាក់ដែល Wick របស់
        Candle ទី ១ និង Candle ទី ៣ <strong>មិនត្រួតគ្នា</strong> — ចន្លោះនោះជា "Inefficiency" ដែល Price ច្រើន
        ត្រឡប់មកបំពេញ ។
      </p>
    ),
    diagram1Caption: 'Candle 1-2-3 ធ្វើ Displacement — ចន្លោះរវាង High របស់ Candle 1 និង Low របស់ Candle 3 ជា Bullish FVG ។',
    rule1: (
      <>
        FVG ដែលកើតចេញពី Candle Displacement <strong>ខ្លាំង និងលឿន</strong> ជាទូទៅមានប្រសិទ្ធភាពជាង FVG តូចដែល
        កើតចេញពី Candle ធម្មតា ។
      </>
    ),
    h3: 'IFVG — Inverse Fair Value Gap',
    ifvgDef: (
      <p>
        <strong>និយមន័យ ៖</strong> ពេល FVG ត្រូវបាន Price បំពេញពេញលេញ (Close ឆ្លងកាត់ទាំងស្រុង) FVG នោះ{' '}
        <strong>បញ្ច្រាសតួនាទី</strong> — Bullish FVG ចាស់ ក្លាយជា Resistance, Bearish FVG ចាស់ ក្លាយជា Support ។
        នេះហៅថា <strong>IFVG</strong> ។
      </p>
    ),
    rule2: (
      <>
        IFVG មានប្រយោជន៍បំផុត នៅពេលវាកើតឡើងក្នុងទិសដៅដូចគ្នានឹង HTF Bias — FVG ដែលធ្លាក់ខ្លួន ក្លាយជា Zone
        បន្តទិសដៅថ្មី ។
      </>
    ),
    h4: 'OB — Order Block',
    obDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Candle (ឬក្រុម Candle) ចុងក្រោយ ដែលផ្ទុយទិសដៅ មុននឹង Price ធ្វើ{' '}
        <strong>Displacement</strong> យ៉ាងខ្លាំង ។ Bullish OB = Candle ចុះក្រោមចុងក្រោយ មុន Move ឡើងខ្លាំង ។
        Bearish OB = Candle ឡើងលើចុងក្រោយ មុន Move ចុះខ្លាំង ។
      </p>
    ),
    diagram2Caption: 'Candle ក្រហមចុងក្រោយ (Bullish OB) មុននឹង Price Displace ឡើងលើយ៉ាងខ្លាំង — Price ត្រឡប់មក Retest OB នេះជា Entry ។',
    rule3: (
      <>
        OB ដែលមាន <strong>Displacement</strong> ខ្លាំង ភ្លាមៗបន្ទាប់ពីវា គឺជា OB ដែលមានគុណភាពខ្ពស់ជាង OB ដែល
        Price គ្រាន់តែផ្លាស់ទីយឺតៗ ។
      </>
    ),
    h5: 'BPR — Balanced Price Range',
    bprDef: (
      <p>
        <strong>និយមន័យ ៖</strong> កន្លែងដែល Bullish FVG និង Bearish FVG (ពី Leg ២ ផ្សេងគ្នា) ត្រួតគ្នា — បង្កើត
        ជា "តំបន់ស្ថេរភាព" ដែលមាំមួនជាង FVG តែមួយ ព្រោះមាន Inefficiency ២ ជាន់គ្នា ។
      </p>
    ),
    diagram3Caption: 'Bullish FVG (បៃតង) និង Bearish FVG (ក្រហម) ត្រួតគ្នាកណ្តាល — តំបន់ត្រួតគ្នានោះជា BPR ។',
    h6: 'Rejection Block, Mitigation Block & Breaker Block',
    rejectionLabel: 'Rejection Block',
    rejectionBody: (
      <>
        Zone ដែល Wick (មិនមែន Body) បង្ខាំង Price យ៉ាងខ្លាំង — សម្គាល់ដោយ Wick វែងជាច្រើន Candle ជាប់គ្នា
        <br />
        <strong>→ ប្រើ Wick High/Low ជា Entry Zone</strong>
      </>
    ),
    mitigationLabel: 'Mitigation Block',
    mitigationBody: (
      <>
        OB ដែល Price ត្រឡប់មក "សង" (Mitigate) Order ដែលមិនទាន់ Fill ពេញលេញ — មិនមែន OB ថ្មីទេ គ្រាន់តែជា
        Perspective ខុសគ្នា
        <br />
        <strong>→ ជាធម្មតាចេញ Reaction ខ្សោយជាង OB ធម្មតា</strong>
      </>
    ),
    breakerLabel: 'Breaker Block',
    breakerBody: (
      <>
        OB ចាស់ដែលត្រូវបាន Price ទម្លុះឆ្លងកាត់ (Failed) រួច Price ត្រឡប់មកវិញ — ឥឡូវ Breaker ដើរតួជា Zone
        ផ្ទុយពីមុន
        <br />
        <strong>→ Bullish OB បរាជ័យ ក្លាយជា Bearish Breaker</strong>
      </>
    ),
    diagram4Caption: 'Bullish OB ចាស់ត្រូវបំបែក (Failed) — Price ត្រឡប់មក Retest ត្រង់ចំណុចនោះ ឥឡូវក្លាយជា Bearish Breaker Block ។',
    rule4: (
      <>
        បែងចែក ៣ គំនិតនេះឲ្យបានច្បាស់ ៖ <strong>Rejection</strong> = Wick, <strong>Mitigation</strong> = OB ចាស់
        សងសល់, <strong>Breaker</strong> = OB ដែលបរាជ័យ ហើយប្តូរតួនាទី ។
      </>
    ),
    h7: 'Volume Imbalances & Gap Variations',
    volLabel: 'Volume Imbalance',
    volBody: (
      <>
        ចន្លោះរវាង Body របស់ Candle ២ ជាប់គ្នា (មិនមែន Wick) ដែលគ្មាន Trading Volume កើតឡើងផ្ទាល់
        <br />
        <strong>→ ស្រដៀង FVG ប៉ុន្តែខ្សោយជាង</strong>
      </>
    ),
    gapLabel: 'Gap Variations',
    gapBody: (
      <>
        Price Gap ដែលកើតឡើងរវាង Candle ចុងសប្តាហ៍ និង Candle បើកសប្តាហ៍ថ្មី (Weekend Gap), ឬ Gap ក្រោយ News
        <br />
        <strong>→ ជា Inefficiency ដែល Price ច្រើនតែត្រឡប់មកបំពេញ</strong>
      </>
    ),
    h8: 'Mean Threshold and Consequence Encroachment (MT & CE)',
    mtceDef: (
      <p>
        <strong>និយមន័យ ៖</strong> PD Array ណាមួយ (FVG, OB, Breaker...) មាន <strong>50% Midpoint</strong> ហៅថា{' '}
        <strong>CE (Consequence Encroachment)</strong> ។ Price ជាច្រើនតែងតែត្រូវការតែឈានដល់ CE (50%) ប៉ុណ្ណោះ
        មិនតម្រូវឲ្យបំពេញពេញ Array ទាំងមូលទេ ដើម្បីឲ្យ Reaction កើតឡើង ។
      </p>
    ),
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'FVG (Fair Value Gap) កើតឡើងចេញពី Candle ប៉ុន្មាន ហើយត្រូវការអ្វី?',
      options: [
        { label: 'Candle ៣ ជាប់គ្នា ដែល Wick Candle 1 និង 3 មិនត្រួតគ្នា', type: 'ok' },
        { label: 'Candle ២ ជាប់គ្នា ដែលមានពណ៌ដូចគ្នា', type: 'no' },
        { label: 'Candle ១ តែមួយ ដែលមាន Wick វែង', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! FVG កើតចេញពី Candle ៣ ជាប់គ្នា ដែល Wick Candle 1 និង 3 មិនត្រួតគ្នា ។',
        no: '✗ FVG កើតចេញពី Candle ៣ ជាប់គ្នា ដែល Wick របស់ Candle 1 និង Candle 3 មិនត្រួតគ្នា ។',
      },
    },
    quiz2: {
      question: 'Breaker Block ខុសពី Order Block ធម្មតាត្រង់ណា?',
      options: [
        { label: 'Breaker គឺជា OB ថ្មីទាំងស្រុង', type: 'no' },
        { label: 'Breaker ជា OB ចាស់ដែលបរាជ័យ (Failed) ហើយប្តូរតួនាទីផ្ទុយ', type: 'ok' },
        { label: 'Breaker កើតឡើងតែលើ Timeframe ធំបំផុត', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Breaker Block ជា OB ចាស់ដែលបរាជ័យ ហើយឥឡូវដើរតួផ្ទុយពីមុន ។',
        no: '✗ Breaker Block ជា Order Block ចាស់ដែលបរាជ័យ (Price ទម្លុះឆ្លងកាត់) ហើយប្តូរតួនាទីទៅជាផ្ទុយពីមុន ។',
      },
    },
    quiz3: {
      question: 'CE (Consequence Encroachment) តំណាងឲ្យអ្វី?',
      options: [
        { label: '100% នៃ PD Array', type: 'no' },
        { label: '50% Midpoint នៃ PD Array', type: 'ok' },
        { label: 'ចំណុចដែល Price មិនដែលទៅដល់', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! CE = 50% Midpoint នៃ PD Array ណាមួយ ។',
        no: '✗ CE (Consequence Encroachment) = 50% Midpoint នៃ PD Array ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ៣',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងឆ្លើយសំណួរដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: (
      <>
        តើ Candle ណាបង្កើត <strong>FVG</strong>?
      </>
    ),
    homeworkLi2: (
      <>
        តើ Candle ណាជា <strong>Order Block</strong> មុន Displacement?
      </>
    ),
    homeworkLi3: <>តើ Price ត្រូវការទៅដល់ 100% ឬត្រឹម CE (50%) ប៉ុណ្ណោះ ដើម្បីឲ្យមាន Reaction?</>,
    homeworkCaption: 'Chart នេះមិនទាន់មាន Label ទេ — សាកល្បងកំណត់ដោយខ្លួនឯងសិន ។',
    homeworkRevealLabel: '👁 មើលចម្លើយ',
    homeworkAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Candle 3 ជា <strong>Bullish OB</strong> (Candle ចុះក្រោមចុងក្រោយ មុន Move
        ឡើង) ។ Candle 4-5-6 បង្កើត <strong>FVG</strong> (Wick High របស់ Candle 4 និង Wick Low របស់ Candle 6
        មិនត្រួតគ្នា) ។ Price ត្រូវការត្រឹមតែឈានដល់ <strong>CE (50%)</strong> នៃ FVG នេះប៉ុណ្ណោះ ដើម្បីឲ្យមាន
        Reaction ត្រឡប់ឡើងវិញ — មិនចាំបាច់បំពេញ FVG ទាំងមូលទេ ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> បើកយក Chart ពិត រួច Mark FVG, OB, និង Breaker Block យ៉ាងហោចណាស់ម្នាក់
        ម៉្យាង ។ គូរបន្ទាត់ CE (50%) លើ PD Array នីមួយៗ ។ ថតរូបផ្ញើមក Mentor ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៨ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បង
        ម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'FVG (Fair Value Gap) ត្រូវការ Candle ប៉ុន្មាន?',
        options: [
          { label: '២ Candle', correct: false },
          { label: '៣ Candle ជាប់គ្នា', correct: true },
          { label: '៥ Candle ជាប់គ្នា', correct: false },
        ],
      },
      {
        question: 'IFVG (Inverse FVG) កើតឡើងនៅពេលណា?',
        options: [
          { label: 'ពេល FVG ត្រូវបានបំពេញពេញលេញ ហើយបញ្ច្រាសតួនាទី', correct: true },
          { label: 'ពេល FVG ទើបនឹងបង្កើតថ្មី', correct: false },
          { label: 'ពេល FVG កើតឡើងលើ Timeframe H4', correct: false },
        ],
      },
      {
        question: 'Bullish Order Block ជាអ្វី?',
        options: [
          { label: 'Candle ឡើងលើចុងក្រោយ មុន Move ចុះខ្លាំង', correct: false },
          { label: 'Candle ចុះក្រោមចុងក្រោយ មុន Move ឡើងខ្លាំង (Displacement)', correct: true },
          { label: 'Candle ណាមួយក៏បានដែលមាន Body ធំ', correct: false },
        ],
      },
      {
        question: 'BPR (Balanced Price Range) បង្កើតឡើងចេញពីអ្វី?',
        options: [
          { label: 'Bullish FVG និង Bearish FVG ត្រួតគ្នា', correct: true },
          { label: 'OB ២ ដងជាប់គ្នា', correct: false },
          { label: 'Session Liquidity ២ Session', correct: false },
        ],
      },
      {
        question: 'តើអ្វីខុសគ្នារវាង Mitigation Block និង Breaker Block?',
        options: [
          { label: 'ពួកវាដូចគ្នាទាំងស្រុង', correct: false },
          { label: 'Mitigation = OB ចាស់សងសល់ Order · Breaker = OB ចាស់ដែលបរាជ័យ ប្តូរតួនាទី', correct: true },
          { label: 'Mitigation កើតលើ Daily, Breaker កើតលើ Weekly', correct: false },
        ],
      },
      {
        question: 'Volume Imbalance ខុសពី FVG ត្រង់ណា?',
        options: [
          { label: 'Volume Imbalance គិតលើ Body មិនមែន Wick', correct: true },
          { label: 'Volume Imbalance តែងតែធំជាង FVG', correct: false },
          { label: 'ពួកវាដូចគ្នា ១០០%', correct: false },
        ],
      },
      {
        question: 'Weekend Gap ជាប្រភេទ PD Array អ្វី?',
        options: [
          { label: 'Order Block', correct: false },
          { label: 'Gap Variation', correct: true },
          { label: 'Breaker Block', correct: false },
        ],
      },
      {
        question: 'CE (Consequence Encroachment) របស់ PD Array មួយណាមួយ ស្ថិតនៅត្រង់ណា?',
        options: [
          { label: '50% Midpoint របស់ PD Array នោះ', correct: true },
          { label: 'ចុងបំផុតនៃ PD Array', correct: false },
          { label: 'ខាងក្រៅ PD Array ទាំងស្រុង', correct: false },
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
    lessonTag: 'Lesson 3',
    intro: (
      <>
        The <strong>PD Array (Premium/Discount Array)</strong> is the general name for any{' '}
        <strong>point of interest</strong> price tends to return to and react from — including the Liquidity
        Pools you learned in Lesson 2. This lesson covers 10 more PD Array types that ICT traders use constantly.
      </>
    ),
    videoCaption: "Listen closely — each PD Array has its own characteristics and strength, don't treat them all the same.",
    h1: 'What Is a PD Array?',
    recapDef: (
      <p>
        <strong>Quick recap:</strong> In Lesson 2 you learned about <strong>LQ Pool</strong> (BSL/SSL, EQH/EQL,
        PDH/PDL, PWH/PWL) — the first kind of PD Array. Everything below usually sits <strong>inside</strong> the
        Dealing Range (IRL), unlike LQ Pools, which usually sit outside it (ERL).
      </p>
    ),
    h2: 'FVG — Fair Value Gap',
    fvgDef: (
      <p>
        <strong>Definition:</strong> An FVG forms when 3 consecutive candles move fast enough that the wicks of
        candle 1 and candle 3 <strong>don't overlap</strong> — that gap is an "inefficiency" price often comes
        back to fill.
      </p>
    ),
    diagram1Caption: 'Candles 1-2-3 displace hard — the gap between candle 1\'s high and candle 3\'s low is a Bullish FVG.',
    rule1: (
      <>
        An FVG formed by <strong>strong, fast displacement</strong> is generally more effective than a small FVG
        formed by ordinary candles.
      </>
    ),
    h3: 'IFVG — Inverse Fair Value Gap',
    ifvgDef: (
      <p>
        <strong>Definition:</strong> When an FVG gets fully closed by price (a full close through it), that FVG{' '}
        <strong>flips roles</strong> — an old Bullish FVG becomes resistance, an old Bearish FVG becomes support.
        This is called an <strong>IFVG</strong>.
      </p>
    ),
    rule2: (
      <>
        An IFVG is most useful when it forms in the same direction as your HTF bias — a failed FVG becomes a zone
        that continues the new direction.
      </>
    ),
    h4: 'OB — Order Block',
    obDef: (
      <p>
        <strong>Definition:</strong> The last candle (or group of candles) moving against the trend right before
        price <strong>displaces</strong> hard. A Bullish OB is the last down candle before a strong rally. A
        Bearish OB is the last up candle before a strong drop.
      </p>
    ),
    diagram2Caption: 'The last red candle (a Bullish OB) right before price displaces sharply higher — price returns to retest that OB as an entry.',
    rule3: (
      <>
        An OB followed by <strong>strong displacement</strong> is higher quality than one where price only drifts
        away slowly.
      </>
    ),
    h5: 'BPR — Balanced Price Range',
    bprDef: (
      <p>
        <strong>Definition:</strong> The zone where a Bullish FVG and a Bearish FVG (from two different legs)
        overlap — creating a more reliable "balanced" zone, since two inefficiencies stack on top of each other.
      </p>
    ),
    diagram3Caption: 'A Bullish FVG (green) and a Bearish FVG (red) overlap in the middle — that overlap zone is the BPR.',
    h6: 'Rejection Block, Mitigation Block & Breaker Block',
    rejectionLabel: 'Rejection Block',
    rejectionBody: (
      <>
        A zone where wicks (not bodies) strongly reject price — marked by several long wicks in a row
        <br />
        <strong>→ Use the wick high/low as your entry zone</strong>
      </>
    ),
    mitigationLabel: 'Mitigation Block',
    mitigationBody: (
      <>
        An OB where price returns just to "mitigate" (settle) orders that never fully filled — not a new OB, just
        a different way of viewing the same zone
        <br />
        <strong>→ Usually produces a weaker reaction than a fresh OB</strong>
      </>
    ),
    breakerLabel: 'Breaker Block',
    breakerBody: (
      <>
        An old OB that price broke straight through (failed), then came back to retest — the Breaker now acts as
        the opposite zone
        <br />
        <strong>→ A failed Bullish OB becomes a Bearish Breaker</strong>
      </>
    ),
    diagram4Caption: 'An old Bullish OB fails — price returns to retest that same spot, which now acts as a Bearish Breaker Block.',
    rule4: (
      <>
        Keep the three separate: <strong>Rejection</strong> = a wick, <strong>Mitigation</strong> = an old OB
        settling leftover orders, <strong>Breaker</strong> = an OB that failed and flipped roles.
      </>
    ),
    h7: 'Volume Imbalances & Gap Variations',
    volLabel: 'Volume Imbalance',
    volBody: (
      <>
        A gap between the bodies (not the wicks) of two consecutive candles, where no real trading volume
        occurred
        <br />
        <strong>→ Similar to an FVG, but weaker</strong>
      </>
    ),
    gapLabel: 'Gap Variations',
    gapBody: (
      <>
        A price gap between Friday's close and the new week's open (weekend gap), or a gap right after a news
        release
        <br />
        <strong>→ An inefficiency price often comes back to fill</strong>
      </>
    ),
    h8: 'Mean Threshold and Consequence Encroachment (MT & CE)',
    mtceDef: (
      <p>
        <strong>Definition:</strong> Every PD Array (FVG, OB, Breaker...) has a <strong>50% midpoint</strong>{' '}
        called the <strong>CE (Consequence Encroachment)</strong>. Price often only needs to reach the CE (50%),
        not fill the entire array, for a reaction to happen.
      </p>
    ),
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'How many candles form an FVG (Fair Value Gap), and what do they need?',
      options: [
        { label: "3 consecutive candles where candle 1 and 3's wicks don't overlap", type: 'ok' },
        { label: '2 consecutive candles of the same color', type: 'no' },
        { label: '1 single candle with a long wick', type: 'no' },
      ],
      feedback: {
        ok: "✓ Correct! An FVG forms from 3 consecutive candles where candle 1 and candle 3's wicks don't overlap.",
        no: "✗ An FVG forms from 3 consecutive candles where candle 1 and candle 3's wicks don't overlap.",
      },
    },
    quiz2: {
      question: 'How is a Breaker Block different from a regular Order Block?',
      options: [
        { label: "It's a brand-new OB", type: 'no' },
        { label: 'It\'s an old OB that failed and flipped to the opposite role', type: 'ok' },
        { label: 'It only ever forms on the highest timeframe', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A Breaker Block is an old OB that failed and now acts as the opposite zone.',
        no: "✗ A Breaker Block is an old Order Block that failed (price broke through it) and flipped to the opposite role.",
      },
    },
    quiz3: {
      question: 'What does CE (Consequence Encroachment) represent?',
      options: [
        { label: '100% of the PD array', type: 'no' },
        { label: 'The 50% midpoint of the PD array', type: 'ok' },
        { label: 'A point price never reaches', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! CE = the 50% midpoint of any PD array.',
        no: '✗ CE (Consequence Encroachment) = the 50% midpoint of any PD array.',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 3',
    homeworkIntro: 'Study the chart below and try to answer for yourself before clicking "Show Answer":',
    homeworkLi1: (
      <>
        Which candles form the <strong>FVG</strong>?
      </>
    ),
    homeworkLi2: (
      <>
        Which candle is the <strong>Order Block</strong> before the displacement?
      </>
    ),
    homeworkLi3: <>Does price need to reach 100%, or just the CE (50%), for a reaction to happen?</>,
    homeworkCaption: "This chart isn't labeled yet — try to work it out yourself first.",
    homeworkRevealLabel: '👁 Show Answer',
    homeworkAnswer: (
      <p>
        <strong>Answer:</strong> Candle 3 is the <strong>Bullish OB</strong> (the last down candle before the
        rally). Candles 4-5-6 form the <strong>FVG</strong> (candle 4's high and candle 6's low don't overlap).
        Price only needs to reach the <strong>CE (50%)</strong> of that FVG for a reaction to happen — it doesn't
        need to fill the entire gap.
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Open a real chart and mark at least one FVG, one OB, and one Breaker
        Block. Draw the CE (50%) line on each PD array. Screenshot it and send it to your mentor.
      </p>
    ),
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You need to answer <strong>all 8 questions correctly</strong> to unlock and move on to the next lesson —
        wrong answers can be retried an unlimited number of times.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'How many candles does an FVG (Fair Value Gap) need?',
        options: [
          { label: '2 candles', correct: false },
          { label: '3 consecutive candles', correct: true },
          { label: '5 consecutive candles', correct: false },
        ],
      },
      {
        question: 'When does an IFVG (Inverse FVG) form?',
        options: [
          { label: 'When an FVG gets fully closed by price and flips roles', correct: true },
          { label: 'The moment an FVG is first created', correct: false },
          { label: 'Only when the FVG forms on the H4 timeframe', correct: false },
        ],
      },
      {
        question: 'What is a Bullish Order Block?',
        options: [
          { label: 'The last up candle before a strong drop', correct: false },
          { label: 'The last down candle before a strong up displacement', correct: true },
          { label: 'Any candle at all with a large body', correct: false },
        ],
      },
      {
        question: 'What forms a BPR (Balanced Price Range)?',
        options: [
          { label: 'A Bullish FVG and a Bearish FVG overlapping', correct: true },
          { label: 'Two Order Blocks stacked in a row', correct: false },
          { label: 'Two different trading sessions', correct: false },
        ],
      },
      {
        question: "What's the difference between a Mitigation Block and a Breaker Block?",
        options: [
          { label: "They're exactly the same thing", correct: false },
          { label: 'Mitigation = an old OB settling leftover orders · Breaker = an old OB that failed and flipped roles', correct: true },
          { label: 'Mitigation forms on Daily, Breaker forms on Weekly', correct: false },
        ],
      },
      {
        question: 'How is a Volume Imbalance different from an FVG?',
        options: [
          { label: "It's measured using candle bodies, not wicks", correct: true },
          { label: "It's always bigger than an FVG", correct: false },
          { label: "They're 100% identical", correct: false },
        ],
      },
      {
        question: 'What type of PD array is a weekend gap?',
        options: [
          { label: 'An Order Block', correct: false },
          { label: 'A Gap Variation', correct: true },
          { label: 'A Breaker Block', correct: false },
        ],
      },
      {
        question: "Where does a PD array's CE (Consequence Encroachment) sit?",
        options: [
          { label: 'At the 50% midpoint of that PD array', correct: true },
          { label: 'At the very far edge of the PD array', correct: false },
          { label: 'Completely outside the PD array', correct: false },
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
    lessonTag: '第 3 课',
    intro: (
      <>
        <strong>PD Array（Premium/Discount Array）</strong>是对任何价格倾向于回归并做出反应的
        <strong>关注点</strong>的统称 — 也包括你在第 2 课学到的流动性池。本课再介绍 10 种 ICT 交易者经常使用的
        PD Array 类型。
      </>
    ),
    videoCaption: '用心聆听 — 每一种 PD Array 都有各自的特征与强弱，不要把它们全部一视同仁。',
    h1: '什么是 PD Array？',
    recapDef: (
      <p>
        <strong>快速回顾：</strong>在第 2 课中，你学过 <strong>LQ Pool</strong>（BSL/SSL、EQH/EQL、PDH/PDL、
        PWH/PWL）— 这是第一种 PD Array。下面这些通常位于 Dealing Range<strong>之内</strong>（IRL），而 LQ Pool
        通常位于区间之外（ERL）。
      </p>
    ),
    h2: 'FVG — Fair Value Gap',
    fvgDef: (
      <p>
        <strong>定义：</strong>当连续 3 根蜡烛快速移动，使得第 1 根与第 3 根蜡烛的影线<strong>没有重叠</strong>
        时，就形成了 FVG — 那段缺口就是价格常常会回来填补的"低效区"。
      </p>
    ),
    diagram1Caption: '1-2-3 号蜡烛强力推动 — 1 号最高点与 3 号最低点之间的缺口就是看涨 FVG。',
    rule1: (
      <>
        由<strong>强劲、快速</strong>的推动形成的 FVG，通常比由普通蜡烛形成的小 FVG 更有效。
      </>
    ),
    h3: 'IFVG — Inverse Fair Value Gap',
    ifvgDef: (
      <p>
        <strong>定义：</strong>当一个 FVG 被价格完全回补收盘穿越后，该 FVG 会<strong>反转角色</strong> — 原本的
        看涨 FVG 变成阻力，原本的看跌 FVG 变成支撑。这称为 <strong>IFVG</strong>。
      </p>
    ),
    rule2: (
      <>
        当 IFVG 与你的高周期偏向方向一致时最有价值 — 失效的 FVG 会变成延续新方向的区域。
      </>
    ),
    h4: 'OB — Order Block',
    obDef: (
      <p>
        <strong>定义：</strong>在价格发生剧烈<strong>推动（Displacement）</strong>之前，最后一根（或一组）逆势
        蜡烛。看涨 OB = 强力上涨之前的最后一根阴线；看跌 OB = 强力下跌之前的最后一根阳线。
      </p>
    ),
    diagram2Caption: '价格大幅推动上涨之前的最后一根阴线（看涨 OB）— 价格回踩此处即为入场点。',
    rule3: (
      <>
        紧随其后出现<strong>强力推动</strong>的 OB，比价格只是缓慢漂离的 OB 质量更高。
      </>
    ),
    h5: 'BPR — Balanced Price Range',
    bprDef: (
      <p>
        <strong>定义：</strong>来自两段不同行情的看涨 FVG 与看跌 FVG 重叠的区域 — 由于两个低效区叠加在一起，
        形成一个更可靠的"平衡"区域。
      </p>
    ),
    diagram3Caption: '看涨 FVG（绿色）与看跌 FVG（红色）在中间重叠 — 重叠的区域就是 BPR。',
    h6: 'Rejection Block、Mitigation Block 与 Breaker Block',
    rejectionLabel: 'Rejection Block（拒绝块）',
    rejectionBody: (
      <>
        影线（而非实体）强烈拒绝价格的区域 — 由连续多根长影线组成
        <br />
        <strong>→ 用影线的最高/最低点作为入场区域</strong>
      </>
    ),
    mitigationLabel: 'Mitigation Block（缓解块）',
    mitigationBody: (
      <>
        价格回来只是为了"缓解"（结算）未完全成交的订单的 OB — 并非新的 OB，只是对同一区域的另一种理解方式
        <br />
        <strong>→ 通常反应比全新的 OB 更弱</strong>
      </>
    ),
    breakerLabel: 'Breaker Block（破坏块）',
    breakerBody: (
      <>
        价格直接突破（失效）的旧 OB，随后价格回来测试 — 该区域现在扮演相反的角色
        <br />
        <strong>→ 失效的看涨 OB 会变成看跌 Breaker</strong>
      </>
    ),
    diagram4Caption: '旧的看涨 OB 失效 — 价格回来测试同一位置，该处现在扮演看跌 Breaker Block 的角色。',
    rule4: (
      <>
        务必区分这三者：<strong>Rejection</strong> = 一段影线，<strong>Mitigation</strong> = 结算剩余订单的旧
        OB，<strong>Breaker</strong> = 失效并反转角色的 OB。
      </>
    ),
    h7: 'Volume Imbalances 与 Gap Variations',
    volLabel: 'Volume Imbalance（成交量失衡）',
    volBody: (
      <>
        两根连续蜡烛实体（而非影线）之间的缺口，该处没有发生真实的成交量
        <br />
        <strong>→ 与 FVG 类似，但强度更弱</strong>
      </>
    ),
    gapLabel: 'Gap Variations（缺口变化）',
    gapBody: (
      <>
        周五收盘与新一周开盘之间的价格缺口（周末缺口），或新闻发布后出现的缺口
        <br />
        <strong>→ 价格常常会回来填补的低效区</strong>
      </>
    ),
    h8: 'Mean Threshold 与 Consequence Encroachment（MT 与 CE）',
    mtceDef: (
      <p>
        <strong>定义：</strong>每一个 PD array（FVG、OB、Breaker……）都有一个<strong>50% 中点</strong>，称为{' '}
        <strong>CE（Consequence Encroachment）</strong>。价格往往只需要到达 CE（50%），而不必填满整个区间，
        就足以引发反应。
      </p>
    ),
    quizHeading: '知识检测',
    quiz1: {
      question: 'FVG（Fair Value Gap）由几根蜡烛构成？需要满足什么条件？',
      options: [
        { label: '连续 3 根蜡烛，且第 1 根与第 3 根的影线不重叠', type: 'ok' },
        { label: '连续 2 根颜色相同的蜡烛', type: 'no' },
        { label: '单独 1 根带长影线的蜡烛', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！FVG 由连续 3 根蜡烛构成，且第 1 根与第 3 根的影线不重叠。',
        no: '✗ FVG 由连续 3 根蜡烛构成，且第 1 根与第 3 根蜡烛的影线不重叠。',
      },
    },
    quiz2: {
      question: 'Breaker Block 与普通 Order Block 有什么不同？',
      options: [
        { label: '它是一个全新的 OB', type: 'no' },
        { label: '它是失效并反转为相反角色的旧 OB', type: 'ok' },
        { label: '它只会出现在最高周期上', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Breaker Block 是失效后反转角色的旧 OB。',
        no: '✗ Breaker Block 是失效（被价格突破）并反转为相反角色的旧 Order Block。',
      },
    },
    quiz3: {
      question: 'CE（Consequence Encroachment）代表什么？',
      options: [
        { label: 'PD array 的 100%', type: 'no' },
        { label: 'PD array 的 50% 中点', type: 'ok' },
        { label: '价格永远不会到达的点', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！CE = 任意 PD array 的 50% 中点。',
        no: '✗ CE（Consequence Encroachment）= 任意 PD array 的 50% 中点。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 3 课',
    homeworkIntro: '先自己研究下面的图表，再点击"查看答案"：',
    homeworkLi1: (
      <>
        哪些蜡烛构成了 <strong>FVG</strong>？
      </>
    ),
    homeworkLi2: (
      <>
        推动之前的 <strong>Order Block</strong> 是哪一根蜡烛？
      </>
    ),
    homeworkLi3: <>价格需要到达 100%，还是只需要到达 CE（50%）就会有反应？</>,
    homeworkCaption: '这张图还没有标注 — 先自己试着判断。',
    homeworkRevealLabel: '👁 查看答案',
    homeworkAnswer: (
      <p>
        <strong>答案：</strong>3 号蜡烛是<strong>看涨 OB</strong>（上涨前最后一根阴线）。4-5-6 号蜡烛构成了{' '}
        <strong>FVG</strong>（4 号的最高点与 6 号的最低点不重叠）。价格只需要到达该 FVG 的{' '}
        <strong>CE（50%）</strong>就足以引发反应 — 不需要填满整个缺口。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 额外作业：</strong>打开一张真实图表，至少标出一个 FVG、一个 OB 和一个 Breaker Block。在每个
        PD array 上画出 CE（50%）线。截图发给导师。
      </p>
    ),
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        需要<strong>全部 8 题都答对</strong>才能解锁并进入下一课 — 答错可以无限次重试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'FVG（Fair Value Gap）需要几根蜡烛？',
        options: [
          { label: '2 根蜡烛', correct: false },
          { label: '连续 3 根蜡烛', correct: true },
          { label: '连续 5 根蜡烛', correct: false },
        ],
      },
      {
        question: 'IFVG（Inverse FVG）在什么时候形成？',
        options: [
          { label: '当 FVG 被价格完全回补并反转角色时', correct: true },
          { label: 'FVG 刚形成的那一刻', correct: false },
          { label: '只有在 H4 周期形成时', correct: false },
        ],
      },
      {
        question: '什么是看涨 Order Block？',
        options: [
          { label: '强力下跌之前的最后一根阳线', correct: false },
          { label: '强力上涨推动之前的最后一根阴线', correct: true },
          { label: '任何带有大实体的蜡烛', correct: false },
        ],
      },
      {
        question: '什么构成了 BPR（Balanced Price Range）？',
        options: [
          { label: '看涨 FVG 与看跌 FVG 重叠', correct: true },
          { label: '两个连续的 Order Block', correct: false },
          { label: '两个不同的交易时段', correct: false },
        ],
      },
      {
        question: 'Mitigation Block 与 Breaker Block 有什么区别？',
        options: [
          { label: '它们完全相同', correct: false },
          { label: 'Mitigation = 结算剩余订单的旧 OB · Breaker = 失效并反转角色的旧 OB', correct: true },
          { label: 'Mitigation 出现在日线，Breaker 出现在周线', correct: false },
        ],
      },
      {
        question: 'Volume Imbalance 与 FVG 有什么不同？',
        options: [
          { label: '它是用蜡烛实体而非影线来衡量的', correct: true },
          { label: '它总是比 FVG 更大', correct: false },
          { label: '它们完全一样', correct: false },
        ],
      },
      {
        question: '周末缺口属于哪种 PD array？',
        options: [
          { label: 'Order Block', correct: false },
          { label: 'Gap Variation', correct: true },
          { label: 'Breaker Block', correct: false },
        ],
      },
      {
        question: 'PD array 的 CE（Consequence Encroachment）位于哪里？',
        options: [
          { label: '该 PD array 的 50% 中点', correct: true },
          { label: 'PD array 最远的边缘', correct: false },
          { label: '完全在 PD array 之外', correct: false },
        ],
      },
    ],
  },
};

export default function Advanced3({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['adv3']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="adv3"
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

      {/* ===== WHAT IS A PD ARRAY ===== */}
      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Box variant="g">{t.recapDef}</Box>

      {/* ===== FVG ===== */}
      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="u">{t.fvgDef}</Box>

      <AnimatedFig caption={t.diagram1Caption}>
        <svg viewBox="0 0 700 200">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">FAIR VALUE GAP (FVG)</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="200" y1="90" x2="200" y2="130" stroke="#3EC97A" strokeWidth="1.4" /><rect x="194" y="95" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="200" y="145" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>1</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="260" y1="55" x2="260" y2="105" stroke="#3EC97A" strokeWidth="1.6" /><rect x="252" y="60" width="16" height="40" rx="1" fill="#3EC97A" /></g>
          <text x="260" y="120" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>2</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="320" y1="30" x2="320" y2="70" stroke="#3EC97A" strokeWidth="1.4" /><rect x="314" y="35" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="320" y="85" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>3</text>

          <rect x="188" y="70" width="144" height="20" fill="#3EC97A" opacity="0.18" className="ac" style={{ animationDelay: '.45s' }} />
          <line x1="188" y1="90" x2="332" y2="90" stroke="#3EC97A" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <line x1="188" y1="70" x2="332" y2="70" stroke="#3EC97A" strokeWidth="0.8" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <text x="260" y="60" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>FVG</text>

          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="450" y1="60" x2="450" y2="82" stroke="#E05555" strokeWidth="1.4" /><rect x="444" y="64" width="12" height="14" rx="1" fill="#E05555" /></g>
          <text x="450" y="100" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Return to fill</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== IFVG ===== */}
      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="d">{t.ifvgDef}</Box>
      <Rule title={t.ruleTitle}>{t.rule2}</Rule>

      {/* ===== OB ===== */}
      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Box variant="u">{t.obDef}</Box>

      <AnimatedFig caption={t.diagram2Caption}>
        <svg viewBox="0 0 700 200">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">ORDER BLOCK (OB)</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="80" y1="100" x2="80" y2="130" stroke="#3EC97A" strokeWidth="1.2" /><rect x="74" y="104" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="130" y1="110" x2="130" y2="145" stroke="#E05555" strokeWidth="1.6" /><rect x="122" y="115" width="16" height="27" rx="1" fill="#E05555" /></g>
          <text x="130" y="160" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.22s' }}>Bullish OB</text>
          <rect x="122" y="115" width="16" height="27" fill="none" stroke="#E05555" strokeWidth="1" strokeDasharray="2 2" className="ac" style={{ animationDelay: '.26s' }} />

          <g className="ac" style={{ animationDelay: '.34s' }}><line x1="190" y1="70" x2="190" y2="115" stroke="#3EC97A" strokeWidth="1.4" /><rect x="184" y="75" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.42s' }}><line x1="240" y1="35" x2="240" y2="80" stroke="#3EC97A" strokeWidth="1.4" /><rect x="234" y="40" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="215" y="25" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.46s' }}>Displacement ↑</text>

          <line x1="122" y1="115" x2="500" y2="115" stroke="#E05555" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="420" y1="95" x2="420" y2="130" stroke="#3EC97A" strokeWidth="1.4" /><rect x="414" y="100" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <text x="420" y="145" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.65s' }}>Retest OB</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule3}</Rule>

      {/* ===== BPR ===== */}
      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="b">{t.bprDef}</Box>

      <AnimatedFig caption={t.diagram3Caption}>
        <svg viewBox="0 0 700 190">
          <rect x="220" y="60" width="160" height="70" fill="#5B9BD5" opacity="0.2" className="ac" style={{ animationDelay: '.4s' }} />
          <text x="300" y="55" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>BPR (Overlap)</text>

          <rect x="150" y="80" width="230" height="30" fill="#3EC97A" opacity="0.15" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="150" y="75" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Bullish FVG</text>

          <rect x="220" y="60" width="230" height="30" fill="#E05555" opacity="0.15" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="380" y="135" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>Bearish FVG</text>
        </svg>
      </AnimatedFig>

      {/* ===== REJECTION / MITIGATION / BREAKER ===== */}
      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <div className="g3">
        <GridItem labelColor="#5B9BD5" label={t.rejectionLabel}>
          {t.rejectionBody}
        </GridItem>
        <GridItem labelColor="#9aa0ab" label={t.mitigationLabel}>
          {t.mitigationBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.breakerLabel}>
          {t.breakerBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram4Caption}>
        <svg viewBox="0 0 700 190">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BREAKER BLOCK</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="80" y1="90" x2="80" y2="115" stroke="#3EC97A" strokeWidth="1.2" /><rect x="74" y="94" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="130" y1="100" x2="130" y2="135" stroke="#E05555" strokeWidth="1.6" /><rect x="122" y="105" width="16" height="27" rx="1" fill="#E05555" /></g>
          <text x="130" y="150" textAnchor="middle" fontSize="9" fill="#E05555" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.22s' }}>Old Bullish OB</text>
          <rect x="122" y="105" width="16" height="27" fill="none" stroke="#5B9BD5" strokeWidth="1" strokeDasharray="2 2" className="ac" style={{ animationDelay: '.26s' }} />

          <g className="ac" style={{ animationDelay: '.34s' }}><line x1="180" y1="80" x2="180" y2="105" stroke="#3EC97A" strokeWidth="1.2" /><rect x="174" y="84" width="12" height="18" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.42s' }}><line x1="230" y1="105" x2="230" y2="140" stroke="#E05555" strokeWidth="1.6" /><rect x="222" y="110" width="16" height="27" rx="1" fill="#E05555" /></g>
          <text x="230" y="30" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.46s' }}>Price breaks through ↓</text>

          <line x1="122" y1="105" x2="500" y2="105" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="420" y1="80" x2="420" y2="110" stroke="#E05555" strokeWidth="1.4" /><rect x="414" y="84" width="12" height="22" rx="1" fill="#E05555" /></g>
          <text x="420" y="125" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.65s' }}>Retest as Breaker</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule4}</Rule>

      {/* ===== VOLUME IMBALANCE / GAP ===== */}
      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <div className="g2">
        <GridItem labelColor="#5B9BD5" label={t.volLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.volBody}
        </GridItem>
        <GridItem labelColor="#5B9BD5" label={t.gapLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.gapBody}
        </GridItem>
      </div>

      {/* ===== MT & CE ===== */}
      <h3>
        <span className="bar"></span>
        {t.h8}
      </h3>
      <Box variant="g">{t.mtceDef}</Box>

      {/* ===== QUIZ ===== */}
      <h3>
        <span className="bar"></span>
        {t.quizHeading}
      </h3>
      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />
      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />
      <Quiz question={t.quiz3.question} options={t.quiz3.options} feedback={t.quiz3.feedback} />

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
        <svg viewBox="0 0 700 200">
          <g><line x1="80" y1="90" x2="80" y2="115" stroke="#3EC97A" strokeWidth="1.2" /><rect x="74" y="94" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <text x="80" y="130" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">1</text>

          <g><line x1="130" y1="100" x2="130" y2="130" stroke="#E05555" strokeWidth="1.6" /><rect x="122" y="105" width="16" height="22" rx="1" fill="#E05555" /></g>
          <text x="130" y="145" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">2</text>

          <g><line x1="190" y1="90" x2="190" y2="125" stroke="#3EC97A" strokeWidth="1.2" /><rect x="184" y="95" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <text x="190" y="140" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">3</text>

          <g><line x1="250" y1="55" x2="250" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="244" y="60" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="250" y="115" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">4</text>

          <g><line x1="310" y1="30" x2="310" y2="65" stroke="#3EC97A" strokeWidth="1.4" /><rect x="304" y="35" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="310" y="80" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">5</text>

          <g><line x1="370" y1="15" x2="370" y2="45" stroke="#3EC97A" strokeWidth="1.4" /><rect x="364" y="20" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <text x="370" y="60" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">6</text>

          <rect x="238" y="95" width="144" height="20" fill="#3EC97A" opacity="0.18" />
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
