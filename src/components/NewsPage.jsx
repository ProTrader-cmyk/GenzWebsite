import Footer from './Footer.jsx';

export default function NewsPage({ onBack }) {
  return (
    <div className="view active" id="v-news">
      <button className="back" onClick={onBack}>
        ← ត្រឡប់ក្រោយ
      </button>

      <div className="sec-hero">
        <div className="sec-hero-ey sg">GenZ NEWS</div>
        <h2>ព័ត៌មាន & ការវិភាគទីផ្សារ</h2>
        <p>ព័ត៌មាន Trading, ការវិភាគទីផ្សារ និងព័ត៌មានថ្មីៗពី GenZ Trader នឹងបង្ហាញនៅទីនេះ</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">📰</div>
        <div className="empty-title">ឆាប់ៗនេះ</div>
        <p className="empty-sub">
          យើងកំពុងរៀបចំមាតិកាព័ត៌មាន និងការវិភាគទីផ្សារសម្រាប់ផ្នែកនេះ។ សូមតាមដានទំព័រនេះជាប្រចាំ ឬចុច{' '}
          <strong>Contact Us</strong> ដើម្បីទទួលបានការជូនដំណឹងនៅពេលមាតិកាថ្មីមកដល់។
        </p>
      </div>

      <Footer />
    </div>
  );
}
