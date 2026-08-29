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
import { getLessonMeta } from '../data/lessons.js';
import bullishVideo from '../assets/bullish-demo.mp4';
import bearishVideo from '../assets/bearish-demo.mp4';
import swingExample from '../assets/swing-example.jpg';
import chartA from '../assets/chart-a.jpg';
import chartB from '../assets/chart-b.jpg';

const meta = getLessonMeta('l1');

const OK_FEEDBACK = '✓ ត្រឹមត្រូវ!';
const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត ។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'Swing High គឺជា Candle ណាមួយ ដែល...?',
    options: [
      { label: 'Low ទាបជាង Candle ២ខាង', correct: false },
      { label: 'High ខ្ពស់ជាង Candle ២ខាង', correct: true },
      { label: 'Body ធំជាងគេក្នុង Chart', correct: false },
    ],
    feedback: { ok: OK_FEEDBACK, no: NO_FEEDBACK },
  },
  {
    question: 'BOS (Break of Structure) កើតឡើងនៅពេលណា?',
    options: [
      { label: 'ពេល Wick ឆ្លងកាត់ Swing High/Low ចាស់ភ្លាមៗ', correct: false },
      { label: 'ពេល Candle Body Close ឆ្លងកាត់ Swing High/Low ចាស់', correct: true },
      { label: 'ពេល Candle ប្ដូរពណ៌ក្រហម/បៃតង', correct: false },
    ],
    feedback: { ok: OK_FEEDBACK, no: NO_FEEDBACK },
  },
  {
    question: 'Structure មាន Higher High (HH) និង Higher Low (HL) ជាបន្តបន្ទាប់ — ជា Structure អ្វី?',
    options: [
      { label: 'Bullish', correct: true },
      { label: 'Bearish', correct: false },
      { label: 'Sideways', correct: false },
    ],
    feedback: { ok: OK_FEEDBACK, no: NO_FEEDBACK },
  },
  {
    question: 'Structure មាន Lower High (LH) និង Lower Low (LL) ជាបន្តបន្ទាប់ — ជា Structure អ្វី?',
    options: [
      { label: 'Bullish', correct: false },
      { label: 'Bearish', correct: true },
      { label: 'Sideways', correct: false },
    ],
    feedback: { ok: OK_FEEDBACK, no: NO_FEEDBACK },
  },
  {
    question: 'Price ធ្វើចលនាក្នុង Range ដោយគ្មាន HH/HL ឬ LH/LL ច្បាស់លាស់ — គេហៅថា Structure អ្វី?',
    options: [
      { label: 'Sideways', correct: true },
      { label: 'Breakout', correct: false },
      { label: 'BOS', correct: false },
    ],
    feedback: { ok: OK_FEEDBACK, no: NO_FEEDBACK },
  },
];

