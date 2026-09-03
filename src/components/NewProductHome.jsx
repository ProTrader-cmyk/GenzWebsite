import Footer from './Footer.jsx';
import GoldChart from './GoldChart.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function NewProductHome({ onBack, isActive = true }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;

  return (
    <div className={`view${isActive ? ' active' : ''}`} id="v-new-product">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <GoldChart />

      <Footer />
    </div>
  );
}
