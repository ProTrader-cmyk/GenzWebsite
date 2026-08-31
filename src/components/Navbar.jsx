import { useState } from 'react';
import logo from '../assets/Fav.png';
import LanguageDropdown from './LanguageDropdown.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function Navbar({
  onLogoClick,
  activeSection,
  onNavHome,
  onNavPricing,
  onNavNews,
  onNavContact,
  user,
  onLogout,
  isAdmin,
  onNavAdmin,
  showNavLinks = true,
}) {
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

        {showNavLinks && (
          <div className="nav-links">
            <button
              type="button"
              className={`nav-link${activeSection === 'categories' ? ' active' : ''}`}
              onClick={onNavHome}
            >
              {t.home}
            </button>
            <button
              type="button"
              className={`nav-link${activeSection === 'pricing' ? ' active' : ''}`}
              onClick={onNavPricing}
            >
              {t.pricing}
            </button>
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
        )}

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

        <ThemeToggle />
        <LanguageDropdown />

        {isAdmin && (
          <button type="button" className="nav-link" onClick={onNavAdmin}>
            {t.admin}
          </button>
        )}
        {user && (
          <button type="button" className="nav-logout" onClick={onLogout}>
            {t.logout}
          </button>
        )}
      </div>

      {menuOpen && (
        <div className="nav-mobile-menu">
          {showNavLinks && (
            <>
              <button
                type="button"
                className={`nav-mobile-link${activeSection === 'categories' ? ' active' : ''}`}
                onClick={() => handleNav(onNavHome)}
              >
                {t.home}
              </button>
              <button
                type="button"
                className={`nav-mobile-link${activeSection === 'pricing' ? ' active' : ''}`}
                onClick={() => handleNav(onNavPricing)}
              >
                {t.pricing}
              </button>
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
            </>
          )}
          {isAdmin && (
            <button type="button" className="nav-mobile-link" onClick={() => handleNav(onNavAdmin)}>
              {t.admin}
            </button>
          )}
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
