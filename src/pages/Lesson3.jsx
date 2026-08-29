import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getLessonMeta } from '../data/lessons.js';

const meta = getLessonMeta('l3');

const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'តើអ្វីធ្វើឱ្យ Order Block មាន Context ខ្លាំងជាង Candle ធម្មតា?',
    options: [
      { label: 'Strong Displacement និង Structure Context', correct: true },
      { label: 'ព្រោះ Candle មានពណ៌ស្អាត', correct: false },
      { label: 'ព្រោះវាជា Candle ធំបំផុតគ្រប់ពេល', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! OB ត្រូវមើលជាមួយ Displacement និង Structure។', no: NO_FEEDBACK },
  },
  {
    question: 'បន្ទាប់ពី Mark OB តើយើងគួរធ្វើអ្វី?',
    options: [
      { label: 'ចូល Trade ភ្លាមៗ', correct: false },
      { label: 'រង់ចាំ Price Retest Zone និងស្វែងរក Confirmation', correct: true },
      { label: 'បិទ Chart', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Zone មិនមែនជា Guaranteed Entry ទេ។', no: NO_FEEDBACK },
  },
  {
    question: 'Bullish OB ជាទូទៅស្ថិតនៅកន្លែងណា?',
    options: [
      { label: 'តំបន់ Candle bearish មុន Strong Bullish Displacement', correct: true },
      { label: 'កន្លែងណាក៏បាននៅលើ Chart', correct: false },
      { label: 'តែនៅខាងលើ Trend ប៉ុណ្ណោះ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ!', no: NO_FEEDBACK },
  },
  {
    question: 'តើ Order Block អាច Hold 100% រាល់ពេលឬទេ?',
    options: [
      { label: 'បាទ/ចាស', correct: false },
      { label: 'ទេ ត្រូវប្រើ Context, Confirmation និង Risk Management', correct: true },
      { label: 'តែពេលមាន Volume ខ្ពស់', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! គ្មាន Zone ណាធានា 100% ទេ។', no: NO_FEEDBACK },
  },
];

export default function Lesson3({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l3"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់មេរៀន' : `🔒 បញ្ចប់មេរៀន (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>Order Block (OB)</strong> គឺជាតំបន់ Price ដែល Trader ប្រើដើម្បីសម្គាល់តំបន់មួយដែលមាន{' '}
        <strong>Strong Displacement</strong> ចេញពីវា ហើយបន្ទាប់មក Price អាចត្រឡប់មក <strong>Retest</strong> និង React
        ម្តងទៀត។ សម្រាប់ Beginner ត្រូវមើល OB ជា <strong>Zone</strong> មិនមែនជាចំណុច Entry តែមួយឡើយ។
      </p>

      <Rule title="Order Block = Zone + Displacement + Context">
        កុំ Mark Candle ណាមួយជា OB ដោយគ្មាន Movement និង Structure បញ្ជាក់
      </Rule>

      <h3>
        <span className="bar"></span>១. Bullish Order Block
      </h3>
      <Box variant="u">
        <p>
          ជាទូទៅ <strong>Bullish OB</strong> គឺតំបន់ Candle bearish ចុងក្រោយ មុនពេល Price មាន{' '}
          <strong>Strong Bullish Displacement</strong> ដែលអាចបង្កើត BOS ឬបង្ហាញពីការផ្លាស់ប្តូរ Structure។ តំបន់នេះអាចក្លាយជា
          Demand Zone នៅពេល Price ត្រឡប់មក Retest។
        </p>
      </Box>
      <div className="g2">
        <GridItem labelColor="var(--up)" label="Bullish OB ⬆">
          Bearish candle → Strong move up → Structure break → Price returns → Watch for bullish reaction.
        </GridItem>
        <GridItem label="What to mark">
          Mark the relevant candle/zone before the displacement. Use the candle body/wick according to the marking rule
          you follow and stay consistent.
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>២. Bearish Order Block
      </h3>
      <Box variant="d">
        <p>
          ជាទូទៅ <strong>Bearish OB</strong> គឺតំបន់ Candle bullish ចុងក្រោយ មុនពេល Price មាន{' '}
          <strong>Strong Bearish Displacement</strong> ដែលអាចបង្កើត BOS ឬបង្ហាញពីការផ្លាស់ប្តូរ Structure។ Price
          អាចត្រឡប់មក Retest តំបន់នេះ ហើយ React ចុះ។
        </p>
      </Box>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label="Bearish OB ⬇">
          Bullish candle → Strong move down → Structure break → Price returns → Watch for bearish reaction.
        </GridItem>
        <GridItem label="Key idea">
          The stronger the displacement and the clearer the structural context, the more meaningful the zone becomes.
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>៣. របៀបសម្គាល់ Order Block
      </h3>
      <Steps
        items={[
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
        ]}
      />

      <h3>
        <span className="bar"></span>៤. Order Block + BOS/CHoCH
      </h3>
      <Box variant="b">
        <p>
          មេរៀនមុនយើងរៀនថា <strong>BOS</strong> ជា Continuation និង <strong>CHoCH</strong> ជា Possible Reversal។
          ឥឡូវយើងអាចប្រើ Structure នោះដើម្បីជួយ Filter OB៖{' '}
          <strong>OB ដែលបណ្តាលឱ្យមាន Strong Displacement និង Structure Break មាន Context ខ្លាំងជាង Candle ធម្មតា</strong>។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>៥. កំហុស Beginner
      </h3>
      <Box variant="d">
        <ul>
          <li>Mark គ្រប់ Candle មុន Movement ជា Order Block។</li>
          <li>មិនមើល Structure ឬ Displacement។</li>
          <li>ចូល Trade មុន Price ត្រឡប់មក Zone។</li>
          <li>គិតថា OB ត្រូវ Hold 100% រាល់ពេល។</li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">មើល Structure → រក Displacement → Mark Zone → រង់ចាំ Retest → Seek Confirmation</Rule>

      <h3>
        <span className="bar"></span>Quiz — សាកល្បងចំណេះដឹង
      </h3>
      <FinalTest questions={FINAL_TEST_QUESTIONS} onProgressChange={setGate} />
    </LessonLayout>
  );
}
