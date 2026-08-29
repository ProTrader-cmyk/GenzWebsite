export default function Box({ variant = 'g', style, children }) {
  return (
    <div className={`box box-${variant}`} style={style}>
      {children}
    </div>
  );
}
