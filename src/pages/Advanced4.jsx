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

const meta = getAdvancedLessonMeta('adv4');

// ICT terminology is kept in English across all three languages — same
// convention as the rest of the Advanced and Technical tracks. Session
// times are given in GMT/UTC — traders should convert to their broker's
// server time.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។',
    finishLocked: (p, tt) => `🔒 បញ្ចប់មេរៀន (${p}/${tt})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    ruleTitle: 'ច្បាប់ចងចាំ',
    lessonTag: 'មេរៀន ៤',
    intro: (
      <>
        Setup ដូចគ្នាបេះបិទ អាចមានលទ្ធផលខុសគ្នាទាំងស្រុង អាស្រ័យលើ <strong>ពេលវេលា</strong> ដែលវាកើតឡើង ។ មេរៀននេះ
        បង្រៀនអំពី <strong>Session</strong>, <strong>Killzone</strong>, និង <strong>AMD Cycle</strong> — ដើម្បី
        បញ្ជាក់ថា "ពេលណា" សំខាន់ស្មើនឹង "កន្លែងណា" ។
      </>
    ),
    videoCaption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — Setup ដ៏ល្អឥតខ្ចោះតែកើតឡើងខុស Killzone អាចគ្មានតម្លៃអ្វីទាល់តែសោះ ។',
    h1: 'Trading Sessions',
    sessionDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Forex/Futures Market បើកដំណើរការ ២៤ ម៉ោង ប៉ុន្តែបែងចែកជា ៣ Session ធំៗ តាម
        តំបន់ពេលវេលា — <strong>Asia</strong>, <strong>London</strong>, និង <strong>New York</strong> ។ Session
        នីមួយៗមានចរិតលក្ខណៈ Volatility ខុសគ្នា ។
      </p>
    ),
    asiaLabel: 'Asia Session',
    asiaBody: (
      <>
        23:00–08:00 GMT
        <br />
        Volatility ទាប, ច្រើនធ្វើ Range
        <br />
        <strong>→ បង្កើត Session Liquidity សម្រាប់ Session បន្ទាប់</strong>
      </>
    ),
    londonLabel: 'London Session',
    londonBody: (
      <>
        08:00–17:00 GMT
        <br />
        Volatility ខ្លាំង, ច្រើន Sweep Asia Range
        <br />
        <strong>→ ចាប់ផ្តើម Trend ជាទូទៅ</strong>
      </>
    ),
    nySessionLabel: 'New York Session',
    nySessionBody: (
      <>
        13:00–22:00 GMT
        <br />
        Overlap ជាមួយ London (13:00–17:00) = Volatility ខ្លាំងបំផុត
        <br />
        <strong>→ ច្រើនបន្ត ឬបញ្ច្រាស Trend ពី London</strong>
      </>
    ),
    diagram1Caption: 'Session ទាំង ៣ តាមពេលវេលា GMT — London-NY Overlap (13:00–17:00) ជាទូទៅមាន Volume ធំបំផុត ។',
    rule1: (
      <>
        ត្រូវប្តូរម៉ោង GMT ខាងលើទៅតាម Server Time របស់ Broker ខ្លួនឯង — Broker ខុសគ្នា អាចមាន Offset ខុសគ្នា ២-៣
        ម៉ោង ។
      </>
    ),
    h2: 'Killzones',
    killzoneDef: (
      <p>
        <strong>និយមន័យ ៖</strong> Killzone គឺជា Window ពេលវេលាតូចជាង Session ដែលមាន Probability ខ្ពស់បំផុត ក្នុង
        ការធ្វើ Displacement ។ Trader ICT ផ្តោតការ Trade ភាគច្រើននៅក្នុង Killzone ជាជាង Session ទាំងមូល ។
      </p>
    ),
    londonKzLabel: 'London Killzone',
    londonKzBody: '07:00–10:00 GMT',
    nyKzLabel: 'New York Killzone (AM)',
    nyKzBody: '12:00–15:00 GMT',
    asiaKzLabel: 'Asian Killzone',
    asiaKzBody: '00:00–03:00 GMT',
    diagram2Caption: 'Killzone (បន្ទាត់ត្រង់) ជា Window តូចជាង Session (ប្រអប់ស) — ភាគច្រើននៃ Displacement កើតឡើងក្នុងតំបន់តូចនេះ ។',
    rule2: (
      <>
        Setup ដែលកើតឡើងក្នុង <strong>Killzone</strong> មាន Probability ខ្ពស់ជាង Setup ដូចគ្នា ដែលកើតឡើងក្រៅ
        Killzone — ទោះបីជា Chart Pattern ដូចគ្នាបេះបិទក៏ដោយ ។
      </>
    ),
    h3: 'AMD — Accumulation, Manipulation, Distribution',
    amdDef: (
      <p>
        <strong>និយមន័យ ៖</strong> AMD ជា Cycle ៣ ដំណាក់កាល ដែល Price ធ្វើម្តងហើយម្តងទៀតរាល់ថ្ងៃ — Smart Money
        ប្រមូល Order ក្នុង Range (Accumulation), បន្ទាប់ Sweep Liquidity ភ្លាមៗ (Manipulation), រួច Trend ពិត
        កើតឡើង (Distribution) ។
      </p>
    ),
    accLabel: 'A — Accumulation',
    accBody: (
      <>
        Price ធ្វើ Range តូច (ជាទូទៅក្នុង Asia Session)
        <br />
        Smart Money ប្រមូល Order យ៉ាងស្ងាត់ៗ
      </>
    ),
    manLabel: 'M — Manipulation',
    manBody: (
      <>
        Price Sweep Liquidity (High ឬ Low នៃ Range) ភ្លាមៗ — ជា False Move
        <br />
        Retail Trader ជាច្រើនចាប់ Entry ខុសទិសត្រង់ចំណុចនេះ
      </>
    ),
    distLabel: 'D — Distribution',
    distBody: (
      <>
        Trend ពិតកើតឡើង ទិសដៅផ្ទុយពី Manipulation
        <br />
        Smart Money បិទ Order ធំរបស់ខ្លួននៅទីនេះ
      </>
    ),
    amdSteps: [
      <>
        សម្គាល់ <strong>Range តូច</strong> (Accumulation) — ជាទូទៅកើតឡើងក្នុង Asia Session ។
      </>,
      <>
        រង់ចាំមើលថាតើ Price Sweep High ឬ Low នៃ Range នោះ (<strong>Manipulation</strong>) — Wick វែងភ្លាមៗ ។
      </>,
      <>
        រកមើលទិសដៅ <strong>ផ្ទុយ</strong> ពី Manipulation នោះជា Trend ពិត (<strong>Distribution</strong>) — នេះជា
        Entry Zone ។
      </>,
    ],
    diagram3Caption: 'A → Range តូចក្នុង Asia · M → Sweep High ភ្លាមៗ (False Move) · D → Trend ពិតចុះ ដែលជា Entry Zone ។',
    rule3: (
      <>
        AMD Cycle កើតឡើងម្តងហើយម្តងទៀតរាល់ថ្ងៃ — លើ Timeframe ធំជាង (ដូចជាមួយសប្តាហ៍) វាក៏អាចកើតឡើងជា AMD ធំមួយ
        ដែរ (Weekly Range → Weekly Sweep → Weekly Trend) ។
      </>
    ),
    quizHeading: 'ពិនិត្យចំណេះដឹង',
    quiz1: {
      question: 'Session ណាមួយ ជាទូទៅមាន Volatility ខ្ពស់បំផុត?',
      options: [
        { label: 'Asia Session', type: 'no' },
        { label: 'London-New York Overlap', type: 'ok' },
        { label: 'Session ណាមួយក៏ដូចគ្នា', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! London-NY Overlap (13:00–17:00 GMT) ជាទូទៅមាន Volatility ខ្លាំងបំផុត ។',
        no: '✗ London-New York Overlap ជាទូទៅមាន Volatility ខ្លាំងបំផុត ។',
      },
    },
    quiz2: {
      question: 'ក្នុង AMD Cycle — Manipulation កើតឡើងនៅដំណាក់កាលណា?',
      options: [
        { label: 'មុន Accumulation', type: 'no' },
        { label: 'ក្រោយ Accumulation ប៉ុន្តែមុន Distribution', type: 'ok' },
        { label: 'ក្រោយ Distribution', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Sequence ត្រឹមត្រូវ ៖ Accumulation → Manipulation → Distribution ។',
        no: '✗ Manipulation កើតឡើងក្រោយ Accumulation ប៉ុន្តែមុន Distribution — Sequence ត្រូវជា A → M → D ។',
      },
    },
    homeworkHeading: '📝 កិច្ចការផ្ទះ — មេរៀនទី ៤',
    homeworkIntro: 'មើល Chart ខាងក្រោម ហើយសាកល្បងឆ្លើយសំណួរដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖',
    homeworkLi1: <>តើផ្នែកណានៃ Chart នេះជា Accumulation?</>,
    homeworkLi2: <>តើ Candle ណា Sweep High/Low ជា Manipulation?</>,
    homeworkLi3: <>តើទិសដៅ Distribution ពិតប្រាកដ គឺទិសណា?</>,
    homeworkCaption: 'Chart នេះមិនទាន់មាន Label ទេ — សាកល្បងកំណត់ដោយខ្លួនឯងសិន ។',
    homeworkRevealLabel: '👁 មើលចម្លើយ',
    homeworkAnswer: (
      <p>
        <strong>ចម្លើយ ៖</strong> Candle 1-4 បង្កើត <strong>Range</strong> តូច (Accumulation) ។ Candle 5 Sweep
        High នៃ Range នោះជា <strong>Manipulation</strong> (False Move ឡើងលើ) ។ Candle 6-9 បញ្ច្រាសទិសចុះខ្លាំង —
        នេះជា <strong>Distribution</strong> ពិតប្រាកដ ទិសចុះ — ត្រង់ត្រូវនឹងទ្រឹស្តី AMD ពិតប្រាកដ ។
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 កិច្ចការបន្ថែម ៖</strong> តាមដាន Chart ណាមួយរបស់អ្នកចាប់ពី Asia Session ដល់ London — សម្គាល់ថា
        តើ A, M, D កើតឡើងត្រង់ណា ។ ថតរូបផ្ញើមក Mentor ។
      </p>
    ),
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៦ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បង
        ម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Session ចម្បងទាំង ៣ របស់ Forex/Futures Market មានអ្វីខ្លះ?',
        options: [
          { label: 'Asia, London, New York', correct: true },
          { label: 'ព្រឹក, ថ្ងៃត្រង់, ល្ងាច', correct: false },
          { label: 'BOS, CHoCH, FVG', correct: false },
        ],
      },
      {
        question: 'Killzone ខុសពី Session ត្រង់ណា?',
        options: [
          { label: 'Killzone ធំជាង Session', correct: false },
          { label: 'Killzone ជា Window តូចជាង ដែលមាន Probability ខ្ពស់ជាងក្នុង Session', correct: true },
          { label: 'ពួកវាដូចគ្នាទាំងស្រុង', correct: false },
        ],
      },
      {
        question: 'AMD តំណាងឲ្យអ្វី?',
        options: [
          { label: 'Accumulation, Manipulation, Distribution', correct: true },
          { label: 'Asia, Manila, Dubai', correct: false },
          { label: 'Average, Median, Deviation', correct: false },
        ],
      },
      {
        question: 'Sequence ត្រឹមត្រូវនៃ AMD Cycle គឺជាអ្វី?',
        options: [
          { label: 'Manipulation → Accumulation → Distribution', correct: false },
          { label: 'Accumulation → Manipulation → Distribution', correct: true },
          { label: 'Distribution → Accumulation → Manipulation', correct: false },
        ],
      },
      {
        question: 'Manipulation Phase ជាទូទៅមានលក្ខណៈយ៉ាងណា?',
        options: [
          { label: 'Trend រលូនយឺតៗ', correct: false },
          { label: 'Sweep Liquidity ភ្លាមៗ ជា False Move', correct: true },
          { label: 'Range ស្ងប់ស្ងាត់រយៈពេលយូរ', correct: false },
        ],
      },
      {
        question: 'ហេតុអ្វី London-NY Overlap សំខាន់?',
        options: [
          { label: 'ព្រោះវាមាន Volume និង Volatility ខ្លាំងបំផុត', correct: true },
          { label: 'ព្រោះ Market បិទក្នុងអំឡុងពេលនោះ', correct: false },
          { label: 'ព្រោះវាកើតឡើងតែថ្ងៃសុក្រ', correct: false },
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
    lessonTag: 'Lesson 4',
    intro: (
      <>
        The exact same setup can play out completely differently depending on <strong>when</strong> it happens.
        This lesson covers <strong>Sessions</strong>, <strong>Killzones</strong>, and the{' '}
        <strong>AMD Cycle</strong> — proving that WHEN matters just as much as WHERE.
      </>
    ),
    videoCaption: 'Listen closely — a perfect-looking setup that forms outside a Killzone can be worth nothing at all.',
    h1: 'Trading Sessions',
    sessionDef: (
      <p>
        <strong>Definition:</strong> The forex/futures market runs 24 hours a day, but it splits into 3 major
        sessions by region — <strong>Asia</strong>, <strong>London</strong>, and{' '}
        <strong>New York</strong>. Each session has its own typical volatility.
      </p>
    ),
    asiaLabel: 'Asia Session',
    asiaBody: (
      <>
        23:00–08:00 GMT
        <br />
        Low volatility, tends to range
        <br />
        <strong>→ Builds session liquidity for the next session</strong>
      </>
    ),
    londonLabel: 'London Session',
    londonBody: (
      <>
        08:00–17:00 GMT
        <br />
        High volatility, often sweeps the Asia range
        <br />
        <strong>→ Where the day's trend usually starts</strong>
      </>
    ),
    nySessionLabel: 'New York Session',
    nySessionBody: (
      <>
        13:00–22:00 GMT
        <br />
        Overlaps with London (13:00–17:00) = highest volatility of the day
        <br />
        <strong>→ Often continues or reverses London's trend</strong>
      </>
    ),
    diagram1Caption: 'The 3 sessions across the day in GMT — the London-NY overlap (13:00–17:00) usually carries the biggest volume.',
    rule1: (
      <>
        Convert the GMT times above to your own broker's server time — different brokers can run 2-3 hours off
        from GMT.
      </>
    ),
    h2: 'Killzones',
    killzoneDef: (
      <p>
        <strong>Definition:</strong> A Killzone is a smaller window inside a session where the highest-probability
        displacement tends to happen. ICT traders focus most of their trading inside Killzones, not the entire
        session.
      </p>
    ),
    londonKzLabel: 'London Killzone',
    londonKzBody: '07:00–10:00 GMT',
    nyKzLabel: 'New York Killzone (AM)',
    nyKzBody: '12:00–15:00 GMT',
    asiaKzLabel: 'Asian Killzone',
    asiaKzBody: '00:00–03:00 GMT',
    diagram2Caption: 'A Killzone (solid line) is a smaller window inside a session (white box) — most displacement happens in that narrow slice.',
    rule2: (
      <>
        A setup that forms inside a <strong>Killzone</strong> carries higher probability than the exact same
        setup forming outside one — even with an identical chart pattern.
      </>
    ),
    h3: 'AMD — Accumulation, Manipulation, Distribution',
    amdDef: (
      <p>
        <strong>Definition:</strong> AMD is a 3-phase cycle price repeats almost every day — Smart Money collects
        orders in a range (Accumulation), sweeps liquidity sharply (Manipulation), then the real trend unfolds
        (Distribution).
      </p>
    ),
    accLabel: 'A — Accumulation',
    accBody: (
      <>
        Price trades in a tight range (usually during the Asia session)
        <br />
        Smart Money quietly collects orders
      </>
    ),
    manLabel: 'M — Manipulation',
    manBody: (
      <>
        Price sharply sweeps the high or low of the range — a false move
        <br />
        Many retail traders get trapped entering the wrong direction here
      </>
    ),
    distLabel: 'D — Distribution',
    distBody: (
      <>
        The real trend unfolds, opposite the manipulation direction
        <br />
        Smart Money closes its large orders here
      </>
    ),
    amdSteps: [
      <>
        Spot the <strong>tight range</strong> (Accumulation) — usually formed during the Asia session.
      </>,
      <>
        Watch for price to sweep the high or low of that range (<strong>Manipulation</strong>) — a sharp,
        sudden wick.
      </>,
      <>
        Look for the direction <strong>opposite</strong> the manipulation — that's the real trend (
        <strong>Distribution</strong>) and your entry zone.
      </>,
    ],
    diagram3Caption: 'A → a tight range during Asia · M → a sharp sweep of the high (a false move) · D → the real downtrend, which is the entry zone.',
    rule3: (
      <>
        The AMD cycle repeats almost every single day — on a higher timeframe (like a week), it can also play out
        as one big AMD (a weekly range → weekly sweep → weekly trend).
      </>
    ),
    quizHeading: 'Check Your Understanding',
    quiz1: {
      question: 'Which session usually carries the highest volatility?',
      options: [
        { label: 'The Asia session', type: 'no' },
        { label: 'The London-New York overlap', type: 'ok' },
        { label: 'Every session is the same', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! The London-NY overlap (13:00–17:00 GMT) usually carries the highest volatility of the day.',
        no: '✗ The London-New York overlap usually carries the highest volatility of the day.',
      },
    },
    quiz2: {
      question: 'In the AMD Cycle, when does Manipulation happen?',
      options: [
        { label: 'Before Accumulation', type: 'no' },
        { label: 'After Accumulation but before Distribution', type: 'ok' },
        { label: 'After Distribution', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! The correct sequence is: Accumulation → Manipulation → Distribution.',
        no: '✗ Manipulation happens after Accumulation but before Distribution — the sequence is A → M → D.',
      },
    },
    homeworkHeading: '📝 Homework — Lesson 4',
    homeworkIntro: 'Study the chart below and try to answer for yourself before clicking "Show Answer":',
    homeworkLi1: <>Which part of this chart is the Accumulation?</>,
    homeworkLi2: <>Which candle sweeps the high/low as the Manipulation?</>,
    homeworkLi3: <>Which direction is the real Distribution?</>,
    homeworkCaption: "This chart isn't labeled yet — try to work it out yourself first.",
    homeworkRevealLabel: '👁 Show Answer',
    homeworkAnswer: (
      <p>
        <strong>Answer:</strong> Candles 1-4 form a tight <strong>range</strong> (Accumulation). Candle 5 sweeps
        the high of that range — the <strong>Manipulation</strong> (a false move up). Candles 6-9 reverse sharply
        down — that's the real <strong>Distribution</strong>, downward, matching the AMD theory exactly.
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 Bonus homework:</strong> Follow one of your own charts from the Asia session through London.
        Mark where A, M, and D each happen. Screenshot it and send it to your mentor.
      </p>
    ),
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You need to answer <strong>all 6 questions correctly</strong> to unlock and move on to the next lesson —
        wrong answers can be retried an unlimited number of times.
      </>
    ),
    finalTestQuestions: [
      {
        question: "What are the forex/futures market's 3 major sessions?",
        options: [
          { label: 'Asia, London, New York', correct: true },
          { label: 'Morning, noon, evening', correct: false },
          { label: 'BOS, CHoCH, FVG', correct: false },
        ],
      },
      {
        question: 'How is a Killzone different from a Session?',
        options: [
          { label: "A Killzone is larger than a session", correct: false },
          { label: 'A Killzone is a smaller, higher-probability window inside a session', correct: true },
          { label: "They're exactly the same thing", correct: false },
        ],
      },
      {
        question: 'What does AMD stand for?',
        options: [
          { label: 'Accumulation, Manipulation, Distribution', correct: true },
          { label: 'Asia, Manila, Dubai', correct: false },
          { label: 'Average, Median, Deviation', correct: false },
        ],
      },
      {
        question: 'What is the correct sequence of the AMD Cycle?',
        options: [
          { label: 'Manipulation → Accumulation → Distribution', correct: false },
          { label: 'Accumulation → Manipulation → Distribution', correct: true },
          { label: 'Distribution → Accumulation → Manipulation', correct: false },
        ],
      },
      {
        question: 'What does the Manipulation phase typically look like?',
        options: [
          { label: 'A slow, smooth trend', correct: false },
          { label: 'A sharp liquidity sweep — a false move', correct: true },
          { label: 'A long, quiet range', correct: false },
        ],
      },
      {
        question: 'Why does the London-NY overlap matter?',
        options: [
          { label: "It carries the day's highest volume and volatility", correct: true },
          { label: 'The market is closed during that window', correct: false },
          { label: 'It only happens on Fridays', correct: false },
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
    lessonTag: '第 4 课',
    intro: (
      <>
        同样的交易形态，发生在不同的<strong>时间</strong>，结果可能完全不同。本课讲解{' '}
        <strong>Session（交易时段）</strong>、<strong>Killzone（关键时区）</strong>以及{' '}
        <strong>AMD 循环</strong> — 说明"什么时候"和"什么位置"同样重要。
      </>
    ),
    videoCaption: '用心聆听 — 一个看起来完美的交易形态，如果不在 Killzone 内形成，可能毫无价值。',
    h1: 'Trading Sessions（交易时段）',
    sessionDef: (
      <p>
        <strong>定义：</strong>外汇/期货市场全天 24 小时运行，但按地区分为 3 个主要时段 —{' '}
        <strong>亚洲</strong>、<strong>伦敦</strong>与<strong>纽约</strong>。每个时段各有其典型的波动特征。
      </p>
    ),
    asiaLabel: 'Asia Session（亚洲时段）',
    asiaBody: (
      <>
        23:00–08:00 GMT
        <br />
        波动较低，倾向于区间震荡
        <br />
        <strong>→ 为下一个时段积累 Session Liquidity</strong>
      </>
    ),
    londonLabel: 'London Session（伦敦时段）',
    londonBody: (
      <>
        08:00–17:00 GMT
        <br />
        波动较高，经常扫荡亚洲时段的区间
        <br />
        <strong>→ 通常是当天趋势的起点</strong>
      </>
    ),
    nySessionLabel: 'New York Session（纽约时段）',
    nySessionBody: (
      <>
        13:00–22:00 GMT
        <br />
        与伦敦时段重叠（13:00–17:00）= 全天波动最大
        <br />
        <strong>→ 常常延续或反转伦敦时段的趋势</strong>
      </>
    ),
    diagram1Caption: '按 GMT 时间划分的 3 个时段 — 伦敦-纽约重叠期（13:00–17:00）通常成交量最大。',
    rule1: (
      <>
        请把上面的 GMT 时间换算成你自己经纪商的服务器时间 — 不同经纪商可能与 GMT 相差 2-3 小时。
      </>
    ),
    h2: 'Killzones（关键时区）',
    killzoneDef: (
      <p>
        <strong>定义：</strong>Killzone 是时段内一个更小的时间窗口，在这段时间内出现推动行情的概率最高。ICT
        交易者大多把交易精力集中在 Killzone 内，而不是整个时段。
      </p>
    ),
    londonKzLabel: 'London Killzone（伦敦关键时区）',
    londonKzBody: '07:00–10:00 GMT',
    nyKzLabel: 'New York Killzone（纽约关键时区，上午）',
    nyKzBody: '12:00–15:00 GMT',
    asiaKzLabel: 'Asian Killzone（亚洲关键时区）',
    asiaKzBody: '00:00–03:00 GMT',
    diagram2Caption: 'Killzone（实线区域）是时段（白色方框）内更小的窗口 — 大部分的推动行情都发生在这个狭窄的区间内。',
    rule2: (
      <>
        在 <strong>Killzone</strong> 内形成的交易形态，胜率通常高于在 Killzone 之外形成的同一形态 — 即便图表形态
        完全相同。
      </>
    ),
    h3: 'AMD — Accumulation、Manipulation、Distribution',
    amdDef: (
      <p>
        <strong>定义：</strong>AMD 是价格几乎每天都会重复的 3 阶段循环 — 机构资金在区间内收集订单（Accumulation），
        随后猛烈扫荡流动性（Manipulation），最后展开真正的趋势（Distribution）。
      </p>
    ),
    accLabel: 'A — Accumulation（吸筹阶段）',
    accBody: (
      <>
        价格在一个狭窄区间内运行（通常发生在亚洲时段）
        <br />
        机构资金悄悄收集订单
      </>
    ),
    manLabel: 'M — Manipulation（操纵阶段）',
    manBody: (
      <>
        价格猛烈扫荡区间的最高点或最低点 — 一次假动作
        <br />
        许多散户在此方向做出错误入场
      </>
    ),
    distLabel: 'D — Distribution（派发阶段）',
    distBody: (
      <>
        真正的趋势展开，方向与操纵阶段相反
        <br />
        机构资金在此处平掉大额订单
      </>
    ),
    amdSteps: [
      <>
        找出<strong>狭窄区间</strong>（Accumulation）— 通常出现在亚洲时段。
      </>,
      <>
        观察价格是否猛烈扫荡该区间的高点或低点（<strong>Manipulation</strong>）— 一根急促的长影线。
      </>,
      <>
        寻找与操纵方向<strong>相反</strong>的方向 — 那才是真正的趋势（<strong>Distribution</strong>），也是
        入场区域。
      </>,
    ],
    diagram3Caption: 'A → 亚洲时段内的狭窄区间 · M → 猛烈扫荡高点（假动作）· D → 真正的下跌趋势，即入场区域。',
    rule3: (
      <>
        AMD 循环几乎每天都会重复 — 在更高的周期上（例如一周），它同样可以以更大规模展开（周区间 → 周扫荡 →
        周趋势）。
      </>
    ),
    quizHeading: '知识检测',
    quiz1: {
      question: '哪个时段通常波动最大？',
      options: [
        { label: '亚洲时段', type: 'no' },
        { label: '伦敦-纽约重叠期', type: 'ok' },
        { label: '每个时段都一样', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！伦敦-纽约重叠期（13:00–17:00 GMT）通常是全天波动最大的时段。',
        no: '✗ 伦敦-纽约重叠期通常是全天波动最大的时段。',
      },
    },
    quiz2: {
      question: '在 AMD 循环中，Manipulation 发生在哪个阶段？',
      options: [
        { label: 'Accumulation 之前', type: 'no' },
        { label: 'Accumulation 之后、Distribution 之前', type: 'ok' },
        { label: 'Distribution 之后', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！正确顺序是：Accumulation → Manipulation → Distribution。',
        no: '✗ Manipulation 发生在 Accumulation 之后、Distribution 之前 — 顺序应为 A → M → D。',
      },
    },
    homeworkHeading: '📝 课后作业 — 第 4 课',
    homeworkIntro: '先自己研究下面的图表，再点击"查看答案"：',
    homeworkLi1: <>图表的哪一部分是 Accumulation？</>,
    homeworkLi2: <>哪根蜡烛扫荡了高/低点，属于 Manipulation？</>,
    homeworkLi3: <>真正的 Distribution 方向是哪个？</>,
    homeworkCaption: '这张图还没有标注 — 先自己试着判断。',
    homeworkRevealLabel: '👁 查看答案',
    homeworkAnswer: (
      <p>
        <strong>答案：</strong>1-4 号蜡烛形成一个狭窄的<strong>区间</strong>（Accumulation）。5 号蜡烛扫荡该区间
        的高点 — 即<strong>Manipulation</strong>（向上的假动作）。6-9 号蜡烛猛烈反转向下 — 这正是真正的{' '}
        <strong>Distribution</strong>，方向向下，与 AMD 理论完全吻合。
      </p>
    ),
    bonusHomework: (
      <p>
        <strong>🎯 额外作业：</strong>跟踪自己的一张图表，从亚洲时段一直看到伦敦时段。标出 A、M、D 分别发生在
        哪里。截图发给导师。
      </p>
    ),
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        需要<strong>全部 6 题都答对</strong>才能解锁并进入下一课 — 答错可以无限次重试。
      </>
    ),
    finalTestQuestions: [
      {
        question: '外汇/期货市场的 3 个主要时段是？',
        options: [
          { label: '亚洲、伦敦、纽约', correct: true },
          { label: '早上、中午、晚上', correct: false },
          { label: 'BOS、CHoCH、FVG', correct: false },
        ],
      },
      {
        question: 'Killzone 与 Session 有什么不同？',
        options: [
          { label: 'Killzone 比 Session 更大', correct: false },
          { label: 'Killzone 是 Session 内更小、概率更高的窗口', correct: true },
          { label: '它们完全相同', correct: false },
        ],
      },
      {
        question: 'AMD 代表什么？',
        options: [
          { label: 'Accumulation、Manipulation、Distribution', correct: true },
          { label: 'Asia、Manila、Dubai', correct: false },
          { label: 'Average、Median、Deviation', correct: false },
        ],
      },
      {
        question: 'AMD 循环的正确顺序是？',
        options: [
          { label: 'Manipulation → Accumulation → Distribution', correct: false },
          { label: 'Accumulation → Manipulation → Distribution', correct: true },
          { label: 'Distribution → Accumulation → Manipulation', correct: false },
        ],
      },
      {
        question: 'Manipulation 阶段通常表现为？',
        options: [
          { label: '缓慢平滑的趋势', correct: false },
          { label: '猛烈的流动性扫荡 — 一次假动作', correct: true },
          { label: '长时间安静的区间', correct: false },
        ],
      },
      {
        question: '为什么伦敦-纽约重叠期很重要？',
        options: [
          { label: '因为它是全天成交量和波动最大的时段', correct: true },
          { label: '因为市场在这段时间是关闭的', correct: false },
          { label: '因为它只在星期五出现', correct: false },
        ],
      },
    ],
  },
};

export default function Advanced4({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['adv4']?.url;
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="adv4"
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

      {/* ===== SESSIONS ===== */}
      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <Box variant="g">{t.sessionDef}</Box>
      <div className="g3">
        <GridItem labelColor="#5B9BD5" label={t.asiaLabel}>
          {t.asiaBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.londonLabel}>
          {t.londonBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.nySessionLabel}>
          {t.nySessionBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram1Caption}>
        <svg viewBox="0 0 700 160">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">SESSIONS (GMT)</text>

          <rect x="20" y="40" width="220" height="60" fill="#5B9BD5" opacity="0.12" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="130" y="35" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>ASIA 23:00–08:00</text>

          <rect x="240" y="40" width="260" height="60" fill="#3EC97A" opacity="0.12" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="370" y="35" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>LONDON 08:00–17:00</text>

          <rect x="400" y="40" width="200" height="60" fill="#E05555" opacity="0.12" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="500" y="115" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>NEW YORK 13:00–22:00</text>

          <rect x="400" y="40" width="100" height="60" fill="#D9B25F" opacity="0.25" className="ac" style={{ animationDelay: '.45s' }} />
          <text x="450" y="128" textAnchor="middle" fontSize="9" fill="#D9B25F" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>OVERLAP — highest volume</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule1}</Rule>

      {/* ===== KILLZONES ===== */}
      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="b">{t.killzoneDef}</Box>
      <div className="g3">
        <GridItem labelColor="#5B9BD5" label={t.asiaKzLabel}>
          {t.asiaKzBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.londonKzLabel}>
          {t.londonKzBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.nyKzLabel}>
          {t.nyKzBody}
        </GridItem>
      </div>

      <AnimatedFig caption={t.diagram2Caption}>
        <svg viewBox="0 0 700 140">
          <rect x="60" y="30" width="300" height="60" fill="none" stroke="#9aa0ab" strokeWidth="1" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="210" y="24" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>LONDON SESSION</text>

          <rect x="90" y="30" width="90" height="60" fill="#3EC97A" opacity="0.25" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="135" y="105" textAnchor="middle" fontSize="9" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>London Killzone</text>

          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="115" y1="45" x2="115" y2="80" stroke="#3EC97A" strokeWidth="1.4" /><rect x="109" y="50" width="12" height="25" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.53s' }}><line x1="150" y1="35" x2="150" y2="65" stroke="#3EC97A" strokeWidth="1.4" /><rect x="144" y="40" width="12" height="20" rx="1" fill="#3EC97A" /></g>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule2}</Rule>

      {/* ===== AMD ===== */}
      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="g">{t.amdDef}</Box>
      <div className="g3">
        <GridItem labelColor="#5B9BD5" label={t.accLabel}>
          {t.accBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.manLabel}>
          {t.manBody}
        </GridItem>
        <GridItem labelColor="var(--up)" label={t.distLabel}>
          {t.distBody}
        </GridItem>
      </div>
      <Steps items={t.amdSteps} />

      <AnimatedFig caption={t.diagram3Caption}>
        <svg viewBox="0 0 700 210">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#D9B25F" fontWeight="700" fontFamily="Space Grotesk,sans-serif">AMD CYCLE</text>

          <rect x="40" y="80" width="180" height="45" fill="#5B9BD5" opacity="0.12" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="130" y="75" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>A — Accumulation</text>
          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="70" y1="90" x2="70" y2="115" stroke="#3EC97A" strokeWidth="1.2" /><rect x="64" y="94" width="12" height="17" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.26s' }}><line x1="110" y1="95" x2="110" y2="118" stroke="#E05555" strokeWidth="1.2" /><rect x="104" y="99" width="12" height="15" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.32s' }}><line x1="150" y1="88" x2="150" y2="112" stroke="#3EC97A" strokeWidth="1.2" /><rect x="144" y="92" width="12" height="16" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="190" y1="92" x2="190" y2="116" stroke="#E05555" strokeWidth="1.2" /><rect x="184" y="96" width="12" height="16" rx="1" fill="#E05555" /></g>

          <g className="ac" style={{ animationDelay: '.46s' }}><line x1="250" y1="55" x2="250" y2="120" stroke="#3EC97A" strokeWidth="1.6" /><rect x="242" y="60" width="16" height="45" rx="1" fill="#3EC97A" /></g>
          <text x="250" y="45" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>M — Sweep ↑ (False)</text>

          <g className="ac" style={{ animationDelay: '.6s' }}><line x1="320" y1="100" x2="320" y2="150" stroke="#E05555" strokeWidth="1.4" /><rect x="314" y="105" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.68s' }}><line x1="370" y1="130" x2="370" y2="175" stroke="#E05555" strokeWidth="1.4" /><rect x="364" y="135" width="12" height="30" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.76s' }}><line x1="420" y1="155" x2="420" y2="195" stroke="#E05555" strokeWidth="1.4" /><rect x="414" y="160" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="370" y="195" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.8s' }}>D — Distribution (real trend)</text>
        </svg>
      </AnimatedFig>

      <Rule title={t.ruleTitle}>{t.rule3}</Rule>

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
        <svg viewBox="0 0 700 210">
          <g><line x1="70" y1="90" x2="70" y2="115" stroke="#3EC97A" strokeWidth="1.2" /><rect x="64" y="94" width="12" height="17" rx="1" fill="#3EC97A" /></g>
          <text x="70" y="130" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">1</text>

          <g><line x1="110" y1="95" x2="110" y2="118" stroke="#E05555" strokeWidth="1.2" /><rect x="104" y="99" width="12" height="15" rx="1" fill="#E05555" /></g>
          <text x="110" y="133" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">2</text>

          <g><line x1="150" y1="88" x2="150" y2="112" stroke="#3EC97A" strokeWidth="1.2" /><rect x="144" y="92" width="12" height="16" rx="1" fill="#3EC97A" /></g>
          <text x="150" y="127" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">3</text>

          <g><line x1="190" y1="92" x2="190" y2="116" stroke="#E05555" strokeWidth="1.2" /><rect x="184" y="96" width="12" height="16" rx="1" fill="#E05555" /></g>
          <text x="190" y="131" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">4</text>

          <g><line x1="250" y1="55" x2="250" y2="120" stroke="#3EC97A" strokeWidth="1.6" /><rect x="242" y="60" width="16" height="45" rx="1" fill="#3EC97A" /></g>
          <text x="250" y="135" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">5</text>

          <g><line x1="320" y1="100" x2="320" y2="150" stroke="#E05555" strokeWidth="1.4" /><rect x="314" y="105" width="12" height="35" rx="1" fill="#E05555" /></g>
          <text x="320" y="165" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">6</text>

          <g><line x1="370" y1="130" x2="370" y2="175" stroke="#E05555" strokeWidth="1.4" /><rect x="364" y="135" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="370" y="190" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">7</text>

          <g><line x1="420" y1="155" x2="420" y2="195" stroke="#E05555" strokeWidth="1.4" /><rect x="414" y="160" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="420" y="9" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">8</text>

          <g><line x1="460" y1="165" x2="460" y2="200" stroke="#E05555" strokeWidth="1.4" /><rect x="454" y="170" width="12" height="25" rx="1" fill="#E05555" /></g>
          <text x="460" y="205" textAnchor="middle" fontSize="9" fill="#9aa0ab" fontFamily="Space Grotesk,sans-serif">9</text>
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
