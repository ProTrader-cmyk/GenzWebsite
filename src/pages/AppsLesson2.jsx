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

const meta = getAppsLessonMeta('a2');

const CONTENT = {
  kh: {
    feedbackOk: '✓ ត្រឹមត្រូវ!',
    feedbackNo: '✗ មិនត្រឹមត្រូវ សូមសាកល្បងម្ដងទៀត។',
    finishLocked: (p, t) => `🔒 បញ្ចប់មេរៀន (${p}/${t})`,
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    intro: (
      <>
        <strong>Forex Factory (forexfactory.com)</strong> ជា Website ឥតគិតថ្លៃ ដែល Trader ភាគច្រើនប្រើដើម្បីតាមដាន{' '}
        <strong>Economic Calendar</strong> — កាលវិភាគព័ត៌មានសេដ្ឋកិច្ចដែលអាចធ្វើឲ្យ Price ផ្លាស់ប្តូរខ្លាំង
        ភ្លាមៗ ។ ក្នុងមេរៀននេះ យើងផ្តោតតែលើផ្នែកសំខាន់បំផុតសម្រាប់ Trader ថ្មី ៖ <strong>Red Folder News</strong>{' '}
        និង <strong>USD</strong> ។
      </>
    ),
    h1: 'តើ Red Folder ជាអ្វី?',
    folderIntro: 'Forex Factory សម្គាល់ព័ត៌មានតាមពណ៌ តាមកម្រិតឥទ្ធិពលលើទីផ្សារ ៖',
    yellowLabel: 'លឿង (Low Impact)',
    yellowBody: 'ព័ត៌មានតូចតាច — ស្ទើរតែគ្មានឥទ្ធិពលលើ Price',
    orangeLabel: 'ទឹកក្រូច (Medium Impact)',
    orangeBody: 'ព័ត៌មានមធ្យម — អាចមានចលនាបន្តិចបន្តួច',
    redLabel: 'ក្រហម (High Impact) ⚠️',
    redBody: 'ព័ត៌មានសំខាន់បំផុត — ធ្វើឲ្យ Price លោតខ្លាំង និងលឿនភ្លាមៗពេលប្រកាស — ត្រូវប្រុងប្រយ័ត្នបំផុត',
    ruleRed: 'តែងតែពិនិត្យ Forex Factory មុន Trade រាល់ថ្ងៃ ដើម្បីដឹងថាមាន Red Folder News ណាខ្លះនៅថ្ងៃនោះ',
    h2: 'ហេតុអ្វីត្រូវផ្តោតលើ USD?',
    usdBox: (
      <p>
        <strong>USD (ដុល្លារអាមេរិក)</strong> ជារូបិយប័ណ្ណមូលដ្ឋានធំបំផុតក្នុងពិភពលោក — ស្ទើរតែគូ Currency
        និង Gold (XAUUSD) ទាំងអស់ដែល Trader ធ្វើការជួញដូរ សុទ្ធតែពាក់ព័ន្ធនឹង USD ដោយផ្ទាល់ ។ ព័ត៌មាន Red
        Folder របស់ USD ដូច្នេះជាព័ត៌មានដែលមានឥទ្ធិពលទូលំទូលាយបំផុតលើទីផ្សារដែលយើង Trade ។
      </p>
    ),
    keyEventsHeading: 'ព័ត៌មាន USD សំខាន់ៗដែលត្រូវចាំ',
    nfpLabel: 'NFP (Non-Farm Payrolls)',
    nfpBody: 'របាយការណ៍ការងារខែៗ — ច្រើនតែធ្វើឲ្យទីផ្សារលោតខ្លាំងបំផុតក្នុងខែ',
    fomcLabel: 'FOMC / Interest Rate Decision',
    fomcBody: 'ការសម្រេចអត្រាការប្រាក់របស់ Fed — ជះឥទ្ធិពលទូទាំង USD Pair និង Gold',
    cpiLabel: 'CPI (Inflation)',
    cpiBody: 'របាយការណ៍អតិផរណា — ជះឥទ្ធិពលលើការសម្រេចចិត្ត Fed ខាងមុខ',
    fedSpeechLabel: 'Fed Chair Speech',
    fedSpeechBody: 'សុន្ទរកថារបស់ប្រធាន Fed — អាចមានពាក្យសំដីដែលធ្វើឲ្យទីផ្សារប្រតិកម្មភ្លាមៗ',
    quiz1: {
      question: 'តើពណ៌ណាលើ Forex Factory តំណាងឲ្យព័ត៌មានដែលមានឥទ្ធិពលខ្លាំងបំផុត?',
      options: [
        { label: 'លឿង', type: 'no' },
        { label: 'ក្រហម', type: 'ok' },
        { label: 'ទឹកក្រូច', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! ក្រហម (Red) តំណាងឲ្យ High Impact News — ធ្វើឲ្យ Price ផ្លាស់ប្តូរខ្លាំងបំផុត។',
        no: '✗ ក្រហម (Red) ទើបជាព័ត៌មានឥទ្ធិពលខ្លាំងបំផុត មិនមែនលឿង ឬទឹកក្រូចទេ។',
      },
    },
    h3: 'របៀបត្រង Filter មើលតែ USD + Red',
    filterSteps: [
      'ចូល forexfactory.com → ចុចផ្ទាំង Calendar',
      'ចុចលើ Filter (រូបតម្រង) នៅជ្រុងខាងលើ',
      'ក្នុង Currency — ជ្រើសរើសតែ USD (ដកគូរូបិយប័ណ្ណផ្សេងចេញ)',
      'ក្នុង Impact — ជ្រើសរើសតែ High (Red)',
      'ចុច Apply — Calendar នឹងបង្ហាញតែ USD Red Folder News ប៉ុណ្ណោះ',
    ],
    h4: 'គន្លឹះសុវត្ថិភាពពេលមាន Red News',
    tip1: (
      <>
        <strong>ជៀសវាង Trade ថ្មី</strong> ប្រហែល ១៥-៣០ នាទី មុននិងក្រោយ Red Folder News — Spread ធំឡើង
        និង Price អាចលោត (Whipsaw) ខ្លាំង
      </>
    ),
    tip2: (
      <>
        <strong>Position ដែលបើករួច</strong> — គិតគូរអំពីការកាត់បន្ថយ Lot Size ឬដកចេញមុនពេលមានព័ត៌មានធំ
        បើមិនទាន់មានបទពិសោធន៍គ្រប់គ្រាន់ក្នុងការ Trade ព័ត៌មាន
      </>
    ),
    tip3: (
      <>
        Trader មានបទពិសោធន៍ខ្លះអាច Trade ដោយផ្ទាល់តាមព័ត៌មាន (News Trading) ប៉ុន្តែសម្រាប់អ្នកចាប់ផ្តើម{' '}
        <strong>គួររង់ចាំរហូតដល់ស្ថានភាពស្ងប់វិញ</strong> ទើប Trade តាម Structure ធម្មតា
      </>
    ),
    quiz2: {
      question: 'តើគួរធ្វើដូចម្ដេចមុននឹង Red Folder News ប្រហែល ១៥-៣០ នាទី?',
      options: [
        { label: 'បើក Position ថ្មីភ្លាមៗឲ្យបានច្រើន', type: 'no' },
        { label: 'ជៀសវាង Trade ថ្មី ព្រោះ Spread ធំ និង Price អាចលោតខ្លាំង', type: 'ok' },
        { label: 'គ្មានអ្វីត្រូវប្រុងប្រយ័ត្នទេ', type: 'no' },
      ],
      feedback: {
        ok: '✓ ត្រឹមត្រូវ! ជិត Red News, Spread ធំឡើង ហើយ Price អាចលោត Whipsaw ខ្លាំង — គួរជៀសវាង Trade ថ្មី។',
        no: '✗ ត្រូវជៀសវាង Trade ថ្មីជិតម៉ោង Red News ព្រោះហានិភ័យខ្ពស់ (Spread ធំ + Whipsaw) ។',
      },
    },
    practiceHeading: '📝 លំហាត់អនុវត្ត',
    practiceIntro: 'បើក forexfactory.com ហើយសាកល្បង ៖',
    practiceSteps: [
      'ត្រង Filter ឲ្យបង្ហាញតែ USD + Red Folder',
      'សម្គាល់ថា តើមាន Red News អ្វីខ្លះនៅសប្តាហ៍នេះ',
      'កត់ត្រាម៉ោង Red News ទាំងនោះទុក ដើម្បីជៀសវាង Trade ជិតម៉ោងនោះ',
    ],
    finalTestHeading: '🔒 តេស្តបញ្ចប់មេរៀន',
    finalTestIntro: (
      <>
        ត្រូវឆ្លើយ<strong>ត្រូវទាំង ៤ សំណួរ</strong> ដើម្បីដោះសោ ហើយបន្តទៅមេរៀនបន្ទាប់បាន — បើឆ្លើយខុស
        អាចសាកល្បងម្ដងទៀតបានគ្មានកំណត់ ។
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Forex Factory ប្រើសម្រាប់អ្វី?',
        options: [
          { label: 'តាមដាន Economic Calendar / ព័ត៌មានសេដ្ឋកិច្ច', correct: true },
          { label: 'គូរ Chart វិភាគបច្ចេកទេស', correct: false },
          { label: 'ដាក់ Order Trade', correct: false },
        ],
      },
      {
        question: 'ពណ៌ណាតំណាងឲ្យ High Impact News?',
        options: [
          { label: 'លឿង', correct: false },
          { label: 'ក្រហម', correct: true },
          { label: 'ស', correct: false },
        ],
      },
      {
        question: 'NFP តំណាងឲ្យអ្វី?',
        options: [
          { label: 'Non-Farm Payrolls — របាយការណ៍ការងារ', correct: true },
          { label: 'National Finance Policy', correct: false },
          { label: 'New Forex Price', correct: false },
        ],
      },
      {
        question: 'ហេតុអ្វីមេរៀននេះផ្តោតលើ USD?',
        options: [
          { label: 'ព្រោះ USD ជាមូលដ្ឋានភាគច្រើននៃគូ Currency និង Gold ដែល Trade', correct: true },
          { label: 'ព្រោះ USD មិនដែលមានព័ត៌មានសំខាន់ទេ', correct: false },
          { label: 'ព្រោះ Forex Factory មិនគាំទ្ររូបិយប័ណ្ណផ្សេង', correct: false },
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
        <strong>Forex Factory (forexfactory.com)</strong> is a free website most traders use to track the{' '}
        <strong>Economic Calendar</strong> — the schedule of economic news that can cause sudden, sharp price
        moves. In this lesson we focus on the part that matters most for a new trader:{' '}
        <strong>Red Folder News</strong> and <strong>USD</strong>.
      </>
    ),
    h1: 'What Is a Red Folder?',
    folderIntro: 'Forex Factory color-codes news by its impact on the market:',
    yellowLabel: 'Yellow (Low Impact)',
    yellowBody: 'Minor news — almost no effect on price',
    orangeLabel: 'Orange (Medium Impact)',
    orangeBody: 'Moderate news — can cause a small move',
    redLabel: 'Red (High Impact) ⚠️',
    redBody: 'The most important news — causes price to spike sharply and fast the moment it\'s released — needs the most caution',
    ruleRed: 'Always check Forex Factory before trading each day to know which Red Folder News is scheduled',
    h2: 'Why Focus on USD?',
    usdBox: (
      <p>
        <strong>USD (US Dollar)</strong> is the biggest base currency in the world — almost every currency
        pair and Gold (XAUUSD) that traders trade is directly tied to USD. USD's Red Folder News therefore
        has the broadest impact on the markets we trade.
      </p>
    ),
    keyEventsHeading: 'Key USD Events to Remember',
    nfpLabel: 'NFP (Non-Farm Payrolls)',
    nfpBody: "The monthly jobs report — usually the biggest market mover of the month",
    fomcLabel: 'FOMC / Interest Rate Decision',
    fomcBody: "The Fed's interest rate decision — affects USD pairs and Gold across the board",
    cpiLabel: 'CPI (Inflation)',
    cpiBody: "The inflation report — influences the Fed's upcoming decisions",
    fedSpeechLabel: 'Fed Chair Speech',
    fedSpeechBody: "The Fed Chair's remarks — can contain wording that causes an instant market reaction",
    quiz1: {
      question: 'Which color on Forex Factory represents the highest-impact news?',
      options: [
        { label: 'Yellow', type: 'no' },
        { label: 'Red', type: 'ok' },
        { label: 'Orange', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Red represents High Impact News — it causes the sharpest price moves.',
        no: '✗ Red is the highest-impact color — not Yellow or Orange.',
      },
    },
    h3: 'How to Filter for USD + Red Only',
    filterSteps: [
      'Go to forexfactory.com → click the Calendar tab',
      'Click the Filter icon at the top',
      'Under Currency — select only USD (uncheck the other currencies)',
      'Under Impact — select only High (Red)',
      'Click Apply — the calendar will now show only USD Red Folder News',
    ],
    h4: 'Safety Tips Around Red News',
    tip1: (
      <>
        <strong>Avoid opening new trades</strong> roughly 15-30 minutes before and after a Red Folder News
        release — spreads widen and price can whipsaw violently
      </>
    ),
    tip2: (
      <>
        <strong>For open positions</strong> — consider reducing lot size or closing before a major release if
        you don't yet have enough experience trading through news
      </>
    ),
    tip3: (
      <>
        Some experienced traders trade the news directly (News Trading), but as a beginner{' '}
        <strong>you should wait until things settle down</strong> before trading normal Structure again
      </>
    ),
    quiz2: {
      question: 'What should you do roughly 15-30 minutes before a Red Folder News release?',
      options: [
        { label: 'Open as many new positions as possible', type: 'no' },
        { label: 'Avoid new trades — spreads widen and price can whipsaw sharply', type: 'ok' },
        { label: 'Nothing needs extra caution', type: 'no' },
      ],
      feedback: {
        ok: '✓ Correct! Close to Red News, spreads widen and price can whipsaw sharply — you should avoid new trades.',
        no: '✗ You should avoid new trades close to Red News time because of the high risk (wide spread + whipsaw).',
      },
    },
    practiceHeading: '📝 Practice Exercise',
    practiceIntro: 'Open forexfactory.com and try this:',
    practiceSteps: [
      'Filter to show only USD + Red Folder',
      'Note which Red News is scheduled this week',
      'Write down the times of that Red News so you can avoid trading close to them',
    ],
    finalTestHeading: '🔒 End-of-Lesson Test',
    finalTestIntro: (
      <>
        You must answer <strong>all 4 questions correctly</strong> to unlock and move on to the next lesson —
        if you answer wrong, you can try again with no limit.
      </>
    ),
    finalTestQuestions: [
      {
        question: 'What is Forex Factory used for?',
        options: [
          { label: 'Tracking the Economic Calendar / economic news', correct: true },
          { label: 'Drawing technical analysis charts', correct: false },
          { label: 'Placing trade orders', correct: false },
        ],
      },
      {
        question: 'Which color represents High Impact News?',
        options: [
          { label: 'Yellow', correct: false },
          { label: 'Red', correct: true },
          { label: 'White', correct: false },
        ],
      },
      {
        question: 'What does NFP stand for?',
        options: [
          { label: 'Non-Farm Payrolls — the jobs report', correct: true },
          { label: 'National Finance Policy', correct: false },
          { label: 'New Forex Price', correct: false },
        ],
      },
      {
        question: 'Why does this lesson focus on USD?',
        options: [
          { label: 'Because USD underlies most of the currency pairs and Gold traders trade', correct: true },
          { label: 'Because USD never has important news', correct: false },
          { label: "Because Forex Factory doesn't support other currencies", correct: false },
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
        <strong>Forex Factory (forexfactory.com)</strong> 是大多数交易者用来追踪 <strong>Economic Calendar</strong>{' '}
        （经济日历）的免费网站——它列出可能导致价格突然剧烈波动的经济新闻时间表。本课我们只聚焦对新手交易者
        最重要的部分：<strong>Red Folder News</strong> 和 <strong>USD</strong>。
      </>
    ),
    h1: '什么是 Red Folder？',
    folderIntro: 'Forex Factory 按照对市场的影响程度给新闻分配颜色：',
    yellowLabel: '黄色（Low Impact）',
    yellowBody: '影响较小的新闻——对价格几乎没有影响',
    orangeLabel: '橙色（Medium Impact）',
    orangeBody: '中等影响的新闻——可能引发小幅波动',
    redLabel: '红色（High Impact）⚠️',
    redBody: '最重要的新闻——公布瞬间会让价格急速、剧烈波动——需要格外小心',
    ruleRed: '每天交易前务必先查看 Forex Factory，了解当天有哪些 Red Folder News',
    h2: '为什么要聚焦 USD？',
    usdBox: (
      <p>
        <strong>USD（美元）</strong>是全球最大的基础货币——交易者交易的几乎所有货币对和 Gold（XAUUSD）都直接
        与 USD 相关。因此 USD 的 Red Folder News 对我们交易的市场影响范围最广。
      </p>
    ),
    keyEventsHeading: '需要记住的关键 USD 事件',
    nfpLabel: 'NFP（Non-Farm Payrolls，非农就业）',
    nfpBody: '每月就业报告——通常是当月市场波动最大的事件',
    fomcLabel: 'FOMC / 利率决议',
    fomcBody: 'Fed 的利率决定——对所有 USD 货币对和 Gold 都有全面影响',
    cpiLabel: 'CPI（通胀数据）',
    cpiBody: '通胀报告——会影响 Fed 之后的决策',
    fedSpeechLabel: 'Fed 主席讲话',
    fedSpeechBody: 'Fed 主席的发言——其中的措辞可能引发市场即时反应',
    quiz1: {
      question: 'Forex Factory 上哪种颜色代表影响力最大的新闻？',
      options: [
        { label: '黄色', type: 'no' },
        { label: '红色', type: 'ok' },
        { label: '橙色', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！红色（Red）代表 High Impact News——会引发最剧烈的价格波动。',
        no: '✗ 红色（Red）才是影响力最大的颜色，而不是黄色或橙色。',
      },
    },
    h3: '如何筛选只显示 USD + Red',
    filterSteps: [
      '打开 forexfactory.com → 点击 Calendar 标签',
      '点击顶部的 Filter（筛选）图标',
      '在 Currency 中——只勾选 USD（取消其他货币）',
      '在 Impact 中——只勾选 High（Red）',
      '点击 Apply —— Calendar 将只显示 USD 的 Red Folder News',
    ],
    h4: 'Red News 期间的安全提示',
    tip1: (
      <>
        <strong>避免开新单</strong>——在 Red Folder News 公布前后约 15-30 分钟内，Spread 会变大，价格可能剧烈
        Whipsaw（来回抽动）
      </>
    ),
    tip2: (
      <>
        <strong>已开的持仓</strong>——如果你还没有足够的新闻交易经验，可以考虑在重大新闻公布前减小 Lot Size
        或直接平仓
      </>
    ),
    tip3: (
      <>
        部分有经验的交易者会直接交易新闻（News Trading），但作为初学者，
        <strong>建议等市场平静下来后</strong>，再按正常 Structure 交易
      </>
    ),
    quiz2: {
      question: '在 Red Folder News 公布前约 15-30 分钟，应该怎么做？',
      options: [
        { label: '尽可能多开新仓', type: 'no' },
        { label: '避免开新单，因为 Spread 会变大、价格可能剧烈波动', type: 'ok' },
        { label: '完全不需要特别注意', type: 'no' },
      ],
      feedback: {
        ok: '✓ 正确！临近 Red News 时 Spread 会变大，价格也可能剧烈 Whipsaw——应避免开新单。',
        no: '✗ 临近 Red News 时应避免开新单，因为风险很高（Spread 变大 + Whipsaw）。',
      },
    },
    practiceHeading: '📝 实践练习',
    practiceIntro: '打开 forexfactory.com，尝试以下操作：',
    practiceSteps: [
      '筛选出只显示 USD + Red Folder',
      '记录本周有哪些 Red News',
      '记下这些 Red News 的具体时间，避免在临近时间交易',
    ],
    finalTestHeading: '🔒 课程结业测验',
    finalTestIntro: (
      <>
        必须<strong>全部 4 题答对</strong>才能解锁并进入下一课——如果答错，可以无限次重新尝试。
      </>
    ),
    finalTestQuestions: [
      {
        question: 'Forex Factory 是用来做什么的？',
        options: [
          { label: '追踪 Economic Calendar / 经济新闻', correct: true },
          { label: '绘制技术分析图表', correct: false },
          { label: '下达交易订单', correct: false },
        ],
      },
      {
        question: '哪种颜色代表 High Impact News？',
        options: [
          { label: '黄色', correct: false },
          { label: '红色', correct: true },
          { label: '白色', correct: false },
        ],
      },
      {
        question: 'NFP 代表什么？',
        options: [
          { label: 'Non-Farm Payrolls —— 就业报告', correct: true },
          { label: 'National Finance Policy', correct: false },
          { label: 'New Forex Price', correct: false },
        ],
      },
      {
        question: '为什么本课聚焦于 USD？',
        options: [
          { label: '因为 USD 是大多数交易货币对和 Gold 的基础', correct: true },
          { label: '因为 USD 从来没有重要新闻', correct: false },
          { label: '因为 Forex Factory 不支持其他货币', correct: false },
        ],
      },
    ],
  },
};

export default function AppsLesson2({ onNavigate, onDone }) {
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
      id="a2"
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
      <p>{t.folderIntro}</p>
      <div className="g3">
        <GridItem labelColor="var(--gold)" label={t.yellowLabel}>
          {t.yellowBody}
        </GridItem>
        <GridItem labelColor="var(--gold)" label={t.orangeLabel}>
          {t.orangeBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.redLabel}>
          {t.redBody}
        </GridItem>
      </div>
      <Rule title="💡">{t.ruleRed}</Rule>

      <h3>
        <span className="bar"></span>
        {t.h2}
      </h3>
      <Box variant="g">{t.usdBox}</Box>

      <p className="sec-label sg" style={{ marginTop: 8 }}>
        {t.keyEventsHeading}
      </p>
      <div className="g2">
        <GridItem labelColor="var(--dn)" label={t.nfpLabel}>
          {t.nfpBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.fomcLabel}>
          {t.fomcBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.cpiLabel}>
          {t.cpiBody}
        </GridItem>
        <GridItem labelColor="var(--dn)" label={t.fedSpeechLabel}>
          {t.fedSpeechBody}
        </GridItem>
      </div>

      <Quiz question={t.quiz1.question} options={t.quiz1.options} feedback={t.quiz1.feedback} />

      <h3>
        <span className="bar"></span>
        {t.h3}
      </h3>
      <Steps items={t.filterSteps} />

      <h3>
        <span className="bar"></span>
        {t.h4}
      </h3>
      <Box variant="d">
        <ul>
          <li>{t.tip1}</li>
          <li>{t.tip2}</li>
          <li>{t.tip3}</li>
        </ul>
      </Box>

      <Quiz question={t.quiz2.question} options={t.quiz2.options} feedback={t.quiz2.feedback} />

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
