// Static content for the About, Blog, Terms and Privacy pages.
// Legal text is a working draft based on how the site actually handles data; have it reviewed
// by a qualified lawyer before relying on it.

export const LEGAL_UPDATED = 'October 27, 2026';
export const CONTACT_TELEGRAM = 'https://t.me/Vengsopheagenz?direct';

export const ABOUT = {
  en: {
    eyebrow: 'About Us',
    title: 'Learn to trade with a plan, not a feeling',
    intro:
      'GenZ Trader is a private mentorship and trading education platform built for Khmer-speaking traders. We teach a clear, rules-based approach to the markets and give members tools that make it easier to follow it.',
    blocks: [
      {
        title: 'What we do',
        body: [
          'Step-by-step lessons on technical analysis, advanced concepts, trading psychology, trading apps and backtesting, written in plain language.',
          'A member area with live sessions, a signal feed, a trading journal and a market news and economic calendar page.',
          'Pip AI, our analysis assistant. It reads live multi-timeframe charts and explains what it sees. When the market is unclear, it tells you there is no trade.',
        ],
      },
      {
        title: 'How we think about trading',
        list: [
          'Protect capital first. We teach fixed risk per trade and a minimum 1:2 risk-reward.',
          'No trade is a valid trade. Sitting out unclear markets is a skill.',
          'Process over outcome. Journal every trade, review it, improve.',
          'Honest about risk. Trading can lose money, and nothing we publish is a promise of profit.',
        ],
      },
      {
        title: 'Who it is for',
        body: [
          'Beginners who want a structured start, and developing traders who want discipline and better tools. Everything on this site is for education and is not financial advice.',
        ],
      },
    ],
    ctaTitle: 'Questions? Talk to us',
    ctaBody: 'The fastest way to reach the team is Telegram.',
    ctaButton: 'Message us on Telegram',
  },
  km: {
    eyebrow: 'អំពីយើង',
    title: 'រៀនជួញដូរដោយមានផែនការ មិនមែនតាមអារម្មណ៍',
    intro:
      'GenZ Trader គឺជាវេទិកាអប់រំ និងណែនាំឯកជនសម្រាប់អ្នកជួញដូរខ្មែរ។ យើងបង្រៀនវិធីសាស្ត្រច្បាស់លាស់ដែលមានច្បាប់ និងផ្តល់ឧបករណ៍ជួយឱ្យសមាជិកអនុវត្តតាមបានងាយស្រួល។',
    blocks: [
      {
        title: 'អ្វីដែលយើងធ្វើ',
        body: [
          'មេរៀនជាជំហានៗអំពីការវិភាគបច្ចេកទេស គំនិតកម្រិតខ្ពស់ ចិត្តវិទ្យាជួញដូរ កម្មវិធីជួញដូរ និង Backtesting ដោយប្រើភាសាងាយយល់។',
          'តំបន់សមាជិកមានវគ្គ Live សញ្ញាជួញដូរ កំណត់ត្រាជួញដូរ និងទំព័រព័ត៌មានទីផ្សារ។',
          'Pip AI ជាជំនួយការវិភាគរបស់យើង។ វាអានតារាងពហុ Timeframe ផ្ទាល់ ហើយប្រាប់ថា «មិនគួរជួញដូរ» នៅពេលទីផ្សារមិនច្បាស់។',
        ],
      },
      {
        title: 'របៀបដែលយើងគិតអំពីការជួញដូរ',
        list: [
          'ការពារដើមទុនមុនគេ៖ ហានិភ័យថេរក្នុងមួយការជួញដូរ និង R:R យ៉ាងតិច 1:2។',
          'ការមិនជួញដូរក៏ជាការសម្រេចចិត្តត្រឹមត្រូវដែរ។',
          'ផ្តោតលើដំណើរការ ជាជាងលទ្ធផល៖ កត់ត្រា ពិនិត្យ និងកែលម្អ។',
          'ស្មោះត្រង់អំពីហានិភ័យ៖ ការជួញដូរអាចខាតបង់ ហើយអ្វីដែលយើងចែករំលែកមិនមែនជាការធានាប្រាក់ចំណេញទេ។',
        ],
      },
      {
        title: 'សម្រាប់អ្នកណា',
        body: ['អ្នកចាប់ផ្តើមដែលចង់បានមូលដ្ឋានច្បាស់លាស់ និងអ្នកជួញដូរដែលចង់បានវិន័យ និងឧបករណ៍ល្អជាង។ មាតិកាទាំងអស់សម្រាប់ការសិក្សា មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុទេ។'],
      },
    ],
    ctaTitle: 'មានសំណួរ? ទាក់ទងមកយើង',
    ctaBody: 'វិធីលឿនបំផុតគឺតាម Telegram។',
    ctaButton: 'ផ្ញើសារតាម Telegram',
  },
};

