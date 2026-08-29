import { useState } from 'react';
import logo from '../assets/logo.jpg';
import Footer from './Footer.jsx';
import {
  CandleChartIcon,
  BrainIcon,
  AppWindowIcon,
  BacktestIcon,
  AdvancedChartIcon,
  LockIcon,
} from './ui/CategoryIcons.jsx';

const CATEGORIES = [
  {
    id: 'apps',
    Icon: AppWindowIcon,
    title: 'App & Website for Trading',
    subtitle: 'ស្គាល់ Platform និង Tool សម្រាប់ធ្វើការជួញដូរ',
    tag: 'ឆាប់ៗនេះ',
    locked: true,
  },
  {
    id: 'technical',
    Icon: CandleChartIcon,
    title: 'Technical for Beginner',
    subtitle: 'Market Structure · BOS/CHoCH · Order Block · FVG · Liquidity · EMA',
    tag: '៦ មេរៀន',
    locked: false,
  },
  {
    id: 'psychology',
    Icon: BrainIcon,
    title: 'Psychology',
    subtitle: 'Discipline · Emotion Control · Risk Mindset',
    tag: 'ឆាប់ៗនេះ',
    locked: true,
  },
  {
    id: 'backtest',
    Icon: BacktestIcon,
    title: 'Backtest Technical Analysis for Beginner',
    subtitle: 'អនុវត្ត Backtest ដើម្បីសាកល្បងចំណេះដឹង Technical',
    tag: 'ឆាប់ៗនេះ',
    locked: true,
  },
  {
    id: 'advanced',
    Icon: AdvancedChartIcon,
    title: 'Advanced Technical Analysis',
    subtitle: 'សិក្សា Technical Analysis ជាដំណាក់កាលខ្ពស់ — សម្រាប់អ្នកដែលបញ្ចប់ Technical for Beginner រួច',
    tag: 'ឆាប់ៗនេះ',
    locked: false,
    premium: true,
  },
];

export default function CategoryHome({ onSelectCategory }) {
  const [unlockPrompt, setUnlockPrompt] = useState(null);

  function handleCardClick(cat) {
    if (cat.premium) {
      setUnlockPrompt(cat);
    } else if (!cat.locked) {
      onSelectCategory(cat.id);
    }
  }

  return (
    <div className="view active" id="v-categories">
      <div className="hero">
        <div className="hero-logo">
          <img src={logo} alt="GenZ Trader — Veng Sophea" />
        </div>
        <div className="hero-tag">
          <span></span>Trading Class<span></span>
        </div>
        <h1>GenZ Trader</h1>
        <div className="hero-tagline">
          LEARN. TRADE. <b>GROW.</b>
        </div>
        <p className="hero-sub">
          វគ្គសិក្សា Trading ដឹកនាំដោយ <strong style={{ color: 'var(--text)' }}>Veng Sophea</strong> — ងាយ ច្បាស់
          ពេញលេញ ជាជំហានៗ
        </p>
      </div>

      <p className="sec-label sg">ជ្រើសរើសផ្នែកសិក្សា</p>

      <div className="cat-grid">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={`cat-card${cat.locked ? ' locked' : ''}${cat.premium ? ' premium' : ''}`}
            onClick={() => handleCardClick(cat)}
          >
            {cat.premium && (
              <div className="cat-lock-badge">
                <LockIcon />
              </div>
            )}
            <div className="cat-icon">
              <cat.Icon />
            </div>
            <div className="cat-title">{cat.title}</div>
            <div className="cat-sub">{cat.subtitle}</div>
            <div className={`cat-tag${cat.locked ? ' locked' : ''}${cat.premium ? ' premium' : ''}`}>
              {cat.premium && <LockIcon />}
              {cat.tag}
            </div>
          </div>
        ))}
      </div>

      <Footer />

      {unlockPrompt && (
        <div className="modal-overlay" onClick={() => setUnlockPrompt(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-lock">
              <LockIcon width="20" height="20" />
            </div>
            <h3 className="modal-title">{unlockPrompt.title}</h3>
            <p className="modal-text">
              ផ្នែកនេះជា <strong>មេរៀនកម្រិតខ្ពស់ដែលត្រូវទូទាត់ប្រាក់</strong> ដើម្បីចូលរៀន។ សូមទាក់ទង Mentor
              ដើម្បីទិញ Course និងទទួលបានលេខកូដសម្រាប់ដោះសោ។
            </p>
            <button className="modal-btn" onClick={() => setUnlockPrompt(null)}>
              យល់ព្រម
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
