export default function GridItem({ labelColor, label, valStyle, children }) {
  return (
    <div className="gi">
      <div className="gi-label" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="gi-val" style={valStyle}>
        {children}
      </div>
    </div>
  );
}
