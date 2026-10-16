import { useEffect, useState, useMemo } from 'react';
import Footer from './Footer.jsx';
import EconomicCalendar from './EconomicCalendar.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { analyzeGoldImpact } from '../utils/goldImpactAnalyzer.js';
import { classifyNewsArticle, formatNewsTime } from '../utils/newsClassifier.js';
import '../styles/newsPage.css';

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app';

export default function NewsPage({ onBack }) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';
  const t = getStrings(lang).news;

  // View & Filter States
  const [tab, setTab] = useState('news'); // 'news' | 'calendar'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low' | 'CENTRAL BANK' | 'COMMODITIES' | 'MACRO' | 'FOREX' | 'CRYPTO'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Data States
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [articles, setArticles] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Selected Article for AI Analysis Modal
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalAnalysis, setModalAnalysis] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 1. Fetch Real News from API
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetch(`${NEWS_API_URL}/api/news`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setArticles(data.articles || []);
        setFetchedAt(data.fetchedAt || null);
        setStatus('loaded');
      })
      .catch((err) => {
        console.warn('[NewsPage] Fetch error:', err);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 2. Fetch Deep AI Analysis for Modal
  useEffect(() => {
    if (!selectedArticle) {
      setModalAnalysis(null);
      return;
    }

    let cancelled = false;
    setModalLoading(true);

    fetch(`${NEWS_API_URL}/api/news/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: selectedArticle.url,
        title: selectedArticle.title,
        description: selectedArticle.description,
        lang: isKhmer ? 'kh' : 'en',
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setModalAnalysis(data);
        setModalLoading(false);
      })
      .catch(() => {
        if (!cancelled) setModalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedArticle, isKhmer]);

  // 3. Process Articles with Category, Impact & Multi-Asset Matrix
  const processedArticles = useMemo(() => {
    return articles.map((article) => {
      const classification = classifyNewsArticle(article);
      const goldImpact = analyzeGoldImpact(article, lang);
      const timeInfo = formatNewsTime(article.publishedAt);
      return {
        ...article,
        ...classification,
        goldImpact,
        timeInfo,
      };
    });
  }, [articles, lang]);

  // 4. Extract Top 2 Hot Breaking Catalysts for PIP AI Radar Box
  const hotBreakingArticles = useMemo(() => {
    const highAndMeds = processedArticles.filter(
      (a) => a.impactLevel === 'HIGH' || a.impactLevel === 'MEDIUM'
    );
    return highAndMeds.slice(0, 2);
  }, [processedArticles]);

  // 5. Filter Articles by Category / Impact Tier and Search Query
  const filteredArticles = useMemo(() => {
    return processedArticles.filter((a) => {
      // Filter tab check
      if (activeFilter === 'high' && a.impactLevel !== 'HIGH') return false;
      if (activeFilter === 'medium' && a.impactLevel !== 'MEDIUM') return false;
      if (activeFilter === 'low' && a.impactLevel !== 'LOW') return false;
      if (
        ['CENTRAL BANK', 'COMMODITIES', 'MACRO', 'FOREX', 'CRYPTO'].includes(activeFilter) &&
        a.category !== activeFilter
      ) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (a.title || '').toLowerCase().includes(q);
        const matchesDesc = (a.description || '').toLowerCase().includes(q);
        const matchesSource = (a.source || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSource) return false;
      }

      return true;
    });
  }, [processedArticles, activeFilter, searchQuery]);

  // 6. Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredArticles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredArticles, currentPage]);

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setCurrentPage(1);
  };

  return (
    <div className="view active gzn-page-root" id="v-news">
      {/* Back to previous section button */}
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      {/* =========================================================================
          HERO HEADER BAR
          ========================================================================= */}
      <div className="gzn-hero-header">
        <div className="gzn-hero-top-row">
          <span className="gzn-hero-tag">
            <span className="gzn-live-pulse-dot" />
            <span>{isKhmer ? 'LIVE RADAR • ព័ត៌មានទីផ្សារផ្ទាល់' : 'LIVE RADAR • REAL-TIME CATALYSTS'}</span>
          </span>

          <div className="gzn-hero-actions">
            <a
              href="https://t.me/genztrader"
              target="_blank"
              rel="noopener noreferrer"
              className="gzn-tg-channel-btn"
            >
              <span>✈️</span>
              <span>{isKhmer ? 'ទទួលដំណឹងតាម Telegram' : 'Live Telegram Alerts'}</span>
            </a>
            <button
              type="button"
              className="gzn-refresh-icon-btn"
              onClick={() => setReloadKey((k) => k + 1)}
              title="Refresh News Feed"
            >
              <span>↻</span>
              <span>{t.refresh}</span>
            </button>
          </div>
        </div>

        <h1 className="gzn-hero-title">
          <span>{isKhmer ? 'ព័ត៌មានទីផ្សារសកល' : 'Market News'}</span>
          <span className="gzn-title-gradient">/ {isKhmer ? 'GenZ Macro Wire' : 'Global Intelligence'}</span>
        </h1>
        <p className="gzn-hero-sub">
          {isKhmer
            ? 'ព័ត៌មានសំខាន់ៗដែលធ្វើឱ្យទីផ្សារកម្រើក ត្រូវបានវិភាគជាភាសាខ្មែរ និងវាយតម្លៃឥទ្ធិពលផ្ទាល់លើតម្លៃមាស (XAU/USD) និងរូបិយប័ណ្ណសកល។'
            : 'Real-time market-moving headlines, translated to Khmer and scored for institutional Gold & Forex impact.'}
        </p>

        {/* Tab Switcher: News Feed vs Economic Calendar */}
        <div className="news-tabs" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={`news-tab ${tab === 'news' ? 'news-tab-active' : ''}`}
            onClick={() => setTab('news')}
          >
            📰 {t.tabNews}
          </button>
          <button
            type="button"
            className={`news-tab ${tab === 'calendar' ? 'news-tab-active' : ''}`}
            onClick={() => setTab('calendar')}
          >
            📅 {t.tabCalendar}
          </button>
        </div>
      </div>

      {/* Render Economic Calendar if selected */}
      {tab === 'calendar' && <EconomicCalendar />}

      {/* Render News Feed */}
      {tab === 'news' && (
        <>
          {/* =========================================================================
              CONTROLS & FILTER CHIPS ROW
              ========================================================================= */}
          <div className="gzn-controls-row">
            <div className="gzn-filter-chips-wrap">
              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                <span>{isKhmer ? 'ទាំងអស់' : 'All'}</span>
                <span>({processedArticles.length})</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'high' ? 'active' : ''}`}
                onClick={() => handleFilterChange('high')}
              >
                <span className="gzn-chip-dot red" />
                <span>{isKhmer ? 'ឥទ្ធិពលខ្ពស់' : 'High Impact'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'medium' ? 'active' : ''}`}
                onClick={() => handleFilterChange('medium')}
              >
                <span className="gzn-chip-dot amber" />
                <span>{isKhmer ? 'ឥទ្ធិពលមធ្យម' : 'Medium'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'low' ? 'active' : ''}`}
                onClick={() => handleFilterChange('low')}
              >
                <span className="gzn-chip-dot slate" />
                <span>{isKhmer ? 'ឥទ្ធិពលទាប' : 'Low'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'COMMODITIES' ? 'active' : ''}`}
                onClick={() => handleFilterChange('COMMODITIES')}
              >
                <span>🥇 {isKhmer ? 'មាស & ទំនិញ' : 'Gold & Commodities'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'CENTRAL BANK' ? 'active' : ''}`}
                onClick={() => handleFilterChange('CENTRAL BANK')}
              >
                <span>🏦 {isKhmer ? 'Fed & ធនាគារកណ្តាល' : 'Central Bank'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'MACRO' ? 'active' : ''}`}
                onClick={() => handleFilterChange('MACRO')}
              >
                <span>📊 {isKhmer ? 'អតិផរណា Macro' : 'Macro / CPI'}</span>
              </button>

              <button
                type="button"
                className={`gzn-chip-btn ${activeFilter === 'FOREX' ? 'active' : ''}`}
                onClick={() => handleFilterChange('FOREX')}
              >
                <span>💵 {isKhmer ? 'រូបិយប័ណ្ណ FX' : 'Forex'}</span>
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="gzn-search-input-box">
              <span className="gzn-search-icon">🔍</span>
              <input
                type="text"
                className="gzn-search-input"
                placeholder={isKhmer ? 'ស្វែងរកព័ត៌មាន (Gold, Fed, CPI...)' : 'Search catalysts (Gold, Fed, CPI)...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* =========================================================================
              PIP AI RADAR • HOT BREAKING CATALYSTS (Featured Top Alert Box)
              ========================================================================= */}
          {hotBreakingArticles.length > 0 && activeFilter === 'all' && !searchQuery.trim() && (
            <div className="gzn-hot-reads-box">
              <div className="gzn-hot-header">
                <span className="gzn-hot-title">
                  <span>⚡</span>
                  <span>{isKhmer ? 'PIP AI RADAR • ព័ត៌មានក្ដៅៗដែលជះឥទ្ធិពលខ្លាំង' : 'PIP AI RADAR • HOT BREAKING CATALYSTS'}</span>
                </span>
                <span className="gzn-hot-live-tag">
                  <span className="gzn-live-pulse-dot" />
                  <span>{isKhmer ? 'ផ្សាយផ្ទាល់' : 'LIVE'}</span>
                </span>
              </div>

              <div className="gzn-hot-items-list">
                {hotBreakingArticles.map((article) => (
                  <div
                    key={article.url}
                    className="gzn-hot-item"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="gzn-hot-item-top">
                      <span className={`gzn-impact-badge ${article.impactLevel.toLowerCase()}`}>
                        {article.impactLevel}
                      </span>
                      <strong className="gzn-hot-headline">{article.title}</strong>
                      <div className="gzn-asset-tags-group">
                        {article.assetPills.map((pill, idx) => (
                          <span key={idx} className={`gzn-asset-pill ${pill.status}`}>
                            {pill.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="gzn-hot-takeaway">
                      <span className="gzn-hot-takeaway-bullet">▸</span>
                      <span>
                        <strong>{isKhmer ? 'ឥទ្ធិពលលើទីផ្សារ៖ ' : 'Market Transmission: '}</strong>
                        {article.goldImpact.explanation}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              MAIN CONTENT: 2-COLUMN NEWS GRID
              ========================================================================= */}
          {status === 'loading' && (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">{t.loading}</div>
            </div>
          )}

          {status === 'error' && (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <div className="empty-title">{isKhmer ? 'មិនអាចទាញយកព័ត៌មានបានទេ' : 'Could not fetch news feed'}</div>
              <button
                type="button"
                className="gzn-refresh-icon-btn"
                style={{ marginTop: 12 }}
                onClick={() => setReloadKey((k) => k + 1)}
              >
                ↻ {t.refresh}
              </button>
            </div>
          )}

          {status === 'loaded' && paginatedArticles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">
                {isKhmer ? 'រកមិនឃើញព័ត៌មានដែលត្រូវនឹងតម្រងនេះទេ' : 'No news found matching this filter'}
              </div>
              <button
                type="button"
                className="gzn-refresh-icon-btn"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
              >
                {isKhmer ? 'បង្ហាញព័ត៌មានទាំងអស់វិញ' : 'Show All Catalysts'}
              </button>
            </div>
          )}

          {status === 'loaded' && paginatedArticles.length > 0 && (
            <>
              <div className="gzn-news-grid">
                {paginatedArticles.map((article) => (
                  <div
                    key={article.url}
                    className="gzn-news-card"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div>
                      {/* Card Top Row: Category + Impact + Timestamp */}
                      <div className="gzn-card-top-row">
                        <div className="gzn-card-badges">
                          <span className={`gzn-impact-badge ${article.impactLevel.toLowerCase()}`}>
                            {article.impactLevel}
                          </span>
                          <span className="gzn-category-badge">{article.category}</span>
                        </div>
                        <span className="gzn-card-time">{article.timeInfo.fullDisplay}</span>
                      </div>

                      {/* Main Headline */}
                      <h3 className="gzn-card-headline" style={{ marginTop: 10, marginBottom: 8 }}>
                        {article.title}
                      </h3>

                      {/* Description snippet */}
                      {article.description && (
                        <p className="gzn-card-desc" style={{ marginBottom: 12 }}>
                          {article.description}
                        </p>
                      )}

                      {/* Multi-Asset Impact Matrix Pills */}
                      <div className="gzn-card-matrix-row" style={{ marginBottom: 12 }}>
                        {article.assetPills.map((pill, pIdx) => (
                          <span key={pIdx} className={`gzn-asset-pill ${pill.status}`}>
                            {pill.label}
                          </span>
                        ))}
                      </div>

                      {/* Dedicated Gold & Macro Transmission Callout */}
                      <div className="gzn-card-transmission-box">
                        <div className="gzn-transmission-header">
                          <span>🏆 {article.goldImpact.impactTitle}</span>
                          <span style={{ fontSize: 10.5, color: '#34d399' }}>📌 {article.goldImpact.driverTag}</span>
                        </div>
                        <p className="gzn-transmission-text">{article.goldImpact.explanation}</p>
                      </div>
                    </div>

                    {/* Card Footer: Source and Action */}
                    <div className="gzn-card-footer">
                      <span className="gzn-card-source">{article.source || 'Market Feed'}</span>
                      <span className="gzn-card-action-btn">
                        {isKhmer ? 'មើលការវិភាគ AI លម្អិត ▸' : 'AI Deep Breakdown ▸'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* =========================================================================
                  PAGINATION BAR
                  ========================================================================= */}
              <div className="gzn-pagination-bar">
                <span className="gzn-pagination-info">
                  {isKhmer
                    ? `បង្ហាញ ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                        currentPage * PAGE_SIZE,
                        filteredArticles.length
                      )} នៃ ${filteredArticles.length} ព័ត៌មានសកល`
                    : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                        currentPage * PAGE_SIZE,
                        filteredArticles.length
                      )} of ${filteredArticles.length} Market Catalysts`}
                </span>

                <div className="gzn-pagination-pages">
                  <button
                    type="button"
                    className="gzn-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`gzn-page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="gzn-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* =========================================================================
          DETAILED AI ARTICLE ANALYSIS MODAL
          ========================================================================= */}
      {selectedArticle && (
        <div className="gzn-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="gzn-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="gzn-modal-top">
              <div className="gzn-card-badges">
                <span className={`gzn-impact-badge ${selectedArticle.impactLevel.toLowerCase()}`}>
                  {selectedArticle.impactLevel}
                </span>
                <span className="gzn-category-badge">{selectedArticle.category}</span>
                <span className="gzn-card-time">{selectedArticle.timeInfo.fullDisplay}</span>
              </div>
              <button
                type="button"
                className="gzn-modal-close-btn"
                onClick={() => setSelectedArticle(null)}
              >
                ✕
              </button>
            </div>

            <h2 className="gzn-modal-title">{selectedArticle.title}</h2>

            {/* AI Analysis Container */}
            <div className="gzn-modal-ai-box">
              <div className="gzn-modal-ai-header">
                <span className="gzn-modal-ai-tag">
                  🤖 PIP AI INSTITUTIONAL AUDIT
                </span>
                {modalAnalysis?.confidence && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>
                    Confidence: {modalAnalysis.confidence.toUpperCase()}
                  </span>
                )}
              </div>

              {modalLoading ? (
                <div style={{ padding: '16px 0', color: '#38bdf8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="gzn-live-pulse-dot" />
                  <span>{isKhmer ? 'PIP AI កំពុងវិភាគ និងបកប្រែជាភាសាខ្មែរ...' : 'PIP AI is analyzing and translating...'}</span>
                </div>
              ) : (
                <>
                  <p className="gzn-modal-summary">
                    {modalAnalysis?.summary || selectedArticle.description}
                  </p>

                  {modalAnalysis?.explanation && (
                    <div style={{ margin: '14px 0', padding: '10px 14px', background: 'rgba(0, 242, 254, 0.05)', borderRadius: 8, borderLeft: '3px solid #00f2fe' }}>
                      <strong style={{ fontSize: 12, color: '#38bdf8', display: 'block', marginBottom: 4 }}>
                        {isKhmer ? 'យន្តការជះឥទ្ធិពលលើទីផ្សារ៖' : 'Market Transmission Verdict:'}
                      </strong>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.55 }}>
                        {modalAnalysis.explanation}
                      </p>
                    </div>
                  )}

                  {modalAnalysis?.keyTakeaways?.length > 0 && (
                    <>
                      <div className="gzn-modal-takeaways-title">
                        {isKhmer ? 'ចំណុចសំខាន់ៗដែលគួរកត់សម្គាល់៖' : 'Key Institutional Takeaways:'}
                      </div>
                      <ul className="gzn-modal-takeaways-list">
                        {modalAnalysis.keyTakeaways.map((point, kIdx) => (
                          <li key={kIdx}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="gzn-modal-actions">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="gzn-modal-source-link"
              >
                <span>{isKhmer ? 'អានប្រភពដើមលើ ' : 'Read on '} {selectedArticle.source || 'Publisher'}</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