export const BLOG_POSTS = [
  {
    slug: 'the-1-percent-rule',
    date: 'October 27, 2026',
    minutes: 4,
    tag: 'Risk',
    title: 'The 1% rule: how much should you risk per trade?',
    summary: 'One simple rule that keeps a bad week from becoming the end of your account.',
    body: [
      'The 1% rule says you should never risk more than 1% of your account on a single trade. On a $1,000 account that is $10. Not the position size, the amount you lose if your stop-loss is hit.',
      'Why so small? Because losing streaks are normal. Even a good strategy can lose five or six trades in a row. At 1% risk, six losses cost you about 6%. At 10% risk per trade, six losses cost you more than half the account, and you need a 100%+ gain just to recover.',
      'How to apply it: decide your stop-loss first, based on the chart. Then work out the position size so that the distance to your stop equals 1% of your balance. The size follows the stop, not the other way around.',
      'Example: balance $2,000, risk 1% = $20. Your stop is 5 points away on gold. Position size is $20 divided by 5 points = 4 units. If the stop is wider, the size gets smaller. The risk stays $20.',
      'Add a daily loss limit as well, such as 3%. When you hit it, stop trading for the day. The rule is boring on purpose. It keeps you in the game long enough to get good.',
    ],
  },
  {
    slug: 'why-risk-reward-1-to-2',
    date: 'October 20, 2026',
    minutes: 4,
    tag: 'Strategy',
    title: 'Why a 1:2 risk-reward changes the maths',
    summary: 'You can be wrong more often than you are right and still make money. Here is how.',
    body: [
      'Risk-reward compares what you can lose to what you aim to win. A 1:2 ratio means you risk 1 unit to make 2.',
      'The break-even win rate at 1:2 is about 33%. Win one trade out of three and you are flat. At 1:1 you need to win half your trades just to break even, before costs.',
      'Example over 10 trades risking $20 each: win 4 and lose 6 at 1:2. Wins: 4 x $40 = $160. Losses: 6 x $20 = $120. Net: +$40, even though you lost most trades.',
      'This is why we ask for a minimum 1:2 on every setup. It takes pressure off being right every time. Spreads and commissions do reduce results a little, so leave some margin.',
      'A word of caution: do not stretch a target to make the ratio look good. The take-profit must sit at a level price can realistically reach, such as the next support or resistance.',
    ],
  },
  {
    slug: 'how-pip-ai-signals-work',
    date: 'October 13, 2026',
    minutes: 5,
    tag: 'AI',
    title: 'How our AI signals work, and when they say "no trade"',
    summary: 'What Pip AI looks at, what it ignores, and why it is built to say no.',
    body: [
      'Pip AI reads live candles across several timeframes (M5, M15, H1 and H4) and calculates standard indicators: EMA 20/50/200, RSI, MACD, ATR and nearby support and resistance.',
      'It then answers in a fixed format: buy, sell or hold, with entry, stop-loss, take-profit, a risk-reward figure, a confidence score and a short reason. We do not trust the AI blindly. The numbers are checked by rules. The stop must be on the right side of the entry, the distance must suit current volatility, and the risk-reward must be at least 1:2.',
      'If the market is choppy, the timeframes disagree, the market is closed or confidence is low, the answer is "no trade". Most of the time there is no good setup, and that is by design.',
      'New signals are checked on each closed 15-minute candle, so you are not flooded with alerts. We also avoid posting a second signal in the same direction near the same price while one is still active.',
      'Important: signals are educational analysis. They can be wrong, markets can gap or move fast, and past results do not predict future ones. Always size your trade with your own risk rules.',
    ],
  },
  {
    slug: 'stop-revenge-trading',
    date: 'October 6, 2026',
    minutes: 4,
    tag: 'Psychology',
    title: 'Three habits that stop revenge trading',
    summary: 'The urge to win it back is the most expensive emotion in trading. Here is how to manage it.',
    body: [
      'Revenge trading is entering a trade right after a loss, not because there is a setup, but because you want your money back. It usually means a bigger size, a worse entry and a bigger loss.',
      'Habit 1: a hard stop. Decide in advance, for example two losses in a row or a 3% daily loss, and close the platform when you hit it. Removing the choice removes the temptation.',
      'Habit 2: a cooling-off ritual. After every loss, stand up, take five minutes, and write one line in your journal: what happened, and was it a mistake or just a normal loss?',
      'Habit 3: judge the process, not the result. A trade that followed your plan and lost is a good trade. A trade that broke your rules and won is a bad one, because it teaches you the wrong lesson.',
      'Keep a journal. After a month you will see exactly when and why you break your own rules, and you can fix that.',
    ],
  },
];

