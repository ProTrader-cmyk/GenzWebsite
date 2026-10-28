import Footer from './Footer.jsx';
import { TelegramIcon } from './ui/CategoryIcons.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';
import '../styles/infoPages.css';

// Same three people, roles and Telegram handles as the team section on the home page.
const TEAM = [
  { name: 'Veng Sophea', handle: 'veng_sophea', accent: '#F5B94A', role: 'CEO & Founder', roleKm: 'CEO & ស្ថាបនិក' },
  { name: 'Lim Sunhour', handle: 'huarrrrr', accent: '#2DD4BF', role: 'COO & Head of Risk', roleKm: 'COO & ប្រធានផ្នែកហានិភ័យ' },
  { name: 'Sen Visal', handle: 'visalsen0630', accent: '#A78BFA', role: 'Lead AI & Software Engineer', roleKm: 'ប្រធានផ្នែក AI & Software' },
];

export default function ContactPage({ onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).contact;
  const isKhmer = lang === 'km' || lang === 'kh';

  return (
    <div className="view active" id="v-contact">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <header className="contact-hero">
        <span className="contact-hero-glow" aria-hidden="true" />
        <div className="contact-eyebrow">{t.eyebrow}</div>
        <h1 className="contact-title">{isKhmer ? 'ជជែកជាមួយក្រុមរបស់យើង' : <>Talk to <span>our team</span></>}</h1>
        <p className="contact-sub">{isKhmer ? 'ជ្រើសរើសអ្នកដែលអ្នកចង់ទាក់ទង ហើយផ្ញើសារមកយើងតាម Telegram។' : 'Pick who you want to reach and message us directly on Telegram.'}</p>
      </header>

      <div className="team-grid">
        {TEAM.map((m, i) => (
          <article
            key={m.handle}
            className="team-card"
            style={{ '--accent': m.accent, '--i': i }}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
          >
            <div className="team-avatar" aria-hidden="true">
              <span>{m.name.split(' ').map((w) => w[0]).join('')}</span>
              <i className="team-avatar-tg"><TelegramIcon /></i>
            </div>
            <h3 className="team-name">{m.name}</h3>
            <span className="team-chip">{isKhmer ? m.roleKm : m.role}</span>
            <a className="team-btn" href={`https://t.me/${m.handle}?direct`} target="_blank" rel="noopener noreferrer">
              <span><b>@{m.handle}</b></span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </article>
        ))}
      </div>

      <Footer />
    </div>
  );
}
