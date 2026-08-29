import logo from '../assets/logo.jpg';

export default function Navbar({ onLogoClick, activeSection, onNavNews, onNavContact, user, onLogout }) {
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

        <div className="nav-links sg">
          <a href="https://t.me/veng_sophea" target="_blank" rel="noopener noreferrer" className="nav-link">
            Private Mentorship
          </a>
          <button
            type="button"
            className={`nav-link${activeSection === 'news' ? ' active' : ''}`}
            onClick={onNavNews}
          >
            GenZ NEWS
          </button>
          <button
            type="button"
            className={`nav-link${activeSection === 'contact' ? ' active' : ''}`}
            onClick={onNavContact}
          >
            Contact Us
          </button>
        </div>

        {user && (
          <button type="button" className="nav-logout sg" onClick={onLogout}>
            ចេញពីប្រព័ន្ធ
          </button>
        )}
      </div>
    </nav>
  );
}
