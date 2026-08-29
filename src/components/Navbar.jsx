import logo from '../assets/logo.jpg';
import LanguageDropdown from './LanguageDropdown.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Navbar({ onLogoClick, activeSection, onNavNews, onNavContact, user, onLogout }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).nav;

  return (
    <nav className="nav">
      <div className="nav-in">
        <div className="logo" onClick={onLogoClick}>
          <div className="logo-icon">
            <img src={logo} alt="GenZ Trader" />
          </div>
          <span className="logo-name">
            Gen<b>Z</b> Trader
          </span>
        </div>

        <div className="nav-links">
          <a href="https://t.me/veng_sophea" target="_blank" rel="noopener noreferrer" className="nav-link">
            {t.mentorship}
          </a>
          <button
            type="button"
            className={`nav-link${activeSection === 'news' ? ' active' : ''}`}
            onClick={onNavNews}
          >
            {t.news}
          </button>
          <button
            type="button"
            className={`nav-link${activeSection === 'contact' ? ' active' : ''}`}
            onClick={onNavContact}
          >
            {t.contact}
          </button>
        </div>

        <LanguageDropdown />

        {user && (
          <button type="button" className="nav-logout sg" onClick={onLogout}>
            {t.logout}
          </button>
        )}
      </div>
    </nav>
  );
}
