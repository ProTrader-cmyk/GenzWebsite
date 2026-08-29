// Numbered step list (the "1 → 2 → 3 → 4" walkthrough pattern).
export default function Steps({ items }) {
  return (
    <div className="steps">
      {items.map((item, idx) => (
        <div className="step" key={idx}>
          <div className="sn">{idx + 1}</div>
          <div className="sc">{item}</div>
        </div>
      ))}
    </div>
  );
}
