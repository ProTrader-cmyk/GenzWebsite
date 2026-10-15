import { useEffect, useState } from 'react';
import Footer from './Footer.jsx';
import Trans from '../i18n/Trans.jsx';
import EconomicCalendar from './EconomicCalendar.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import { analyzeGoldImpact } from '../utils/goldImpactAnalyzer.js';

// Set once the backend (genztrader-news-api, deployed on Railway) is live.
// Until then the page falls back to the static "coming soon" panel below.
const NEWS_API_URL = import.meta.env.VITE_NEWS_API_URL;

const LOCALE_BY_LANG = { kh: 'km-KH', en: 'en-US' };

function formatPublished(iso, lang) {
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] || 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

const DIRECTION_META = {
  bullish: { icon: '▲', cls: 'gna-up' },
  bearish: { icon: '▼', cls: 'gna-down' },
  neutral: { icon: '■', cls: 'gna-flat' },
};

function NewsCard({ a, lang, readMoreLabel, featured, onOpen }) {
  const isKhmer = lang === 'km' || lang === 'kh';
  const impact = analyzeGoldImpact(a, lang);

  return (
    <div
      className={featured ? 'news-featured' : 'news-card'}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(a)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(a);
      }}
    >
      {a.imageUrl && (
        <div className="news-thumb" style={{ backgroundImage: `url(${a.imageUrl})` }}>
          <div className={`news-thumb-impact-badge impact-badge-${impact.direction}`}>
            {impact.biasTag}
          </div>
        </div>
      )}
      <div className="news-body">
        <div className="news-title">{a.title}</div>
        {a.description && <div className="news-desc">{a.description}</div>}

        {/* Dedicated Gold Impact Panel */}
        <div className={`gold-impact-panel gold-impact-${impact.direction} ${featured ? 'featured-panel' : ''}`}>
          <div className="gold-impact-panel-header">
            <div className="gold-impact-title-group">
              <span className="gold-impact-icon">🏆</span>
              <span className="gold-impact-heading">
                {isKhmer ? 'ឥទ្ធិពលលើមាស (XAU/USD)' : 'Impact on Gold (XAU/USD)'}
              </span>
            </div>
            <span className={`gold-impact-badge gold-impact-badge-${impact.direction}`}>
              {impact.biasTag}
            </span>
          </div>

          <p className="gold-impact-explanation">{impact.explanation}</p>

          <div className="gold-impact-footer-row">
            <span className="gold-impact-driver">
              📌 {impact.driverTag}
            </span>
            {featured && (
              <span className="gold-impact-tip">
                💡 {impact.tradingTip}
              </span>
            )}
          </div>
        </div>

        <div className="news-meta">
          <span className="news-source">{a.source}</span>
          <span className="news-time">{formatPublished(a.publishedAt, lang)}</span>
          <span className="news-readmore">{readMoreLabel}</span>
        </div>
      </div>
    </div>
  );
}

const ARTICLE_DIRECTION_ICON = { bullish: '▲', bearish: '▼', neutral: '■' };

