import Footer from './Footer.jsx';
import GoldChart from './GoldChart.jsx';
import Box from './ui/Box.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getStrings } from '../i18n/strings.js';

export default function NewProductHome({ onBack }) {
  const { lang } = useLanguage();
  const t = getStrings(lang).newProduct;

  return (
    <div className="view active" id="v-new-product">
      <button className="back" onClick={onBack}>
        {t.back}
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>

      <Box variant="b">{t.intro}</Box>

      <GoldChart />

      <Footer />
    </div>
  );
}