export const TERMS = {
  title: 'Terms of Service',
  intro:
    'These Terms govern your use of GenZ Trader (the "Site"), including our lessons, member area, news pages, AI trading tools and signals. By creating an account or using the Site you agree to them. If you do not agree, please do not use the Site.',
  sections: [
    {
      title: '1. Education only, not financial advice',
      body: [
        'Everything on the Site is for educational and informational purposes. Nothing is investment, financial, legal or tax advice, and nothing is an offer or recommendation to buy or sell any instrument.',
        'We are not a broker, and we do not manage money or place trades on your behalf.',
      ],
    },
    {
      title: '2. Trading risk',
      body: [
        'Trading foreign exchange, metals, indices and crypto assets carries a high level of risk. You can lose some or all of your capital. Leverage can magnify losses as well as gains.',
        'Signals, AI analysis, backtests and example trades are not guarantees. They can be wrong, delayed or based on incomplete data. Past or simulated performance does not predict future results. You alone decide whether and how to trade and you are responsible for your own results.',
      ],
    },
    {
      title: '3. Eligibility and accounts',
      body: [
        'You must be at least 18 years old and able to enter a binding agreement. You agree to give accurate information and to keep your login details private. You are responsible for activity under your account.',
        'We may require email verification and may approve, suspend or restrict accounts to protect the Site and its members.',
      ],
    },
    {
      title: '4. Memberships and payments',
      body: [
        'Some features need a paid plan. Prices, plan features and limits (for example how many signals or AI requests are available) are shown at checkout and on the plans page, and may change for future purchases.',
        'Payments are processed through Bakong KHQR. Access is granted after the payment is confirmed. Paid access runs for the period you bought and does not renew automatically unless we clearly tell you otherwise.',
        'Because access to digital content starts straight away, payments are generally non-refundable once access is granted, unless the law requires otherwise or we agree in writing. If you believe you were charged in error, contact us and we will look into it.',
      ],
    },
    {
      title: '5. Acceptable use',
      body: ['You agree not to:'],
      list: [
        'share, resell or republish paid lessons, signals or live sessions;',
        'share your account or let others use your plan;',
        'scrape, copy or overload the Site, or try to bypass its limits or security;',
        'upload unlawful, abusive or misleading content, or impersonate others;',
        'use the Site to promote scams or to give unlicensed financial advice.',
      ],
    },
    {
      title: '6. AI features',
      body: [
        'AI tools may produce errors or outdated information. Treat their output as one input among many and check it yourself. Messages you send to AI features may be processed by our AI provider to generate a reply (see our Privacy Policy).',
      ],
    },
    {
      title: '7. Intellectual property',
      body: [
        'The Site, its lessons, text, graphics, software and branding belong to GenZ Trader or its licensors. We give you a personal, non-transferable licence to use them for your own learning while your account is active. All other rights are reserved.',
      ],
    },
    {
      title: '8. Third-party services',
      body: [
        'The Site uses third-party services, such as TradingView charts, market data providers, Telegram and payment services. We are not responsible for their content, availability or terms.',
      ],
    },
    {
      title: '9. Suspension and termination',
      body: [
        'We may suspend or end your access if you breach these Terms, put the Site or other members at risk, or where required by law. You can stop using the Site at any time and may ask us to delete your account.',
      ],
    },
    {
      title: '10. Disclaimers and limit of liability',
      body: [
        'The Site is provided "as is" and "as available". We do not promise it will be uninterrupted, error-free or that data, prices or signals are complete or accurate.',
        'To the extent the law allows, GenZ Trader is not liable for trading losses, lost profits or indirect or consequential damages arising from your use of the Site. Our total liability for any claim is limited to the amount you paid us in the 3 months before the claim.',
      ],
    },
    {
      title: '11. Changes to these Terms',
      body: [
        'We may update these Terms from time to time. The date at the top shows the latest version. If you keep using the Site after a change, you accept the updated Terms.',
      ],
    },
    {
      title: '12. Governing law',
      body: ['These Terms are governed by the laws of the Kingdom of Cambodia. Disputes are to be brought before the competent courts of Cambodia.'],
    },
    {
      title: '13. Contact',
      body: ['Questions about these Terms? Message us on Telegram using the link on our Contact page.'],
    },
  ],
};