// A full in-site reading view — swaps into the same spot the news list was
// in (like navigating to a lesson), not a popup. Claude's summary reads like
// the article; the gold-impact verdict sits in its own section at the
// bottom, with the original source linked underneath for anyone who wants it.
function ArticleView({ article, lang, onBack }) {
  const t = getStrings(lang).news;
  const [state, setState] = useState('loading'); // loading | loaded | error
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetch(`${NEWS_API_URL}/api/news/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: article.url, title: article.title, description: article.description, lang }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAnalysis(data);
        setState('loaded');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [article.url, lang]);

  const confidenceLabel = analysis
    ? { low: t.confidenceLow, medium: t.confidenceMedium, high: t.confidenceHigh }[analysis.confidence]
    : null;

  return (
    <div className="article-view">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="article-meta">
        <span className="news-source">{article.source}</span>
        <span className="news-time">{formatPublished(article.publishedAt, lang)}</span>
      </div>
      <h2 className="article-title">{article.title}</h2>

      {article.imageUrl && <div className="article-thumb" style={{ backgroundImage: `url(${article.imageUrl})` }} />}

      {state === 'loading' && <div className="article-loading">{t.analyzing}</div>}

      {state === 'error' && <p className="article-body">{article.description}</p>}

      {state === 'loaded' && analysis && (
        <>
          <p className="article-body">{analysis.summary}</p>

          <div className={`gna-card article-verdict ${DIRECTION_META[analysis.direction]?.cls || 'gna-flat'}`}>
            <div className="gna-top">
              <div className="gna-eyebrow">{t.articleAnalysisTitle}</div>
              <div className="gna-badge">{analysis.impactsGold ? t.impactsGold : t.noGoldImpact}</div>
            </div>
            <div className="gna-title">
              {ARTICLE_DIRECTION_ICON[analysis.direction]} {t[analysis.direction] || analysis.direction}
            </div>
            {confidenceLabel && <div className="gna-confidence">{confidenceLabel}</div>}
            <p className="gna-summary">{analysis.explanation}</p>
            {analysis.keyTakeaways?.length > 0 && (
              <>
                <div className="gna-drivers-label">{t.keyTakeaways}</div>
                <ul className="gna-drivers">
                  {analysis.keyTakeaways.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="gna-disclaimer">{t.analysisDisclaimer}</div>
          </div>
        </>
      )}

      <a className="article-source-link" href={article.url} target="_blank" rel="noopener noreferrer">
        {t.readFullArticle}
      </a>
    </div>
  );
}

export default function NewsPage({ onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).news;
  const [tab, setTab] = useState('news'); // 'news' | 'calendar'

  const [status, setStatus] = useState(NEWS_API_URL ? 'loading' : 'unconfigured'); // loading | loaded | error | unconfigured
  const [articles, setArticles] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    if (!NEWS_API_URL) return;
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
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const isKhmer = lang === 'km' || lang === 'kh';
  const [impactFilter, setImpactFilter] = useState('all'); // 'all' | 'bullish' | 'bearish' | 'volatile'

  const filteredArticles = articles.filter((a) => {
    if (impactFilter === 'all') return true;
    const impact = analyzeGoldImpact(a, lang);
    if (impactFilter === 'volatile') {
      return impact.direction === 'volatile' || impact.direction === 'neutral';
    }
    return impact.direction === impactFilter;
  });

  const counts = {
    all: articles.length,
    bullish: articles.filter((a) => analyzeGoldImpact(a, lang).direction === 'bullish').length,
    bearish: articles.filter((a) => analyzeGoldImpact(a, lang).direction === 'bearish').length,
    volatile: articles.filter((a) => ['volatile', 'neutral'].includes(analyzeGoldImpact(a, lang).direction)).length,
  };

  const [featuredArticle, ...restArticles] = filteredArticles;

  if (selectedArticle) {
    return (
      <div className="view active" id="v-news">
        <ArticleView article={selectedArticle} lang={lang} onBack={() => setSelectedArticle(null)} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="view active" id="v-news">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="news-tabs">
        <button className={`news-tab ${tab === 'news' ? 'news-tab-active' : ''}`} onClick={() => setTab('news')}>
          {t.tabNews}
        </button>
        <button
          className={`news-tab ${tab === 'calendar' ? 'news-tab-active' : ''}`}
          onClick={() => setTab('calendar')}
        >
          {t.tabCalendar}
        </button>
      </div>

      {tab === 'calendar' && <EconomicCalendar />}

      {tab === 'news' && (
        <>
          {(status === 'unconfigured' || status === 'error') && (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">{t.comingSoonTitle}</div>
              <p className="empty-sub">
                <Trans text={t.comingSoonBody} />
              </p>
            </div>
          )}

          {status === 'loading' && (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">{t.loading}</div>
            </div>
          )}

          {status === 'loaded' && articles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">{t.emptyTitle}</div>
            </div>
          )}

          {status === 'loaded' && articles.length > 0 && (
            <>
              <div className="news-toolbar">
                {fetchedAt && (
                  <span className="news-updated">
                    {t.updatedAt}: {formatPublished(new Date(fetchedAt).toISOString(), lang)}
                  </span>
                )}
                <button className="news-refresh-btn" onClick={() => setReloadKey((k) => k + 1)}>
                  ↻ {t.refresh}
                </button>
              </div>

              {/* Gold Impact Filter Bar */}
              <div className="gold-impact-filter-bar">
                <button
                  type="button"
                  className={`impact-filter-pill ${impactFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setImpactFilter('all')}
                >
                  {isKhmer ? 'ព័ត៌មានទាំងអស់' : 'All Catalysts'} ({counts.all})
                </button>
                <button
                  type="button"
                  className={`impact-filter-pill filter-bullish ${impactFilter === 'bullish' ? 'active' : ''}`}
                  onClick={() => setImpactFilter('bullish')}
                >
                  ▲ {isKhmer ? 'និន្នាការឡើង (Bullish)' : 'Bullish (+XAU)'} ({counts.bullish})
                </button>
                <button
                  type="button"
                  className={`impact-filter-pill filter-bearish ${impactFilter === 'bearish' ? 'active' : ''}`}
                  onClick={() => setImpactFilter('bearish')}
                >
                  ▼ {isKhmer ? 'និន្នាការចុះ (Bearish)' : 'Bearish (-XAU)'} ({counts.bearish})
                </button>
                <button
                  type="button"
                  className={`impact-filter-pill filter-volatile ${impactFilter === 'volatile' ? 'active' : ''}`}
                  onClick={() => setImpactFilter('volatile')}
                >
                  ⚡ {isKhmer ? 'ប្រែប្រួលខ្លាំង' : 'Volatile (CPI/Fed)'} ({counts.volatile})
                </button>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="empty-state" style={{ padding: '36px 20px', marginTop: '16px' }}>
                  <div className="empty-icon">🔍</div>
                  <div className="empty-title">
                    {isKhmer ? 'មិនមានព័ត៌មានត្រូវនឹងតម្រងនេះទេ' : 'No news matching this impact filter'}
                  </div>
                  <button className="news-refresh-btn" style={{ marginTop: '14px' }} onClick={() => setImpactFilter('all')}>
                    {isKhmer ? 'បង្ហាញទាំងអស់វិញ' : 'Show All News'}
                  </button>
                </div>
              ) : (
                <>
                  {featuredArticle && (
                    <>
                      <div className="news-section-label">
                        {impactFilter === 'all'
                          ? t.featured
                          : (isKhmer ? `លទ្ធផល (${filteredArticles.length})` : `Filtered Catalysts (${filteredArticles.length})`)}
                      </div>
                      <NewsCard a={featuredArticle} lang={lang} readMoreLabel={t.readMore} featured onOpen={setSelectedArticle} />
                    </>
                  )}

                  {restArticles.length > 0 && (
                    <>
                      <div className="news-section-label">{t.moreNews}</div>
                      <div className="news-grid">
                        {restArticles.map((a) => (
                          <NewsCard key={a.url} a={a} lang={lang} readMoreLabel={t.readMore} onOpen={setSelectedArticle} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <Footer />
    </div>
  );
}
