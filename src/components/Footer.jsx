import { FacebookIcon, TelegramIcon, YoutubeIcon, TiktokIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/share/1CJP5eCsRk/?mibextid=wwXIfr', Icon: FacebookIcon },
  { name: 'Telegram', href: 'https://t.me/Vengsopheagenz', Icon: TelegramIcon },
  { name: 'YouTube', href: 'https://www.youtube.com/@alexender868', Icon: YoutubeIcon },
  { name: 'TikTok', href: 'https://www.tiktok.com/@vengsophea18', Icon: TiktokIcon },
];

export default function Footer() {
  const { lang } = useLanguage();
  const t = getStrings(lang).footer;

  return (
    <footer className="site-footer">
      <div className="footer-social">
        {SOCIAL_LINKS.map(({ name, href, Icon }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label={name}>
            <Icon />
          </a>
        ))}
      </div>

      <p className="footer-text">
        {t.line1}
        <br />
        {t.line2}
      </p>
    </footer>
  );
}
