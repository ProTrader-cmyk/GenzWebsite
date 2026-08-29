import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
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
        បន្ទាប់ពីយើងយល់ពី <strong>Market Structure</strong> រួចហើយ មេរៀននេះយើងនឹងរៀនពី{' '}
        <strong>BOS (Break of Structure)</strong> និង <strong>CHoCH (Change of Character)</strong>។ ទាំងពីរជួយឱ្យយើងអានថា
        Price កំពុង <strong>បន្តទិសដើម</strong> ឬ កំពុងចាប់ផ្តើម <strong>ផ្លាស់ប្តូរទិស</strong>។
      </p>

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
          <li>ហៅ Break តូចៗគ្រប់កន្លែងថា BOS ឬ CHoCH។</li>
          <li>មិនកំណត់ Trend និង Swing សំខាន់មុនពេល Mark Structure។</li>
          <li>ឃើញ CHoCH ម្តង ហើយសន្និដ្ឋានថា Trend Reverse 100%។</li>
          <li>ចូល Trade ដោយគ្មាន Confirmation ឬ Risk Management។</li>
        </ul>
      </Box>

      <Rule title="ច្បាប់ងាយចាំ">Break តាម Trend = BOS · Break ផ្ទុយពី Trend = CHoCH</Rule>

      <h3>
        <span className="bar"></span>Quiz — សាកល្បងចំណេះដឹង
      </h3>
      <FinalTest questions={FINAL_TEST_QUESTIONS} onProgressChange={setGate} />
    </LessonLayout>
  );
}
