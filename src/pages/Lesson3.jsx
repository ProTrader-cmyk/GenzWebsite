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
        ម្តងទៀត។ សម្រាប់ Beginner ត្រូវមើល OB ជា <strong>Zone</strong> (តំបន់មួយចន្លោះ) មិនមែនជាចំណុច Entry តែមួយឡើយ។
      </p>

      <Box variant="g">
        <p>
          <strong>🧠 គិតឲ្យងាយ ៖</strong> Order Block ដូចជា <strong>"កន្លែងចុងក្រោយ" ដែល Smart Money ទិញ/លក់ធំៗ</strong>{' '}
          មុននឹង Price រុញខ្លាំង។ ដូច្នេះពេល Price ត្រឡប់មកកន្លែងនោះម្ដងទៀត វាមានឱកាសខ្ពស់ថា Order ធំៗនៅសល់ត្រង់នោះ
          អាចរុញ Price បន្តទិសដដែល — ប៉ុន្តែមិនមែនធានា ១០០% ទេ ត្រូវរង់ចាំសញ្ញាបញ្ជាក់ជានិច្ច។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label="Displacement">
          ចលនា Price ដ៏ខ្លាំង និងលឿន (Candle Body ធំៗជាប់ៗគ្នា) ដែលបង្ហាញថា Order ធំចូលទីផ្សារ — ជាភស្ដុតាងសំខាន់
          បង្កើត Order Block ។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="Retest">
          ពេល Price ត្រឡប់មកកន្តាល Zone ដែលបានកន្លងទៅម្ដងទៀត មុននឹងសម្រេចថានឹងបន្ត ឬបដិសេធ Zone នោះ ។
        </GridItem>
      </div>

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
        <GridItem labelColor="var(--up)" label="Bullish OB ⬆" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle bearish (ក្រហម) → Strong Displacement ឡើងលើ → Break Structure → Price ត្រឡប់មក Retest → រង់ចាំ
          Reaction ឡើងវិញ ។
        </GridItem>
        <GridItem label="តើគួរ Mark ត្រង់ណា?" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Mark តំបន់ Candle bearish ចុងក្រោយ <strong>មុន</strong> Displacement ចាប់ផ្ដើម ។ អ្នកអាចប្រើ Candle Body
          ឬ Wick ទាំងមូល — សំខាន់គឺជ្រើសរើសមួយ ហើយប្រើឲ្យស្មើគ្នារាល់ពេល កុំប្តូរវិធីពាក់កណ្ដាល Chart ។
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
        <GridItem labelColor="var(--dn)" label="Bearish OB ⬇" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle bullish (បៃតង) → Strong Displacement ចុះក្រោម → Break Structure → Price ត្រឡប់មក Retest → រង់ចាំ
          Reaction ចុះវិញ ។
        </GridItem>
        <GridItem label="ចំណុចសំខាន់" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Displacement កាន់តែខ្លាំង និង Context Structure កាន់តែច្បាស់ ({'>'} BOS/CHoCH ពិត) — Zone នោះកាន់តែមាន
          តម្លៃ ។ Displacement ខ្សោយឬមិនច្បាស់ Structure = Zone ខ្សោយ មិនគួរទុកចិត្ត ។
        </GridItem>
      </div>

      <AnimatedFig
        caption={
          <>
            ខាងឆ្វេង៖ Candle ក្រហមចុងក្រោយមុន Displacement ឡើងខ្លាំង = <strong style={{ color: '#3EC97A' }}>Bullish OB</strong> ·
            ខាងស្ដាំ៖ Candle បៃតងចុងក្រោយមុន Displacement ចុះខ្លាំង = <strong style={{ color: '#E05555' }}>Bearish OB</strong> —
            ក្រៅ Zone ចាំរង់ Price ត្រឡប់មក Retest មុននឹង React
          </>
        }
      >
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
          <text x="215" y="150" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Retest</text>
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
          <text x="565" y="45" textAnchor="middle" fontSize="9" fill="#2E7CF6" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.7s' }}>Retest</text>
          <text x="610" y="150" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.75s' }}>React ↓</text>
        </svg>
      </AnimatedFig>

      <Quiz
        question="Order Block ត្រូវបានចាត់ទុកថាមាន Context ខ្លាំង នៅពេលណា?"
        options={[
          { label: 'ពេល Candle មានទំហំធំបំផុតលើ Chart', type: 'no' },
          { label: 'ពេលមាន Strong Displacement + Break Structure ច្បាស់លាស់', type: 'ok' },
          { label: 'ពេល Candle ប្តូរពណ៌', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Displacement ខ្លាំង + Structure Break ច្បាស់ = Zone មានតម្លៃខ្ពស់។',
          no: '✗ ទំហំ Candle ឬពណ៌ Candle ម្នាក់ឯង មិនប្រាប់ថា Zone ល្អទេ — ត្រូវមើល Displacement និង Structure។',
        }}
      />

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
          <li>
            <strong>Mark គ្រប់ Candle មុន Movement ជា Order Block</strong> — គ្មាន Displacement ខ្លាំង ក៏គ្មាន OB
            ពិត Candle ធម្មតាមួយមិនមែនស្វ័យប្រវត្តិក្លាយជា OB ទេ។
          </li>
          <li>
            <strong>មិនមើល Structure ឬ Displacement</strong> — OB ដែលមិនភ្ជាប់ជាមួយ BOS/CHoCH ច្បាស់ ជាទូទៅ
            ខ្សោយ និងទុកចិត្តបានតិច។
          </li>
          <li>
            <strong>ចូល Trade មុន Price ត្រឡប់មក Zone</strong> — "Chase" Price ដោយមិនរង់ចាំ Retest បង្កើន Risk
            ដោយមិនចាំបាច់។
          </li>
          <li>
            <strong>គិតថា OB ត្រូវ Hold 100% រាល់ពេល</strong> — Zone ជាច្រើនអាចត្រូវ Break ចោល (Mitigated) ត្រូវប្រើ
            Stop Loss និង Risk Management ជានិច្ច។
          </li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">មើល Structure → រក Displacement → Mark Zone → រង់ចាំ Retest → Seek Confirmation</Rule>

      <h3>
        <span className="bar"></span>📝 លំហាត់អនុវត្ត
      </h3>
      <Box variant="g">
        <p>មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView ៖</p>
        <Steps
          items={[
            'រកមើល Strong Displacement Candle ចំនួន ២ កន្លែងលើ Chart',
            'សម្គាល់ Candle/Zone ចុងក្រោយ មុន Displacement ចាប់ផ្ដើម — នោះជា Order Block របស់អ្នក',
            'ពិនិត្យមើលថា តើ Zone នោះភ្ជាប់ជាមួយ BOS ឬ CHoCH ដែរឬទេ (ត្រលប់ទៅមេរៀនទី ២ បើភ្លេច)',
            'បើ Price ធ្លាប់ត្រឡប់មក Zone នោះម្ដងទៀត សូមមើលថា Price React យ៉ាងណា',
          ]}
        />
      </Box>

      <h3>
        <span className="bar"></span>Quiz — សាកល្បងចំណេះដឹង
      </h3>
      <p>ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។</p>
      <FinalTest questions={FINAL_TEST_QUESTIONS} onProgressChange={setGate} />
    </LessonLayout>
  );
}
