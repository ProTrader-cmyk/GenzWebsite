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
              <span>{isKhmer ? 'CLASSIFIED // កម្រិតសម្ងាត់ LEVEL 5' : 'CLASSIFIED // LEVEL 5 ACCESS'}</span>
            </div>
            <span className="mcs-clearance-code">
              [PROTO_OMEGA // {telemetryTime || '00:00:00'} ICT]
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
            <span>{isKhmer ? 'ប្រព័ន្ធស្ថាប័នជំនាន់ក្រោយ' : 'NEXT-GEN INSTITUTIONAL ARCHITECTURE'}</span>
          </div>

          <h1 className="mcs-hero-title">
            {isKhmer ? (
              <>
                អ្វីមួយដ៏អស្ចារ្យកំពុងតែមកដល់ <br />
                <span className="glow-gold">GENZ MEMBER PORTAL 2.0</span>
              </>
            ) : (
              <>
                SOMETHING MASSIVE IS FORMING <br />
                <span className="glow-gold">THE INSTITUTIONAL MEMBER PORTAL</span>
              </>
            )}
          </h1>

          <p className="mcs-hero-desc">
            {isKhmer
              ? 'បច្ចេកវិទ្យាជួញដូរកម្រិតសម្ងាត់សម្រាប់ស្ថាប័នកំពុងត្រូវបានអភិវឌ្ឍយ៉ាងលម្អិត។ ការតាមដាន Dark Pool Liquidity, ប្រព័ន្ធ Algorithmic Execution គ្មាន Drawdown និងការបញ្ជាទិញផ្ទាល់ពីធនាគារអន្តរជាតិនឹងត្រូវបានបើកសម្ពោធក្នុងពេលឆាប់ៗនេះ។'
              : 'A clandestine trading ecosystem engineered for quantitative liquidity hunters and high-stakes operators. We are deploying proprietary interbank capabilities that will permanently revolutionize retail market interaction.'}
          </p>
        </section>

        {/* High-Tech Decryption Telemetry Terminal */}
        <div className="mcs-terminal-card">
          <div className="mcs-terminal-header">
            <div className="mcs-terminal-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="mcs-terminal-title">
              {isKhmer ? 'ប្រព័ន្ធ DECRYPTION កំពុងដំណើរការ' : 'SYSTEM INITIALIZATION TELEMETRY // CORE V3.9'}
            </div>
            <div style={{ width: 40 }} />
          </div>

          <div className="mcs-terminal-body">
            <div className="mcs-progress-section">
              <div className="mcs-progress-labels">
                <span className="mcs-progress-label">
                  {isKhmer ? 'ដំណើរការដោះសោប្រព័ន្ធ (DECRYPTION PHASE)' : 'DECRYPTION & CALIBRATION STATUS'}
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
                <span className="mcs-tl-prefix">[MATCHING]</span>
                <span className="mcs-tl-text">
                  Establishing direct fiber optic FIX bridge to Tier-1 New York & London liquidity nodes...
                </span>
                <span className="mcs-tl-status">[CONNECTED]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:05'}]</span>
                <span className="mcs-tl-prefix">[ORDERFLOW]</span>
                <span className="mcs-tl-text">
                  Compiling institutional Smart Money volume absorption & resting limit order matrices...
                </span>
                <span className="mcs-tl-status">[ACTIVE]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:06'}]</span>
                <span className="mcs-tl-prefix">[PIP_AI]</span>
                <span className="mcs-tl-text">
                  Synchronizing Gemini 3.8 Multi-Modal live chart scanner & cognitive tilt-prevention module...
                </span>
                <span className="mcs-tl-status">[CALIBRATED]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:07'}]</span>
                <span className="mcs-tl-prefix">[GUARDIAN]</span>
                <span className="mcs-tl-text">
                  Prop-firm 4% max daily drawdown hard-stop protocol initialized and locked...
                </span>
                <span className="mcs-tl-status">[ARMED]</span>
              </div>
              <div className="mcs-telemetry-line">
                <span className="mcs-tl-time">[{telemetryTime || '14:22:08'}]</span>
                <span className="mcs-tl-prefix">[SECURITY]</span>
                <span className="mcs-tl-text">
                  Vault encryption seals active. Priority admission reserved for registered early initiates.
                </span>
                <span className="mcs-tl-status pending">[PENDING UNLOCK]</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Classified Dossier Cards */}
        <div className="mcs-dossier-grid">
          {/* Card 1 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-redacted">TOP SECRET</span>
            <div className="mcs-card-icon-box">🛰️</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Project Aegis: Dark Pool Radar' : 'Project Aegis: Dark Pool Radar'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'ចាប់សញ្ញាការបញ្ជាទិញធំៗរបស់ធនាគារកណ្តាល និងទីតាំង Liquidity លាក់មុខ មុនពេលទីផ្សារមានការ Sweep ពិតប្រាកដ។'
                : 'Direct algorithmic detection of institutional resting limit orders and bank absorption blocks before retail liquidity is purged.'}
            </p>
            <div className="mcs-card-meta">
              <span>CLEARANCE: LEVEL 5</span>
              <span>•</span>
              <span>ICT ORDERFLOW</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-calibrating">CALIBRATING</span>
            <div className="mcs-card-icon-box">⚡</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Zero-Lag Execution Sentinel' : 'Zero-Lag Execution Sentinel'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'ម៉ាស៊ីន Execution ល្បឿន Sub-millisecond ភ្ជាប់ជាមួយប្រព័ន្ធគណិតវិទ្យាការពារទុន មិនឱ្យខាតលើសកំណត់លើគណនី Funded។'
                : 'Sub-millisecond execution engine with strict mathematical capital preservation locks designed for funded prop firm equity.'}
            </p>
            <div className="mcs-card-meta">
              <span>LATENCY: &lt; 2.4MS</span>
              <span>•</span>
              <span>PROP FIRM SAFE</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-synced">NEURAL SYNC</span>
            <div className="mcs-card-icon-box">🧠</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'Pip AI Vision & Voice Co-Pilot' : 'Pip AI Vision & Voice Co-Pilot'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'AI វិភាគលើផ្ទាំង Chart ដោយផ្ទាល់ ពិនិត្យភាពស៊ីគ្នានៃទៀន FVG/OTE និងជួយទប់ស្កាត់អារម្មណ៍ Overtrading តាមពេលវេលាជាក់ស្តែង។'
                : 'Multi-modal AI analyzing real-time chart candles, confirming displacement confluence, and preventing psychological tilt live.'}
            </p>
            <div className="mcs-card-meta">
              <span>GEMINI 3.8 FLASH</span>
              <span>•</span>
              <span>LIVE VISION</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="mcs-dossier-card">
            <span className="mcs-card-corner-tag mcs-tag-restricted">RESTRICTED</span>
            <div className="mcs-card-icon-box">🏛️</div>
            <h3 className="mcs-card-title">
              {isKhmer ? 'The Inner Circle Floor' : 'The Inner Circle Floor'}
            </h3>
            <p className="mcs-card-desc">
              {isKhmer
                ? 'បន្ទប់ Trade ផ្ទាល់ប្រចាំថ្ងៃជាមួយ Master Trader Sunhour និងឯកសារយុទ្ធសាស្ត្រស្ថាប័នកម្រិតខ្ពស់ដែលមិនធ្លាប់បង្ហាញពីមុនមក។'
                : 'Synchronized live desk trading sessions with Sunhour, private institutional playbooks, and high-capital account syndication.'}
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
            {isKhmer ? '★ ទទួលបានសិទ្ធិចូលរួមមុនគេ' : '★ EARLY CLEARANCE REGISTRATION'}
          </div>

          <h2 className="mcs-action-heading">
            {isKhmer ? 'ត្រៀមខ្លួនសម្រាប់បទពិសោធន៍ថ្មី' : 'Secure Priority Access Before Global Release'}
          </h2>

          <p className="mcs-action-sub">
            {isKhmer
              ? 'ចំនួនសមាជិកដំបូងនឹងត្រូវបានកំណត់យ៉ាងតឹងរ៉ឹងដើម្បីធានាគុណភាពនៃ Terminal។ ទាក់ទង Admin តាម Telegram ដើម្បីចុះឈ្មោះក្នុងបញ្ជីអាទិភាព VIP។'
              : 'Initial member allocations are strictly capped to ensure institutional server throughput. DM Admin to secure early whitelist priority.'}
          </p>

          <div className="mcs-btns-row">
            <a
              href={TELEGRAM_ADMIN_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mcs-btn-primary"
            >
              <span>✈️</span>
              <span>{isKhmer ? 'ផ្ញើសារស្នើសុំចូលបញ្ជីអាទិភាព VIP (@Vengsopheagenz)' : 'Request Priority Whitelist on Telegram (@Vengsopheagenz)'}</span>
            </a>

            {onExploreAI && (
              <button
                type="button"
                className="mcs-btn-secondary"
                onClick={onExploreAI}
              >
                <span>📡</span>
                <span>{isKhmer ? 'សាកល្បង Live AI Trading Terminal' : 'Explore Live AI Trading'}</span>
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

