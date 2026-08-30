import { useState } from 'react';
import logo from '../assets/logo.jpg';
import LanguageDropdown from './LanguageDropdown.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Navbar({ onLogoClick, activeSection, onNavNews, onNavContact, user, onLogout }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).nav;
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNav(fn) {
    setMenuOpen(false);
    fn();
  }

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

        <button
          type="button"
          className="nav-burger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <LanguageDropdown />

        {user && (
          <button type="button" className="nav-logout" onClick={onLogout}>
            {t.logout}
          </button>
        )}
      </div>

      {menuOpen && (
        <div className="nav-mobile-menu">
          <a
            href="https://t.me/veng_sophea"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            {t.mentorship}
          </a>
          <button
            type="button"
            className={`nav-mobile-link${activeSection === 'news' ? ' active' : ''}`}
            onClick={() => handleNav(onNavNews)}
          >
            {t.news}
          </button>
          <button
            type="button"
            className={`nav-mobile-link${activeSection === 'contact' ? ' active' : ''}`}
            onClick={() => handleNav(onNavContact)}
          >
            {t.contact}
          </button>
          {user && (
            <button type="button" className="nav-mobile-link nav-mobile-logout" onClick={() => handleNav(onLogout)}>
              {t.logout}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
