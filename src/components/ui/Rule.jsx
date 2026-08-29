export default function Rule({ title, children }) {
  return (
    <div className="rule">
      <div className="rb">{title}</div>
      <div className="rs">{children}</div>
    </div>
  );
}
