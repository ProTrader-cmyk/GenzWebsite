import logo from '../assets/logo.jpg';

export default function Navbar({
  onLogoClick,
  activeSection,
  onNavNews,
  onNavContact,
  user,
  onLogout,
  locked,
}) {
  return (
    <nav className="nav">
      <div className="nav-in">
        <div className={`logo${locked ? ' nav-disabled' : ''}`} onClick={locked ? undefined : onLogoClick}>
          <div className="logo-icon">
            <img src={logo} alt="GenZ Trader" />
          </div>
          <span className="logo-name">
            Gen<b>Z</b> Trader
          </span>
        </div>

        <div className="nav-links sg">
          <a
            href="https://t.me/veng_sophea"
            target="_blank"
            rel="noopener noreferrer"
            className={`nav-link${locked ? ' nav-disabled' : ''}`}
            onClick={locked ? (e) => e.preventDefault() : undefined}
            tabIndex={locked ? -1 : undefined}
          >
            Private Mentorship
          </a>
          <button
            type="button"
            className={`nav-link${activeSection === 'news' ? ' active' : ''}`}
            onClick={onNavNews}
            disabled={locked}
          >
            GenZ NEWS
          </button>
          <button
            type="button"
            className={`nav-link${activeSection === 'contact' ? ' active' : ''}`}
            onClick={onNavContact}
            disabled={locked}
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
