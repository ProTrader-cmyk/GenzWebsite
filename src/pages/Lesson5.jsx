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

const meta = getLessonMeta('l5');

const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'Buy-side Liquidity (BSL) ជាទូទៅស្ថិតនៅឯណា?',
    options: [
      { label: 'ខាងលើ Swing High / Equal High', correct: true },
      { label: 'ខាងក្រោម Swing Low / Equal Low', correct: false },
      { label: 'ចំកណ្ដាល Range', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Buy Stop និង Sell Stop Loss ប្រមូលផ្ដុំគ្នានៅខាងលើ Swing High។', no: NO_FEEDBACK },
  },
  {
    question: 'Liquidity Sweep (Stop Hunt) មានលក្ខណៈបែបណា?',
    options: [
      { label: 'Candle Body Close ឆ្លងកាត់ Zone ដោយស្ងប់ស្ងាត់', correct: false },
      { label: 'Wick ចាក់ចូល Zone រហ័ស រួច Price បដិសេធត្រឡប់មកវិញ', correct: true },
      { label: 'Price ធ្វើចលនាដូចគ្នារាល់ថ្ងៃ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Sweep ជាទូទៅជា Wick ចាក់ចូល រួច Reject មិនមែន Close ស្ថិតស្ថេរនៅទីនោះទេ។', no: NO_FEEDBACK },
  },
  {
    question: 'ហេតុអ្វី Equal High/Low (EQH/EQL) ជា Liquidity Zone ខ្លាំង?',
    options: [
      { label: 'ព្រោះ Trader ជាច្រើនដាក់ Stop នៅកម្រិតដូចគ្នា — ប្រមូលផ្ដុំគ្នាច្រើន', correct: true },
      { label: 'ព្រោះវាមាន Candle ពណ៌ស្អាត', correct: false },
      { label: 'ព្រោះវាកើតឡើងតែម្ដងគត់ក្នុងមួយឆ្នាំ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! កម្រិតតម្លៃដដែលៗទាក់ទាញ Order ប្រមូលផ្ដុំច្រើន។', no: NO_FEEDBACK },
  },
  {
    question: 'តើគួរធ្វើដូចម្ដេចបន្ទាប់ពីឃើញ Liquidity Sweep?',
    options: [
      { label: 'ចូល Trade ភ្លាមៗពេលឃើញ Wick', correct: false },
      { label: 'រង់ចាំ BOS/CHoCH បញ្ជាក់ទិសបន្ទាប់ពី Sweep សិន', correct: true },
      { label: 'មិនចាំបាច់ធ្វើអ្វីទាំងអស់', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Sweep ម្នាក់ឯង មិនទាន់ជា Signal ពេញលេញ ត្រូវការ Confirmation បន្ថែម។', no: NO_FEEDBACK },
  },
];

export default function Lesson5({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l5"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់មេរៀន' : `🔒 បញ្ចប់មេរៀន (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>Liquidity (LQ)</strong> គឺជាតំបន់លើ Chart ដែលមាន <strong>Order ជាច្រើនប្រមូលផ្ដុំគ្នា</strong> —
        ភាគច្រើនជា Stop Loss របស់ Trader ដែលកំពុងកាន់ Position ស្រាប់ បូកនឹង Order ថ្មីរបស់ Trader ដែលរង់ចាំ
        Breakout។ Smart Money ច្រើនតែរុញ Price ទៅកាន់តំបន់ទាំងនេះ <strong>ដើម្បីទាញយក Liquidity</strong> មុននឹង
        បន្តទិសពិតរបស់វា។
      </p>

      <Box variant="g">
        <p>
          <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Stop Loss របស់ Trader តូចៗ គឺដូចជា <strong>"ត្រីតូចៗ" ប្រមូលផ្ដុំគ្នា</strong>{' '}
          នៅត្រង់ Swing High/Low ។ Smart Money ដូចជា <strong>"ត្រីធំ"</strong> ដែលហែលចូលទៅ "ស៊ី" ត្រីតូចទាំងនោះ
          (ចាក់ Wick ចូល Zone ទាញ Stop Loss) មុននឹងហែលចេញទៅទិសផ្ទុយវិញ។ នេះហើយជាមូលហេតុដែល Price ច្រើនតែ "ចាក់" លើស
          Swing មួយភ្លែត មុននឹងបត់ត្រឡប់។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label="Liquidity Sweep / Stop Hunt">
          ពេល Price ចាក់ Wick ចូលទៅក្នុងតំបន់ Liquidity មួយភ្លែត ដើម្បីទាញ Order (Stop Loss) រួចបដិសេធត្រឡប់មកវិញ ។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="Equal High / Equal Low (EQH/EQL)">
          Swing High ឬ Swing Low ចំនួន ២ ឬច្រើន ដែលនៅកម្រិតជិតគ្នា/ដូចគ្នា — កន្លែងដែល Stop Loss ប្រមូលផ្ដុំច្រើនបំផុត ។
        </GridItem>
      </div>

      <Rule title="Liquidity Sweep ≠ Reversal Signal ដោយខ្លួនឯង">
        តែងតែរង់ចាំ BOS ឬ CHoCH កើតឡើងបន្ទាប់ពី Sweep សិន មុននឹងសន្និដ្ឋានទិស
      </Rule>

      <h3>
        <span className="bar"></span>១. Buy-side Liquidity (BSL)
      </h3>
      <Box variant="d">
        <p>
          <strong>BSL</strong> ស្ថិតនៅ <strong>ខាងលើ Swing High / Equal High</strong> — ជាកន្លែងដែល Sell Stop
          Loss (របស់ Seller ដែលកាន់ Short) និង Buy Stop Order (របស់ Trader រង់ចាំ Breakout ឡើង) ប្រមូលផ្ដុំគ្នា។
          ពេល Price ចាក់ឡើងលើតំបន់នេះ រួច Reject ចុះមកវិញ គេហៅថា <strong>BSL Sweep</strong> — ជាទូទៅជាសញ្ញា
          Bearish។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>២. Sell-side Liquidity (SSL)
      </h3>
      <Box variant="u">
        <p>
          <strong>SSL</strong> ស្ថិតនៅ <strong>ខាងក្រោម Swing Low / Equal Low</strong> — ជាកន្លែងដែល Buy Stop
          Loss (របស់ Buyer ដែលកាន់ Long) និង Sell Stop Order ប្រមូលផ្ដុំគ្នា។ ពេល Price ចាក់ចុះក្រោមតំបន់នេះ រួច
          Reject ឡើងវិញ គេហៅថា <strong>SSL Sweep</strong> — ជាទូទៅជាសញ្ញា Bullish។
        </p>
      </Box>

      <div className="g2">
        <GridItem labelColor="var(--dn)" label="BSL Sweep ⬇" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Price ចាក់លើស Equal High → Wick Reject → រង់ចាំ Bearish CHoCH/BOS បញ្ជាក់ → Bias Sell ។
        </GridItem>
        <GridItem labelColor="var(--up)" label="SSL Sweep ⬆" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Price ចាក់ក្រោម Equal Low → Wick Reject → រង់ចាំ Bullish CHoCH/BOS បញ្ជាក់ → Bias Buy ។
        </GridItem>
      </div>

      <AnimatedFig
        caption={
          <>
            ខាងឆ្វេង៖ Price ចាក់ Wick ក្រោម <strong style={{ color: '#6FA8FF' }}>SSL (Equal Lows)</strong> ទាញ Stop
            Loss រួច Reject ឡើង + CHoCH = <strong style={{ color: '#3EC97A' }}>Bullish</strong> · ខាងស្ដាំ៖ ចាក់
            Wick លើស <strong style={{ color: '#6FA8FF' }}>BSL (Equal Highs)</strong> រួច Reject ចុះ + CHoCH ={' '}
            <strong style={{ color: '#E05555' }}>Bearish</strong>
          </>
        }
      >
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">SELL-SIDE LIQUIDITY SWEEP</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BUY-SIDE LIQUIDITY SWEEP</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <line x1="20" y1="150" x2="330" y2="150" stroke="#6FA8FF" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="24" y="144" fontSize="9" fill="#6FA8FF" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>SSL (Equal Lows)</text>

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
          <text x="374" y="54" fontSize="9" fill="#6FA8FF" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>BSL (Equal Highs)</text>

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

      <Quiz
        question="Price ចាក់ Wick ក្រោម Equal Low ២ ចំណុច រួច Close ត្រឡប់ឡើងលើវិញភ្លាមៗ — តើនេះជាអ្វី?"
        options={[
          { label: 'BSL Sweep — សញ្ញា Bearish', type: 'no' },
          { label: 'SSL Sweep — សញ្ញាដំបូងអាចជា Bullish', type: 'ok' },
          { label: 'FVG', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! ចាក់ក្រោម Equal Low (SSL) រួច Reject ឡើង = SSL Sweep — សញ្ញាដំបូងអាចនាំទៅ Bullish (ត្រូវរង់ចាំ CHoCH/BOS បញ្ជាក់)។',
          no: '✗ ចាក់ក្រោម Equal Low ជា SSL (Sell-side) មិនមែន BSL ទេ — SSL Sweep ជាទូទៅនាំទៅ Bullish។',
        }}
      />

      <h3>
        <span className="bar"></span>៣. របៀបសម្គាល់ Liquidity Sweep ជាជំហានៗ
      </h3>
      <Steps
        items={[
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
        ]}
      />

      <Quiz
        question="បន្ទាប់ពីឃើញ Liquidity Sweep តើជំហានបន្ទាប់ត្រូវធ្វើអ្វី?"
        options={[
          { label: 'ចូល Trade ភ្លាមៗលើ Wick', type: 'no' },
          { label: 'រង់ចាំ BOS/CHoCH ក្នុងទិសផ្ទុយបញ្ជាក់សិន', type: 'ok' },
          { label: 'បិទ Chart ចាំថ្ងៃក្រោយ', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Sweep ជា Context មិនមែន Entry Signal ដោយខ្លួនឯងទេ — ត្រូវការ Structure Confirmation បន្ថែម។',
          no: '✗ ចូល Trade ភ្លាមៗលើ Wick មានហានិភ័យខ្ពស់ — សូមរង់ចាំ BOS/CHoCH បញ្ជាក់ទិសសិន។',
        }}
      />

      <h3>
        <span className="bar"></span>៤. Liquidity + Structure + OB — ភ្ជាប់គ្នា
      </h3>
      <Box variant="b">
        <p>
          <strong>Setup ខ្លាំង</strong> ជាទូទៅមកពី Confluence ច្រើនស្រទាប់៖ SSL Sweep (មេរៀននេះ) + Bullish CHoCH
          (មេរៀនទី ២) + Bullish Order Block ដែលបង្កើត Displacement នោះ (មេរៀនទី ៣) + FVG ក្នុងចលនាដដែល (មេរៀនទី
          ៤)។ កាន់តែច្រើន Confluence ត្រូវគ្នា — Setup កាន់តែគួរឱ្យទុកចិត្ត។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>៥. កំហុសដែល Beginner ជួបញឹកញាប់
      </h3>
      <Box variant="d">
        <ul>
          <li>
            <strong>ហៅរាល់ Wick តូចៗថា Liquidity Sweep</strong> — Sweep ពិតត្រូវឆ្លងកាត់ Equal High/Low ឬ Swing
            សំខាន់ ជាមួយ Reaction ច្បាស់លាស់ មិនមែន Wick ធម្មតារាល់ Candle ។
          </li>
          <li>
            <strong>ចូល Trade ភ្លាមៗលើ Sweep ដោយគ្មាន Confirmation</strong> — Sweep អាចបន្តទិសដើមក៏បាន (False
            Signal) ត្រូវរង់ចាំ BOS/CHoCH ។
          </li>
          <li>
            <strong>មិនគិតពី Higher Timeframe Liquidity</strong> — Zone នៅ Timeframe ធំ (H4, Daily) មានទម្ងន់ខ្ពស់
            ជាង Zone នៅ Timeframe តូច ។
          </li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">Sweep = ការទាញ Order មិនមែន Signal ចូល Trade ភ្លាមៗ — រង់ចាំ Structure បញ្ជាក់សិន</Rule>

      <h3>
        <span className="bar"></span>📝 លំហាត់អនុវត្ត
      </h3>
      <Box variant="g">
        <p>មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView ៖</p>
        <Steps
          items={[
            'រកមើល Equal High ឬ Equal Low យ៉ាងហោចណាស់ ១ ចំណុចលើ Chart',
            'ពិនិត្យថា Price ធ្លាប់ចាក់ Wick ហួសកម្រិតនោះ ហើយ Reject ត្រឡប់មកវិញដែរឬទេ',
            'បើមាន សូមមើលថា BOS/CHoCH កើតឡើងបន្ទាប់ពី Sweep នោះដែរឬអត់',
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