export default function Lesson1({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l1"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់មេរៀន' : `🔒 បញ្ចប់មេរៀន (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>Market Structure (រចនាសម្ព័ន្ធទីផ្សារ)</strong> ជា <strong>មូលដ្ឋានគ្រឹះដំបូងគេ</strong> ដែល
        Trader ត្រូវរៀនមុនអ្វីទាំងអស់ — វាប្រាប់យើងថា Price កំពុងផ្លាស់ទីតាមទិសណា ដោយសិក្សាពីរបៀបដែល{' '}
        <strong>Swing High</strong> (កំពូល) និង <strong>Swing Low</strong> (បាត) ត្រូវបានបង្កើតឡើងជាបន្តបន្ទាប់។
        Market Structure មាន <strong>៣ ប្រភេទ</strong> គឺ Bullish, Bearish និង Sideways។
      </p>

      <h3>
        <span className="bar"></span>Market Structure ៣ ប្រភេទ
      </h3>
      <div className="g3">
        <GridItem labelColor="var(--up)" label="Bullish ⬆">
          Structure <strong style={{ color: 'var(--up)' }}>ឡើង</strong>
          <br />
          Higher High (HH)
          <br />
          Higher Low (HL)
          <br />
          <strong>→ Bias Buy</strong>
        </GridItem>
        <GridItem labelColor="var(--dn)" label="Bearish ⬇">
          Structure <strong style={{ color: 'var(--dn)' }}>ចុះ</strong>
          <br />
          Lower High (LH)
          <br />
          Lower Low (LL)
          <br />
          <strong>→ Bias Sell</strong>
        </GridItem>
        <GridItem labelColor="var(--blue)" label="Sideways ↔">
          Structure <strong style={{ color: 'var(--blue)' }}>រង</strong>
          <br />
          Equal High (EQH)
          <br />
          Equal Low (EQL)
          <br />
          <strong>→ រង់ចាំ Breakout</strong>
        </GridItem>
      </div>

      {/* ===== SWING HIGH / SWING LOW ===== */}
      <h3>
        <span className="bar"></span>Swing High &amp; Swing Low
      </h3>
      <p>
        មុននឹងចេះមើល Market Structure ត្រូវចេះមើល <strong>Swing High</strong> និង <strong>Swing Low</strong>{' '}
        ជាមុនសិន — ព្រោះ Swing Point ទាំងនេះជា "ឆ្អឹងខ្នង" ដែលប្រើសម្រាប់កំណត់ HH, HL, LH, LL និង BOS ទាំងអស់ ។
      </p>

      <div className="g2">
        <GridItem labelColor="var(--up)" label="Swing High" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle ណាមួយ ដែលមាន <strong>High ខ្ពស់ជាង</strong> Candle ខាងឆ្វេង និងខាងស្ដាំវាភ្លាមៗ (យ៉ាងហោចណាស់ម្ខាង
          ១ Candle) ។ វាបង្ហាញពីចំណុចកំពូលមួយ មុននឹង Price ត្រឡប់ចុះមកវិញ ។
        </GridItem>
        <GridItem labelColor="var(--dn)" label="Swing Low" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle ណាមួយ ដែលមាន <strong>Low ទាបជាង</strong> Candle ខាងឆ្វេង និងខាងស្ដាំវាភ្លាមៗ ។ វាបង្ហាញពីចំណុចបាតមួយ
          មុននឹង Price ត្រឡប់ឡើងលើវិញ ។
        </GridItem>
      </div>

      <h3 style={{ marginTop: 20 }}>
        <span className="bar"></span>របៀបមើលលើ Candle ដើម្បីកំណត់
      </h3>
      <Steps
        items={[
          'សម្គាល់ Candle ចំកណ្ដាល ១ គូ ជាមួយ Candle ២ ខាង (ឆ្វេង-ស្ដាំ)',
          <>
            បើ High របស់ Candle កណ្ដាល <strong>ខ្ពស់ជាង</strong> High ទាំង ២ ខាង → នោះជា{' '}
            <strong style={{ color: 'var(--up)' }}>Swing High</strong>
          </>,
          <>
            បើ Low របស់ Candle កណ្ដាល <strong>ទាបជាង</strong> Low ទាំង ២ ខាង → នោះជា{' '}
            <strong style={{ color: 'var(--dn)' }}>Swing Low</strong>
          </>,
          'អូសបន្តទៅមុខ Candle មួយៗ ដើម្បីរក Swing High/Low បន្ទាប់ៗទៀត',
        ]}
      />

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          📊 ឧទាហរណ៍ពិត — XAUUSD (TradingView)
        </div>
        <img
          src={swingExample}
          alt="Swing High Swing Low XAUUSD"
          style={{ width: '100%', borderRadius: 8, display: 'block' }}
        />
        <div className="cap">
          Swing High = កំពូល Candle ដែលខ្ពស់ជាងជុំវិញ · Swing Low = បាត Candle ដែលទាបជាងជុំវិញ
        </div>
      </div>

      <Rule title="ច្បាប់ចងចាំ">
        Swing High/Low ត្រូវការ Candle ២ ខាង "បញ្ជាក់" ជានិច្ច — គ្មាន Candle ខាងស្ដាំគ្រប់គ្រាន់ទេ
        មិនទាន់អាចកំណត់ថាជា Swing Point ពិតប្រាកដបានឡើយ
      </Rule>

      {/* ===== BULLISH MARKET STRUCTURE ===== */}
      <h3>
        <span className="bar"></span>1. Bullish Market Structure
      </h3>
      <Box variant="u">
        <p>
          <strong>និយមន័យ ៖</strong> Price បង្កើត <strong>Higher High (HH)</strong> និង{' '}
          <strong>Higher Low (HL)</strong> ជាបន្តបន្ទាប់ — រាល់ Swing High ថ្មី <strong>ខ្ពស់ជាង</strong> Swing
          High ចាស់ ហើយរាល់ Swing Low ថ្មី <strong>ខ្ពស់ជាង</strong> Swing Low ចាស់ ។ នេះជាភស្ដុតាងថា{' '}
          <strong>Buyer កំពុងគ្រប់គ្រង</strong> ទីផ្សារ ។
        </p>
      </Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--up)', marginBottom: 8 }}>
          🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={bullishVideo} type="video/mp4" />
        </video>
      </div>

      <AnimatedFig
        caption={
          <>
            Low 1 ធ្វើ BOS ទម្លុះ High 1 → Price Close លើ Swing High ចាស់ → បង្កើត{' '}
            <strong style={{ color: '#3EC97A' }}>Higher High (HH)</strong> ថ្មី — Structure ក្លាយជា Bullish
          </>
        }
      >
        <svg viewBox="0 0 700 210">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            BULLISH MARKET STRUCTURE
          </text>

          <line x1="40" y1="70" x2="465" y2="70" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="40" y1="70" x2="40" y2="105" stroke="#E05555" strokeWidth="1.4" /><rect x="34" y="75" width="12" height="25" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="82.5" y1="94.75" x2="82.5" y2="116.75" stroke="#E05555" strokeWidth="1" /><rect x="78.5" y="98.75" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="125" y1="100" x2="125" y2="145" stroke="#E05555" strokeWidth="1.4" /><rect x="119" y="108" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.33s' }}><line x1="167.5" y1="126.5" x2="167.5" y2="148.5" stroke="#E05555" strokeWidth="1" /><rect x="163.5" y="130.5" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="210" y1="140" x2="210" y2="160" stroke="#E05555" strokeWidth="1.4" /><rect x="204" y="145" width="12" height="12" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.48s' }}><line x1="252.5" y1="133.5" x2="252.5" y2="155.5" stroke="#3EC97A" strokeWidth="1" /><rect x="248.5" y="137.5" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="295" y1="118" x2="295" y2="158" stroke="#3EC97A" strokeWidth="1.4" /><rect x="289" y="122" width="12" height="32" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.63s' }}><line x1="337.5" y1="112" x2="337.5" y2="134" stroke="#3EC97A" strokeWidth="1" /><rect x="333.5" y="116" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.7s' }}><line x1="380" y1="90" x2="380" y2="125" stroke="#3EC97A" strokeWidth="1.4" /><rect x="374" y="94" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.78s' }}><line x1="445" y1="71.9" x2="445" y2="93.9" stroke="#3EC97A" strokeWidth="1" /><rect x="441" y="75.9" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.85s' }}><line x1="465" y1="55" x2="465" y2="95" stroke="#3EC97A" strokeWidth="1.4" /><rect x="459" y="60" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.93s' }}><line x1="507.5" y1="49.5" x2="507.5" y2="69.5" stroke="#3EC97A" strokeWidth="1" /><rect x="503.5" y="53.5" width="8" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1s' }}><line x1="550" y1="25" x2="550" y2="62" stroke="#3EC97A" strokeWidth="1.4" /><rect x="544" y="30" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.08s' }}><line x1="585" y1="39.5" x2="585" y2="59.5" stroke="#E05555" strokeWidth="1" /><rect x="581" y="43.5" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.15s' }}><line x1="620" y1="40" x2="620" y2="70" stroke="#E05555" strokeWidth="1.4" /><rect x="614" y="45" width="12" height="20" rx="1" fill="#E05555" /></g>

          <g className="ac" style={{ animationDelay: '.1s' }}><circle cx="40" cy="70" r="4" fill="#2E7CF6" /><text x="40" y="55" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">High 1</text></g>
          <text x="410" y="64" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '1.3s' }}>Swing High</text>

          <g className="ac" style={{ animationDelay: '.4s' }}><circle cx="210" cy="160" r="4" fill="#2E7CF6" /><text x="210" y="178" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">Low 1</text></g>
          <text x="210" y="194" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '1.4s' }}>Swing Low</text>

          <text x="465" y="45" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1.1s' }}>BOS ↑</text>
          <g className="ac" style={{ animationDelay: '1s' }}><circle cx="550" cy="25" r="4" fill="#3EC97A" /><text x="550" y="14" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">HH</text></g>
        </svg>
      </AnimatedFig>

      {/* ===== BEARISH MARKET STRUCTURE ===== */}
      <h3>
        <span className="bar"></span>2. Bearish Market Structure
      </h3>
      <Box variant="d">
        <p>
          <strong>និយមន័យ ៖</strong> Price បង្កើត <strong>Lower High (LH)</strong> និង{' '}
          <strong>Lower Low (LL)</strong> ជាបន្តបន្ទាប់ — រាល់ Swing High ថ្មី <strong>ទាបជាង</strong> Swing High
          ចាស់ ហើយរាល់ Swing Low ថ្មី <strong>ទាបជាង</strong> Swing Low ចាស់ ។ នេះជាភស្ដុតាងថា{' '}
          <strong>Seller កំពុងគ្រប់គ្រង</strong> ទីផ្សារ ។
        </p>
      </Box>

      <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
        <div className="gi-label" style={{ color: 'var(--dn)', marginBottom: 8 }}>
          🎥 វីដេអូបង្ហាញជាក់ស្តែងពី TradingView
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
        >
          <source src={bearishVideo} type="video/mp4" />
        </video>
      </div>

      <AnimatedFig
        caption={
          <>
            High 1 ធ្វើ BOS ទម្លុះ Low 1 → Price Close ក្រោម Swing Low ចាស់ → បង្កើត{' '}
            <strong style={{ color: '#E05555' }}>Lower Low (LL)</strong> ថ្មី — Structure ក្លាយជា Bearish
          </>
        }
      >
        <svg viewBox="0 0 700 230">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            BEARISH MARKET STRUCTURE
          </text>

          <line x1="40" y1="160" x2="465" y2="160" stroke="#2E7CF6" strokeWidth="0.7" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="40" y1="140" x2="40" y2="165" stroke="#3EC97A" strokeWidth="1.4" /><rect x="34" y="145" width="12" height="15" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.18s' }}><line x1="82.5" y1="127.75" x2="82.5" y2="149.75" stroke="#3EC97A" strokeWidth="1" /><rect x="78.5" y="131.75" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.25s' }}><line x1="125" y1="100" x2="125" y2="148" stroke="#3EC97A" strokeWidth="1.4" /><rect x="119" y="105" width="12" height="40" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.33s' }}><line x1="167.5" y1="92" x2="167.5" y2="114" stroke="#3EC97A" strokeWidth="1" /><rect x="163.5" y="96" width="8" height="14" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.4s' }}><line x1="210" y1="70" x2="210" y2="90" stroke="#3EC97A" strokeWidth="1.4" /><rect x="204" y="75" width="12" height="12" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.48s' }}><line x1="252.5" y1="85" x2="252.5" y2="107" stroke="#E05555" strokeWidth="1" /><rect x="248.5" y="89" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="295" y1="90" x2="295" y2="130" stroke="#E05555" strokeWidth="1.4" /><rect x="289" y="95" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.63s' }}><line x1="337.5" y1="112.5" x2="337.5" y2="134.5" stroke="#E05555" strokeWidth="1" /><rect x="333.5" y="116.5" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.7s' }}><line x1="380" y1="115" x2="380" y2="155" stroke="#E05555" strokeWidth="1.4" /><rect x="374" y="120" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.78s' }}><line x1="440" y1="147.24" x2="440" y2="169.24" stroke="#E05555" strokeWidth="1" /><rect x="436" y="151.24" width="8" height="14" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.85s' }}><line x1="465" y1="140" x2="465" y2="185" stroke="#E05555" strokeWidth="1.4" /><rect x="459" y="150" width="12" height="35" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.93s' }}><line x1="507.5" y1="169.25" x2="507.5" y2="189.25" stroke="#E05555" strokeWidth="1" /><rect x="503.5" y="173.25" width="8" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1s' }}><line x1="550" y1="170" x2="550" y2="210" stroke="#E05555" strokeWidth="1.4" /><rect x="544" y="175" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.08s' }}><line x1="585" y1="180.5" x2="585" y2="200.5" stroke="#3EC97A" strokeWidth="1" /><rect x="581" y="184.5" width="8" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.15s' }}><line x1="620" y1="175" x2="620" y2="205" stroke="#3EC97A" strokeWidth="1.4" /><rect x="614" y="180" width="12" height="20" rx="1" fill="#3EC97A" /></g>

          <g className="ac" style={{ animationDelay: '.1s' }}><circle cx="40" cy="160" r="4" fill="#2E7CF6" /><text x="40" y="182" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">Low 1</text></g>
          <text x="410" y="153" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '1.3s' }}>Swing Low</text>

          <g className="ac" style={{ animationDelay: '.4s' }}><circle cx="210" cy="70" r="4" fill="#2E7CF6" /><text x="210" y="58" textAnchor="middle" fontSize="10" fill="#2E7CF6" fontWeight="700" fontFamily="Space Grotesk,sans-serif">High 1</text></g>
          <text x="210" y="45" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '1.4s' }}>Swing High</text>

          <text x="465" y="200" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '1.1s' }}>BOS ↓</text>
          <g className="ac" style={{ animationDelay: '1s' }}><circle cx="550" cy="210" r="4" fill="#E05555" /><text x="550" y="224" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">LL</text></g>
        </svg>
      </AnimatedFig>

      {/* ===== SIDEWAYS ===== */}
      <h3>
        <span className="bar"></span>3. Sideways Market Structure
      </h3>
      <Box variant="b">
        <p>
          <strong>និយមន័យ ៖</strong> Price ធ្វើចលនាចុះឡើងក្នុង <strong>Range</strong> មួយ — គ្មាន HH/HL ច្បាស់
          ក៏គ្មាន LH/LL ច្បាស់ដែរ ។ High-Low ស្មើៗគ្នា (Equal High / Equal Low) ។ Trader ជាទូទៅ{' '}
          <strong>រង់ចាំ Breakout</strong> មុននឹង Trade ។
        </p>
      </Box>

      <AnimatedFig caption="Equal High / Equal Low → Range → រង់ចាំ Breakout ច្បាស់លាស់">
        <svg viewBox="0 0 700 160">
          <text x="350" y="16" textAnchor="middle" fontSize="12" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif">
            SIDEWAYS — RANGE
          </text>
          <line x1="30" y1="45" x2="670" y2="45" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />
          <line x1="30" y1="110" x2="670" y2="110" stroke="#5B9BD5" strokeWidth="0.6" strokeDasharray="4 3" className="ac" style={{ animationDelay: '.2s' }} />
          <text x="20" y="49" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>EQH</text>
          <text x="20" y="114" textAnchor="end" fontSize="9" fill="#5B9BD5" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.2s' }}>EQL</text>
          <g className="ac" style={{ animationDelay: '.35s' }}><line x1="90" y1="48" x2="90" y2="95" stroke="#3EC97A" strokeWidth="1.4" /><rect x="84" y="55" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.425s' }}><line x1="132.5" y1="68" x2="132.5" y2="80" stroke="#E05555" strokeWidth="1" /><rect x="129.5" y="71" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.5s' }}><line x1="175" y1="60" x2="175" y2="108" stroke="#E05555" strokeWidth="1.4" /><rect x="169" y="68" width="12" height="32" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.575s' }}><line x1="217.5" y1="66.5" x2="217.5" y2="84.5" stroke="#3EC97A" strokeWidth="1" /><rect x="214.5" y="69.5" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="260" y1="45" x2="260" y2="92" stroke="#3EC97A" strokeWidth="1.4" /><rect x="254" y="52" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.725s' }}><line x1="302.5" y1="66" x2="302.5" y2="84" stroke="#E05555" strokeWidth="1" /><rect x="299.5" y="69" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.8s' }}><line x1="345" y1="58" x2="345" y2="110" stroke="#E05555" strokeWidth="1.4" /><rect x="339" y="66" width="12" height="34" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '.875s' }}><line x1="387.5" y1="67" x2="387.5" y2="85" stroke="#3EC97A" strokeWidth="1" /><rect x="384.5" y="70" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '.95s' }}><line x1="430" y1="47" x2="430" y2="94" stroke="#3EC97A" strokeWidth="1.4" /><rect x="424" y="54" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.025s' }}><line x1="472.5" y1="68" x2="472.5" y2="86" stroke="#E05555" strokeWidth="1" /><rect x="469.5" y="71" width="6" height="12" rx="0.8" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.1s' }}><line x1="515" y1="62" x2="515" y2="108" stroke="#E05555" strokeWidth="1.4" /><rect x="509" y="70" width="12" height="30" rx="1" fill="#E05555" /></g>
          <g className="ac" style={{ animationDelay: '1.175s' }}><line x1="557.5" y1="67.5" x2="557.5" y2="85.5" stroke="#3EC97A" strokeWidth="1" /><rect x="554.5" y="70.5" width="6" height="12" rx="0.8" fill="#3EC97A" /></g>
          <g className="ac" style={{ animationDelay: '1.25s' }}><line x1="600" y1="46" x2="600" y2="93" stroke="#3EC97A" strokeWidth="1.4" /><rect x="594" y="53" width="12" height="30" rx="1" fill="#3EC97A" /></g>
        </svg>
      </AnimatedFig>

      {/* ===== BOS ===== */}
      <h3>
        <span className="bar"></span>BOS — Break of Structure
      </h3>
      <Box variant="g">
        <p>
          <strong>BOS (Break of Structure)</strong> = ពេល Candle <strong>Close</strong> ឆ្លងកាត់ Swing High
          ចាស់ (Bullish BOS ↑) ឬ Swing Low ចាស់ (Bearish BOS ↓) ។ BOS ជាភស្ដុតាងបញ្ជាក់ថា Market Structure
          កំពុង <strong>បន្ត</strong> ទិសដើម ។
        </p>
        <ul>
          <li>
            ត្រូវការ <strong>Candle Body Close</strong> ឆ្លងកាត់ — Wick ឆ្លងតែមួយភ្លែត{' '}
            <strong>មិនមែន BOS</strong> (ជា False Break)
          </li>
          <li>BOS ↑ = Bullish Continuation · BOS ↓ = Bearish Continuation</li>
        </ul>
      </Box>

      {/* ===== HH / HL / LH / LL ===== */}
      <h3>
        <span className="bar"></span>របៀបសម្គាល់ HH, HL, LH, LL លើ Swing Point
      </h3>
      <p>
        នេះជា <strong>គំនិតសំខាន់បំផុត</strong> ក្នុងការអាន Market Structure — យើងគ្រាន់តែប្រៀបធៀប{' '}
        <strong>Swing High/Low ថ្មី</strong> ជាមួយ <strong>Swing High/Low ចាស់</strong> ដើម្បីដឹងថា Structure
        កំពុងឡើង ឬចុះ ។
      </p>

      <div className="g2">
        <GridItem labelColor="var(--dn)" label="Bearish Structure" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Swing High ថ្មី <strong>ទាបជាង</strong> Swing High ចាស់ → <strong style={{ color: 'var(--dn)' }}>Lower High (LH)</strong> ។
          Swing Low ថ្មី <strong>ទាបជាង</strong> Swing Low ចាស់ → <strong style={{ color: 'var(--dn)' }}>Lower Low (LL)</strong> ។
          BOS ↓ កើតឡើងពេល Price Close ក្រោម Swing Low ចាស់ ។
        </GridItem>
        <GridItem labelColor="var(--up)" label="Bullish Structure" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Swing High ថ្មី <strong>ខ្ពស់ជាង</strong> Swing High ចាស់ → <strong style={{ color: 'var(--up)' }}>Higher High (HH)</strong> ។
          Swing Low ថ្មី <strong>ខ្ពស់ជាង</strong> Swing Low ចាស់ → <strong style={{ color: 'var(--up)' }}>Higher Low (HL)</strong> ។
          BOS ↑ កើតឡើងពេល Price Close លើ Swing High ចាស់ ។
        </GridItem>
      </div>

      <Rule title="ច្បាប់ចងចាំ">
        <strong>HH + HL</strong> = Bullish Structure (Buyer កំពុងគ្រប់គ្រង) · <strong>LH + LL</strong> = Bearish
        Structure (Seller កំពុងគ្រប់គ្រង)
      </Rule>

      <Box variant="g">
        <p>
          <strong>💡 ហេតុអ្វីវាសំខាន់ ៖</strong> Swing Point មុន BOS (ឧ. Low មុន BOS ↑ ឬ High មុន BOS ↓)
          ភាគច្រើនជា <strong>Zone ដែល Smart Money ទុក Order</strong> — ពេល Price ត្រឡប់មកតំបន់នេះម្ដងទៀត
          វាច្រើនតែជា <strong>Entry Zone ល្អ</strong> សម្រាប់បន្ត Trend ។
        </p>
      </Box>

      {/* QUIZ */}
      <h3>
        <span className="bar"></span>ពិនិត្យចំណេះដឹង
      </h3>
      <Quiz
        question="ក្នុង Bearish Market Structure — Swing Low ថ្មី ដែលទាបជាង Swing Low ចាស់ ត្រូវហៅថាអ្វី?"
        options={[
          { label: 'Higher Low (HL)', type: 'no' },
          { label: 'Lower Low (LL)', type: 'ok' },
          { label: 'Equal Low (EQL)', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Swing Low ថ្មី ទាបជាង Swing Low ចាស់ = Lower Low (LL) ។',
          no: '✗ Swing Low ថ្មី ដែលទាបជាង Swing Low ចាស់ ត្រូវហៅថា Lower Low (LL) ។',
        }}
      />
      <Quiz
        question="Swing High ថ្មី ដែលខ្ពស់ជាង Swing High ចាស់ ត្រូវហៅថាអ្វី?"
        options={[
          { label: 'Higher High (HH)', type: 'ok' },
          { label: 'Lower High (LH)', type: 'no' },
          { label: 'Equal High (EQH)', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Swing High ថ្មី ខ្ពស់ជាង Swing High ចាស់ = Higher High (HH) ។',
          no: '✗ Swing High ថ្មី ដែលខ្ពស់ជាង Swing High ចាស់ ត្រូវហៅថា Higher High (HH) ។',
        }}
      />

      {/* ===== HOMEWORK ===== */}
      <h3>
        <span className="bar"></span>📝 កិច្ចការផ្ទះ — មេរៀនទី ១
      </h3>
      <Box variant="g">
        <p>មើល Chart ខាងក្រោម ហើយសាកល្បងកំណត់ដោយខ្លួនឯង មុននឹងចុច "មើលចម្លើយ" ៖</p>
        <ul>
          <li>
            តើនេះជា <strong>Bullish</strong> ឬ <strong>Bearish</strong> Market Structure?
          </li>
          <li>
            សម្គាល់ចំណុច <strong>BOS</strong> (Break of Structure) នៅត្រង់ណា?
          </li>
          <li>
            សម្គាល់ថា Swing ថ្មីនោះជា <strong>HH, HL, LH ឬ LL</strong>?
          </li>
        </ul>
      </Box>

      <div className="fig" style={{ marginTop: 16 }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          Chart A
        </div>
        <img src={chartA} alt="Chart A — XAUUSD" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      </div>
      <AnswerReveal label="👁 មើលចម្លើយ Chart A" variant="d">
        <p>
          <strong>ចម្លើយ ៖</strong> Chart A ជា <strong>Bearish Market Structure</strong> ។ Low 1 (candle
          ដំបូង) → High 1 (candle ទី ៣, Swing High) → BOS ↓ កើតឡើងត្រង់ candle ទី ៦ ដែល Close ក្រោម Low 1
          (Swing Low ចាស់) · candle ចុងក្រោយបំផុត បង្កើត <strong>Lower Low (LL)</strong> ថ្មី — Structure នេះជា
          Bearish ព្រោះមាន Lower High (LH) និង Lower Low (LL) ។
        </p>
      </AnswerReveal>

      <div className="fig" style={{ marginTop: 20 }}>
        <div className="gi-label" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          Chart B
        </div>
        <img src={chartB} alt="Chart B — XAUUSD" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      </div>
      <AnswerReveal label="👁 មើលចម្លើយ Chart B" variant="u">
        <p>
          <strong>ចម្លើយ ៖</strong> Chart B ជា <strong>Bullish Market Structure</strong> ។ High 1 (candle
          ដំបូង) → Low 1 (candle ទី ៣, Swing Low) → BOS ↑ កើតឡើងត្រង់ candle ទី ៦ ដែល Close លើ High 1 (Swing
          High ចាស់) · candle ចុងក្រោយបំផុត បង្កើត <strong>Higher High (HH)</strong> ថ្មី — Structure នេះជា
          Bullish ព្រោះមាន Higher High (HH) និង Higher Low (HL) ។
        </p>
      </AnswerReveal>

      <Box variant="b" style={{ marginTop: 20 }}>
        <p>
          <strong>🎯 កិច្ចការបន្ថែម ៖</strong> បើកយក Chart ពិតរបស់អ្នកលើ TradingView (គូ Forex/Gold/Crypto
          ណាមួយ) រួច Mark ដោយខ្លួនឯងនូវ Swing High/Low, BOS, HH, HL, LH, LL ។ ថតរូបផ្ញើមក Mentor
          ដើម្បីត្រួតពិនិត្យក្នុងវគ្គបន្ទាប់ ។
        </p>
      </Box>

      {/* ===== FINAL TEST — LOCK GATE ===== */}
      <h3>
        <span className="bar"></span>🔒 តេស្តបញ្ចប់មេរៀន
      </h3>
      <p>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៥ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </p>
      <FinalTest questions={FINAL_TEST_QUESTIONS} onProgressChange={setGate} />
    </LessonLayout>
  );
}
