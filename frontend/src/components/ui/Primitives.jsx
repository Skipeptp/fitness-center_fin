// VOLT - набор простых UI-примитивов в одном файле,
// чтобы не плодить десяток крошечных компонентов.

import { initials as getInitials } from '../../utils/format.js';

export function Card({ children, hover = false, className = '', onClick, ...rest }) {
  const cls = ['volt-card', hover && 'volt-card--hover', className].filter(Boolean).join(' ');
  return (
    <div className={cls} onClick={onClick} {...rest}>
      {children}
      <style>{`
        .volt-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: transform var(--t-base) var(--ease),
                      border-color var(--t-base) var(--ease),
                      box-shadow var(--t-base) var(--ease);
        }
        .volt-card--hover {
          cursor: pointer;
        }
        .volt-card--hover:hover {
          transform: translateY(-2px);
          border-color: var(--brand-primary);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}

export function Badge({ children, color = 'default', size = 'md' }) {
  const palette = {
    default: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)' },
    primary: { bg: 'rgba(230,57,70,.15)', fg: 'var(--brand-primary)' },
    success: { bg: 'rgba(42,157,143,.15)', fg: 'var(--brand-success)' },
    warning: { bg: 'rgba(255,183,3,.15)', fg: 'var(--brand-warning)' },
    danger:  { bg: 'rgba(230,57,70,.15)', fg: 'var(--brand-danger)' },
    info:    { bg: 'rgba(0,180,216,.15)', fg: 'var(--brand-info)' }
  };
  // Если color - это HEX (#RRGGBB), используем как есть
  const isHex = typeof color === 'string' && color.startsWith('#');
  const style = isHex
    ? { background: color + '22', color }
    : { background: palette[color]?.bg, color: palette[color]?.fg };
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span className="volt-badge" style={{ ...style, padding, fontSize: fs }}>
      {children}
      <style>{`
        .volt-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-weight: 600;
          border-radius: var(--radius-full);
          line-height: 1;
        }
      `}</style>
    </span>
  );
}

export function Avatar({ user, size = 40, src }) {
  const url = src || user?.photo_url;
  const text = user ? getInitials(user) : '?';
  return (
    <div className="volt-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {url ? (
        <img src={url} alt={text} />
      ) : (
        <span>{text}</span>
      )}
      <style>{`
        .volt-avatar {
          display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
          color: #fff; font-weight: 700;
          border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
        }
        .volt-avatar img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </div>
  );
}

export function ProgressBar({ value = 0, max = 100, color, height = 8, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="volt-progress-wrap">
      {label && (
        <div className="volt-progress-label">
          <span>{label}</span>
          <span className="text-muted">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="volt-progress-bg" style={{ height }}>
        <div
          className="volt-progress-fill"
          style={{ width: `${pct}%`, background: color || 'var(--brand-primary)' }}
        />
      </div>
      <style>{`
        .volt-progress-wrap { width: 100%; }
        .volt-progress-label {
          display: flex; justify-content: space-between;
          font-size: 12px; margin-bottom: 6px;
          color: var(--text-secondary);
        }
        .volt-progress-bg {
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .volt-progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--t-slow) var(--ease);
        }
      `}</style>
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-md)' }) {
  return (
    <span className="volt-skeleton" style={{ width, height, borderRadius: radius }}>
      <style>{`
        .volt-skeleton {
          display: block;
          background: linear-gradient(90deg,
            var(--skeleton-base) 0%,
            var(--skeleton-shine) 50%,
            var(--skeleton-base) 100%);
          background-size: 200% 100%;
          animation: shine 1.4s linear infinite;
        }
      `}</style>
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="volt-empty">
      {Icon && <Icon size={48} className="volt-empty-icon" />}
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action}
      <style>{`
        .volt-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 48px 24px; text-align: center;
          color: var(--text-secondary);
        }
        .volt-empty-icon { color: var(--text-muted); }
        .volt-empty h3 { margin: 8px 0 0; color: var(--text-primary); }
        .volt-empty p { max-width: 380px; margin: 0; }
      `}</style>
    </div>
  );
}
