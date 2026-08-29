import { useState } from 'react';
import Box from './Box.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { getLessonChrome } from '../../i18n/lessonStrings.js';

export default function AnswerReveal({ label, variant, children }) {
  const { lang } = useLanguage();
  const c = getLessonChrome(lang);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="reveal-btn" onClick={() => setOpen((o) => !o)}>
        {open ? c.hideAnswer : label}
      </button>
      {open && <Box variant={variant}>{children}</Box>}
    </>
  );
}
