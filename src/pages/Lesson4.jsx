import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getLessonMeta } from '../data/lessons.js';

const meta = getLessonMeta('l4');

const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'FVG ត្រូវបានសម្គាល់ជាទូទៅតាមអ្វី?',
    options: [
      { label: '3-Candle relationship ដែលបង្កើត Imbalance', correct: true },
      { label: 'Candle តែមួយ', correct: false },
      { label: 'RSI តែមួយ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! FVG គឺ 3-Candle Imbalance concept។', no: NO_FEEDBACK },
  },
  {
    question: 'Bullish FVG កើតឡើងនៅពេលណា?',
    options: [
      { label: 'Candle 3 Low ខ្ពស់ជាង Candle 1 High', correct: true },
      { label: 'Candle 3 High ទាបជាង Candle 1 Low', correct: false },
      { label: 'Candle 1 និង 3 ត្រូវតែមានពណ៌ដូចគ្នា', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ!', no: NO_FEEDBACK },
  },
  {
    question: 'តើ FVG ត្រូវ Fill 100% រាល់ពេលឬទេ?',
    options: [
      { label: 'បាទ/ចាស 100%', correct: false },
      { label: 'ទេ វាមិនមែនជា Guarantee ទេ', correct: true },
      { label: 'តែពេល Market Sideways', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! FVG គឺជា Zone សម្រាប់ Analysis មិនមែនការធានា។', no: NO_FEEDBACK },
  },
  {
    question: 'អ្វីជាវិធីល្អសម្រាប់ប្រើ FVG?',
    options: [
      { label: 'ចូល Trade ភ្លាមៗពេលឃើញ FVG', correct: false },
      { label: 'ពិនិត្យ Structure + Displacement + Context និងរង់ចាំ Reaction', correct: true },
      { label: 'ប្រើ FVG ដោយមិនចាំបាច់មើល Trend', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Context ជាផ្នែកសំខាន់នៃ Analysis។', no: NO_FEEDBACK },
  },
];

export default function Lesson4({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l4"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់ Course' : `🔒 បញ្ចប់ Course (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>FVG (Fair Value Gap)</strong> គឺជា <strong>Imbalance</strong> ដែលអាចមើលឃើញតាមរយៈ Pattern នៃ{' '}
        <strong>3 Candles</strong>។ នៅពេល Price move ខ្លាំង មានតំបន់មួយដែលការជួញដូររវាង Wick របស់ Candle ទី 1 និង
        Candle ទី 3 មិន overlap គ្នា។ Trader ប្រើតំបន់នេះដើម្បីសិក្សាថា Price អាចត្រឡប់មក Fill ឬ React នៅទីនោះ។
      </p>

      <Rule title="FVG = Imbalance មិនមែន Guaranteed Entry">
        ត្រូវមើល FVG ជាមួយ Structure, Displacement និង Context
      </Rule>

      <h3>
        <span className="bar"></span>១. Bullish FVG
      </h3>
      <Box variant="u">
        <p>
          ក្នុង <strong>Bullish FVG</strong> មាន Strong Bullish Move ហើយ{' '}
          <strong>Low របស់ Candle ទី 3 នៅខ្ពស់ជាង High របស់ Candle ទី 1</strong>។ ចន្លោះរវាងកម្រិតទាំងពីរនេះគឺ FVG
          Zone។
        </p>
      </Box>
      <div className="g2">
        <GridItem labelColor="var(--up)" label="Bullish FVG ⬆">
          Candle 1 High &lt; Candle 3 Low → Gap/Imbalance between them.
        </GridItem>
        <GridItem label="What to watch">
          If price returns into the FVG, observe reaction and structure instead of assuming an automatic Buy.
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>២. Bearish FVG
      </h3>
      <Box variant="d">
        <p>
          ក្នុង <strong>Bearish FVG</strong> មាន Strong Bearish Move ហើយ{' '}
          <strong>High របស់ Candle ទី 3 នៅទាបជាង Low របស់ Candle ទី 1</strong>។ ចន្លោះរវាងកម្រិតទាំងពីរគឺ Bearish FVG
          Zone។
        </p>
      </Box>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label="Bearish FVG ⬇">
          Candle 1 Low &gt; Candle 3 High → Gap/Imbalance between them.
        </GridItem>
        <GridItem label="Key idea">
          A return to the gap can provide information about price reaction, but it is not a guaranteed reversal or
          entry.
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>៣. របៀបសម្គាល់ FVG ជាជំហានៗ
      </h3>
      <Steps
        items={[
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
        ]}
      />

      <h3>
        <span className="bar"></span>៤. FVG vs Order Block
      </h3>
      <div className="g2">
        <GridItem label="Order Block">
          <strong>Zone</strong> ដែលភ្ជាប់ទៅនឹង Candle/Area មុន Strong Displacement និង Structure Context។
        </GridItem>
        <GridItem label="FVG">
          <strong>Imbalance</strong> ដែលសម្គាល់តាម 3-Candle relationship និង Non-overlap តាម Direction របស់ Move។
        </GridItem>
      </div>
      <Box variant="b">
        <p>
          <strong>អាចប្រើជាមួយគ្នា:</strong> បើ OB និង FVG មាន Context ដូចគ្នា ហើយស្ថិតនៅកន្លែងដែលសមហេតុផលតាម
          Structure នោះវាអាចជួយឱ្យ Analysis មាន Confluence បន្ថែម។ តែ Confluence មិនមែន Guarantee ទេ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>៥. កំហុស Beginner
      </h3>
      <Box variant="d">
        <ul>
          <li>ឃើញ Gap តូចៗគ្រប់កន្លែង ហើយហៅថា FVG ដោយមិនពិនិត្យ 3-Candle structure។</li>
          <li>គិតថា FVG ត្រូវ Fill 100% រាល់ពេល។</li>
          <li>ចូល Trade ដោយគ្មាន Structure និង Confirmation។</li>
          <li>ប្រើ FVG ដាច់ដោយឡែកពី Market Context។</li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">3 Candles → Find Imbalance → Mark FVG → Check Context → Wait for Reaction</Rule>

      <h3>
        <span className="bar"></span>Quiz — សាកល្បងចំណេះដឹង
      </h3>
      <FinalTest
        questions={FINAL_TEST_QUESTIONS}
        onProgressChange={setGate}
        lockedHint="ត្រូវត្រូវទាំងអស់ដើម្បីបញ្ចប់ Course"
      />
    </LessonLayout>
  );
}
