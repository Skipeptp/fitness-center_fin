import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const push = useCallback((message, type = 'info', duration = 3500) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const api = {
    push,
    success: (msg, dur) => push(msg, 'success', dur),
    error: (msg, dur) => push(msg, 'error', dur || 4500),
    info: (msg, dur) => push(msg, 'info', dur),
    warning: (msg, dur) => push(msg, 'warning', dur),
    remove
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon size={18} />
              <span>{t.message}</span>
              <button onClick={() => remove(t.id)} aria-label="Закрыть"><X size={16} /></button>
            </div>
          );
        })}
      </div>
      <style>{`
        .toast-stack {
          position: fixed; top: 20px; right: 20px;
          display: flex; flex-direction: column; gap: 8px;
          z-index: 9999;
          max-width: calc(100vw - 40px);
        }
        .toast {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-left: 3px solid var(--brand-info);
          color: var(--text-primary);
          padding: 12px 14px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 260px; max-width: 380px;
          animation: slideInRight var(--t-base) var(--ease) both;
        }
        .toast button {
          background: none; border: 0; color: var(--text-muted);
          margin-left: auto; padding: 4px; border-radius: var(--radius-sm);
        }
        .toast button:hover { color: var(--text-primary); background: var(--bg-tertiary); }
        .toast--success { border-left-color: var(--brand-success); }
        .toast--error { border-left-color: var(--brand-danger); }
        .toast--warning { border-left-color: var(--brand-warning); }
        .toast--info { border-left-color: var(--brand-info); }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
