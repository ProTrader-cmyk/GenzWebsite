import Footer from './Footer.jsx';
import { TelegramIcon } from './ui/CategoryIcons.jsx';

const TELEGRAM_URL = 'https://t.me/Vengsopheagenz?direct';

export default function ContactPage({ onBack }) {
  return (
    <div className="view active" id="v-contact">
      <button className="back" onClick={onBack}>
        ← ត្រឡប់ក្រោយ
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">Contact Us</div>
        <h2>ទាក់ទងមកកាន់ Mentor</h2>
        <p>មានសំណួរអំពី Course ឬចង់ដឹងបន្ថែម? ទាក់ទងមកយើងខ្ញុំតាមរយៈ Telegram</p>
      </div>

      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="contact-card">
        <div className="contact-icon">
          <TelegramIcon />
        </div>
        <div className="contact-info">
          <div className="contact-label">Telegram</div>
          <div className="contact-value">Veng Sophea — GenZ Trader</div>
        </div>
        <div className="contact-go">→</div>
      </a>

      <Footer />
    </div>
  );
}
