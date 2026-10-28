import { useState } from 'react';
import Footer from './Footer.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  ABOUT, BLOG_POSTS, CONTACT_TELEGRAM, LEGAL_UPDATED, PRIVACY, TERMS,
} from '../data/siteContent.js';
import '../styles/infoPages.css';

const isKm = (lang) => lang === 'km' || lang === 'kh';

function Shell({ onBack, eyebrow, title, intro, children, lang }) {
  return (
    <div className="view active info-page" id="v-info">
      <button type="button" className="back" onClick={onBack}>
        {isKm(lang) ? '← ត្រឡប់ក្រោយ' : '← Back'}
      </button>
      <header className="info-hero">
        {eyebrow && <div className="info-eyebrow">{eyebrow}</div>}
        <h1 className="info-title">{title}</h1>
        {intro && <p className="info-intro">{intro}</p>}
      </header>
      {children}
      <Footer />
    </div>
  );
}

function Blocks({ sections }) {
  return sections.map((s) => (
    <section key={s.title} className="info-block">
      <h2>{s.title}</h2>
      {s.body?.map((p) => <p key={p}>{p}</p>)}
      {s.list && <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
    </section>
  ));
}

export function AboutPage({ onBack }) {
  const { lang } = useLanguage();
  const c = isKm(lang) ? ABOUT.km : ABOUT.en;
  return (
    <Shell onBack={onBack} eyebrow={c.eyebrow} title={c.title} intro={c.intro} lang={lang}>
      <div className="info-body">
        <Blocks sections={c.blocks} />
        <div className="info-cta">
          <div>
            <h3>{c.ctaTitle}</h3>
            <p>{c.ctaBody}</p>
          </div>
          <a className="info-cta-btn" href={CONTACT_TELEGRAM} target="_blank" rel="noopener noreferrer">{c.ctaButton}</a>
        </div>
      </div>
    </Shell>
  );
}

function LegalNote({ lang }) {
  if (!isKm(lang)) return null;
  return <p className="info-note">ឯកសារផ្លូវច្បាប់នេះត្រូវបានផ្តល់ជាភាសាអង់គ្លេស។ សូមទាក់ទងមកយើងប្រសិនបើអ្នកត្រូវការជំនួយក្នុងការយល់។</p>;
}

function LegalPage({ onBack, doc }) {
  const { lang } = useLanguage();
  return (
    <Shell onBack={onBack} eyebrow={`${isKm(lang) ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Last updated'}: ${LEGAL_UPDATED}`} title={doc.title} intro={doc.intro} lang={lang}>
      <div className="info-body legal">
        <LegalNote lang={lang} />
        <Blocks sections={doc.sections} />
      </div>
    </Shell>
  );
}

export const TermsPage = ({ onBack }) => <LegalPage onBack={onBack} doc={TERMS} />;
export const PrivacyPage = ({ onBack }) => <LegalPage onBack={onBack} doc={PRIVACY} />;

export function BlogPage({ onBack }) {
  const { lang } = useLanguage();
  const km = isKm(lang);
  const [slug, setSlug] = useState(null);
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (post) {
    return (
      <Shell onBack={() => setSlug(null)} eyebrow={`${post.tag} · ${post.date} · ${post.minutes} min read`} title={post.title} lang={lang}>
        <article className="info-body legal">
          {post.body.map((p) => <p key={p}>{p}</p>)}
          <p className="info-note">{km ? 'សម្រាប់ការសិក្សាប៉ុណ្ណោះ មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុទេ។' : 'For education only. This is not financial advice.'}</p>
        </article>
      </Shell>
    );
  }

  return (
    <Shell
      onBack={onBack}
      eyebrow={km ? 'ប្លក់' : 'Blog'}
      title={km ? 'អត្ថបទអប់រំអំពីការជួញដូរ' : 'Trading education, in plain language'}
      intro={km ? 'ចំណេះដឹងខ្លីៗអំពីការគ្រប់គ្រងហានិភ័យ យុទ្ធសាស្ត្រ AI និងចិត្តវិទ្យា។ (អត្ថបទជាភាសាអង់គ្លេស)' : 'Short reads on risk, strategy, AI and psychology.'}
      lang={lang}
    >
      <div className="blog-grid">
        {BLOG_POSTS.map((p) => (
          <button key={p.slug} type="button" className="blog-card" onClick={() => setSlug(p.slug)}>
            <span className="blog-tag">{p.tag}</span>
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <span className="blog-meta">{p.date} · {p.minutes} min read</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}
