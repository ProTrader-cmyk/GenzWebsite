import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import '../../styles/memberComingSoon.css';

export default function MemberComingSoon({
  user,
  onExit,
  onExploreAI,
  onToggleDevTerminal,
  isAdmin = false,
}) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'kh';

  // Live timestamp for telemetry
  const [telemetryTime, setTelemetryTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTelemetryTime(
        d.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Phnom_Penh',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const TELEGRAM_ADMIN_URL = 'https://t.me/Vengsopheagenz?direct';

  return (
    <div className="mcs-wrapper">
      {/* Background Cyber Matrix & Glowing Orbs */}
      <div className="mcs-grid-matrix" />
      <div className="mcs-glow-orb mcs-orb-gold" />
      <div className="mcs-glow-orb mcs-orb-cyan" />
      <div className="mcs-glow-orb mcs-orb-purple" />
      <div className="mcs-radar-sweep" />

      {/* Main Content Container */}
      <div className="mcs-content-container">
        {/* Top Header Bar */}
        <header className="mcs-top-bar">
          <div className="mcs-top-left">
            <div className="mcs-classified-badge">
              <span className="mcs-beacon-dot" />
              <span>{isKhmer ? 'សមាជិក VIP' : 'VIP PORTAL'}</span>
            </div>
            <span className="mcs-clearance-code">
              [{telemetryTime || '00:00:00'} ICT]
            </span>
          </div>

          <div className="mcs-top-actions">
            {onExit && (
              <button
                type="button"
                className="mcs-exit-btn"
                onClick={onExit}
                title={isKhmer ? 'ត្រឡប់ទៅទំព័រដើម' : 'Return to Website'}
              >
                <span>←</span>
                <span>{isKhmer ? 'ត្រឡប់ទៅទំព័រដើម' : 'Exit to Home'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Hero Headline */}
        <section className="mcs-hero">
          <div className="mcs-sub-badge">
            <span>⚡</span>
            <span>{isKhmer ? 'មកដល់ឆាប់ៗនេះ' : 'COMING SOON'}</span>
          </div>

          <h1 className="mcs-hero-title">
            GENZ MEMBER PORTAL <br />
            <span className="glow-gold">{isKhmer ? 'មកដល់ឆាប់ៗនេះ' : 'COMING SOON'}</span>
          </h1>

          <p className="mcs-hero-desc">
            {isKhmer
              ? 'ប្រព័ន្ធជួញដូរ VIP ជំនាន់ក្រោយជាមួយ AI Signals, Live Coaching និងឧបករណ៍វិភាគទីផ្សារ។'
              : 'Next-generation VIP portal featuring AI signals, live mentorship, and advanced trading tools.'}
          </p>
        </section>

        {/* Decryption Telemetry Terminal */}
        <div className="mcs-terminal-card">
          <div className="mcs-terminal-header">
            <div className="mcs-terminal-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="mcs-terminal-title">
              {isKhmer ? 'ស្ថានភាពរៀបចំប្រព័ន្ធ' : 'SYSTEM STATUS // CORE V3.9'}
            </div>
            <div style={{ width: 40 }} />
          </div>

          <div className="mcs-terminal-body">
            <div className="mcs-progress-section">
              <div className="mcs-progress-labels">
                <span className="mcs-progress-label">
                  {isKhmer ? 'ដំណើរការរៀបចំ' : 'DEPLOYMENT STATUS'}
                </span>
                <span className="mcs-progress-value">93.8% COMPLETE</span>
              </div>
              <div className="mcs-progress-track">
                <div className="mcs-progress-fill" />
              </div>
            </div>

            <div className="mcs-telemetry-lines">
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:04'}]</span>
                <span className="mcs-tl-prefix">[LIQUIDITY]</span>
                <span className="mcs-tl-text">
                  Connecting Tier-1 liquidity feeds...
                </span>
                <span className="mcs-tl-status">[CONNECTED]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:05'}]</span>
                <span className="mcs-tl-prefix">[SIGNALS]</span>
                <span className="mcs-tl-text">
                  Calibrating Smart Money volume matrices...
                </span>
                <span className="mcs-tl-status">[ACTIVE]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:06'}]</span>
                <span className="mcs-tl-prefix">[AI_ENGINE]</span>
                <span className="mcs-tl-text">
                  Syncing Gemini AI chart scanner & alerts...
                </span>
                <span className="mcs-tl-status">[READY]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:07'}]</span>
                <span className="mcs-tl-prefix">[RISK_GUARD]</span>
                <span className="mcs-tl-text">
                  Loading daily drawdown protection rules...
                </span>
                <span className="mcs-tl-status">[LOCKED]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:08'}]</span>
                <span className="mcs-tl-prefix">[ACCESS]</span>
                <span className="mcs-tl-text">
                  Priority VIP whitelist registration open.
                </span>
                <span className="mcs-tl-status pending">[OPEN]</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Dossier Cards */}
        <div className="mcs-dossier-grid">
          {/* Card 1 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-redacted">TOP SECRET</span>
            <div className="mcs-card-icon-box">🛰️</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Dark Pool Radar' : 'Dark Pool Radar'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'តាមដានសញ្ញា Liquidity និងការបញ្ជាទិញរបស់ធនាគារក្នុងពេលជាក់ស្តែង។'
                : 'Track institutional liquidity and bank order flow in real time.'}
            </p>
            <div className="mcs-card-meta">
              <span>LEVEL 5</span>
              <span>•</span>
              <span>ORDERFLOW</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-calibrating">CALIBRATING</span>
            <div className="mcs-card-icon-box">⚡</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Zero-Lag Execution' : 'Zero-Lag Execution'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'ប្រព័ន្ធចូល Trade លឿន ជាមួយការការពារទុនសម្រាប់គណនី Funded។'
                : 'Fast trade execution with built-in prop-firm risk protection.'}
            </p>
            <div className="mcs-card-meta">
              <span>&lt; 2.4MS</span>
              <span>•</span>
              <span>PROP FIRM SAFE</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-synced">NEURAL SYNC</span>
            <div className="mcs-card-icon-box">🧠</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Pip AI Co-Pilot' : 'Pip AI Co-Pilot'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'AI វិភាគ Chart ផ្ទាល់ និងជួយគ្រប់គ្រងអារម្មណ៍ក្នុងការ Trade។'
                : 'Real-time chart analysis and discipline coaching powered by AI.'}
            </p>
            <div className="mcs-card-meta">
              <span>GEMINI 3.8</span>
              <span>•</span>
              <span>LIVE VISION</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-restricted">RESTRICTED</span>
            <div className="mcs-card-icon-box">🏛️</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'VIP Trading Desk' : 'VIP Trading Desk'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'បន្ទប់ Trade ផ្ទាល់ជាមួយ Master Trader និង Playbooks ពិសេស។'
                : 'Live trading desk sessions with Master Trader and private playbooks.'}
            </p>
            <div className="mcs-card-meta">
              <span>INVITE ONLY</span>
              <span>•</span>
              <span>VIP DESK</span>
            </div>
          </div>
        </div>

        {/* Action Deck */}
        <section className="mcs-actions-deck">
          <div className="mcs-action-badge">
            {isKhmer ? '★ ចូលរួមមុនគេ' : '★ VIP EARLY ACCESS'}
          </div>

          <h2 className="mcs-action-heading">
            {isKhmer ? 'ចុះឈ្មោះចូល VIP មុនគេ' : 'Join the VIP Early Access List'}
          </h2>

          <p className="mcs-action-sub">
            {isKhmer
              ? 'កន្លែងមានកំណត់។ ផ្ញើសារទៅ Admin ឥឡូវនេះដើម្បីទទួលបានសិទ្ធិចូលរួម។'
              : 'Spots are limited. Direct message Admin on Telegram to secure your access.'}
          </p>

          <div className="mcs-btns-row">
            <a
              href={TELEGRAM_ADMIN_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mcs-btn-primary"
            >
              <span>✈️</span>
              <span>{isKhmer ? 'ផ្ញើសារទៅកាន់ Admin (@Vengsopheagenz)' : 'Message Admin on Telegram (@Vengsopheagenz)'}</span>
            </a>

            {onExploreAI && (
              <button
                type="button"
                className="mcs-btn-secondary"
                onClick={onExploreAI}
              >
                <span>📡</span>
                <span>{isKhmer ? 'សាកល្បង AI Trading' : 'Explore AI Trading'}</span>
              </button>
            )}
          </div>
        </section>

        {/* Admin Dev Terminal Bypass Toggle */}
        {isAdmin && onToggleDevTerminal && (
          <div className="mcs-admin-override-bar">
            <button
              type="button"
              className="mcs-admin-btn"
              onClick={onToggleDevTerminal}
            >
              <span>🛠️</span>
              <span>Admin Override: Preview Internal Terminal Views</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

