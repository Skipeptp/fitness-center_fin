// VOLT Button - универсальная кнопка.
// Варианты: primary | secondary | ghost | danger
// Размеры: sm | md | lg
// Состояния: loading, disabled

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon: Icon,
  iconRight,
  onClick,
  className = '',
  ...rest
}) {
  const cls = [
    'volt-btn',
    `volt-btn--${variant}`,
    `volt-btn--${size}`,
    fullWidth && 'volt-btn--full',
    loading && 'volt-btn--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <span className="volt-btn-spinner" aria-hidden />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
          <span>{children}</span>
          {iconRight && <span className="volt-btn-iconRight">{iconRight}</span>}
        </>
      )}
      <style>{`
        .volt-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px;
          font-family: inherit; font-weight: 600;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color var(--t-fast) var(--ease),
                      color var(--t-fast) var(--ease),
                      border-color var(--t-fast) var(--ease),
                      transform var(--t-fast) var(--ease),
                      box-shadow var(--t-fast) var(--ease);
          white-space: nowrap;
        }
        .volt-btn:active:not(:disabled) { transform: translateY(1px) scale(.99); }
        .volt-btn:disabled { opacity: .5; cursor: not-allowed; }
        .volt-btn--full { width: 100%; }

        .volt-btn--sm { font-size: 13px; padding: 6px 12px; height: 32px; }
        .volt-btn--md { font-size: 14px; padding: 8px 16px; height: 40px; }
        .volt-btn--lg { font-size: 16px; padding: 12px 22px; height: 48px; }

        .volt-btn--primary {
          background: var(--brand-primary);
          color: #fff;
        }
        .volt-btn--primary:hover:not(:disabled) {
          background: var(--brand-primary-hover);
          box-shadow: var(--shadow-glow);
        }

        .volt-btn--secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--border);
        }
        .volt-btn--secondary:hover:not(:disabled) {
          background: var(--bg-elevated);
          border-color: var(--border-strong);
        }

        .volt-btn--ghost {
          background: transparent; color: var(--text-primary);
        }
        .volt-btn--ghost:hover:not(:disabled) { background: var(--bg-tertiary); }

        .volt-btn--danger {
          background: transparent; color: var(--brand-danger);
          border-color: var(--brand-danger);
        }
        .volt-btn--danger:hover:not(:disabled) {
          background: var(--brand-danger); color: #fff;
        }

        .volt-btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
      `}</style>
    </button>
  );
}
