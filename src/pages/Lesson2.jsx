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
import bosVideo from '../assets/bos-demo.mp4';
import chochVideo from '../assets/choch-demo.mp4';

const meta = getLessonMeta('l2');

const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'ក្នុង Uptrend ប្រសិនបើ Price Break Previous Swing High តាមទិសឡើង នេះជាអ្វី?',
    options: [
      { label: 'Bullish BOS', correct: true },
      { label: 'Bearish CHoCH', correct: false },
      { label: 'Sideways', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! BOS បង្ហាញពី Continuation តាមទិស Trend។', no: NO_FEEDBACK },
  },
  {
    question: 'ក្នុង Uptrend ប្រសិនបើ Price Break Previous Higher Low (HL) សំខាន់ នេះជាសញ្ញាអ្វី?',
    options: [
      { label: 'Bullish BOS', correct: false },
      { label: 'Bearish CHoCH', correct: true },
      { label: 'Bullish Trend Confirmation', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Break HL ផ្ទុយពី Uptrend អាចបង្ហាញពី CHoCH។', no: NO_FEEDBACK },
  },
  {
    question: 'តើ CHoCH មានន័យថា Trend Reverse 100% រួចហើយឬ?',
    options: [
      { label: 'បាទ/ចាស 100%', correct: false },
      { label: 'ទេ វាជា Possible Reversal Signal ហើយត្រូវការ Confirmation បន្ថែម', correct: true },
      { label: 'CHoCH មិនពាក់ព័ន្ធនឹង Trend ទេ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! CHoCH ជាសញ្ញាផ្លាស់ប្តូរដំបូង មិនមែន Guarantee។', no: NO_FEEDBACK },
  },
  {
    question: 'តើជំហានដំបូងមុនសម្គាល់ BOS ឬ CHoCH គឺអ្វី?',
    options: [
      { label: 'កំណត់ Trend និង Swing Structure ជាមុន', correct: true },
      { label: 'ចូល Buy/Sell ភ្លាមៗ', correct: false },
      { label: 'មើល Candlestick តែមួយ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! Context និង Swing Structure គឺជាមូលដ្ឋាន។', no: NO_FEEDBACK },
  },
];

export default function Lesson2({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l2"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់មេរៀន' : `🔒 បញ្ចប់មេរៀន (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        បន្ទាប់ពីយើងយល់ពី <strong>Market Structure</strong> (មេរៀនទី ១) រួចហើយ ថ្ងៃនេះយើងនឹងរៀនអានថា ពេល Price
        Break ចេញពី Swing ចាស់មួយ តើវាមានន័យអ្វី — <strong>បន្តទិសដើម</strong> ឬ <strong>ចាប់ផ្តើមប្តូរទិស</strong>?
        នេះហើយជាតួនាទីរបស់ <strong>BOS (Break of Structure)</strong> និង <strong>CHoCH (Change of Character)</strong>។
      </p>

      <Box variant="g">
        <p>
          <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Trend ជា <strong>រថភ្លើងមួយ</strong> កំពុងរត់លើផ្លូវថេរ។ BOS
          ដូចរថភ្លើងបន្តរត់លើផ្លូវដដែល — Trend នៅតែដដែល។ ចំណែក CHoCH ដូចរថភ្លើងចាប់ផ្តើម{' '}
          <strong>បត់ចេញពីផ្លូវចាស់</strong> — មិនទាន់ដឹងច្បាស់ថាទៅទិសណា ប៉ុន្តែជាសញ្ញាដំបូងថា អ្វីមួយកំពុងផ្លាស់ប្តូរ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label="Protected Swing">
          Swing Point សំខាន់ដែល Trend កំពុង "ការពារ" — ឧ. HL ក្នុង Uptrend។ បើ Break Swing នេះ Trend ចាស់ចាត់ទុកថាមានបញ្ហា។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="Context">
          ស្ថានភាពទូទៅនៃ Chart (Trend ទិសណា, Swing នៅឯណា) មុននឹងសម្រេចថា Break មួយជា BOS ឬ CHoCH។
        </GridItem>
      </div>

      <Rule title="BOS = Continuation · CHoCH = Possible Reversal">
        មើល Context និង Swing ដែល Price Break មិនមែនមើលតែ Candlestick មួយគត់
      </Rule>

      <h3>
        <span className="bar"></span>១. BOS (Break of Structure) ជាអ្វី?
      </h3>
      <p>
        <strong>BOS</strong> កើតឡើងនៅពេល Price <strong>Break Swing Structure សំខាន់ក្នុងទិសដើម</strong>។ វាបង្ហាញថា
        Momentum និង Structure នៅតែគាំទ្រ Trend នោះ។
      </p>

      <div className="g2">
        <GridItem labelColor="var(--up)" label="Bullish BOS ⬆">
          ក្នុង Uptrend មាន HH និង HL។ នៅពេល Price Break <strong>Previous Swing High</strong> → Bullish BOS → Bias
          បន្តឡើង។
        </GridItem>
        <GridItem labelColor="var(--dn)" label="Bearish BOS ⬇">
          ក្នុង Downtrend មាន LH និង LL។ នៅពេល Price Break <strong>Previous Swing Low</strong> → Bearish BOS → Bias
          បន្តចុះ។
        </GridItem>
      </div>

      <Box variant="u">
        <p>
          <strong>ចំណុចសំខាន់:</strong> BOS មិនមានន័យថា "ចូល Trade ភ្លាមៗ" ទេ។ វាគ្រាន់តែជាសញ្ញាថា Structure កំពុងបន្តក្នុងទិសដើម។
        </p>
      </Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--up)', marginBottom: 8 }}>
          🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView — BOS
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

      <Quiz
        question="ក្នុង Downtrend (LH-LL) ប្រសិនបើ Price Break Previous Swing Low តាមទិសចុះ តើនេះជាអ្វី?"
        options={[
          { label: 'Bearish BOS', type: 'ok' },
          { label: 'Bullish CHoCH', type: 'no' },
          { label: 'Order Block', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Break Swing Low តាមទិស Downtrend ដដែល = Bearish BOS (Continuation)។',
          no: '✗ Break Swing តាមទិស Trend ដដែល (ចុះបន្តចុះ) ត្រូវហៅថា Bearish BOS មិនមែន CHoCH ទេ។',
        }}
      />

      <h3>
        <span className="bar"></span>២. CHoCH (Change of Character) ជាអ្វី?
      </h3>
      <p>
        <strong>CHoCH</strong> ជាសញ្ញាដំបូងថា Character របស់ Price អាចកំពុងផ្លាស់ប្តូរ។ ជាទូទៅ វាកើតឡើងនៅពេល Price{' '}
        <strong>Break Swing ដែលផ្ទុយពី Trend មុន</strong>។
      </p>

      <div className="g2">
        <GridItem labelColor="var(--blue)" label="Bullish CHoCH ↗">
          Downtrend: LH → LL → LH → បន្ទាប់មក Price Break <strong>Previous LH</strong>។ នេះបង្ហាញថា Sellers អាចកំពុងខ្សោយ។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="Bearish CHoCH ↘">
          Uptrend: HH → HL → HH → បន្ទាប់មក Price Break <strong>Previous HL</strong>។ នេះបង្ហាញថា Buyers អាចកំពុងខ្សោយ។
        </GridItem>
      </div>

      <Box variant="b">
        <p>
          <strong>ចំណាំ:</strong> CHoCH ជា <strong>Possible Reversal Signal</strong> មិនមែន Confirmation ថា Trend ប្តូររួច
          100% ទេ។ Trader ត្រូវរង់ចាំ Context និង Confirmation បន្ថែម។
        </p>
      </Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--blue)', marginBottom: 8 }}>
          🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView — CHoCH
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

      <Quiz
        question="Uptrend មាន HH → HL → HH រួច Price ធ្លាក់ចុះ Break HL សំខាន់ — តើនេះជាសញ្ញាអ្វី?"
        options={[
          { label: 'Bullish BOS — បន្តឡើង', type: 'no' },
          { label: 'Bearish CHoCH — Buyer អាចកំពុងចុះខ្សោយ', type: 'ok' },
          { label: 'គ្មានន័យអ្វីទេ', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Break HL ក្នុង Uptrend ផ្ទុយពី Trend ដើម = Bearish CHoCH (សញ្ញាដំបូងនៃការប្តូរទិស)។',
          no: '✗ Break Swing ផ្ទុយពី Trend ដើម (Uptrend ធ្លាក់ Break HL) ត្រូវហៅថា CHoCH មិនមែន BOS ទេ។',
        }}
      />

      <h3>
        <span className="bar"></span>៣. BOS vs CHoCH — ខុសគ្នាត្រង់ណា?
      </h3>
      <div className="g2">
        <GridItem label="BOS">
          <strong>Break តាមទិស Trend</strong>
          <br />
          បង្ហាញពី Continuation
          <br />
          ឧទាហរណ៍: Uptrend Break HH
        </GridItem>
        <GridItem label="CHoCH">
          <strong>Break ផ្ទុយពី Trend មុន</strong>
          <br />
          បង្ហាញពី Possible Reversal
          <br />
          ឧទាហរណ៍: Uptrend Break HL
        </GridItem>
      </div>

      <AnimatedFig
        caption={
          <>
            ខាងឆ្វេង៖ Price Break លើ <strong style={{ color: '#3EC97A' }}>Previous High</strong> → បន្តទិសដើម ={' '}
            <strong style={{ color: '#3EC97A' }}>BOS</strong> · ខាងស្ដាំ៖ Price Break ក្រោម{' '}
            <strong style={{ color: '#5B9BD5' }}>Previous Low ដែល Trend កំពុងការពារ</strong> → ប្តូរទិស ={' '}
            <strong style={{ color: '#5B9BD5' }}>CHoCH</strong>
          </>
        }
      >
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BOS — CONTINUATION</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">CHoCH — POSSIBLE REVERSAL</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <line x1="20" y1="70" x2="330" y2="70" stroke="#7A7870" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="24" y="65" fontSize="9" fill="#7A7870" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>Previous High</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="50" y1="95" x2="50" y2="130" stroke="#E05555" strokeWidth="1.3" /><rect x="44" y="102" width="12" height="22" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="95" y1="80" x2="95" y2="115" stroke="#3EC97A" strokeWidth="1.3" /><rect x="89" y="86" width="12" height="24" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="140" y1="35" x2="140" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="134" y="42" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="185" y1="20" x2="185" y2="50" stroke="#3EC97A" strokeWidth="1.3" /><rect x="179" y="24" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="230" y1="15" x2="230" y2="40" stroke="#3EC97A" strokeWidth="1.2" /><rect x="224" y="18" width="12" height="18" rx="1" fill="#3EC97A" /></g>
          <text x="185" y="60" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>BOS ↑</text>
          <text x="185" y="200" textAnchor="middle" fontSize="10" fill="#7A7870" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>Trend បន្តឡើងដដែល</text>

          <line x1="370" y1="140" x2="680" y2="140" stroke="#7A7870" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="374" y="153" fontSize="9" fill="#7A7870" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.1s' }}>Previous Low (Protected)</text>

          <g className="ac" style={{ animationDelay: '.15s' }}><line x1="400" y1="75" x2="400" y2="105" stroke="#3EC97A" strokeWidth="1.3" /><rect x="394" y="80" width="12" height="20" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.22s' }}><line x1="445" y1="95" x2="445" y2="128" stroke="#E05555" strokeWidth="1.3" /><rect x="439" y="100" width="12" height="22" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="490" y1="120" x2="490" y2="172" stroke="#E05555" strokeWidth="1.4" /><rect x="484" y="128" width="12" height="38" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.38s' }}><line x1="535" y1="160" x2="535" y2="188" stroke="#E05555" strokeWidth="1.3" /><rect x="529" y="164" width="12" height="20" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.45s' }}><line x1="580" y1="172" x2="580" y2="196" stroke="#E05555" strokeWidth="1.2" /><rect x="574" y="176" width="12" height="16" rx="1" fill="#E05555" /></g>
          <text x="535" y="150" textAnchor="middle" fontSize="10" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.5s' }}>CHoCH ↓</text>
          <text x="535" y="206" textAnchor="middle" fontSize="10" fill="#7A7870" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.55s' }}>Trend អាចកំពុងប្តូរទិស</text>
        </svg>
      </AnimatedFig>

      <h3>
        <span className="bar"></span>៤. របៀបសម្គាល់ BOS ជាជំហានៗ
      </h3>
      <Steps
        items={[
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
        ]}
      />

      <h3>
        <span className="bar"></span>៥. របៀបសម្គាល់ CHoCH ជាជំហានៗ
      </h3>
      <Steps
        items={[
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
        ]}
      />

      <Box variant="g">
        <p>
          <strong>Example:</strong> Uptrend មាន HH → HL → HH។ ប្រសិនបើ Price បន្ត Break HH = <strong>Bullish BOS</strong>។
          ប៉ុន្តែបើ Price ចុះ Break HL សំខាន់ = <strong>Bearish CHoCH</strong>។ បន្ទាប់មកយើងត្រូវមើល Structure បន្ត
          មុនសម្រេចថា Trend បាន Reverse ពិតប្រាកដ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>៦. កំហុសដែល Beginner ជួបញឹកញាប់
      </h3>
      <Box variant="d">
        <ul>
          <li>
            <strong>ហៅ Break តូចៗគ្រប់កន្លែងថា BOS ឬ CHoCH</strong> — Wick ឆ្លងកាត់មួយភ្លែត ឬ Break ដោយគ្មាន
            Momentum មិនទាន់រាប់ជា BOS/CHoCH ពិតប្រាកដទេ ត្រូវការ Candle Body Close ច្បាស់លាស់។
          </li>
          <li>
            <strong>មិនកំណត់ Trend និង Swing សំខាន់មុនពេល Mark Structure</strong> — បើមិនដឹងថា Trend បច្ចុប្បន្នជា
            អ្វី នឹងច្រឡំមិនដឹងថា Break មួយជា Continuation ឬ Reversal។
          </li>
          <li>
            <strong>ឃើញ CHoCH ម្តង ហើយសន្និដ្ឋានថា Trend Reverse 100%</strong> — CHoCH គ្រាន់តែជា{' '}
            <em>សញ្ញាដំបូង</em> ត្រូវរង់ចាំ Structure បន្ទាប់ទៀត (BOS ក្នុងទិសថ្មី) ដើម្បីបញ្ជាក់។
          </li>
          <li>
            <strong>ចូល Trade ដោយគ្មាន Confirmation ឬ Risk Management</strong> — សូម្បី Signal ល្អ ក៏នៅតែអាចខុសបាន
            Stop Loss និង Position Size តូចជានិច្ចត្រូវមានគ្រប់ Trade។
          </li>
        </ul>
      </Box>

      <Rule title="ច្បាប់ងាយចាំ">Break តាម Trend = BOS · Break ផ្ទុយពី Trend = CHoCH</Rule>

      <h3>
        <span className="bar"></span>📝 លំហាត់អនុវត្ត
      </h3>
      <Box variant="g">
        <p>មុននឹងធ្វើ Quiz ខាងក្រោម សូមអនុវត្តជាមួយ Chart ពិតរបស់អ្នកលើ TradingView (Timeframe ណាក៏បាន) ៖</p>
        <Steps
          items={[
            'កំណត់ Trend បច្ចុប្បន្ន — Bullish, Bearish ឬ Sideways (ត្រលប់ទៅមេរៀនទី ១ បើភ្លេច)',
            'រកមើល BOS ចំនួន ២-៣ កន្លែងលើ Chart — Mark ដោយបន្ទាត់ផ្ដេក',
            'រកមើល CHoCH យ៉ាងហោចណាស់ ១ កន្លែង — សម្គាល់ថា Swing ណាដែលត្រូវ Break ដើម្បីកើតឡើង',
            'ថតរូបជាមួយ Mark របស់អ្នក ដើម្បីប្រៀបធៀបជាមួយវីដេអូខាងលើម្ដងទៀត',
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
