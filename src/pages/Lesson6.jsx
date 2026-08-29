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

const meta = getLessonMeta('l6');

const NO_FEEDBACK = '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។';

const FINAL_TEST_QUESTIONS = [
  {
    question: 'ហេតុអ្វី EMA ប្រតិកម្មលឿនជាង SMA (រយៈពេលដូចគ្នា)?',
    options: [
      { label: 'EMA ផ្ដល់ទម្ងន់ខ្ពស់ជាងទៅលើ Price ថ្មីៗ', correct: true },
      { label: 'EMA ប្រើ Candle តិចជាង SMA', correct: false },
      { label: 'EMA គណនាតែពេលមាន Volume ខ្ពស់', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! ការផ្ដល់ទម្ងន់ (Weight) ខ្ពស់ទៅលើ Price ថ្មីធ្វើឱ្យ EMA រហ័សជាង SMA។', no: NO_FEEDBACK },
  },
  {
    question: 'EMA50 Cross ឡើងលើ SMA50 (រយៈពេលដូចគ្នា) មានន័យថាអ្វី?',
    options: [
      { label: 'Trend ធំទាំងមូល Reverse 100% ភ្លាមៗ', correct: false },
      { label: 'Momentum ក្នុង Layer 50 ចាប់ផ្ដើមប្ដូរទៅ Bullish', correct: true },
      { label: 'គ្មានន័យអ្វីទាំងអស់', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! EMA Cross ឡើងលើ SMA ដូចគ្នា = Momentum Shift Bullish សម្រាប់ Layer រយៈពេលនោះ។', no: NO_FEEDBACK },
  },
  {
    question: 'EMA50 > SMA50, EMA100 > SMA100, EMA200 > SMA200 ទាំងអស់ ព្រមទាំង Price នៅលើគ្រប់បន្ទាត់ — Structure ទូទៅជាអ្វី?',
    options: [
      { label: 'Full Stack Bullish — Bias ខ្លាំង', correct: true },
      { label: 'Full Stack Bearish', correct: false },
      { label: 'Sideways ពិតប្រាកដ', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! ពេល Layer ទាំង ៣ ស្រប Bullish ព្រម Price នៅលើគ្រប់បន្ទាត់ — Bias រឹងមាំ។', no: NO_FEEDBACK },
  },
  {
    question: 'Price Pullback មកប៉ះ EMA/SMA ហើយ Reject ត្រឡប់តាមទិស Trend — គេហៅតួនាទីនេះថាអ្វី?',
    options: [
      { label: 'Dynamic Support/Resistance', correct: true },
      { label: 'Liquidity Sweep', correct: false },
      { label: 'Fair Value Gap', correct: false },
    ],
    feedback: { ok: '✓ ត្រឹមត្រូវ! EMA/SMA ដើរតួជា Support/Resistance ដែលផ្លាស់ទីទៅតាម Price។', no: NO_FEEDBACK },
  },
];

export default function Lesson6({ onNavigate, onDone }) {
  const [gate, setGate] = useState({ passed: 0, total: FINAL_TEST_QUESTIONS.length, unlocked: false });

  return (
    <LessonLayout
      id="l6"
      title={meta.pageTitle}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? '✓ បញ្ចប់ Course' : `🔒 បញ្ចប់ Course (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>EMA (Exponential Moving Average)</strong> និង <strong>SMA (Simple Moving Average)</strong> ទាំង
        ពីរជា Indicator គូសបន្ទាត់ Average នៃ Price ក្នុងរយៈពេលកំណត់មួយ — ខុសគ្នាត្រង់ EMA{' '}
        <strong>ផ្ដល់ទម្ងន់ខ្ពស់ជាងទៅលើ Price ថ្មីៗ</strong> ធ្វើឱ្យវាប្រតិកម្មរហ័សជាង ចំណែក SMA គិត Average ស្មើ
        គ្នារាល់ Candle ធ្វើឱ្យវារលូន និងយឺតជាង។ មេរៀននេះនឹងបង្ហាញពីរបៀប{' '}
        <strong>ផ្សំ EMA និង SMA រយៈពេលដូចគ្នា (50, 100, 200)</strong> ដើម្បីអាន Bullish/Bearish Structure និង
        សម្គាល់ពេល Momentum ចាប់ផ្ដើមផ្លាស់ប្តូរ។
      </p>

      <Box variant="g">
        <p>
          <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃ SMA ដូចជា <strong>មិត្តដើរឆ្ងាយពីក្រោយ</strong> — ដឹងទិសយឺតៗ។ EMA
          ដូចជា <strong>មិត្តដើរជិតៗពីក្រោយ</strong> — ពេលអ្នកបត់ វាបត់តាមភ្លាមៗជាង។ ពេល "មិត្តជិត" (EMA){' '}
          <strong>ដើរលឿនហួស "មិត្តឆ្ងាយ" (SMA)</strong> នេះជាសញ្ញាថា ល្បឿនរបស់អ្នក (Momentum) កំពុងផ្លាស់ប្តូរ —
          នោះហើយជាគោលការណ៍នៃមេរៀននេះ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label="Period (Length)">
          ចំនួន Candle ដែល EMA/SMA ប្រើសម្រាប់គណនា Average — ឧ. EMA50 = 50 Candle ចុងក្រោយ (ផ្ដល់ទម្ងន់ខ្ពស់ទៅ Candle ថ្មី)។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="EMA-SMA Pair Crossover">
          ពេល EMA និង SMA <strong>រយៈពេលដូចគ្នា</strong> (ឧ. EMA50 vs SMA50) ប្រសព្វគ្នា — សញ្ញា Momentum Shift សម្រាប់ Layer នោះ។
        </GridItem>
      </div>

      <Rule title="EMA + SMA = Tool ជំនួយ មិនមែន Signal ពេញលេញ">
        តែងតែផ្សំជាមួយ Market Structure និង Context ដទៃទៀត កុំប្រើម្នាក់ឯង
      </Rule>

      <h3>
        <span className="bar"></span>១. EMA/SMA ជា Trend Filter
      </h3>
      <Box variant="u">
        <p>
          វិធីសាមញ្ញបំផុតប្រើ EMA/SMA គឺជា <strong>Filter Bias</strong>៖ Price ស្ថិតនៅ <strong>លើ</strong> បន្ទាត់
          ជាទូទៅចាត់ទុកជា <strong>Bullish Bias</strong>, Price ស្ថិតនៅ <strong>ក្រោម</strong> បន្ទាត់ជាទូទៅចាត់ទុកជា{' '}
          <strong>Bearish Bias</strong>។ ប្រើផ្សំជាមួយ Market Structure (មេរៀនទី ១) ដើម្បីបញ្ជាក់ទិសបន្ថែម។
        </p>
      </Box>

      <div className="g2">
        <GridItem labelColor="var(--gold)" label="50 (EMA50 / SMA50)">
          Short-Medium term — តាមដាន Momentum រយៈពេលខ្លីទៅមធ្យម ប្រតិកម្មលឿន តែងាយប្រែប្រួល។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="100 (EMA100 / SMA100)">
          Medium term — Balance ល្អរវាង Speed និង Reliability សម្រាប់ Swing Trading។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="200 (EMA200 / SMA200)">
          Long term — តំណាង Trend ធំ/Bias ស្ថាប័ន Trader ជាច្រើនប្រើជា "បន្ទាត់ព្រំដែន" Bull/Bear Market។
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>២. ផ្សំ EMA + SMA រយៈពេលដូចគ្នា — អាន Bull/Bear Structure
      </h3>
      <Box variant="b">
        <p>
          គន្លឹះសំខាន់នៃមេរៀននេះ៖ គូស <strong>EMA និង SMA រយៈពេលដូចគ្នា</strong> នៅលើគ្នា (EMA50+SMA50, EMA100+SMA100,
          EMA200+SMA200)។ ដោយសារ EMA ប្រតិកម្មលឿនជាង SMA ជានិច្ច ទំនាក់ទំនងរវាងបន្ទាត់ទាំងពីរប្រាប់ពី{' '}
          <strong>Momentum</strong> របស់ Layer រយៈពេលនោះ៖
        </p>
      </Box>

      <div className="g2">
        <GridItem labelColor="var(--up)" label="EMA នៅលើ SMA ⬆">
          Momentum កំពុងបង្កើនល្បឿនទៅ <strong>Bullish</strong> — Price ថ្មីៗខ្លាំងជាង Average ចាស់។
        </GridItem>
        <GridItem labelColor="var(--dn)" label="EMA នៅក្រោម SMA ⬇">
          Momentum កំពុងបង្កើនល្បឿនទៅ <strong>Bearish</strong> — Price ថ្មីៗខ្សោយជាង Average ចាស់។
        </GridItem>
      </div>

      <Box variant="g">
        <p>
          <strong>Full Stack Bullish ៖</strong> EMA50{'>'}SMA50 <em>ព្រម</em> EMA100{'>'}SMA100 <em>ព្រម</em> EMA200
          {'>'}SMA200 — Layer ទាំង ៣ ស្របគ្នា Bullish — Bias រឹងមាំបំផុត។ <strong>Full Stack Bearish</strong> គឺផ្ទុយ
          ពីនេះទាំងស្រុង។ ពេល Layer មិនទាន់ស្របគ្នា (ឧ. EMA50 Cross ឡើងលើ SMA50 រួច ប៉ុន្តែ EMA200 នៅតែក្រោម SMA200)
          — នេះជាសញ្ញា Momentum រយៈពេលខ្លីចាប់ផ្ដើមប្ដូរ ប៉ុន្តែ Trend ធំមិនទាន់ Confirm ត្រូវប្រុងប្រយ័ត្ន — ស្រដៀង
          គ្នានឹងគំនិត CHoCH (មេរៀនទី ២) ដែលជាសញ្ញាដំបូង មិនមែន Reversal ពេញលេញភ្លាមៗ។
        </p>
      </Box>

      <AnimatedFig
        caption={
          <>
            ខាងឆ្វេង៖ <strong style={{ color: '#3EC97A' }}>EMA</strong> Cross ឡើងលើ{' '}
            <strong style={{ color: '#6FA8FF' }}>SMA រយៈពេលដូចគ្នា</strong> = Momentum Shift{' '}
            <strong style={{ color: '#3EC97A' }}>Bullish</strong> · ខាងស្ដាំ៖ EMA Cross ចុះក្រោម SMA = Momentum
            Shift <strong style={{ color: '#E05555' }}>Bearish</strong> — Price ច្រើនតែត្រឡប់មកប៉ះបន្ទាត់ EMA
            (Dynamic S/R) មុននឹងបន្តទិស
          </>
        }
      >
        <svg viewBox="0 0 700 210">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">EMA CROSS ABOVE SMA — BULLISH</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">EMA CROSS BELOW SMA — BEARISH</text>
          <line x1="350" y1="10" x2="350" y2="205" stroke="#2A2A35" strokeWidth="1" />

          <path d="M20,120 C100,132 200,126 330,108" fill="none" stroke="#6FA8FF" strokeWidth="1.6" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="30" y="132" fontSize="9" fill="#6FA8FF" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>SMA</text>
          <path d="M20,152 C80,142 130,124 152,121 C220,92 280,72 330,55" fill="none" stroke="#3EC97A" strokeWidth="2" className="ac" style={{ animationDelay: '.25s' }} />
          <text x="30" y="165" fontSize="9" fill="#3EC97A" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>EMA</text>
          <circle cx="152" cy="121" r="4.5" fill="#0C0C0F" stroke="#3EC97A" strokeWidth="2" className="ac" style={{ animationDelay: '.4s' }} />
          <text x="152" y="140" textAnchor="middle" fontSize="10" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Cross ↑</text>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="260" y1="60" x2="260" y2="95" stroke="#3EC97A" strokeWidth="1.3" /><rect x="254" y="66" width="12" height="22" rx="1" fill="#3EC97A" /></g>
          <text x="260" y="108" textAnchor="middle" fontSize="9" fill="#6FA8FF" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.6s' }}>Retest EMA</text>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="300" y1="35" x2="300" y2="65" stroke="#3EC97A" strokeWidth="1.3" /><rect x="294" y="38" width="12" height="20" rx="1" fill="#3EC97A" /></g>

          <path d="M370,90 C450,84 550,90 680,102" fill="none" stroke="#6FA8FF" strokeWidth="1.6" className="ac" style={{ animationDelay: '.1s' }} />
          <text x="380" y="80" fontSize="9" fill="#6FA8FF" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>SMA</text>
          <path d="M370,60 C420,70 470,88 500,90 C560,120 620,142 680,158" fill="none" stroke="#E05555" strokeWidth="2" className="ac" style={{ animationDelay: '.25s' }} />
          <text x="380" y="52" fontSize="9" fill="#E05555" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.3s' }}>EMA</text>
          <circle cx="500" cy="90" r="4.5" fill="#0C0C0F" stroke="#E05555" strokeWidth="2" className="ac" style={{ animationDelay: '.4s' }} />
          <text x="500" y="75" textAnchor="middle" fontSize="10" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.45s' }}>Cross ↓</text>
          <g className="ac" style={{ animationDelay: '.55s' }}><line x1="600" y1="118" x2="600" y2="148" stroke="#E05555" strokeWidth="1.3" /><rect x="594" y="122" width="12" height="20" rx="1" fill="#E05555" /></g>
          <text x="600" y="160" textAnchor="middle" fontSize="9" fill="#6FA8FF" fontFamily="Kantumruy Pro,sans-serif" className="ac" style={{ animationDelay: '.6s' }}>Retest EMA</text>
          <g className="ac" style={{ animationDelay: '.65s' }}><line x1="640" y1="148" x2="640" y2="178" stroke="#E05555" strokeWidth="1.3" /><rect x="634" y="152" width="12" height="20" rx="1" fill="#E05555" /></g>
        </svg>
      </AnimatedFig>

      <Quiz
        question="EMA100 Cross ចុះក្រោម SMA100 (រយៈពេលដូចគ្នា) — សញ្ញាអ្វី?"
        options={[
          { label: 'Momentum Shift Bullish', type: 'no' },
          { label: 'Momentum Shift Bearish សម្រាប់ Layer 100', type: 'ok' },
          { label: 'Liquidity Sweep', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! EMA Cross ចុះក្រោម SMA រយៈពេលដូចគ្នា = Momentum Shift Bearish សម្រាប់ Layer នោះ។',
          no: '✗ Cross ចុះក្រោមមានន័យថា Momentum ចាប់ផ្ដើមខ្សោយទៅ Bearish មិនមែន Bullish ឬ Liquidity Sweep ទេ។',
        }}
      />

      <h3>
        <span className="bar"></span>៣. EMA/SMA ជា Dynamic Support/Resistance
      </h3>
      <Box variant="b">
        <p>
          ក្នុង Trend ខ្លាំង Price ច្រើនតែ <strong>Pullback មកប៉ះ EMA ឬ SMA</strong> មុននឹង React បន្តទិស Trend —
          ស្រដៀងគ្នានឹង Retest លើ Order Block (មេរៀនទី ៣) ដែរ ប៉ុន្តែ EMA/SMA ជា Zone ដែល{' '}
          <strong>ផ្លាស់ទីរាល់ថ្ងៃ</strong> មិនថេរដូច OB ទេ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>៤. របៀបប្រើ EMA + SMA ជាជំហានៗ
      </h3>
      <Steps
        items={[
          'បន្ថែម EMA និង SMA រយៈពេលដូចគ្នាទាំង ៣ ស្រទាប់ — 50, 100, 200 លើ Chart',
          'ពិនិត្យរាល់ Layer ថា EMA នៅលើ ឬក្រោម SMA របស់វា — កំណត់ Momentum នីមួយៗ',
          <>
            ប្រៀបធៀបជាមួយ <strong>Market Structure</strong> (មេរៀនទី ១) ដើម្បីមើលថា Layer ទាំង ៣ ស្របនឹង Structure ដែរឬអត់ ។
          </>,
          'បើ Layer ខ្លះស្រប ខ្លះមិនទាន់ស្រប — ចាត់ទុកជា Transition មិនមែន Full Reversal ភ្លាមៗ',
          'រង់ចាំ Price Pullback មកប៉ះ EMA/SMA ហើយ React ជា Dynamic Support/Resistance មុន Entry',
        ]}
      />

      <Quiz
        question="EMA50 Cross ឡើងលើ SMA50 រួច ប៉ុន្តែ EMA200 នៅតែក្រោម SMA200 — គួរបកស្រាយយ៉ាងណា?"
        options={[
          { label: 'Trend ធំបាន Reverse ភ្លាមៗ 100%', type: 'no' },
          { label: 'Momentum រយៈពេលខ្លីចាប់ផ្ដើមប្ដូរ ប៉ុន្តែ Trend ធំមិនទាន់ Confirm — ត្រូវប្រុងប្រយ័ត្ន', type: 'ok' },
          { label: 'មិនសំខាន់ទាល់តែសោះ', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Layer ខ្លីៗអាចប្ដូរមុន Layer ធំ — ត្រូវរង់ចាំ Layer ធំ (200) ស្របតាមផង មុននឹងទុកចិត្តពេញលេញ។',
          no: '✗ Layer តែមួយប្ដូរ មិនទាន់មានន័យថា Trend ធំទាំងមូល Reverse ភ្លាមៗទេ — និងវាមានសារៈសំខាន់ក្នុងការតាមដាន Momentum ។',
        }}
      />

      <h3>
        <span className="bar"></span>៥. កំហុសដែល Beginner ជួបញឹកញាប់
      </h3>
      <Box variant="d">
        <ul>
          <li>
            <strong>ប្រើ EMA/SMA ម្នាក់ឯង ដោយគ្មាន Structure</strong> — ជា Filter/Confluence មិនមែន Complete
            Strategy ។
          </li>
          <li>
            <strong>ដាក់បន្ទាត់ច្រើនពេកលើ Chart</strong> — EMA/SMA ច្រើនស្រទាប់ធ្វើឱ្យ Chart ច្របូកច្របល់ លំបាកសម្រេចចិត្ត ។
          </li>
          <li>
            <strong>ឃើញ EMA/SMA Layer តែមួយ Cross ហើយសន្និដ្ឋានថា Trend ធំ Reverse ភ្លាមៗ</strong> — ត្រូវរង់ចាំ
            Layer ធំៗ (ជាពិសេស 200) ស្របតាមផងសិន ។
          </li>
          <li>
            <strong>ចូល Trade រាល់ Cross ភ្លាមៗដោយគ្មាន Confirmation</strong> — Crossover មាន Lag ជួនកាល False
            Signal ក្នុង Market Sideways ។
          </li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">EMA លើ SMA (រយៈពេលដូចគ្នា) = Momentum Bullish · EMA ក្រោម SMA = Momentum Bearish · Layer ធំបញ្ជាក់ Layer តូច</Rule>

      <h3>
        <span className="bar"></span>📝 លំហាត់អនុវត្ត — ត្រៀមខ្លួនសម្រាប់ Course បញ្ចប់
      </h3>
      <Box variant="g">
        <p>
          នេះជាមេរៀនចុងក្រោយនៃ Course — មុននឹងធ្វើ Quiz ចុងក្រោយ សូមព្យាយាមផ្សំចំណេះដឹងទាំង ៦ មេរៀនចូលគ្នាលើ Chart
          ពិតរបស់អ្នក ៖
        </p>
        <Steps
          items={[
            'បន្ថែម EMA50/SMA50, EMA100/SMA100, EMA200/SMA200 លើ Chart',
            'កត់ត្រា Layer នីមួយៗថា EMA នៅលើ ឬក្រោម SMA — Layer ណាខ្លះស្របគ្នា Bullish/Bearish',
            'ប្រៀបធៀបលទ្ធផលនោះជាមួយ Market Structure (មេរៀនទី ១) — ដូចគ្នាដែរឬទេ?',
            'រកមើល Liquidity Sweep (មេរៀនទី ៥) ដែលនាំឱ្យមាន BOS/CHoCH ថ្មី',
            'រកមើល Order Block ឬ FVG ដែលភ្ជាប់ជាមួយចលនានោះ ហើយមើលថា Price Pullback មកប៉ះ EMA/SMA ដែរឬទេ',
            'កត់ត្រា Confluence ទាំងអស់ដែលរកឃើញ — កាន់តែច្រើន កាន់តែគួរឱ្យទុកចិត្ត',
          ]}
        />
      </Box>

      <h3>
        <span className="bar"></span>Quiz — សាកល្បងចំណេះដឹង
      </h3>
      <p>ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីបញ្ចប់ Course — បើឆ្លើយខុស អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់។</p>
      <FinalTest
        questions={FINAL_TEST_QUESTIONS}
        onProgressChange={setGate}
        lockedHint="ត្រូវត្រូវទាំងអស់ដើម្បីបញ្ចប់ Course"
      />
    </LessonLayout>
  );
}