export const PRIVACY = {
  title: 'Privacy Policy',
  intro:
    'This policy explains what personal data GenZ Trader collects, why, who we share it with and the choices you have. We collect only what we need to run the Site.',
  sections: [
    {
      title: '1. Information we collect',
      list: [
        'Account details: name, email address, profile photo (if you add one) and your sign-in credentials. Passwords are handled by Firebase Authentication and are never stored by us in plain text.',
        'Learning data: lessons you completed, your progress and feedback you submit.',
        'Membership and payment data: your plan, access dates and payment records (amount, plan, status, reference). We do not receive your bank login or card details; payments are made through Bakong KHQR.',
        'Trading journal entries you write. These are private to your account.',
        'Messages you send to Pip AI and other AI features.',
        'Notification data: if you turn on push notifications, a device token so we can send alerts.',
        'Technical data: your language and theme choice, interface state stored in your browser, login attempt counters and basic logs used for security.',
      ],
    },
    {
      title: '2. How we use it',
      list: [
        'to create and secure your account, verify your email and reset passwords;',
        'to deliver lessons, track progress and unlock the features of your plan;',
        'to confirm payments and grant or end paid access;',
        'to send signal, news and account notifications you opted into;',
        'to provide AI replies and market analysis;',
        'to prevent abuse and keep the Site secure, and to improve our content and tools.',
      ],
    },
    {
      title: '3. Service providers we use',
      body: ['We share data only with providers that help us run the Site, and only what they need:'],
      list: [
        'Google Firebase: sign-in, database and push notifications.',
        'Google Gemini: AI features. Text you send to an AI feature is processed to produce a reply.',
        'EmailJS: sending verification codes and password-reset emails.',
        'Bakong (National Bank of Cambodia) and our payment API: KHQR payments.',
        'LiveKit: live audio and video sessions in the member area.',
        'TradingView: embedded charts. TradingView may set its own cookies under its own policy.',
        'Telegram: if you contact us or join our channels there, Telegram\'s policy applies.',
      ],
    },
    {
      title: '4. Cookies and local storage',
      body: [
        'We use your browser\'s local storage to remember things like language, theme, your place in a lesson and the last page you viewed. This is needed for the Site to work properly. Third-party embeds such as TradingView may use their own cookies.',
      ],
    },
    {
      title: '5. How long we keep data',
      body: [
        'We keep your account data while your account is active. Payment records are kept as long as needed for accounting and dispute handling. When you ask us to delete your account we remove your personal data, except what we must keep by law.',
      ],
    },
    {
      title: '6. Security',
      body: [
        'We use industry-standard services and access controls, and limit admin access to staff who need it. No system is completely secure, so please use a strong, unique password.',
      ],
    },
    {
      title: '7. Your choices and rights',
      list: [
        'View and update your profile details in your account.',
        'Turn push notifications off in your browser or in the site settings.',
        'Ask us to access, correct or delete your personal data.',
        'Withdraw consent for optional processing at any time.',
      ],
      body: ['To make a request, message us on Telegram using the link on our Contact page.'],
    },
    {
      title: '8. Children',
      body: ['The Site is for adults aged 18 and over. We do not knowingly collect data from children. If you think a child has given us data, contact us and we will delete it.'],
    },
    {
      title: '9. International transfers',
      body: ['Some of our providers process data on servers outside Cambodia. By using the Site you understand your data may be processed in other countries with different data laws.'],
    },
    {
      title: '10. Changes to this policy',
      body: ['We may update this policy. The date at the top shows the latest version. If a change is significant we will tell you on the Site.'],
    },
    {
      title: '11. Contact',
      body: ['For any privacy question, message us on Telegram using the link on our Contact page.'],
    },
  ],
};
