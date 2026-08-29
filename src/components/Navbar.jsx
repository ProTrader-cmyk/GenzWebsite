import logo from '../assets/logo.jpg';

export default function Navbar({ onLogoClick }) {
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
        <span className="nav-pill sg">Private Mentorship</span>
      </div>
    </nav>
  );
}
