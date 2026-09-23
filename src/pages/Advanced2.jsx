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

const meta = getAdvancedLessonMeta('adv2');

// ICT terminology is kept in English across all three languages — same
// convention as the rest of the Advanced and Technical tracks.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, tt) => `🔒 បញ្ចប់មេរៀន (${p}/${tt})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    ruleTitle: 'ច្បាប់ចងចាំ',
    lessonTag: 'មេរៀន ២',
    intro: (
      <>
        <strong>Liquidity</strong> គឺជាមូលហេតុពិតប្រាកដដែល Price ផ្លាស់ទី — ធនាគារ និង Institution ត្រូវការ
        Liquidity ចំនួនច្រើន ដើម្បីបំពេញ Order ធំៗរបស់ពួកគេ ។ Liquidity ស្ថិតនៅកន្លែងណាដែលមាន Stop-Loss ឬ
        Pending Order ប្រមូលផ្តុំច្រើន — ជាទូទៅនៅលើ ឬក្រោម Swing High/Low ។ មេរៀននេះពង្រីកគំនិត LQ ទៅដល់ទម្រង់
        កម្រិត Advanced ៧ ប្រភេទ ។
      </>
    ),
    videoCaption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — Liquidity Pool ណាមួយ ក៏អាចក្លាយជាគោលដៅរបស់ Smart Money បានទាំងអស់ ។',
    h1: 'តើ Liquidity ជាអ្វី?',
    liquidityDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Liquidity គឺជា Order ដែលកំពុង "សម្រាក" (Resting) នៅលើ Chart — ភាគច្រើនជា
        Stop-Loss របស់ Trader Retail ដែលដាក់លើ/ក្រោម Swing Point ។ Smart Money ត្រូវការតម្លៃទាំងនេះដើម្បីបំពេញ
        Order ធំរបស់ខ្លួន មុននឹងបញ្ច្រាសទិស ។
      </p>
    ),
    h2: 'LQ Pool — Buy-Side & Sell-Side Liquidity',
    bslLabel: 'BSL — Buy-Side Liquidity',
    bslBody: (
      <>
        Order ទិញ (Stop-Loss របស់អ្នក Sell) ដាក់ <strong>លើ Swing High</strong>
        <br />
        Smart Money "លួច" យក Liquidity នេះ មុននឹង Sell ចុះ
      </>
    ),
    sslLabel: 'SSL — Sell-Side Liquidity',
    sslBody: (
      <>
        Order លក់ (Stop-Loss របស់អ្នក Buy) ដាក់ <strong>ក្រោម Swing Low</strong>
        <br />
        Smart Money "លួច" យក Liquidity នេះ មុននឹង Buy ឡើង
      </>
    ),
    lqSteps: [
      <>
        សម្គាល់ <strong>Swing High</strong> ទាំងអស់លើ Chart — លើវាមាន <strong>BSL</strong> ។
      </>,
      <>
        សម្គាល់ <strong>Swing Low</strong> ទាំងអស់លើ Chart — ក្រោមវាមាន <strong>SSL</strong> ។
      </>,
      <>
        រង់ចាំមើលថាតើ Price ទៅ "លួច" (Sweep) BSL ឬ SSL មុន — នេះជាគន្លឹះទស្សន៍ទាយទិសដៅបន្ទាប់ ។
      </>,
    ],
    diagram1Caption: 'Price Sweep SSL ក្រោម Swing Low ជាមុនសិន រួចបញ្ច្រាសទិសឡើងទៅរក BSL លើ Swing High ។',
    rule1: (
      <>
        Liquidity Sweep <strong>មិនមែន BOS</strong> ទេ — វាគ្រាន់តែជា Wick ចូលទៅចាប់ Order ប៉ុណ្ណោះ ។ រង់ចាំមើល
        Reaction (ដូចជា CHoCH) បន្ទាប់ពី Sweep សិន មុននឹង Entry ។
      </>
    ),
    h3: 'Equal Highs & Equal Lows (EQH / EQL)',
    eqhDef: (
      <p>
        <strong>និយមន័យ ៖</strong> ពេល Swing High (ឬ Low) ២ ចំណុច ឬច្រើនជាងនេះ ស្ថិតនៅកម្រិតតម្លៃស្ទើរតែដូចគ្នា —
        Retail Trader ដាក់ Stop-Loss នៅកម្រិតដដែលៗ បង្កើតជា <strong>Liquidity Pool ដ៏ធំ</strong> មួយ ។ EQH = Equal
        Highs (BSL ធំ), EQL = Equal Lows (SSL ធំ) ។
      </p>
    ),
    diagram2Caption: 'EQH ២ ចំណុច ស្ថិតនៅកម្រិតដូចគ្នា — Liquidity ប្រមូលផ្តុំគ្នាធំជាងធម្មតា ត្រង់ចំណុចនេះ ។',
    rule2: (
      <>
        Pool កាន់តែច្រើនចំណុច Equal High/Low ដែលបង្កើតបាន Pool នោះ <strong>កាន់តែទាក់ទាញ Smart Money</strong> —
        Pool ធំតែងតែជាគោលដៅដែល Price "ចង់" ទៅដល់មុនបញ្ច្រាស ។
      </>
    ),
    h4: 'PDH/PDL និង PWH/PWL',
    pdhLabel: 'PDH — Previous Day High',
    pdhBody: 'High ខ្ពស់បំផុតកាលពីម្សិលមិញ',
    pdlLabel: 'PDL — Previous Day Low',
    pdlBody: 'Low ទាបបំផុតកាលពីម្សិលមិញ',
    pwhLabel: 'PWH — Previous Week High',
    pwhBody: 'High ខ្ពស់បំផុតកាលពីសប្តាហ៍មុន',
    pwlLabel: 'PWL — Previous Week Low',
    pwlBody: 'Low ទាបបំផុតកាលពីសប្តាហ៍មុន',
    diagram3Caption: 'PDH/PDL (បន្ទាត់ខ្ពស់/ទាប ម្សិលមិញ) និង PWH/PWL (បន្ទាត់ខ្ពស់/ទាប សប្តាហ៍មុន) — ទាំងអស់ជា Liquidity Level ដែល Institution តាមដាន ។',
    rule3: (
      <>
        PDH/PDL និង PWH/PWL គឺជា Level ដែល Institution Trader <strong>តាមដានជានិច្ច</strong> — ជាពិសេស PWH/PWL
        មានទំងន់ខ្លាំងជាង ព្រោះជា Timeframe ធំជាង ។
      </>
    ),
    h5: 'Session Liquidity',
    sessionDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Swing High/Low ដែលបង្កើតឡើងក្នុង Session ជាក់លាក់មួយ (ឧ. Asia Session) —
        ក្លាយជា Liquidity Pool ដែល Session បន្ទាប់ (ឧ. London) ច្រើនតែត្រឡប់មក Sweep មុននឹងចាប់ផ្តើម Trend ពិត ។
      </p>
    ),
    diagram4Caption: 'Asia Session បង្កើត Range តូចមួយ — London Session បើក រួច Sweep High/Low របស់ Asia មុននឹង Trend ។',
    h6: 'Psychology Number (CME Data)',
    psychDef: (
      <p>
        <strong>និយមន័យ ៖</strong> លេខមូល (Round Number) ដូចជា <strong>4500, 4550, 4600</strong> — Trader ជាច្រើន
        ដាក់ Order នៅជុំវិញលេខទាំងនេះដោយចិត្តសាស្ត្រ (ងាយចងចាំ) ។ លេខទាំងនេះក្លាយជា Liquidity Level ខ្លាំង ទោះបីជា
        មិនមែនជា Swing High/Low ក៏ដោយ ។
      </p>
    ),
    psychExampleLabel: 'ឧទាហរណ៍ — S&P 500 Futures (ES)',
    psychExample: '4500 · 4550 · 4600 · 4650 · 4700 — រាល់ 50 Point',
    h7: 'Internal Range Liquidity vs External Range Liquidity (IRL / ERL)',
    erlLabel: 'ERL — External Range Liquidity',
    erlBody: (
      <>
        Liquidity ស្ថិតនៅ <strong>ក្រៅ</strong> Dealing Range — BSL/SSL, EQH/EQL, PDH/PDL ។
        <br />
        <strong>→ គោលដៅដំបូងដែល Price ស្វែងរក</strong>
      </>
    ),
    irlLabel: 'IRL — Internal Range Liquidity',
    irlBody: (
      <>
        PD Array ស្ថិតនៅ <strong>ក្នុង</strong> Dealing Range — FVG, OB, Breaker ។
        <br />
        <strong>→ តំបន់ Entry បន្ទាប់ពី Price ត្រឡប់ចូលមកវិញ</strong>
      </>
    ),
    diagram5Caption: 'Price ចេញពី IRL (PD Array ក្នុង Range) ទៅ Sweep ERL (Liquidity ក្រៅ Range) រួចត្រឡប់ចូល IRL ម្តងទៀត ។',
    rule4: (
      <>
        ជាទូទៅ Price <strong>រត់ទៅរក ERL សិន</strong> (Liquidity Grab) មុននឹងត្រឡប់ចូលទៅរក IRL (PD Array) ដើម្បី
        Entry — នេះជា Sequence ស្តង់ដាររបស់ Smart Money ។
      </>
    ),
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'BSL (Buy-Side Liquidity) ស្ថិតនៅត្រង់ណា?',
      options: [
        { label: 'លើ Swing High', type: 'ok' },
        { label: 'ក្រោម Swing Low', type: 'no' },
        { label: 'ត្រង់ 50% នៃ Range', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! BSL ស្ថិតនៅលើ Swing High (Stop-Loss របស់អ្នក Sell) ។',
        no: '✗ BSL (Buy-Side Liquidity) ស្ថិតនៅលើ Swing High ។',
      },
    },
    quiz2: {
      question: 'ERL និង IRL — តើមួយណាជាគោលដៅដំបូងដែល Price ច្រើនតែរត់ទៅរក?',
      options: [
        { label: 'IRL (PD Array ក្នុង Range)', type: 'no' },
        { label: 'ERL (Liquidity ក្រៅ Range)', type: 'ok' },
        { label: 'ទាំង ២ ក្នុងពេលតែមួយ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Price ច្រើនតែរត់ទៅ Sweep ERL សិន មុននឹងត្រឡប់ចូល IRL ។',
        no: '✗ Price ច្រើនតែរត់ទៅ ERL (Liquidity ក្រៅ Range) សិន ។',
      },
    },
    quiz3: {
      question: 'តើអ្វីជា Psychology Number?',
      options: [
        { label: 'Swing High ចុងក្រោយបំផុត', type: 'no' },
        { label: 'លេខមូលដូចជា 4500, 4550, 4600 ដែល Trader ច្រើនដាក់ Order', type: 'ok' },
        { label: 'ចំណុច 50% នៃ Fibonacci', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Psychology Number ជាលេខមូលដែល Trader ច្រើនដាក់ Order ដោយចិត្តសាស្ត្រ ។',
        no: '✗ Psychology Number ជាលេខមូល (ដូចជា 4500, 4550, 4600) ដែល Trader ច្រើនដាក់ Order ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ២',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងឆ្លើយសំណួរដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: (
      <>
        តើ Candle លេខប៉ុន្មាន Sweep <strong>SSL</strong> ក្រោម Swing Low ដំបូង?
      </>
    ),
    homeworkLi2: (
      <>
        តើ Candle លេខប៉ុន្មាន Sweep <strong>BSL</strong> លើ EQH?
      </>
    ),
    homeworkLi3: <>តើ Sequence នេះជា ERL → IRL ឬ IRL → ERL?</>,
    homeworkCaption: 'Chart នេះមិនទាន់មាន Label ទេ — សាកល្បងកំណត់ដោយខ្លួនឯងសិន ។',
    homeworkRevealLabel: '👁 មើលចម្លើយ',
    homeworkAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Candle 2 Sweep <strong>SSL</strong> ក្រោម Swing Low ដំបូង (Candle 1) រួច Price
        ឡើងទៅ Sweep <strong>BSL</strong> នៅ Candle 6 ដែលជា EQH (Candle 3 និង 5 ស្មើគ្នា) ។ Sequence នេះជា{' '}
        <strong>ERL → ERL</strong> ២ ដងជាប់គ្នា — SSL ជា ERL ខាងក្រោម, EQH ជា ERL ខាងលើ — មុននឹង Price ត្រឡប់ចូល
        IRL (FVG/OB) ដើម្បី Entry ពិត ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> បើកយក Chart ពិតរបស់អ្នក រួច Mark BSL, SSL, EQH/EQL, PDH/PDL យ៉ាងហោច
        ណាស់ម្នាក់ម៉្យាង ។ សម្គាល់ថាតើ Price កំពុងទៅរក ERL ឬ IRL បន្ទាប់ ។ ថតរូបផ្ញើមក Mentor ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៧ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បង
        ម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'SSL (Sell-Side Liquidity) ស្ថិតនៅត្រង់ណា?',
        options: [
          { label: 'លើ Swing High', correct: false },
          { label: 'ក្រោម Swing Low', correct: true },
          { label: 'ត្រង់ Equilibrium', correct: false },
        ],
      },
      {
        question: 'EQH (Equal Highs) បង្កើត Liquidity Pool ធំ ព្រោះ...?',
        options: [
          { label: 'Retail Trader ច្រើនដាក់ Stop-Loss នៅកម្រិតដដែលៗ', correct: true },
          { label: 'វាតែងតែជា Dealing Range High', correct: false },
          { label: 'វាកើតឡើងតែម្តងគត់ក្នុង ១ ឆ្នាំ', correct: false },
        ],
      },
      {
        question: 'PWH/PWL តំណាងឲ្យអ្វី?',
        options: [
          { label: 'Previous Week High / Previous Week Low', correct: true },
          { label: 'Price Wave High / Price Wave Low', correct: false },
          { label: 'Pending Weekly Highlight', correct: false },
        ],
      },
      {
        question: 'Session Liquidity ច្រើនកើតឡើងនៅពេលណា?',
        options: [
          { label: 'Session បន្ទាប់ Sweep High/Low របស់ Session មុន', correct: true },
          { label: 'តែនៅចុងសប្តាហ៍ប៉ុណ្ណោះ', correct: false },
          { label: 'តែពេល News Release ប៉ុណ្ណោះ', correct: false },
        ],
      },
      {
        question: 'Psychology Number ដូចជា 4500, 4550, 4600 កើតចេញពីអ្វី?',
        options: [
          { label: 'Fibonacci Retracement', correct: false },
          { label: 'លេខមូលដែល Trader ដាក់ Order ដោយចិត្តសាស្ត្រ', correct: true },
          { label: 'Order Block ចុងក្រោយ', correct: false },
        ],
      },
      {
        question: 'ERL (External Range Liquidity) ស្ថិតនៅឯណា?',
        options: [
          { label: 'ក្នុង Dealing Range (ដូចជា FVG, OB)', correct: false },
          { label: 'ក្រៅ Dealing Range (ដូចជា BSL, SSL, EQH, PDH)', correct: true },
          { label: 'ត្រង់ 50% Equilibrium ប៉ុណ្ណោះ', correct: false },
        ],
      },
      {
        question: 'Sequence ធម្មតារបស់ Smart Money គឺជាអ្វី?',
        options: [
          { label: 'ទៅ IRL សិន រួចចេញទៅ ERL', correct: false },
          { label: 'Sweep ERL សិន រួចត្រឡប់ចូល IRL ដើម្បី Entry', correct: true },
          { label: 'ជៀសវាង ERL និង IRL ទាំងស្រុង', correct: false },
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
    lessonTag: 'Lesson 2',
    intro: (
      <>
        <strong>Liquidity</strong> is the real reason price moves at all — banks and institutions need huge
        amounts of it to fill their large orders. It sits wherever stop-losses and pending orders cluster, which
        is usually just above or below a swing point. This lesson expands the LQ concept into 7 advanced forms.
      </>
    ),
    videoCaption: 'Listen closely — every liquidity pool is a potential target for Smart Money.',
    h1: 'What Is Liquidity?',
    liquidityDef: (
      <p>
        <strong>Definition:</strong> Liquidity is the orders "resting" on the chart — mostly retail traders'
        stop-losses parked above or below a swing point. Smart Money needs those exact prices to fill its own
        large orders before it reverses direction.
      </p>
    ),
    h2: 'LQ Pool — Buy-Side & Sell-Side Liquidity',
    bslLabel: 'BSL — Buy-Side Liquidity',
    bslBody: (
      <>
        Buy orders (sellers' stop-losses) sit <strong>above a Swing High</strong>
        <br />
        Smart Money "grabs" this liquidity before selling
      </>
    ),
    sslLabel: 'SSL — Sell-Side Liquidity',
    sslBody: (
      <>
        Sell orders (buyers' stop-losses) sit <strong>below a Swing Low</strong>
        <br />
        Smart Money "grabs" this liquidity before buying
      </>
    ),
    lqSteps: [
      <>
        Mark every <strong>Swing High</strong> on the chart — <strong>BSL</strong> sits above it.
      </>,
      <>
        Mark every <strong>Swing Low</strong> on the chart — <strong>SSL</strong> sits below it.
      </>,
      <>
        Watch which one price sweeps first — that's your clue for the next likely direction.
      </>,
    ],
    diagram1Caption: 'Price sweeps SSL below the Swing Low first, then reverses up toward BSL above the Swing High.',
    rule1: (
      <>
        A liquidity sweep is <strong>not the same as a BOS</strong> — it's just a wick grabbing orders. Wait for a
        reaction (like a CHoCH) after the sweep before entering.
      </>
    ),
    h3: 'Equal Highs & Equal Lows (EQH / EQL)',
    eqhDef: (
      <p>
        <strong>Definition:</strong> When two or more Swing Highs (or Lows) sit at nearly the same price, retail
        traders keep stacking stop-losses at that same level, building one <strong>large liquidity pool</strong>.
        EQH = Equal Highs (a big BSL pool), EQL = Equal Lows (a big SSL pool).
      </p>
    ),
    diagram2Caption: 'Two Equal Highs sitting at the same level — liquidity stacks up much more heavily right there than at a single swing.',
    rule2: (
      <>
        The more equal points that make up the pool, the <strong>more attractive it is to Smart Money</strong> —
        a large pool is usually the target price "wants" to reach before reversing.
      </>
    ),
    h4: 'PDH/PDL and PWH/PWL',
    pdhLabel: 'PDH — Previous Day High',
    pdhBody: "Yesterday's highest point",
    pdlLabel: 'PDL — Previous Day Low',
    pdlBody: "Yesterday's lowest point",
    pwhLabel: 'PWH — Previous Week High',
    pwhBody: "Last week's highest point",
    pwlLabel: 'PWL — Previous Week Low',
    pwlBody: "Last week's lowest point",
    diagram3Caption: "PDH/PDL (yesterday's high/low) and PWH/PWL (last week's high/low) — both are liquidity levels institutions track closely.",
    rule3: (
      <>
        PDH/PDL and PWH/PWL are levels institutional traders <strong>watch constantly</strong> — PWH/PWL carries
        even more weight since it comes from a higher timeframe.
      </>
    ),
    h5: 'Session Liquidity',
    sessionDef: (
      <p>
        <strong>Definition:</strong> The Swing High/Low formed during a specific trading session (e.g. the Asia
        session) becomes a liquidity pool the next session (e.g. London) often sweeps before the real trend for
        the day begins.
      </p>
    ),
    diagram4Caption: 'The Asia session prints a tight range — London opens and sweeps the Asia High/Low before the real trend starts.',
    h6: 'Psychology Number (CME Data)',
    psychDef: (
      <p>
        <strong>Definition:</strong> Round numbers like <strong>4500, 4550, 4600</strong> — traders place orders
        around these levels simply because they're easy to remember. That psychological weight makes them strong
        liquidity levels, even without being an actual Swing High/Low.
      </p>
    ),
    psychExampleLabel: 'Example — S&P 500 Futures (ES)',
    psychExample: '4500 · 4550 · 4600 · 4650 · 4700 — every 50 points',
    h7: 'Internal Range Liquidity vs External Range Liquidity (IRL / ERL)',
    erlLabel: 'ERL — External Range Liquidity',
    erlBody: (
      <>
        Liquidity sitting <strong>outside</strong> the Dealing Range — BSL/SSL, EQH/EQL, PDH/PDL.
        <br />
        <strong>→ The first target price usually looks for</strong>
      </>
    ),
    irlLabel: 'IRL — Internal Range Liquidity',
    irlBody: (
      <>
        PD arrays sitting <strong>inside</strong> the Dealing Range — FVG, OB, Breaker.
        <br />
        <strong>→ Where you look to enter once price comes back</strong>
      </>
    ),
    diagram5Caption: 'Price leaves an IRL (a PD array inside the range), sweeps an ERL (liquidity outside the range), then returns to the IRL.',
    rule4: (
      <>
        Price usually <strong>runs to the ERL first</strong> (a liquidity grab) before returning to an IRL (a PD
        array) to look for an entry — this is Smart Money's standard sequence.
      </>
    ),
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'Where does BSL (Buy-Side Liquidity) sit?',
      options: [
        { label: 'Above a Swing High', type: 'ok' },
        { label: 'Below a Swing Low', type: 'no' },
        { label: 'At the 50% of the range', type: 'no' },
      ],
      feedback: {
        ok: "✓ Correct! BSL sits above a Swing High (sellers' stop-losses).",
        no: '✗ BSL (Buy-Side Liquidity) sits above a Swing High.',
      },
    },
    quiz2: {
      question: 'Between ERL and IRL, which one does price usually run to first?',
      options: [
        { label: 'IRL (a PD array inside the range)', type: 'no' },
        { label: 'ERL (liquidity outside the range)', type: 'ok' },
        { label: 'Both, at the exact same time', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Price usually sweeps the ERL first, then returns to the IRL.',
        no: '✗ Price usually runs to the ERL (liquidity outside the range) first.',
      },
    },
    quiz3: {
      question: 'What is a Psychology Number?',
      options: [
        { label: 'The most recent Swing High', type: 'no' },
        { label: 'A round number like 4500, 4550, 4600 where traders commonly place orders', type: 'ok' },
        { label: 'The 50% Fibonacci point', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A Psychology Number is a round number where traders commonly cluster orders.',
        no: '✗ A Psychology Number is a round number (like 4500, 4550, 4600) where traders commonly place orders.',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 2',
    homeworkIntro: 'Study the chart below and try to answer for yourself before clicking "Show Answer":',
    homeworkLi1: (
      <>
        Which candle number sweeps the first <strong>SSL</strong> below the Swing Low?
      </>
    ),
    homeworkLi2: (
      <>
        Which candle number sweeps the <strong>BSL</strong> at the EQH?
      </>
    ),
    homeworkLi3: <>Is this sequence ERL → IRL, or ERL → ERL?</>,
    homeworkCaption: "This chart isn't labeled yet — try to work it out yourself first.",
    homeworkRevealLabel: '👁 Show Answer',
    homeworkAnswer: (
      <p>
        <strong>Answer:</strong> Candle 2 sweeps the <strong>SSL</strong> below the first Swing Low (Candle 1),
        then price rallies and sweeps the <strong>BSL</strong> at Candle 6, which is an EQH (Candle 3 and Candle
        5 sit at equal levels). This sequence is <strong>ERL → ERL</strong> twice in a row — the SSL below is one
        ERL, the EQH above is another ERL — before price is ready to return to an IRL (FVG/OB) for the real
        entry.
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Open a real chart, mark at least one of BSL, SSL, EQH/EQL, and
        PDH/PDL. Note whether price is currently heading toward an ERL or an IRL next. Screenshot it and send it
        to your mentor.
      </p>
    ),
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You need to answer <strong>all 7 questions correctly</strong> to unlock and move on to the next lesson —
        wrong answers can be retried an unlimited number of times.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Where does SSL (Sell-Side Liquidity) sit?',
        options: [
          { label: 'Above a Swing High', correct: false },
          { label: 'Below a Swing Low', correct: true },
          { label: 'At Equilibrium', correct: false },
        ],
      },
      {
        question: 'Equal Highs (EQH) form a large liquidity pool because...?',
        options: [
          { label: 'Retail traders keep stacking stop-losses at that same level', correct: true },
          { label: "It's always the Dealing Range High", correct: false },
          { label: 'It only ever happens once a year', correct: false },
        ],
      },
      {
        question: 'What does PWH/PWL stand for?',
        options: [
          { label: 'Previous Week High / Previous Week Low', correct: true },
          { label: 'Price Wave High / Price Wave Low', correct: false },
          { label: 'Pending Weekly Highlight', correct: false },
        ],
      },
      {
        question: 'Session Liquidity usually gets swept when...?',
        options: [
          { label: 'The next session sweeps the high/low of the prior session', correct: true },
          { label: 'Only at the very end of the week', correct: false },
          { label: 'Only during a news release', correct: false },
        ],
      },
      {
        question: 'Where do Psychology Numbers like 4500, 4550, 4600 come from?',
        options: [
          { label: 'A Fibonacci retracement', correct: false },
          { label: 'Round numbers traders cluster orders around psychologically', correct: true },
          { label: 'The most recent Order Block', correct: false },
        ],
      },
      {
        question: 'Where does ERL (External Range Liquidity) sit?',
        options: [
          { label: 'Inside the Dealing Range (like an FVG or OB)', correct: false },
          { label: 'Outside the Dealing Range (like BSL, SSL, EQH, PDH)', correct: true },
          { label: 'Only ever at the 50% Equilibrium', correct: false },
        ],
      },
      {
        question: "What's Smart Money's typical sequence?",
        options: [
          { label: 'Go to the IRL first, then leave for the ERL', correct: false },
          { label: 'Sweep the ERL first, then return to the IRL to look for an entry', correct: true },
          { label: 'Avoid both the ERL and IRL entirely', correct: false },
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
    lessonTag: '第 2 课',
    intro: (
      <>
        <strong>流动性（Liquidity）</strong>才是价格真正移动的原因 — 银行与机构需要大量流动性来成交自己的大额订单。
        流动性所在的位置，通常就是止损单与挂单聚集的地方 — 一般在摆动高点上方或摆动低点下方。本课将流动性概念
        扩展为 7 种进阶形态。
      </>
    ),
    videoCaption: '用心聆听 — 每一个流动性池，都可能是机构资金的潜在目标。',
    h1: '什么是流动性？',
    liquidityDef: (
      <p>
        <strong>定义：</strong>流动性就是图表上"静置"的订单 — 大多是散户交易者放在摆动点上方或下方的止损单。
        机构资金需要这些具体价位来成交自己的大额订单，然后再反转方向。
      </p>
    ),
    h2: 'LQ Pool — 买方流动性与卖方流动性',
    bslLabel: 'BSL — Buy-Side Liquidity（买方流动性）',
    bslBody: (
      <>
        买单（卖方的止损单）位于 <strong>摆动高点上方</strong>
        <br />
        机构资金会在卖出之前先"扫掉"这些流动性
      </>
    ),
    sslLabel: 'SSL — Sell-Side Liquidity（卖方流动性）',
    sslBody: (
      <>
        卖单（买方的止损单）位于 <strong>摆动低点下方</strong>
        <br />
        机构资金会在买入之前先"扫掉"这些流动性
      </>
    ),
    lqSteps: [
      <>
        在图表上标出每一个<strong>摆动高点</strong> — 它上方就是 <strong>BSL</strong>。
      </>,
      <>
        在图表上标出每一个<strong>摆动低点</strong> — 它下方就是 <strong>SSL</strong>。
      </>,
      <>观察价格先扫哪一边 — 这是判断接下来方向的重要线索。</>,
    ],
    diagram1Caption: '价格先扫掉摆动低点下方的 SSL，随后反转向上，扫向摆动高点上方的 BSL。',
    rule1: (
      <>
        流动性扫荡（Liquidity Sweep）<strong>不等于 BOS</strong> — 它只是一根影线扫掉订单而已。扫荡之后要先等
        反应出现（比如 CHoCH），再考虑入场。
      </>
    ),
    h3: 'Equal Highs 与 Equal Lows（EQH / EQL）',
    eqhDef: (
      <p>
        <strong>定义：</strong>当两个或更多摆动高点（或低点）处于几乎相同的价位时，散户会不断在同一水平堆叠止损
        单，形成一个<strong>更大的流动性池</strong>。EQH = Equal Highs（大型 BSL 池），EQL = Equal Lows（大型
        SSL 池）。
      </p>
    ),
    diagram2Caption: '两个 Equal High 处于同一水平 — 该位置的流动性会比单一摆动点堆积得多得多。',
    rule2: (
      <>
        构成这个池的相等点越多，<strong>对机构资金的吸引力就越大</strong> — 大型流动性池通常就是价格反转之前
        "想要"到达的目标。
      </>
    ),
    h4: 'PDH/PDL 与 PWH/PWL',
    pdhLabel: 'PDH — Previous Day High（昨日最高点）',
    pdhBody: '昨天的最高点',
    pdlLabel: 'PDL — Previous Day Low（昨日最低点）',
    pdlBody: '昨天的最低点',
    pwhLabel: 'PWH — Previous Week High（上周最高点）',
    pwhBody: '上周的最高点',
    pwlLabel: 'PWL — Previous Week Low（上周最低点）',
    pwlBody: '上周的最低点',
    diagram3Caption: 'PDH/PDL（昨日高低点）与 PWH/PWL（上周高低点）— 都是机构密切关注的流动性水平。',
    rule3: (
      <>
        PDH/PDL 与 PWH/PWL 是机构交易者<strong>持续关注</strong>的水平 — PWH/PWL 因为来自更高的周期，权重甚至
        更大。
      </>
    ),
    h5: 'Session Liquidity（时段流动性）',
    sessionDef: (
      <p>
        <strong>定义：</strong>某个特定交易时段（例如亚洲时段）形成的摆动高/低点，会成为下一个时段（例如伦敦
        时段）在当天真正趋势开始之前经常扫荡的流动性池。
      </p>
    ),
    diagram4Caption: '亚洲时段形成一个较窄的区间 — 伦敦时段开盘后扫荡亚洲时段的高/低点，随后才开始真正的趋势。',
    h6: 'Psychology Number（心理数字，CME 数据）',
    psychDef: (
      <p>
        <strong>定义：</strong>像 <strong>4500、4550、4600</strong> 这样的整数 — 交易者仅仅因为它们容易记忆，就
        习惯在这些价位附近挂单。这种心理上的重量，让它们即使不是真正的摆动高/低点，也会成为强流动性水平。
      </p>
    ),
    psychExampleLabel: '示例 — S&P 500 期货（ES）',
    psychExample: '4500 · 4550 · 4600 · 4650 · 4700 — 每隔 50 点',
    h7: 'Internal Range Liquidity 与 External Range Liquidity（IRL / ERL）',
    erlLabel: 'ERL — External Range Liquidity（区间外流动性）',
    erlBody: (
      <>
        流动性位于 Dealing Range <strong>之外</strong> — BSL/SSL、EQH/EQL、PDH/PDL。
        <br />
        <strong>→ 价格通常最先寻找的目标</strong>
      </>
    ),
    irlLabel: 'IRL — Internal Range Liquidity（区间内流动性）',
    irlBody: (
      <>
        PD array 位于 Dealing Range <strong>之内</strong> — FVG、OB、Breaker。
        <br />
        <strong>→ 价格回归后寻找入场的区域</strong>
      </>
    ),
    diagram5Caption: '价格从 IRL（区间内的 PD array）出发，扫荡 ERL（区间外流动性），随后再回到 IRL。',
    rule4: (
      <>
        价格通常会<strong>先跑向 ERL</strong>（一次流动性扫荡），然后再回到 IRL（PD array）寻找入场 — 这是机构
        资金的标准操作顺序。
      </>
    ),
    quizHeading: '知识检测',
    quiz1: {
      question: 'BSL（Buy-Side Liquidity）位于哪里？',
      options: [
        { label: '摆动高点上方', type: 'ok' },
        { label: '摆动低点下方', type: 'no' },
        { label: '区间的 50% 处', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！BSL 位于摆动高点上方（卖方的止损单）。',
        no: '✗ BSL（Buy-Side Liquidity）位于摆动高点上方。',
      },
    },
    quiz2: {
      question: '在 ERL 与 IRL 之间，价格通常会先跑向哪一个？',
      options: [
        { label: 'IRL（区间内的 PD array）', type: 'no' },
        { label: 'ERL（区间外流动性）', type: 'ok' },
        { label: '两者同时', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！价格通常先扫荡 ERL，再回到 IRL。',
        no: '✗ 价格通常会先跑向 ERL（区间外流动性）。',
      },
    },
    quiz3: {
      question: '什么是 Psychology Number？',
      options: [
        { label: '最近一个摆动高点', type: 'no' },
        { label: '像 4500、4550、4600 这样交易者常挂单的整数', type: 'ok' },
        { label: 'Fibonacci 的 50% 位置', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Psychology Number 是交易者常聚集挂单的整数价位。',
        no: '✗ Psychology Number 是像 4500、4550、4600 这样交易者常挂单的整数。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 2 课',
    homeworkIntro: '先自己研究下面的图表，再点击"查看答案"：',
    homeworkLi1: (
      <>
        哪根蜡烛扫掉了摆动低点下方的第一个 <strong>SSL</strong>？
      </>
    ),
    homeworkLi2: (
      <>
        哪根蜡烛扫掉了 EQH 处的 <strong>BSL</strong>？
      </>
    ),
    homeworkLi3: <>这个顺序是 ERL → IRL，还是 ERL → ERL？</>,
    homeworkCaption: '这张图还没有标注 — 先自己试着判断。',
    homeworkRevealLabel: '👁 查看答案',
    homeworkAnswer: (
      <p>
        <strong>答案：</strong>2 号蜡烛扫掉了 1 号蜡烛（第一个摆动低点）下方的 <strong>SSL</strong>，随后价格上涨
        并在 6 号蜡烛扫掉 <strong>BSL</strong>，而 6 号正是一个 EQH（3 号与 5 号处于相等水平）。这个顺序是连续
        两次 <strong>ERL → ERL</strong> — 下方的 SSL 是一个 ERL，上方的 EQH 是另一个 ERL — 之后价格才会回到 IRL
        （FVG/OB）寻找真正的入场点。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 额外作业：</strong>打开一张真实图表，至少标出 BSL、SSL、EQH/EQL、PDH/PDL 中的一种。记录当前
        价格接下来更可能走向 ERL 还是 IRL。截图发给导师。
      </p>
    ),
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        需要<strong>全部 7 题都答对</strong>才能解锁并进入下一课 — 答错可以无限次重试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'SSL（Sell-Side Liquidity）位于哪里？',
        options: [
          { label: '摆动高点上方', correct: false },
          { label: '摆动低点下方', correct: true },
          { label: 'Equilibrium 处', correct: false },
        ],
      },
      {
        question: 'Equal Highs（EQH）会形成大型流动性池，是因为...？',
        options: [
          { label: '散户不断在同一水平堆叠止损单', correct: true },
          { label: '它永远是 Dealing Range High', correct: false },
          { label: '它一年只会出现一次', correct: false },
        ],
      },
      {
        question: 'PWH/PWL 代表什么？',
        options: [
          { label: 'Previous Week High / Previous Week Low（上周高/低点）', correct: true },
          { label: 'Price Wave High / Price Wave Low', correct: false },
          { label: 'Pending Weekly Highlight', correct: false },
        ],
      },
      {
        question: 'Session Liquidity 通常在什么时候被扫荡？',
        options: [
          { label: '下一个时段扫荡上一个时段的高/低点时', correct: true },
          { label: '只会在每周最后才发生', correct: false },
          { label: '只在新闻发布时发生', correct: false },
        ],
      },
      {
        question: '像 4500、4550、4600 这样的 Psychology Number 从何而来？',
        options: [
          { label: 'Fibonacci 回撤', correct: false },
          { label: '交易者出于心理习惯聚集挂单的整数价位', correct: true },
          { label: '最近一个 Order Block', correct: false },
        ],
      },
      {
        question: 'ERL（External Range Liquidity）位于哪里？',
        options: [
          { label: 'Dealing Range 之内（如 FVG 或 OB）', correct: false },
          { label: 'Dealing Range 之外（如 BSL、SSL、EQH、PDH）', correct: true },
          { label: '只会在 50% Equilibrium 处', correct: false },
        ],
      },
      {
        question: '机构资金的典型操作顺序是？',
        options: [
          { label: '先去 IRL，再离开去 ERL', correct: false },
          { label: '先扫荡 ERL，再回到 IRL 寻找入场', correct: true },
          { label: '完全避开 ERL 与 IRL', correct: false },
        ],
      },
    ],
  },
};

export default function Advanced2({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['adv2']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="adv2"
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

      {/* ===== WHAT IS LIQUIDITY ===== */}
      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Box variant="g">{t.liquidityDef}</Box>

      {/* ===== LQ POOL ===== */}
      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.bslLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.bslBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.sslLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.sslBody}
        </GridItem>
      </div>
      <Steps items={t.lqSteps} />

      <AnimatedFig caption={t.diagram1Caption}>
        <svg viewBox="0 0 700 220">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">LIQUIDITY POOL — BSL &amp; SSL</text>

          <line x1="20" y1="55" x2="650" y2="55" stroke="#3EC97A" strokeWidth="0.8" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="175" x2="650" y2="175" stroke="#E05555" strokeWidth="0.8" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="655" y="59" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>BSL</text>
          <text x="655" y="179" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>SSL</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="50" y1="95" x2="50" y2="145" stroke="#3EC97A" strokeWidth="1.4" /><rect x="44" y="100" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.28s' }}><line x1="90" y1="130" x2="90" y2="180" stroke="#E05555" strokeWidth="1.4" /><rect x="84" y="135" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.36s' }}><line x1="130" y1="160" x2="130" y2="190" stroke="#E05555" strokeWidth="1.4" /><rect x="124" y="165" width="12" height="20" rx="1" fill="#E05555" /></g>
          <text x="130" y="205" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.4s' }}>Sweep SSL ↓</text>

          <g className="ac" style={{ animationDelay: '.44s' }}><line x1="170" y1="140" x2="170" y2="170" stroke="#3EC97A" strokeWidth="1.4" /><rect x="164" y="145" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.52s' }}><line x1="210" y1="100" x2="210" y2="145" stroke="#3EC97A" strokeWidth="1.4" /><rect x="204" y="105" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="250" y1="65" x2="250" y2="105" stroke="#3EC97A" strokeWidth="1.4" /><rect x="244" y="70" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.68s' }}><line x1="290" y1="40" x2="290" y2="70" stroke="#3EC97A" strokeWidth="1.4" /><rect x="284" y="45" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <text x="290" y="30" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.72s' }}>Sweep BSL ↑</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== EQH / EQL ===== */}
      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="b">{t.eqhDef}</Box>

      <AnimatedFig caption={t.diagram2Caption}>
        <svg viewBox="0 0 700 190">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">EQUAL HIGHS (EQH)</text>
          <line x1="20" y1="60" x2="650" y2="60" stroke="#E05555" strokeWidth="0.8" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="655" y="64" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>BSL Pool</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="60" y1="100" x2="60" y2="150" stroke="#3EC97A" strokeWidth="1.4" /><rect x="54" y="105" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.28s' }}><line x1="130" y1="60" x2="130" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="124" y="65" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="130" y="45" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.32s' }}>High 1</text>

          <g className="ac" style={{ animationDelay: '.36s' }}><line x1="200" y1="90" x2="200" y2="140" stroke="#E05555" strokeWidth="1.4" /><rect x="194" y="95" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.44s' }}><line x1="270" y1="60" x2="270" y2="105" stroke="#3EC97A" strokeWidth="1.4" /><rect x="264" y="65" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="270" y="45" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.48s' }}>High 2 = Equal</text>

          <g className="ac" style={{ animationDelay: '.52s' }}><line x1="340" y1="95" x2="340" y2="150" stroke="#E05555" strokeWidth="1.4" /><rect x="334" y="100" width="12" height="40" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="410" y1="35" x2="410" y2="60" stroke="#3EC97A" strokeWidth="1.4" /><rect x="404" y="40" width="12" height="18" rx="1" fill="#3EC97A" /></g>
          <text x="410" y="25" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.65s' }}>Sweep ↑</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule2}</Rule>

      {/* ===== PDH/PDL & PWH/PWL ===== */}
      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.pdhLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.pdhBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.pdlLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.pdlBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.pwhLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.pwhBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.pwlLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.pwlBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram3Caption}>
        <svg viewBox="0 0 700 190">
          <line x1="20" y1="45" x2="650" y2="45" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="5 3" className="ac" style={{ animationDelay: '.1s' }} />
          <line x1="20" y1="150" x2="650" y2="150" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="5 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="655" y="49" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>PWH</text>
          <text x="655" y="154" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>PWL</text>

          <line x1="20" y1="70" x2="650" y2="70" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.2s' }} />
          <line x1="20" y1="125" x2="650" y2="125" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="655" y="74" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>PDH</text>
          <text x="655" y="129" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>PDL</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="200" y1="85" x2="200" y2="110" stroke="#3EC97A" strokeWidth="1.4" /><rect x="194" y="90" width="12" height="15" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="250" y1="95" x2="250" y2="118" stroke="#E05555" strokeWidth="1.4" /><rect x="244" y="98" width="12" height="15" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.46s' }}><line x1="300" y1="60" x2="300" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="294" y="65" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <text x="300" y="50" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>Today</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule3}</Rule>

      {/* ===== SESSION LIQUIDITY ===== */}
      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="g">{t.sessionDef}</Box>

      <AnimatedFig caption={t.diagram4Caption}>
        <svg viewBox="0 0 700 190">
          <rect x="40" y="70" width="180" height="60" fill="#5B9BD5" opacity="0.1" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="130" y="60" textAnchor="middle" fontSize="10" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>ASIA SESSION</text>
          <line x1="40" y1="75" x2="220" y2="75" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.2s' }} />
          <line x1="40" y1="125" x2="220" y2="125" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.2s' }} />

          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="70" y1="95" x2="70" y2="120" stroke="#3EC97A" strokeWidth="1.2" /><rect x="65" y="99" width="10" height="15" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.32s' }}><line x1="110" y1="80" x2="110" y2="105" stroke="#E05555" strokeWidth="1.2" /><rect x="105" y="84" width="10" height="15" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.39s' }}><line x1="150" y1="90" x2="150" y2="118" stroke="#3EC97A" strokeWidth="1.2" /><rect x="145" y="94" width="10" height="15" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.46s' }}><line x1="190" y1="85" x2="190" y2="110" stroke="#E05555" strokeWidth="1.2" /><rect x="185" y="89" width="10" height="15" rx="1" fill="#E05555" /></g>

          <line x1="230" y1="0" x2="230" y2="190" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="3 3" className="ac" style={{ animationDelay: '.5s' }} />
          <text x="235" y="15" fontSize="9" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>LONDON OPEN</text>

          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="270" y1="100" x2="270" y2="140" stroke="#E05555" strokeWidth="1.4" /><rect x="264" y="105" width="12" height="30" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.68s' }}><line x1="310" y1="120" x2="310" y2="150" stroke="#E05555" strokeWidth="1.4" /><rect x="304" y="125" width="12" height="20" rx="1" fill="#E05555" /></g>
          <text x="310" y="165" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.72s' }}>Sweep Asia Low</text>

          <g className="ac" style={{ animationDelay: '.8s' }}><line x1="350" y1="80" x2="350" y2="115" stroke="#3EC97A" strokeWidth="1.4" /><rect x="344" y="85" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.88s' }}><line x1="390" y1="45" x2="390" y2="85" stroke="#3EC97A" strokeWidth="1.4" /><rect x="384" y="50" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="390" y="35" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.92s' }}>Real Trend ↑</text>
        </svg>
      </AnimatedFig>

      {/* ===== PSYCHOLOGY NUMBER ===== */}
      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="b">{t.psychDef}</Box>
      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: '#5B9BD5', marginBottom: 8 }}>
          {t.psychExampleLabel}
        </div>
        <svg viewBox="0 0 700 130">
          <line x1="20" y1="20" x2="650" y2="20" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" />
          <line x1="20" y1="45" x2="650" y2="45" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" />
          <line x1="20" y1="70" x2="650" y2="70" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" />
          <line x1="20" y1="95" x2="650" y2="95" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" />
          <line x1="20" y1="120" x2="650" y2="120" stroke="#5B9BD5" strokeWidth="0.7" strokeDasharray="3 3" />
          <text x="15" y="24" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif">4700</text>
          <text x="15" y="49" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif">4650</text>
          <text x="15" y="74" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif">4600</text>
          <text x="15" y="99" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif">4550</text>
          <text x="15" y="124" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Space Grotesk,sans-serif">4500</text>
          <g><line x1="300" y1="60" x2="300" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="294" y="65" width="12" height="20" rx="1" fill="#3EC97A" /></g>
        </svg>
        <div className="cap">{t.psychExample}</div>
      </div>

      {/* ===== IRL / ERL ===== */}
      <h3>
        <span className="bar"></span>
        {t.h7}
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.erlLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.erlBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.irlLabel} valStyle={{ marginTop: 6, fontSize: 13 }}>
          {t.irlBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram5Caption}>
        <svg viewBox="0 0 700 220">
          <rect x="60" y="50" width="580" height="120" fill="none" stroke="#2E7CF6" strokeWidth="1" className="ac" style={{ animationDelay: '.05s' }} />
          <text x="660" y="45" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>DR High (ERL)</text>
          <text x="660" y="178" fontSize="9" fill="#2E7CF6" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>DR Low (ERL)</text>

          <rect x="260" y="90" width="90" height="35" fill="#3EC97A" opacity="0.15" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="305" y="83" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>IRL (FVG)</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="120" y1="95" x2="120" y2="120" stroke="#3EC97A" strokeWidth="1.4" /><rect x="114" y="99" width="12" height="16" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="180" y1="80" x2="180" y2="105" stroke="#3EC97A" strokeWidth="1.4" /><rect x="174" y="84" width="12" height="16" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.46s' }}><line x1="240" y1="45" x2="240" y2="80" stroke="#3EC97A" strokeWidth="1.4" /><rect x="234" y="50" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <text x="240" y="35" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>Sweep ERL ↑</text>

          <g className="ac" style={{ animationDelay: '.58s' }}><line x1="380" y1="55" x2="380" y2="100" stroke="#E05555" strokeWidth="1.4" /><rect x="374" y="60" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.66s' }}><line x1="420" y1="90" x2="420" y2="125" stroke="#E05555" strokeWidth="1.4" /><rect x="414" y="95" width="12" height="25" rx="1" fill="#E05555" /></g>
          <text x="420" y="140" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Return to IRL</text>

          <g className="ac" style={{ animationDelay: '.78s' }}><line x1="460" y1="60" x2="460" y2="95" stroke="#3EC97A" strokeWidth="1.4" /><rect x="454" y="65" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.86s' }}><line x1="500" y1="40" x2="500" y2="70" stroke="#3EC97A" strokeWidth="1.4" /><rect x="494" y="45" width="12" height="20" rx="1" fill="#3EC97A" /></g>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule4}</Rule>

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
        <svg viewBox="0 0 700 220">
          <line x1="20" y1="55" x2="650" y2="55" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="20" y1="175" x2="650" y2="175" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="3 3" />

          <g><line x1="50" y1="150" x2="50" y2="180" stroke="#E05555" strokeWidth="1.4" /><rect x="44" y="155" width="12" height="20" rx="1" fill="#E05555" /></g>
          <text x="50" y="200" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">1</text>

          <g><line x1="100" y1="170" x2="100" y2="195" stroke="#E05555" strokeWidth="1.4" /><rect x="94" y="175" width="12" height="15" rx="1" fill="#E05555" /></g>
          <text x="100" y="210" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">2</text>

          <g><line x1="150" y1="110" x2="150" y2="160" stroke="#3EC97A" strokeWidth="1.4" /><rect x="144" y="115" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <text x="150" y="200" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">3</text>

          <g><line x1="200" y1="55" x2="200" y2="100" stroke="#3EC97A" strokeWidth="1.4" /><rect x="194" y="60" width="12" height="35" rx="1" fill="#3EC97A" /></g>
          <text x="200" y="200" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">4</text>

          <g><line x1="250" y1="70" x2="250" y2="105" stroke="#E05555" strokeWidth="1.4" /><rect x="244" y="75" width="12" height="25" rx="1" fill="#E05555" /></g>
          <text x="250" y="200" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">5</text>

          <g><line x1="300" y1="50" x2="300" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="294" y="55" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="300" y="200" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">6</text>
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
