import { FacebookIcon, TelegramIcon, YoutubeIcon, TiktokIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/share/1CJP5eCsRk/?mibextid=wwXIfr', Icon: FacebookIcon },
  { name: 'Telegram', href: 'https://t.me/Vengsopheagenz', Icon: TelegramIcon },
  { name: 'YouTube', href: 'https://www.youtube.com/@alexender868', Icon: YoutubeIcon },
  { name: 'TikTok', href: 'https://www.tiktok.com/@vengsophea18', Icon: TiktokIcon },
];

// `section` links use the site's ?section= deep links; every item here has a page.
const COLUMNS = [
  {
    title: 'learn',
    items: [
      { label: 'lessons', section: 'categories' },
      { label: 'technical', section: 'technical' },
      { label: 'advanced', section: 'advanced' },
      { label: 'psychology', section: 'psychology' },
      { label: 'backtest', section: 'backtest' },
    ],
  },
  {
    title: 'trading',
    items: [
      { label: 'aiTrading', section: 'ai-trading' },
      { label: 'news', section: 'news' },
      { label: 'memberArea', section: 'member-preview' },
    ],
  },
  {
    title: 'company',
    items: [
      { label: 'contact', section: 'contact' },
      { label: 'about', section: 'about' },
      { label: 'blog', section: 'blog' },
    ],
  },
  {
    title: 'support',
    items: [
      { label: 'terms', section: 'terms' },
      { label: 'privacy', section: 'privacy' },
    ],
  },
];

export default function Footer() {
  const { lang } = useLanguage();
  const t = getStrings(lang).footer;

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-brand-name">GenZ Trader</div>
          <p className="footer-tagline">{t.tagline}</p>
          <div className="footer-social">
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label={name}>
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className="footer-col" aria-label={t[col.title]}>
            <h4 className="footer-col-title">{t[col.title]}</h4>
            <ul>
              {col.items.map((item) => (
                <li key={item.label}>
                  <a className="footer-link" href={`?section=${item.section}`}>{t[item.label]}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="footer-bottom">
        <p className="footer-disclaimer">{t.disclaimer}</p>
        <p className="footer-text">
          {t.line1}
          <br />
          {t.line2}
        </p>
      </div>
    </footer>
  );
}
