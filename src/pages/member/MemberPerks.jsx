import { useState } from 'react';
import { TelegramIcon, LockIcon } from '../../components/ui/CategoryIcons.jsx';

const TELEGRAM_VIP_URL = 'https://t.me/Vengsopheagenz?direct';

const DOWNLOADABLE_PLAYBOOKS = [
  {
    id: 'ict-cheatsheet',
    title: 'ICT Dealing Range & Structure Playbook',
    pages: '24 Pages • PDF',
    desc: 'Visual cheat sheet covering BOS, CHoCH, Dealing Ranges, and multi-timeframe alignment rules.',
    badge: 'Essential',
    fileSize: '4.2 MB',
  },
  {
    id: 'pd-array-matrix',
    title: 'High-Probability PD Array Matrix',
    pages: '18 Pages • PDF',
    desc: 'Step-by-step breakdown of FVG, IFVG, Order Blocks, Breakers, and OTE entry models.',
    badge: 'Advanced',
    fileSize: '3.8 MB',
  },
  {
    id: 'risk-journal',
    title: 'Risk Management Calculator & Trade Journal',
    pages: 'Excel Template + Guide',
    desc: 'Automated 1%–2% risk sizing sheet, compounding projection, and screenshot trade log.',
    badge: 'Tool',
    fileSize: '1.5 MB',
  },
];

const UPCOMING_ZOOMS = [
  {
    title: 'Weekly Live Market Outlook & Killzone Breakdown',
    date: 'Every Tuesday • 8:00 PM Cambodia Time (GMT+7)',
    mentor: 'Veng Sophea (Lead ICT Mentor)',
    status: 'Upcoming',
  },
  {
    title: 'Live Backtest & Chart Review Session',
    date: 'Every Thursday • 8:30 PM Cambodia Time (GMT+7)',
    mentor: 'GenZ Trading Desk',
    status: 'Confirmed',
  },
];

export default function MemberPerks() {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [chartLink, setChartLink] = useState('');
  const [questionText, setQuestionText] = useState('');

  function handleDownload(book) {
    setDownloadNotice(`Downloading "${book.title}" (${book.fileSize})...`);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 2800);
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewSent(true);
    setTimeout(() => {
      setReviewSent(false);
      setReviewModalOpen(false);
      setChartLink('');
      setQuestionText('');
    }, 2000);
  }

  return (
    <div className="member-perks-page">
      {/* VIP TELEGRAM BANNER */}
      <div className="vip-telegram-banner">
        <div className="vip-telegram-left">
          <div className="vip-telegram-icon-wrap">
            <TelegramIcon width={28} height={28} />
          </div>
          <div>
            <div className="vip-telegram-title">Official VIP Signals & Mentorship Channel</div>
            <div className="vip-telegram-sub">
              Instant push notifications for every trade setup, market commentary, and live audio updates.
            </div>
          </div>
        </div>
        <a
          href={TELEGRAM_VIP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="vip-telegram-action-btn"
        >
          <span>Join VIP Telegram</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

      {downloadNotice && (
        <div className="toast-notification">
          <span>✓ {downloadNotice}</span>
        </div>
      )}

      {/* DOWNLOADABLE PLAYBOOKS */}
      <div className="perks-section-head">
        <div className="perks-section-title">VIP Downloadable Playbooks & Systems</div>
        <div className="perks-section-sub">
          Full offline reference sheets, trading plans, and Excel risk models designed exclusively for members.
        </div>
      </div>

      <div className="perks-grid">
        {DOWNLOADABLE_PLAYBOOKS.map((book) => (
          <div key={book.id} className="perk-card">
            <div className="perk-card-top">
              <span className="perk-badge">{book.badge}</span>
              <span className="perk-pages">{book.pages}</span>
            </div>
            <div className="perk-title">{book.title}</div>
            <p className="perk-desc">{book.desc}</p>
            <button
              type="button"
              className="perk-download-btn"
              onClick={() => handleDownload(book)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download File ({book.fileSize})</span>
            </button>
          </div>
        ))}
      </div>

      {/* LIVE ZOOM SCHEDULE & 1-ON-1 REVIEW */}
      <div className="perks-two-col">
        <div className="perks-box">
          <div className="perks-box-head">
            <div className="perk-title" style={{ margin: 0 }}>Weekly VIP Mentorship Streams</div>
            <span className="live-badge">Live on Zoom</span>
          </div>
          <div className="zoom-list">
            {UPCOMING_ZOOMS.map((z, idx) => (
              <div key={idx} className="zoom-item">
                <div className="zoom-item-info">
                  <div className="zoom-item-title">{z.title}</div>
                  <div className="zoom-item-date">{z.date}</div>
                  <div className="zoom-item-mentor">Mentor: {z.mentor}</div>
                </div>
                <a
                  href={TELEGRAM_VIP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zoom-join-link"
                >
                  Get Link
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="perks-box review-box">
          <div className="perks-box-head">
            <div className="perk-title" style={{ margin: 0 }}>1-on-1 Chart Analysis Review</div>
            <span className="mentor-badge">Direct Mentor Feedback</span>
          </div>
          <p className="perk-desc" style={{ marginTop: 10 }}>
            Took a trade and want feedback? Submit your TradingView chart link and get direct commentary from our senior ICT mentor.
          </p>
          <button
            type="button"
            className="request-review-btn"
            onClick={() => setReviewModalOpen(true)}
          >
            <span>Submit Trade For Review</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* MODAL FOR 1-ON-1 REVIEW */}
      {reviewModalOpen && (
        <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setReviewModalOpen(false)}
            >
              ×
            </button>
            <h3 className="modal-title">Request 1-on-1 Chart Breakdown</h3>
            <p className="modal-text">
              Paste your TradingView snapshot or describe your entry. Mentor Veng Sophea will review and message you via Telegram.
            </p>

            {reviewSent ? (
              <div className="review-success-msg">
                ✓ Trade submitted successfully! Your mentor will review it shortly on Telegram.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="modal-field-label">TradingView Chart Link or Image URL</label>
                  <input
                    type="url"
                    required
                    className="modal-input"
                    placeholder="https://www.tradingview.com/x/..."
                    value={chartLink}
                    onChange={(e) => setChartLink(e.target.value)}
                  />
                </div>
                <div>
                  <label className="modal-field-label">What questions do you have about this trade?</label>
                  <textarea
                    required
                    rows={3}
                    className="modal-input modal-textarea"
                    placeholder="E.g., Was my SL placement behind the OB correct? Did I enter too early before London open?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setReviewModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="plan-cta-btn plan-cta-primary" style={{ width: 'auto' }}>
                    Send to Mentor
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
