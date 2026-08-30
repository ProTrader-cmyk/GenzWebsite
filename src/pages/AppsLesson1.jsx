import { useState } from 'react';
import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import GridItem from '../components/ui/GridItem.jsx';
import Rule from '../components/ui/Rule.jsx';
import Steps from '../components/ui/Steps.jsx';
import Quiz from '../components/ui/Quiz.jsx';
import FinalTest from '../components/ui/FinalTest.jsx';
import { getAppsLessonMeta } from '../data/appsLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const meta = getAppsLessonMeta('a1');

// Platform terms (MT5, Buy/Sell, SL/TP, Lot, Buy Limit/Stop, etc.) stay in
// English in every language — that's what the actual MT5 buttons/fields are
// labeled, regardless of the trader's own language.
const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>MT5 (MetaTrader 5)</strong> ជា Platform ដែល Trader ភាគច្រើនប្រើសម្រាប់ធ្វើការជួញដូរ Forex, Gold
        និង Crypto ។ មុននឹងចាប់ផ្តើម Trade ពិត ត្រូវចេះប្រើមុខងារមូលដ្ឋានទាំងអស់ក្នុង MT5 ជាមុនសិន —
        ចាប់ពីការបើកគណនី រហូតដល់ការដាក់ Order ប្រភេទផ្សេងៗ ។
      </>
    ),
    h1: '១. Demo Account និង Real Account',
    demoRealIntro: 'MT5 មានគណនី ២ ប្រភេទ សូមកុំច្រឡំគ្នា ៖',
    demoLabel: 'Demo Account',
    demoBody: 'គណនីសាកល្បង ប្រើប្រាក់និម្មិត (Virtual Money) — សម្រាប់អនុវត្ត Strategy ដោយគ្មានហានិភ័យ។ គួរប្រើ Demo ជានិច្ចមុននឹងទៅ Real ។',
    realLabel: 'Real Account (Live Account)',
    realBody: 'គណនីពិត ប្រើប្រាក់ពិត — លទ្ធផល Trade មានឥទ្ធិពលលើលុយពិតរបស់អ្នក ។ គួរប្រើតែពេលមាន Strategy ដែលបានសាកល្បងច្បាស់លាស់រួច ។',
    demoRealSteps: [
      'បើក MT5 → File → Open an Account',
      'ជ្រើសរើស Broker របស់អ្នក',
      'ជ្រើសរើសប្រភេទគណនី Demo ឬ Real',
      'បំពេញព័ត៌មាន រួច Login ចូលគណនីនោះ',
    ],
    ruleDemo: 'កុំប្រញាប់ទៅ Real Account មុនពេលអ្នកមានទំនុកចិត្តលើ Strategy របស់អ្នកនៅលើ Demo ជាមុនសិន',
    h2: '២. Buy Execute និង Sell Execute',
    executeBox: (
      <p>
        <strong>Market Execution</strong> មានន័យថា Order របស់អ្នកនឹងបើកភ្លាមៗតាមតម្លៃទីផ្សារបច្ចុប្បន្ន —
        ចុច <strong>Buy</strong> (ប៊ូតុងខៀវ) ដើម្បីទិញតាមតម្លៃ Ask បច្ចុប្បន្ន ឬចុច <strong>Sell</strong> (ប៊ូតុងក្រហម)
        ដើម្បីលក់តាមតម្លៃ Bid បច្ចុប្បន្ន — គ្មានការរង់ចាំទេ Order ចូលភ្លាមៗ ។
      </p>
    ),
    executeSteps: [
      'ចុច F9 ឬ New Order ដើម្បីបើកបង្អួច Order',
      'ជ្រើសរើស Symbol ដែលចង់ Trade (ឧ. XAUUSD)',
      'កំណត់ Volume (Lot Size) ដែលចង់ចូល',
      'ចុច Buy ដើម្បីទិញភ្លាមៗ ឬ Sell ដើម្បីលក់ភ្លាមៗ',
    ],
    quiz1: {
      question: 'ពេលចុច Buy Market Execution តើ Order នឹងបើកតាមតម្លៃណា?',
      options: [
        { label: 'តម្លៃណាមួយដែលអ្នកចង់', type: 'no' },
        { label: 'តម្លៃ Ask បច្ចុប្បន្នភ្លាមៗ', type: 'ok' },
        { label: 'តម្លៃទាបបំផុតក្នុងមួយថ្ងៃ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Market Execution ចូល Order ភ្លាមៗតាមតម្លៃទីផ្សារបច្ចុប្បន្ន (Ask សម្រាប់ Buy)។',
        no: '✗ Market Execution ចូល Order ភ្លាមៗតាមតម្លៃ Ask បច្ចុប្បន្ន មិនមែនតម្លៃណាមួយឬតម្លៃទាបបំផុតទេ។',
      },
    },
    h3: '៣. របៀបដាក់ SL និង TP',
    sltpBox: (
      <p>
        <strong>SL (Stop Loss)</strong> ជាកម្រិតតម្លៃដែល Order នឹងបិទដោយស្វ័យប្រវត្តិ ដើម្បីកំណត់ការខាតបង់ —{' '}
        <strong>TP (Take Profit)</strong> ជាកម្រិតតម្លៃដែល Order នឹងបិទដោយស្វ័យប្រវត្តិ ដើម្បីចាក់សោប្រាក់ចំណេញ ។
        ទាំង ២ សុទ្ធតែសំខាន់ណាស់ — កុំ Trade ដោយគ្មាន SL ជាដាច់ខាត ។
      </p>
    ),
    sltpSteps: [
      'នៅពេលបើក Order (F9) — បំពេញកម្រិត SL និង TP ក្នុងប្រអប់ Stop Loss / Take Profit មុននឹងចុច Buy/Sell',
      'ឬបើ Order បើករួចហើយ — ចុចខាងស្តាំលើ Position → Modify or Delete Order → បំពេញ SL/TP → Modify',
      'តែងតែផ្ទៀងផ្ទាត់ SL/TP ម្តងទៀតបន្ទាប់ពី Order ចូល',
    ],
    ruleSltp: 'SL ការពារពីការខាតបង់ធំពេក · TP ចាក់សោប្រាក់ចំណេញដោយស្វ័យប្រវត្តិ — កុំភ្លេចដាក់ SL រាល់ពេល Trade',
    h4: '៤. Lot Size',
    lotIntro: (
      <>
        <strong>Lot</strong> ជាឯកតាកំណត់ទំហំ Position របស់អ្នក — Lot កាន់តែធំ ចំណេញ/ខាតបង់ក្នុងមួយ Pip កាន់តែច្រើន ។
      </>
    ),
    lotStandardLabel: 'Standard Lot',
    lotStandardBody: '1.00 Lot',
    lotMiniLabel: 'Mini Lot',
    lotMiniBody: '0.10 Lot',
    lotMicroLabel: 'Micro Lot',
    lotMicroBody: '0.01 Lot',
    goldBoxTitle: '💡 ឧទាហរណ៍សម្រាប់ Gold (XAUUSD)',
    goldBox: (
      <p>
        1.00 Lot លើ XAUUSD ស្មើនឹង <strong>100 oz មាស</strong> ។ នេះមានន័យថា ពេលតម្លៃមាសផ្លាស់ប្តូរ $1.00 —
        1.00 Lot នឹងចំណេញ/ខាតបង់ប្រហែល <strong>$100</strong> ។ បើប្រើ <strong>0.01 Lot</strong> (Micro Lot)
        តម្លៃមាសផ្លាស់ប្តូរ $1.00 នឹងស្មើនឹងប្រហែល <strong>$1</strong> ប៉ុណ្ណោះ — សមស្របសម្រាប់អ្នកចាប់ផ្តើម ។{' '}
        <em>(តម្លៃពិតប្រាកដអាចប្រែប្រួលបន្តិចអាស្រ័យលើ Broker របស់អ្នក — សូមពិនិត្យ Contract Specification ជានិច្ច)</em> ។
      </p>
    ),
    ruleLot: 'Lot Size ធំពេក = ហានិភ័យធំពេក — Beginner គួរចាប់ផ្តើមពី Micro Lot (0.01) ជាមុនសិន រហូតទាល់តែមានទំនុកចិត្ត',
    h5: '៥. Buy Limit / Sell Limit — របៀបកំណត់ SL TP',
    limitBox: (
      <p>
        <strong>Buy Limit / Sell Limit</strong> ជា Pending Order ដែលនឹងចូល Trade នៅពេល Price ត្រឡប់មកដល់កម្រិត
        តម្លៃ<strong>ប្រសើរជាង</strong>តម្លៃបច្ចុប្បន្ន — Buy Limit ដាក់ <strong>ក្រោម</strong> តម្លៃបច្ចុប្បន្ន
        (រង់ចាំ Pullback ចុះមកទិញថោក) · Sell Limit ដាក់ <strong>លើ</strong> តម្លៃបច្ចុប្បន្ន (រង់ចាំ Pullback
        ឡើងលើទៅលក់ថ្លៃ) ។ ប្រើសម្រាប់រង់ចាំ Price ត្រឡប់មក Zone សំខាន់ (ឧ. Order Block ពីមេរៀន Technical) ។
      </p>
    ),
    limitSteps: [
      'ចុច F9 → New Order → ជ្រើសរើស Type: Pending Order',
      'ជ្រើសរើស Buy Limit ឬ Sell Limit',
      'កំណត់តម្លៃ Entry ដែលចង់ចូល (Price) បូក SL/TP',
      'ចុច Place ដើម្បីដាក់ Order — វានឹងរង់ចាំ Price មកដល់កម្រិតនោះទើបចូល',
    ],
    h6: '៦. Buy Stop និង Sell Stop',
    stopBox: (
      <p>
        <strong>Buy Stop / Sell Stop</strong> ជា Pending Order ដែលនឹងចូល Trade នៅពេល Price{' '}
        <strong>ទម្លុះ</strong> កម្រិតតម្លៃមួយ — Buy Stop ដាក់ <strong>លើ</strong> តម្លៃបច្ចុប្បន្ន (ចូល Buy
        ពេល Price ទម្លុះឡើងលើ) · Sell Stop ដាក់ <strong>ក្រោម</strong> តម្លៃបច្ចុប្បន្ន (ចូល Sell ពេល Price
        ទម្លុះចុះក្រោម) ។ ប្រើសម្រាប់ Trade តាម Breakout (ឧ. BOS ពីមេរៀន Technical) ។
      </p>
    ),
    stopBuyLabel: 'Buy Stop',
    stopBuyBody: 'ដាក់លើតម្លៃបច្ចុប្បន្ន → ចូល Buy ពេល Price ទម្លុះឡើងលើកម្រិតនោះ',
    stopSellLabel: 'Sell Stop',
    stopSellBody: 'ដាក់ក្រោមតម្លៃបច្ចុប្បន្ន → ចូល Sell ពេល Price ទម្លុះចុះក្រោមកម្រិតនោះ',
    quiz2: {
      question: 'តើ Buy Limit ត្រូវដាក់នៅត្រង់ណា ធៀបនឹងតម្លៃបច្ចុប្បន្ន?',
      options: [
        { label: 'លើតម្លៃបច្ចុប្បន្ន', type: 'no' },
        { label: 'ក្រោមតម្លៃបច្ចុប្បន្ន', type: 'ok' },
        { label: 'ត្រង់តម្លៃបច្ចុប្បន្នបេះបិទ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! Buy Limit ដាក់ក្រោមតម្លៃបច្ចុប្បន្ន ដើម្បីរង់ចាំទិញនៅតម្លៃថោកជាង។',
        no: '✗ Buy Limit ត្រូវដាក់ក្រោមតម្លៃបច្ចុប្បន្ន (រង់ចាំ Pullback) មិនមែនលើទេ — នោះជា Buy Stop ។',
      },
    },
    practiceHeading: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'បើក MT5 Demo Account របស់អ្នក រួចសាកល្បង ៖',
    practiceSteps: [
      'បើក Order ដោយ Market Execution មួយលើ Demo (កំណត់ SL/TP ផង)',
      'លុប Order នោះចោល រួចសាកល្បងដាក់ Buy Limit ឬ Sell Limit វិញ',
      'សាកល្បងផ្លាស់ប្តូរ Lot Size ហើយសង្កេតមើលថា ចំណេញ/ខាតបង់ក្នុងមួយ Pip ប្តូរដូចម្តេច',
    ],
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៥ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'តើគួរប្រើគណនីប្រភេទណាមុនគេ សម្រាប់អ្នកចាប់ផ្តើម?',
        options: [
          { label: 'Real Account', correct: false },
          { label: 'Demo Account', correct: true },
          { label: 'ប្រភេទណាក៏បាន', correct: false },
        ],
      },
      {
        question: 'Market Execution ចូល Order តាមរបៀបណា?',
        options: [
          { label: 'ភ្លាមៗតាមតម្លៃទីផ្សារបច្ចុប្បន្ន', correct: true },
          { label: 'រង់ចាំ Price មកដល់កម្រិតកំណត់ជាមុន', correct: false },
          { label: 'រង់ចាំ Broker អនុម័ត', correct: false },
        ],
      },
      {
        question: '1.00 Lot លើ XAUUSD ស្មើនឹងទំហំប៉ុន្មាន?',
        options: [
          { label: '10 oz', correct: false },
          { label: '100 oz', correct: true },
          { label: '1000 oz', correct: false },
        ],
      },
      {
        question: 'Sell Limit ត្រូវដាក់នៅត្រង់ណា ធៀបនឹងតម្លៃបច្ចុប្បន្ន?',
        options: [
          { label: 'លើតម្លៃបច្ចុប្បន្ន', correct: true },
          { label: 'ក្រោមតម្លៃបច្ចុប្បន្ន', correct: false },
          { label: 'ត្រង់តម្លៃបច្ចុប្បន្នបេះបិទ', correct: false },
        ],
      },
      {
        question: 'Buy Stop ត្រូវប្រើនៅពេលណា?',
        options: [
          { label: 'ចង់ចូល Buy ពេល Price ទម្លុះឡើងលើកម្រិតមួយ (Breakout)', correct: true },
          { label: 'ចង់ចូល Buy ភ្លាមៗឥឡូវនេះ', correct: false },
          { label: 'ចង់លុប Order ចោល', correct: false },
        ],
      },
    ],
  },
  en: {
    feedbackOk: '✓ Correct!',
    feedbackNo: '✗ Not quite — try again.',
    finishLocked: (p, t) => `🔒 Finish lesson (${p}/${t})`,
    finishUnlocked: '✓ Finish lesson',
    intro: (
      <>
        <strong>MT5 (MetaTrader 5)</strong> is the platform most traders use to trade Forex, Gold, and Crypto.
        Before placing any real trades, you need to know every basic function in MT5 — from opening an
        account to placing the different types of orders.
      </>
    ),
    h1: '1. Demo Account and Real Account',
    demoRealIntro: 'MT5 has 2 types of accounts — don\'t mix them up:',
    demoLabel: 'Demo Account',
    demoBody: 'A practice account using virtual money — for testing a strategy with zero risk. Always use Demo before going to Real.',
    realLabel: 'Real Account (Live Account)',
    realBody: 'A real account using real money — trade results affect your actual money. Only use it once you have a strategy that\'s been properly tested.',
    demoRealSteps: [
      'Open MT5 → File → Open an Account',
      'Select your Broker',
      'Choose account type: Demo or Real',
      'Fill in your details, then log in to that account',
    ],
    ruleDemo: "Don't rush to a Real Account before you're confident in your strategy on Demo first",
    h2: '2. Buy Execute and Sell Execute',
    executeBox: (
      <p>
        <strong>Market Execution</strong> means your order opens immediately at the current market price —
        click <strong>Buy</strong> (blue button) to buy at the current Ask price, or click{' '}
        <strong>Sell</strong> (red button) to sell at the current Bid price — no waiting, the order enters
        instantly.
      </p>
    ),
    executeSteps: [
      'Press F9 or New Order to open the order window',
      'Select the Symbol you want to trade (e.g. XAUUSD)',
      'Set the Volume (Lot Size) you want to enter',
      'Click Buy to buy instantly, or Sell to sell instantly',
    ],
    quiz1: {
      question: 'When you click Buy on Market Execution, what price does the order open at?',
      options: [
        { label: 'Any price you want', type: 'no' },
        { label: "The current Ask price, instantly", type: 'ok' },
        { label: "The lowest price of the day", type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Market Execution enters instantly at the current market price (Ask, for a Buy).',
        no: '✗ Market Execution enters instantly at the current Ask price — not any price you pick or the lowest of the day.',
      },
    },
    h3: '3. How to Set SL and TP',
    sltpBox: (
      <p>
        <strong>SL (Stop Loss)</strong> is the price level where the order will automatically close to limit
        your loss — <strong>TP (Take Profit)</strong> is the price level where the order will automatically
        close to lock in profit. Both are essential — never trade without an SL.
      </p>
    ),
    sltpSteps: [
      'When opening an order (F9) — fill in the Stop Loss / Take Profit fields before clicking Buy/Sell',
      "Or if the order is already open — right-click the Position → Modify or Delete Order → fill in SL/TP → Modify",
      'Always double-check the SL/TP once more after the order is entered',
    ],
    ruleSltp: 'SL protects you from a large loss · TP locks in profit automatically — never forget to set an SL on every trade',
    h4: '4. Lot Size',
    lotIntro: (
      <>
        <strong>Lot</strong> is the unit that sets your position size — the bigger the lot, the more you
        gain/lose per pip.
      </>
    ),
    lotStandardLabel: 'Standard Lot',
    lotStandardBody: '1.00 Lot',
    lotMiniLabel: 'Mini Lot',
    lotMiniBody: '0.10 Lot',
    lotMicroLabel: 'Micro Lot',
    lotMicroBody: '0.01 Lot',
    goldBoxTitle: '💡 Example for Gold (XAUUSD)',
    goldBox: (
      <p>
        1.00 Lot on XAUUSD equals <strong>100 oz of gold</strong>. That means when gold's price moves
        $1.00 — 1.00 Lot gains/loses about <strong>$100</strong>. If you use <strong>0.01 Lot</strong>{' '}
        (Micro Lot) instead, a $1.00 move only equals about <strong>$1</strong> — a much better fit for
        beginners. <em>(The exact figure can vary slightly by broker — always check your broker's contract
        specification.)</em>
      </p>
    ),
    ruleLot: "Too big a Lot Size = too much risk — beginners should start from Micro Lot (0.01) until they've built confidence",
    h5: '5. Buy Limit / Sell Limit — How to Set SL TP',
    limitBox: (
      <p>
        <strong>Buy Limit / Sell Limit</strong> are pending orders that enter a trade once price comes back to
        a level <strong>better</strong> than the current price — a Buy Limit is placed <strong>below</strong>{' '}
        the current price (waiting for a pullback down to buy cheaper) · a Sell Limit is placed{' '}
        <strong>above</strong> the current price (waiting for a pullback up to sell higher). Used to wait for
        price to return to an important zone (e.g. an Order Block from the Technical lessons).
      </p>
    ),
    limitSteps: [
      'Press F9 → New Order → select Type: Pending Order',
      'Choose Buy Limit or Sell Limit',
      'Set your desired Entry Price, plus SL/TP',
      'Click Place — it will wait for price to reach that level before entering',
    ],
    h6: '6. Buy Stop and Sell Stop',
    stopBox: (
      <p>
        <strong>Buy Stop / Sell Stop</strong> are pending orders that enter a trade once price{' '}
        <strong>breaks</strong> through a level — a Buy Stop is placed <strong>above</strong> the current
        price (enters a Buy when price breaks upward) · a Sell Stop is placed <strong>below</strong> the
        current price (enters a Sell when price breaks downward). Used to trade a Breakout (e.g. a BOS from
        the Technical lessons).
      </p>
    ),
    stopBuyLabel: 'Buy Stop',
    stopBuyBody: 'Placed above the current price → enters a Buy when price breaks above that level',
    stopSellLabel: 'Sell Stop',
    stopSellBody: 'Placed below the current price → enters a Sell when price breaks below that level',
    quiz2: {
      question: 'Where should a Buy Limit be placed, relative to the current price?',
      options: [
        { label: 'Above the current price', type: 'no' },
        { label: 'Below the current price', type: 'ok' },
        { label: 'Exactly at the current price', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! A Buy Limit is placed below the current price to wait to buy cheaper.',
        no: '✗ A Buy Limit is placed below the current price (waiting for a pullback), not above — that would be a Buy Stop.',
      },
    },
    practiceHeading: '📝 Practice Exercise',
    practiceIntro: 'Open your MT5 Demo Account and try this:',
    practiceSteps: [
      'Open a Market Execution order on Demo (set SL/TP too)',
      'Delete that order, then try placing a Buy Limit or Sell Limit instead',
      "Try changing the Lot Size and watch how much the gain/loss per pip changes",
    ],
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You must answer <strong>all 5 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Which account type should a beginner use first?',
        options: [
          { label: 'Real Account', correct: false },
          { label: 'Demo Account', correct: true },
          { label: 'Either one is fine', correct: false },
        ],
      },
      {
        question: 'How does Market Execution enter an order?',
        options: [
          { label: 'Instantly, at the current market price', correct: true },
          { label: 'It waits for price to reach a preset level', correct: false },
          { label: 'It waits for broker approval', correct: false },
        ],
      },
      {
        question: 'What does 1.00 Lot on XAUUSD equal?',
        options: [
          { label: '10 oz', correct: false },
          { label: '100 oz', correct: true },
          { label: '1000 oz', correct: false },
        ],
      },
      {
        question: 'Where should a Sell Limit be placed, relative to the current price?',
        options: [
          { label: 'Above the current price', correct: true },
          { label: 'Below the current price', correct: false },
          { label: 'Exactly at the current price', correct: false },
        ],
      },
      {
        question: 'When should you use a Buy Stop?',
        options: [
          { label: 'When you want to Buy once price breaks above a level (breakout)', correct: true },
          { label: 'When you want to Buy right now, instantly', correct: false },
          { label: 'When you want to delete an order', correct: false },
        ],
      },
    ],
  },
  zh: {
    feedbackOk: '✓ 正确！',
    feedbackNo: '✗ 不正确，请再试一次。',
    finishLocked: (p, t) => `🔒 完成课程 (${p}/${t})`,
    finishUnlocked: '✓ 完成课程',
    intro: (
      <>
        <strong>MT5（MetaTrader 5）</strong>是大多数交易者用来交易 Forex、Gold 和 Crypto 的平台。在开始实盘交易之前，
        必须先掌握 MT5 里的所有基础功能——从开设账户，到下达各种类型的订单。
      </>
    ),
    h1: '1. Demo Account 与 Real Account',
    demoRealIntro: 'MT5 有 2 种账户类型，请不要混淆：',
    demoLabel: 'Demo Account（模拟账户）',
    demoBody: '使用虚拟资金的练习账户——可以零风险测试策略。在使用 Real 账户之前，务必先用 Demo 练习。',
    realLabel: 'Real Account（真实账户）',
    realBody: '使用真实资金的账户——交易结果会直接影响你的真实资金。只有在策略经过充分验证后才应使用。',
    demoRealSteps: [
      '打开 MT5 → File → Open an Account',
      '选择你的 Broker',
      '选择账户类型：Demo 或 Real',
      '填写资料，然后登录该账户',
    ],
    ruleDemo: '在 Demo 上对自己的策略有信心之前，不要急着转到 Real Account',
    h2: '2. Buy Execute 与 Sell Execute',
    executeBox: (
      <p>
        <strong>Market Execution（市价执行）</strong>意味着你的订单会立即以当前市场价格开仓——点击{' '}
        <strong>Buy</strong>（蓝色按钮）以当前 Ask 价格买入，或点击 <strong>Sell</strong>（红色按钮）以当前 Bid
        价格卖出——无需等待，订单立即成交。
      </p>
    ),
    executeSteps: [
      '按 F9 或 New Order 打开下单窗口',
      '选择你想交易的 Symbol（例如 XAUUSD）',
      '设置想要进场的 Volume（Lot Size）',
      '点击 Buy 立即买入，或点击 Sell 立即卖出',
    ],
    quiz1: {
      question: '点击 Market Execution 的 Buy 后，订单会以什么价格开仓？',
      options: [
        { label: '你自己想要的任意价格', type: 'no' },
        { label: '当前的 Ask 价格，立即成交', type: 'ok' },
        { label: '当天的最低价', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Market Execution 会以当前市场价格立即进场（Buy 对应 Ask 价格）。',
        no: '✗ Market Execution 是以当前 Ask 价格立即进场，并非你自选的价格或当天最低价。',
      },
    },
    h3: '3. 如何设置 SL 和 TP',
    sltpBox: (
      <p>
        <strong>SL (Stop Loss)</strong> 是订单会自动平仓以限制亏损的价格水平——<strong>TP (Take Profit)</strong>{' '}
        是订单会自动平仓以锁定利润的价格水平。两者都至关重要——绝不要在没有 SL 的情况下交易。
      </p>
    ),
    sltpSteps: [
      '在开单时（F9）——点击 Buy/Sell 之前先填写 Stop Loss / Take Profit 栏位',
      '若订单已经开仓——右键点击该 Position → Modify or Delete Order → 填写 SL/TP → Modify',
      '订单进场后务必再次确认 SL/TP 是否正确',
    ],
    ruleSltp: 'SL 保护你免受重大亏损 · TP 自动锁定利润——每次交易都不要忘记设置 SL',
    h4: '4. Lot Size（手数）',
    lotIntro: (
      <>
        <strong>Lot</strong> 是决定你仓位大小的单位——Lot 越大，每 Pip 的盈亏也越大。
      </>
    ),
    lotStandardLabel: 'Standard Lot（标准手）',
    lotStandardBody: '1.00 Lot',
    lotMiniLabel: 'Mini Lot（迷你手）',
    lotMiniBody: '0.10 Lot',
    lotMicroLabel: 'Micro Lot（微型手）',
    lotMicroBody: '0.01 Lot',
    goldBoxTitle: '💡 Gold（XAUUSD）示例',
    goldBox: (
      <p>
        XAUUSD 上的 1.00 Lot 等于 <strong>100 盎司黄金</strong>。也就是说，当金价变动 $1.00 时——1.00 Lot
        大约会盈亏 <strong>$100</strong>。如果使用 <strong>0.01 Lot</strong>（Micro Lot），同样 $1.00 的
        价格变动大约只等于 <strong>$1</strong>——更适合初学者。<em>（具体数值可能因 Broker 略有不同——请务必
        查看你的 Broker 的 Contract Specification。）</em>
      </p>
    ),
    ruleLot: 'Lot Size 太大 = 风险太大——初学者应从 Micro Lot（0.01）开始，直到建立足够信心为止',
    h5: '5. Buy Limit / Sell Limit —— 如何设置 SL TP',
    limitBox: (
      <p>
        <strong>Buy Limit / Sell Limit</strong> 是等待价格回到<strong>比当前价格更优</strong>的水平才进场的
        Pending Order——Buy Limit 设置在当前价格<strong>下方</strong>（等待价格回调下来以更低价买入）·
        Sell Limit 设置在当前价格<strong>上方</strong>（等待价格回调上去以更高价卖出）。用于等待价格回到重要
        区域（例如 Technical 课程中的 Order Block）。
      </p>
    ),
    limitSteps: [
      '按 F9 → New Order → 选择 Type: Pending Order',
      '选择 Buy Limit 或 Sell Limit',
      '设置想要进场的 Entry Price，以及 SL/TP',
      '点击 Place —— 系统会等价格到达该水平后才进场',
    ],
    h6: '6. Buy Stop 与 Sell Stop',
    stopBox: (
      <p>
        <strong>Buy Stop / Sell Stop</strong> 是等待价格<strong>突破</strong>某个水平才进场的 Pending
        Order——Buy Stop 设置在当前价格<strong>上方</strong>（价格向上突破时进场 Buy）· Sell Stop 设置在当前
        价格<strong>下方</strong>（价格向下突破时进场 Sell）。用于交易 Breakout（例如 Technical 课程中的
        BOS）。
      </p>
    ),
    stopBuyLabel: 'Buy Stop',
    stopBuyBody: '设置在当前价格上方 → 当价格向上突破该水平时进场 Buy',
    stopSellLabel: 'Sell Stop',
    stopSellBody: '设置在当前价格下方 → 当价格向下突破该水平时进场 Sell',
    quiz2: {
      question: '相对于当前价格，Buy Limit 应该设置在哪里？',
      options: [
        { label: '当前价格上方', type: 'no' },
        { label: '当前价格下方', type: 'ok' },
        { label: '正好在当前价格', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！Buy Limit 设置在当前价格下方，以等待更低价买入。',
        no: '✗ Buy Limit 应设置在当前价格下方（等待回调），而不是上方——那是 Buy Stop。',
      },
    },
    practiceHeading: '📝 实践练习',
    practiceIntro: '打开你的 MT5 Demo Account，尝试以下操作：',
    practiceSteps: [
      '在 Demo 上用 Market Execution 开一笔订单（同时设置 SL/TP）',
      '删除该订单，然后尝试改用 Buy Limit 或 Sell Limit 下单',
      '尝试改变 Lot Size，观察每 Pip 的盈亏如何变化',
    ],
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        必须<strong>全部 5 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: '初学者应该先使用哪种账户类型？',
        options: [
          { label: 'Real Account', correct: false },
          { label: 'Demo Account', correct: true },
          { label: '两种都可以', correct: false },
        ],
      },
      {
        question: 'Market Execution 是如何进场的？',
        options: [
          { label: '立即以当前市场价格进场', correct: true },
          { label: '等待价格到达预设水平', correct: false },
          { label: '等待 Broker 批准', correct: false },
        ],
      },
      {
        question: 'XAUUSD 上的 1.00 Lot 等于多少？',
        options: [
          { label: '10 oz', correct: false },
          { label: '100 oz', correct: true },
          { label: '1000 oz', correct: false },
        ],
      },
      {
        question: '相对于当前价格，Sell Limit 应该设置在哪里？',
        options: [
          { label: '当前价格上方', correct: true },
          { label: '当前价格下方', correct: false },
          { label: '正好在当前价格', correct: false },
        ],
      },
      {
        question: '什么时候应该使用 Buy Stop？',
        options: [
          { label: '想在价格向上突破某水平（breakout）时进场 Buy', correct: true },
          { label: '想现在立即进场 Buy', correct: false },
          { label: '想删除一个订单', correct: false },
        ],
      },
    ],
  },
};

