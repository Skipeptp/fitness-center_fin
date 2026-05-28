import { useEffect } from 'react';
import { X } from 'lucide-react';

// Модалка с порталом-без-портала (просто overlay).
// Закрывается на Esc и клик по бэкграунду.
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: '380px', md: '520px', lg: '720px' };

  return (
    <div className="volt-modal-bg" onClick={onClose}>
      <div
        className="volt-modal"
        style={{ maxWidth: widths[size] || widths.md }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="volt-modal-head">
          <h3>{title}</h3>
          <button className="volt-modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="volt-modal-body">{children}</div>
        {footer && <div className="volt-modal-foot">{footer}</div>}
      </div>
      <style>{`
        .volt-modal-bg {
          position: fixed; inset: 0;
          background: var(--bg-overlay);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          z-index: 1000;
          animation: fadeIn .2s var(--ease) both;
        }
        .volt-modal {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%; max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-lg);
          animation: slideInUp .25s var(--ease) both;
        }
        .volt-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--border);
        }
        .volt-modal-head h3 { margin: 0; }
        .volt-modal-close {
          background: none; border: 0;
          color: var(--text-muted);
          padding: 6px; border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .volt-modal-close:hover { color: var(--text-primary); background: var(--bg-tertiary); }
        .volt-modal-body { padding: 20px 22px; overflow-y: auto; }
        .volt-modal-foot {
          padding: 14px 22px;
          border-top: 1px solid var(--border);
          display: flex; gap: 8px; justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="volt-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`volt-tab ${value === t.key ? 'is-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="volt-tab-count">{t.count}</span>
          )}
        </button>
      ))}
      <style>{`
        .volt-tabs {
          display: flex; gap: 4px; flex-wrap: wrap;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }
        .volt-tab {
          background: none; border: 0;
          padding: 10px 16px;
          font-weight: 600; font-size: 14px;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .volt-tab:hover { color: var(--text-primary); }
        .volt-tab.is-active {
          color: var(--brand-primary);
          border-bottom-color: var(--brand-primary);
        }
        .volt-tab-count {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 1px 8px;
          font-size: 11px;
          border-radius: var(--radius-full);
        }
        .volt-tab.is-active .volt-tab-count {
          background: rgba(230,57,70,.15);
          color: var(--brand-primary);
        }
      `}</style>
    </div>
  );
}

// Селект - простой dropdown через нативный <select>
export function Select({ label, value, onChange, options, ...rest }) {
  return (
    <div className="volt-field">
      {label && <label className="volt-field-label">{label}</label>}
      <select
        className="volt-select"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <style>{`
        .volt-select {
          height: 40px; padding: 0 14px;
          background: var(--input-bg); color: var(--text-primary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          font-size: 14px;
        }
        .volt-select:focus {
          outline: none; border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(230,57,70,.15);
        }
      `}</style>
    </div>
  );
}
