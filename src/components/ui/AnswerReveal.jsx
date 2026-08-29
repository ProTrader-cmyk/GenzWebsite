import { useState } from 'react';
import Box from './Box.jsx';

export default function AnswerReveal({ label, variant, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="reveal-btn" onClick={() => setOpen((o) => !o)}>
        {open ? '▲ លាក់ចម្លើយ' : label}
      </button>
      {open && <Box variant={variant}>{children}</Box>}
    </>
  );
}
