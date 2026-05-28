// VOLT - SVG-логотип. Молния через currentColor, чтобы наследовать цвет.
export default function Logo({ size = 32, withText = false }) {
  return (
    <span className="volt-logo" style={{ height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-label="VOLT"
        role="img"
      >
        <path d="M13 2L4.09 12.97A1 1 0 0 0 4.86 14.5H10L9.5 22l8.91-10.97a1 1 0 0 0-.77-1.53H13L13.5 2z"/>
      </svg>
      {withText && (
        <span
          className="volt-logo-text"
          style={{ fontSize: size * .55 }}
        >
          VOLT
        </span>
      )}
      <style>{`
        .volt-logo {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--brand-primary);
        }
        .volt-logo-text {
          font-family: var(--font-display);
          font-weight: 800;
          letter-spacing: 2px;
          color: var(--brand-primary);
        }
      `}</style>
    </span>
  );
}
