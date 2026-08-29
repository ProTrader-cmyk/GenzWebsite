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
      nextLabel={gate.unlocked ? '✓ បញ្ចប់មេរៀន' : `🔒 បញ្ចប់មេរៀន (${gate.passed}/${gate.total})`}
      nextDisabled={!gate.unlocked}
    >
      <p>
        <strong>FVG (Fair Value Gap)</strong> គឺជា <strong>Imbalance</strong> ដែលអាចមើលឃើញតាមរយៈ Pattern នៃ{' '}
        <strong>3 Candles</strong>។ នៅពេល Price move ខ្លាំង មានតំបន់មួយដែលការជួញដូររវាង Wick របស់ Candle ទី 1 និង
        Candle ទី 3 មិន overlap គ្នា។ Trader ប្រើតំបន់នេះដើម្បីសិក្សាថា Price អាចត្រឡប់មក Fill ឬ React នៅទីនោះ។
      </p>

      <Box variant="g">
        <p>
          <strong>🧠 គិតឲ្យងាយ ៖</strong> ស្រមៃថា Price ដូចជាមនុស្សដើររហ័សពេក រហូតលោត <strong>រំលងជណ្ដើរខ្លះ</strong>{' '}
          (Candle ២ ដែលនៅចន្លោះ ១ និង ៣) ។ ចន្លោះដែលលោតរំលងនោះហៅថា <strong>Imbalance</strong> — ជាតំបន់ដែល
          "មិនទាន់មានការជួញដូរស្មើគ្នា" ហើយពេលខ្លះ Price នឹងវិលត្រឡប់មកបំពេញ (Fill) ចន្លោះនោះនៅពេលក្រោយ។
        </p>
      </Box>

      <h3>
        <span className="bar"></span>ពាក្យគន្លឹះត្រូវចាំមុនចូលមេរៀន
      </h3>
      <div className="g2">
        <GridItem labelColor="var(--gold)" label="Imbalance">
          តំបន់ Price ដែលមិនមាន Buyer/Seller ស្មើគ្នាគ្រប់គ្រាន់ (ព្រោះ Price រុញលឿនពេក) — FVG ជាវិធីមួយសម្គាល់តំបន់នេះ ។
        </GridItem>
        <GridItem labelColor="var(--gold)" label="Fill">
          ពេល Price ត្រឡប់មកដើរកាត់ (ឬពេញ) តំបន់ FVG ម្ដងទៀត — Fill មិនមែនន័យថា Price ត្រូវឈប់ត្រង់នោះទេ វាគ្រាន់តែជាព្រឹត្តិការណ៍មួយ ។
        </GridItem>
      </div>

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
        <GridItem labelColor="var(--up)" label="Bullish FVG ⬆" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle 1 High {'<'} Candle 3 Low → មានចន្លោះ (Gap/Imbalance) នៅចន្លោះទាំងពីរនេះ ។
        </GridItem>
        <GridItem label="គួរសង្កេតអ្វី" valStyle={{ marginTop: 6, fontSize: 13 }}>
          បើ Price ត្រឡប់ចូលទៅក្នុង FVG វិញ សូមសង្កេត Reaction និង Structure ជុំវិញ — កុំសន្និដ្ឋានថា Buy ដោយស្វ័យប្រវត្តិ ។
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
        <GridItem labelColor="var(--dn)" label="Bearish FVG ⬇" valStyle={{ marginTop: 6, fontSize: 13 }}>
          Candle 1 Low {'>'} Candle 3 High → មានចន្លោះ (Gap/Imbalance) នៅចន្លោះទាំងពីរនេះ ។
        </GridItem>
        <GridItem label="ចំណុចសំខាន់" valStyle={{ marginTop: 6, fontSize: 13 }}>
          ការត្រឡប់មកកាន់ Gap អាចប្រាប់ព័ត៌មានអំពី Price Reaction ប៉ុន្តែមិនមែនជា Guarantee ថានឹង Reverse ឬអាច Entry
          បានទេ — ត្រូវរង់ចាំ Confirmation ។
        </GridItem>
      </div>

      <AnimatedFig
        caption={
          <>
            ខាងឆ្វេង៖ Low របស់ Candle 3 <strong style={{ color: '#3EC97A' }}>ខ្ពស់ជាង</strong> High របស់ Candle 1 =
            Bullish FVG · ខាងស្ដាំ៖ High របស់ Candle 3 <strong style={{ color: '#E05555' }}>ទាបជាង</strong> Low
            របស់ Candle 1 = Bearish FVG — តំបន់ចាំង (Shaded) ជា Gap Zone
          </>
        }
      >
        <svg viewBox="0 0 700 200">
          <text x="175" y="16" textAnchor="middle" fontSize="12" fill="#3EC97A" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BULLISH FVG</text>
          <text x="525" y="16" textAnchor="middle" fontSize="12" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif">BEARISH FVG</text>
          <line x1="350" y1="10" x2="350" y2="195" stroke="#2A2A35" strokeWidth="1" />

          <rect x="45" y="55" width="130" height="45" fill="rgba(46,124,246,0.14)" stroke="#5B9BD5" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="110" y="50" textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>FVG ZONE</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="60" y1="90" x2="60" y2="140" stroke="#3EC97A" strokeWidth="1.4" /><rect x="54" y="98" width="12" height="30" rx="1" fill="#3EC97A" /></g>
          <text x="60" y="155" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Candle 1</text>
          <text x="35" y="94" textAnchor="end" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>High</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="115" y1="45" x2="115" y2="105" stroke="#3EC97A" strokeWidth="1.6" /><rect x="107" y="52" width="16" height="48" rx="1" fill="#3EC97A" /></g>
          <text x="115" y="120" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>Candle 2</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="170" y1="20" x2="170" y2="60" stroke="#3EC97A" strokeWidth="1.4" /><rect x="164" y="25" width="12" height="28" rx="1" fill="#3EC97A" /></g>
          <text x="170" y="72" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Candle 3</text>
          <text x="192" y="58" textAnchor="start" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Low</text>

          <rect x="395" y="95" width="130" height="45" fill="rgba(224,85,85,0.14)" stroke="#E05555" strokeWidth="1" strokeDasharray="4 3" rx="3" className="ac" style={{ animationDelay: '.3s' }} />
          <text x="460" y="153" textAnchor="middle" fontSize="9" fill="#E05555" fontWeight="700" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>FVG ZONE</text>

          <g className="ac" style={{ animationDelay: '.1s' }}><line x1="410" y1="55" x2="410" y2="100" stroke="#E05555" strokeWidth="1.4" /><rect x="404" y="60" width="12" height="30" rx="1" fill="#E05555" /></g>
          <text x="410" y="45" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Candle 1</text>
          <text x="385" y="102" textAnchor="end" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.15s' }}>Low</text>

          <g className="ac" style={{ animationDelay: '.2s' }}><line x1="465" y1="90" x2="465" y2="150" stroke="#E05555" strokeWidth="1.6" /><rect x="457" y="98" width="16" height="48" rx="1" fill="#E05555" /></g>
          <text x="465" y="165" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.25s' }}>Candle 2</text>

          <g className="ac" style={{ animationDelay: '.3s' }}><line x1="520" y1="135" x2="520" y2="175" stroke="#E05555" strokeWidth="1.4" /><rect x="514" y="140" width="12" height="28" rx="1" fill="#E05555" /></g>
          <text x="520" y="190" textAnchor="middle" fontSize="9" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>Candle 3</text>
          <text x="542" y="138" textAnchor="start" fontSize="8" fill="#7A7870" fontFamily="Space Grotesk,sans-serif" className="ac" style={{ animationDelay: '.35s' }}>High</text>
        </svg>
      </AnimatedFig>

      <Quiz
        question="Candle 1 High = 2,000 · Candle 3 Low = 2,010 (Gold XAUUSD) — តើនេះជា FVG ប្រភេទណា?"
        options={[
          { label: 'Bullish FVG', type: 'ok' },
          { label: 'Bearish FVG', type: 'no' },
          { label: 'មិនមែន FVG ទេ', type: 'no' },
        ]}
        feedback={{
          ok: '✓ ត្រឹមត្រូវ! Candle 3 Low (2,010) ខ្ពស់ជាង Candle 1 High (2,000) = Bullish FVG។',
          no: '✗ Candle 3 Low ខ្ពស់ជាង Candle 1 High = Bullish FVG (មិនមែន Bearish ឬអត់មាន Gap ទេ)។',
        }}
      />

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
          <li>
            <strong>ឃើញ Gap តូចៗគ្រប់កន្លែង ហើយហៅថា FVG ដោយមិនពិនិត្យ 3-Candle Structure</strong> — ត្រូវផ្ទៀងផ្ទាត់
            Wick របស់ Candle 1 និង 3 ថាពិតជាមិន Overlap មែន មិនមែនគ្រាន់តែមើលដោយភ្នែក។
          </li>
          <li>
            <strong>គិតថា FVG ត្រូវ Fill 100% រាល់ពេល</strong> — FVG ជាច្រើនអាចមិនត្រូវបាន Fill ភ្លាមៗ ឬមិន Fill ទាំង
            ស្រុងក៏មាន Price អាចបន្តទៅមុខដោយមិនវិលមកវិញ។
          </li>
          <li>
            <strong>ចូល Trade ដោយគ្មាន Structure និង Confirmation</strong> — FVG តែឯង មិនគ្រប់គ្រាន់ជា Signal ត្រូវ
            ផ្សំជាមួយ Market Structure និង Order Block ។
          </li>
          <li>
            <strong>ប្រើ FVG ដាច់ដោយឡែកពី Market Context</strong> — FVG ក្នុងទិស Trend មានតម្លៃខ្ពស់ជាង FVG ដែលផ្ទុយ
            ពី Trend ធំ។
          </li>
        </ul>
      </Box>
      <Rule title="ច្បាប់ងាយចាំ">3 Candles → Find Imbalance → Mark FVG → Check Context → Wait for Reaction</Rule>

      <h3>
        <span className="bar"></span>📝 លំហាត់អនុវត្ត
      </h3>
      <Box variant="g">
        <p>
          មុននឹងធ្វើ Quiz ខាងក្រោម សូមព្យាយាមផ្សំចំណេះដឹងទាំង ៤ មេរៀនចូលគ្នាលើ Chart ពិតរបស់អ្នក ៖
        </p>
        <Steps
          items={[
            'កំណត់ Market Structure (មេរៀនទី ១) — Bullish, Bearish ឬ Sideways',
            'រកមើល BOS/CHoCH (មេរៀនទី ២) ថ្មីៗនៅលើ Chart',
            'រកមើល Order Block (មេរៀនទី ៣) ដែលភ្ជាប់ជាមួយ Displacement នោះ',
            'រកមើល FVG ដែលកើតឡើងក្នុងចលនាដដែល — សង្កេតថាតើវាស្ថិតក្នុង/ជិត Order Block ដែរឬអត់',
            'កត់ត្រា Zone ទាំងអស់ ហើយប្រៀបធៀបជាមួយវីដេអូក្នុងមេរៀន ដើម្បីត្រួតពិនិត្យខ្លួនឯង',
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
