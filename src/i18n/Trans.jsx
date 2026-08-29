// Renders a translation string that may contain simple <b>...</b> markup
// (used for the handful of strings that need inline bold emphasis).
export default function Trans({ text }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<b>(.*)<\/b>$/);
    return match ? <strong key={i}>{match[1]}</strong> : part;
  });
}