export default function AppsLesson1({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const [gate, setGate] = useState({ passed: 0, total: t.finalTestQuestions.length, unlocked: false });

  const finalTestQuestions = t.finalTestQuestions.map((q) => ({
    ...q,
    feedback: { ok: t.feedbackOk, no: t.feedbackNo },
    options: q.options.map((o) => ({ ...o })),
  }));

  return (
    <LessonLayout
      id="a1"
      track="apps"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={gate.unlocked ? t.finishUnlocked : t.finishLocked(gate.passed, gate.total)}
      nextDisabled={!gate.unlocked}
    >
      <p>{t.intro}</p>

      <h3>
        <span className="bar"></span>
        {t.h1}
      </h3>
      <p>{t.demoRealIntro}</p>
      <div className="g2">
        <GridItem labelColor="var(--blue)" label={t.demoLabel}>
          {t.demoBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.realLabel}>
          {t.realBody}
        </GridItem>
      </div>
      <Steps items={t.demoRealSteps} />
      <Rule title="💡">{t.ruleDemo}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="g">{t.executeBox}</Box>
      <Steps items={t.executeSteps} />

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Box variant="d">{t.sltpBox}</Box>
      <Steps items={t.sltpSteps} />
      <Rule title="💡">{t.ruleSltp}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <p>{t.lotIntro}</p>
      <div className="g3">
        <GridItem labelColor="var(--up)" label={t.lotStandardLabel}>
          {t.lotStandardBody}
        </GridItem>
        <GridItem labelColor="var(--blue)" label={t.lotMiniLabel}>
          {t.lotMiniBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.lotMicroLabel}>
          {t.lotMicroBody}
        </GridItem>
      </div>
      <Box variant="g">
        <p>
          <strong>{t.goldBoxTitle}</strong>
        </p>
        {t.goldBox}
      </Box>
      <Rule title="💡">{t.ruleLot}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h5}
      </h3>
      <Box variant="u">{t.limitBox}</Box>
      <Steps items={t.limitSteps} />

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h6}
      </h3>
      <Box variant="d">{t.stopBox}</Box>
      <div className="g2">
        <GridItem labelColor="var(--up)" label={t.stopBuyLabel}>
          {t.stopBuyBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.stopSellLabel}>
          {t.stopSellBody}
        </GridItem>
      </div>

      <h3>
        <span className="bar"></span>
        {t.practiceHeading}
      </h3>
      <Box variant="g">
        <p>{t.practiceIntro}</p>
        <Steps items={t.practiceSteps} />
      </Box>

      <h3>
        <span className="bar"></span>
        {t.finalTestHeading}
      </h3>
      <p>{t.finalTestIntro}</p>
      <FinalTest questions={finalTestQuestions} onProgressChange={setGate} />
    </LessonLayout>
  );
}
