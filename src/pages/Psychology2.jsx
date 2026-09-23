import LessonLayout from '../components/LessonLayout.jsx';
import Box from '../components/ui/Box.jsx';
import Rule from '../components/ui/Rule.jsx';
import BookCard from '../components/ui/BookCard.jsx';
import { getPsychologyLessonMeta } from '../data/psychologyLessons.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useVideos } from '../data/useVideos.js';

function LessonVideo({ src, caption }) {
  // Skip the block entirely until its URL is set, instead of showing an
  // empty/broken player.
  if (!src) return null;
  return (
    <div className="fig" style={{ padding: 10, margin: '14px 0 4px' }}>
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        preload="metadata"
        style={{ width: '100%', borderRadius: 8, display: 'block', background: '#000' }}
      >
        <source src={src} type="video/mp4" />
      </video>
      {caption && <div className="cap">{caption}</div>}
    </div>
  );
}

const meta = getPsychologyLessonMeta('psy2');

const CONTENT = {
  kh: {
    finishUnlocked: '✓ បញ្ចប់មេរៀន',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'និពន្ធដោយ Mark Douglas',
    chapterTag: 'ជំពូកទី ២',
    chapterHeading: 'ភាពទាក់ទាញ (និងគ្រោះថ្នាក់) នៃការ Trading',
    intro:
      '📖 Trading ទាក់ទាញមនុស្សគ្រប់គ្នា ព្រោះវាហាក់ដូចជាផ្លូវងាយបំផុតទៅកាន់សេរីភាព — គ្មានចៅហ្វាយ គ្មានម៉ោងធ្វើការ គ្មានដែនកំណត់លើចំណូល។ ប៉ុន្តែសេរីភាពដ៏ធំនោះ គឺជាបញ្ហាចំបងផងដែរ។',
    p1: 'ក្នុងវិជ្ជាជីវៈស្ទើរតែទាំងអស់ មានច្បាប់ រចនាសម្ព័ន្ធ និងអ្នកគ្រប់គ្រងដែលបង្ខំឲ្យអ្នកប្រព្រឹត្តអោយបានត្រឹមត្រូវ។ ប៉ុន្តែក្នុង Trading គ្មានអ្វីទាំងនោះទេ — Market មិនប្រាប់អ្នកថាត្រូវធ្វើអ្វី ត្រូវចូលពេលណា ត្រូវចេញពេលណា ឬត្រូវ risk ប៉ុន្មានទេ។ អ្នកមានសេរីភាពពេញលេញក្នុងការសម្រេចចិត្ត — ហើយនោះជាកន្លែងដែលបញ្ហាចាប់ផ្តើម។',
    p2: 'ដោយសារគ្មានដែនកំណត់ខាងក្រៅ Trader ថ្មីៗច្រើនតែយកចរិតចាស់ៗពីជីវិតប្រចាំថ្ងៃ (ការភ័យខ្លាច ការលោភ ការសង្ឃឹមចង់បានលឿន) ចូលមកក្នុង Market ដោយមិនដឹងខ្លួន។ Market ដូចជា mirror មួយ ដែលឆ្លុះបញ្ចាំងអារម្មណ៍ និងចំណុចខ្សោយផ្លូវចិត្តរបស់អ្នកយ៉ាងឆាប់រហ័ស — ហើយផ្តល់ discipline តិចតួចបំផុតដើម្បីជួយអ្នក។',
    p3: 'នេះហើយជាមូលហេតុដែល Trader ជាច្រើនបរាជ័យ មិនមែនព្រោះខ្វះចំណេះដឹងផ្នែកបច្ចេកទេសទេ ប៉ុន្តែព្រោះខ្វះ structure ខាងក្នុងខ្លួនឯង — ខ្វះច្បាប់ផ្ទាល់ខ្លួន ខ្វះវិន័យ ខ្វះការគ្រប់គ្រងអារម្មណ៍។ គោលដៅចម្បងនៃសៀវភៅនេះ គឺជួយអ្នកបង្កើត structure ផ្ទៃក្នុងនោះឡើង ដើម្បីជំនួសកង្វះខាតរបស់ Market ។',
    caption: 'ស្តាប់ដោយផ្តោតអារម្មណ៍ — សេរីភាពដែលអ្នកចង់បានពី Trading គឺពិតជាមានប្រយោជន៍ ប៉ុន្តែវាទាមទារវិន័យខ្លាំងជាងការងារធម្មតាទៅទៀត។',
    doneTitle: '🌱 ធ្វើបានល្អ!',
    doneBody: 'សូមចងចាំចំណុចនេះជានិច្ច៖ សេរីភាពដ៏ធំរបស់ Market តម្រូវឲ្យអ្នកបង្កើតវិន័យផ្ទាល់ខ្លួន — មិនមែន Market ជួយអ្នកធ្វើដូច្នោះទេ។',
  },
  en: {
    finishUnlocked: '✓ Finish Lesson',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'by Mark Douglas',
    chapterTag: 'Chapter 2',
    chapterHeading: 'The Lure (and the Dangers) of Trading',
    intro:
      '📖 Trading pulls people in because it looks like the easiest road to total freedom — no boss, no fixed hours, no cap on how much you can earn. But that same freedom is exactly what makes it so dangerous.',
    p1: "Almost every other profession comes with rules, structure, and someone watching over you to keep you in line. Trading has none of that. The market never tells you when to enter, when to exit, or how much to risk — you decide everything yourself. That total freedom is precisely where the trouble begins.",
    p2: "With no outside limits, new traders unconsciously carry the habits of everyday life — fear, greed, the urge for a quick win — straight into the market. The market acts like a mirror, reflecting your emotions and psychological weak spots back at you almost instantly, while offering you almost no discipline of its own.",
    p3: "This is why most traders fail — not from a lack of technical knowledge, but from a lack of internal structure: no personal rules, no discipline, no way to manage their own emotions. The core aim of this book is to help you build that internal structure yourself, since the market will never build it for you.",
    caption: "Listen closely — the freedom you want from trading is real and valuable, but it demands far more self-discipline than any regular job ever would.",
    doneTitle: '🌱 Nice work!',
    doneBody: "Keep this in mind: the market's total freedom means YOU have to supply the discipline — the market will never supply it for you.",
  },
  zh: {
    finishUnlocked: '✓ 完成课程',
    bookTitle: 'Trading in the Zone',
    bookAuthor: 'Mark Douglas 著',
    chapterTag: '第二章',
    chapterHeading: '交易的诱惑（与危险）',
    intro:
      '📖 交易之所以吸引人，是因为它看起来是通往完全自由最简单的路 — 没有老板、没有固定上班时间、收入也没有上限。但正是这种巨大的自由，让它变得格外危险。',
    p1: '几乎所有其他行业都有规则、结构，以及监督你的人，逼着你按规矩办事。但交易完全没有这些 — 市场不会告诉你何时进场、何时离场、该承担多少风险，一切都要你自己决定。而这种完全的自由，正是问题的根源所在。',
    p2: '由于没有外部限制，新手交易者往往会不自觉地把日常生活中的习惯 — 恐惧、贪婪、渴望快速获利 — 直接带进市场。市场就像一面镜子，几乎立刻就会把你的情绪和心理弱点反射回来，而它本身几乎不会给你任何纪律约束。',
    p3: '这也是为什么大多数交易者会失败 — 并不是因为缺乏技术知识，而是因为缺乏内在的结构：没有自己的规则、没有纪律、无法管理自己的情绪。这本书的核心目标，就是帮助你建立起这种内在结构，因为市场永远不会替你建立。',
    caption: '用心聆听 — 你想从交易中获得的自由是真实且宝贵的，但它所要求的自律，远比一份普通工作要高得多。',
    doneTitle: '🌱 做得好！',
    doneBody: '请牢记这一点：市场给予的完全自由，意味着纪律必须由你自己来提供 — 市场永远不会替你提供。',
  },
};

export default function Psychology2({ onNavigate, onDone }) {
  const { lang } = useLanguage();
  const t = CONTENT[lang];
  const { videos } = useVideos();
  const src = videos['psy-ch2']?.url;

  return (
    <LessonLayout
      id="psy2"
      track="psychology"
      title={meta.pageTitle[lang]}
      onNavigate={onNavigate}
      onDone={onDone}
      nextLabel={t.finishUnlocked}
      nextDisabled={false}
    >
      <BookCard title={t.bookTitle} author={t.bookAuthor} chapterTag={t.chapterTag} />

      <h3>
        <span className="bar"></span>
        {t.chapterHeading}
      </h3>

      <Box variant="g">{t.intro}</Box>

      <p>{t.p1}</p>
      <p>{t.p2}</p>
      <p>{t.p3}</p>

      <LessonVideo src={src} caption={t.caption} />

      {src && <Rule title={t.doneTitle}>{t.doneBody}</Rule>}
    </LessonLayout>
  );
}
