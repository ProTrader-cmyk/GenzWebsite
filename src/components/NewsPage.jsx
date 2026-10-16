import { useEffect, useState, useMemo } from 'react';
import Footer from './Footer.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { analyzeGoldImpact } from '../utils/goldImpactAnalyzer.js';
import { classifyNewsArticle, formatNewsTime } from '../utils/newsClassifier.js';
import '../styles/newsPage.css';

// =========================================================================
// INSTITUTIONAL SVG ICONS (Replaces generic OS emojis)
// =========================================================================
const IconGrid = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconGold = ({ size = 14, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17h18l-2.5-7h-13L3 17z" fill={color} fillOpacity="0.22" />
    <path d="M6 10l2-5h8l2 5" />
    <line x1="9" y1="17" x2="10.5" y2="10" />
    <line x1="15" y1="17" x2="13.5" y2="10" />
  </svg>
);

const IconBank = ({ size = 14, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M12 3L2 8h20L12 3z" />
  </svg>
);

const IconBarChart = ({ size = 14, color = '#38bdf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <path d="M3 20h18" />
  </svg>
);

const IconForex = ({ size = 14, color = '#34d399' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 1.5 2.5 2 2.5 3.5a1.5 1.5 0 0 1-3 0" />
    <line x1="12" y1="6" x2="12" y2="7.5" />
    <line x1="12" y1="16.5" x2="12" y2="18" />
  </svg>
);

const IconSearch = ({ size = 14, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="21" y1="21" x2="16.3" y2="16.3" />
  </svg>
);

const IconTelegram = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.18 3.35-1.38 3.73-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

const IconRefresh = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
  </svg>
);

const IconZap = ({ size = 13, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCompass = ({ size = 13, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} fillOpacity="0.25" />
  </svg>
);

const IconTag = ({ size = 11, color = '#34d399' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const IconCpu = ({ size = 15, color = '#00e5ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconClose = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconExternalLink = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconChevronRight = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconNewspaper = ({ size = 32, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
  </svg>
);

const IconAlertShield = ({ size = 32, color = '#f43f5e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL || 'https://genzapi-production.up.railway.app';

export default function NewsPage({ onBack }) {
  const { lang } = useLanguage();
  const isKhmer = lang === 'km' || lang === 'kh';
  const t = getStrings(lang).news;

  // View & Filter States
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
              href="https://t.me/+LrfG1UgJ5hU4YzBl"
              target="_blank"
              rel="noopener noreferrer"
              className="gzn-tg-channel-btn"
            >
              <IconTelegram size={14} />
              <span>{isKhmer ? 'ទទួលដំណឹងតាម Telegram' : 'Live Telegram Alerts'}</span>
            </a>
            <button
              type="button"
              className="gzn-refresh-icon-btn"
              onClick={() => setReloadKey((k) => k + 1)}
              title="Refresh News Feed"
            >
              <IconRefresh size={13} />
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
      </div>

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
            <IconGrid size={13} color={activeFilter === 'all' ? '#38bdf8' : 'currentColor'} />
            <span>{isKhmer ? 'ទាំងអស់' : 'All'}</span>
            <span style={{ opacity: 0.75, fontSize: 11 }}>({processedArticles.length})</span>
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
            <IconGold size={14} color={activeFilter === 'COMMODITIES' ? '#fbbf24' : '#f59e0b'} />
            <span>{isKhmer ? 'មាស & ទំនិញ' : 'Gold & Commodities'}</span>
          </button>

          <button
            type="button"
            className={`gzn-chip-btn ${activeFilter === 'CENTRAL BANK' ? 'active' : ''}`}
            onClick={() => handleFilterChange('CENTRAL BANK')}
          >
            <IconBank size={14} color={activeFilter === 'CENTRAL BANK' ? '#c084fc' : '#a78bfa'} />
            <span>{isKhmer ? 'Fed & ធនាគារកណ្តាល' : 'Central Bank'}</span>
          </button>

          <button
            type="button"
            className={`gzn-chip-btn ${activeFilter === 'MACRO' ? 'active' : ''}`}
            onClick={() => handleFilterChange('MACRO')}
          >
            <IconBarChart size={14} color={activeFilter === 'MACRO' ? '#38bdf8' : '#38bdf8'} />
            <span>{isKhmer ? 'អតិផរណា Macro' : 'Macro / CPI'}</span>
          </button>

          <button
            type="button"
            className={`gzn-chip-btn ${activeFilter === 'FOREX' ? 'active' : ''}`}
            onClick={() => handleFilterChange('FOREX')}
          >
            <IconForex size={14} color={activeFilter === 'FOREX' ? '#34d399' : '#34d399'} />
            <span>{isKhmer ? 'រូបិយប័ណ្ណ FX' : 'Forex'}</span>
          </button>
        </div>

        {/* Keyword Search Input */}
        <div className="gzn-search-input-box">
          <span className="gzn-search-icon">
            <IconSearch size={14} color="#64748b" />
          </span>
          <input
            type="text"
            className="gzn-search-input"
            placeholder={isKhmer ? 'ស្វែងរកព័ត៌មាន (Gold, Fed, CPI)...' : 'Search catalysts (Gold, Fed, CPI)...'}
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
              <IconZap size={14} color="#fbbf24" />
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
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconNewspaper size={36} color="#38bdf8" />
              </div>
              <div className="empty-title">{t.loading}</div>
            </div>
          )}

          {status === 'error' && (
            <div className="empty-state">
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconAlertShield size={36} color="#f43f5e" />
              </div>
              <div className="empty-title">{isKhmer ? 'មិនអាចទាញយកព័ត៌មានបានទេ' : 'Could not fetch news feed'}</div>
              <button
                type="button"
                className="gzn-refresh-icon-btn"
                style={{ marginTop: 12 }}
                onClick={() => setReloadKey((k) => k + 1)}
              >
                <IconRefresh size={13} />
                <span>{t.refresh}</span>
              </button>
            </div>
          )}

          {status === 'loaded' && paginatedArticles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconSearch size={36} color="#64748b" />
              </div>
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
                <IconRefresh size={13} />
                <span>{isKhmer ? 'បង្ហាញព័ត៌មានទាំងអស់វិញ' : 'Show All Catalysts'}</span>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <IconCompass size={13} color="#f59e0b" />
                            <span>{article.goldImpact.impactTitle}</span>
                          </span>
                          <span style={{ fontSize: 10.5, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconTag size={11} color="#34d399" />
                            <span>{article.goldImpact.driverTag}</span>
                          </span>
                        </div>
                        <p className="gzn-transmission-text">{article.goldImpact.explanation}</p>
                      </div>
                    </div>

                    {/* Card Footer: Source and Action */}
                    <div className="gzn-card-footer">
                      <span className="gzn-card-source">{article.source || 'Market Feed'}</span>
                      <span className="gzn-card-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span>{isKhmer ? 'មើលការវិភាគ AI លម្អិត' : 'AI Deep Breakdown'}</span>
                        <IconChevronRight size={13} />
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
                <IconClose size={15} />
              </button>
            </div>

            <h2 className="gzn-modal-title">{selectedArticle.title}</h2>

            {/* AI Analysis Container */}
            <div className="gzn-modal-ai-box">
              <div className="gzn-modal-ai-header">
                <span className="gzn-modal-ai-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCpu size={15} color="#00e5ff" />
                  <span>{isKhmer ? 'ការវិភាគស៊ីជម្រៅ PIP AI' : 'PIP AI INSTITUTIONAL AUDIT'}</span>
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
                <IconExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
