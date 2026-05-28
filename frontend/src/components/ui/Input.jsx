import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Поле ввода. Поддерживает label, error, hint, иконку.
const Input = forwardRef(function Input({
  label, error, hint, icon: Icon,
  type = 'text', className = '', containerClassName = '',
  ...rest
}, ref) {
  const id = rest.id || rest.name;
  return (
    <div className={`volt-field ${containerClassName}`}>
      {label && <label htmlFor={id} className="volt-field-label">{label}</label>}
      <div className={`volt-field-wrap ${error ? 'is-error' : ''}`}>
        {Icon && <span className="volt-field-icon"><Icon size={16} /></span>}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`volt-input ${className} ${Icon ? 'has-icon' : ''}`}
          {...rest}
        />
      </div>
      {error && <div className="volt-field-error">{error}</div>}
      {!error && hint && <div className="volt-field-hint">{hint}</div>}
      <style>{`
        .volt-field { display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .volt-field-label {
          font-size: 13px; font-weight: 500; color: var(--text-secondary);
        }
        .volt-field-wrap { position: relative; }
        .volt-field-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
        .volt-input {
          width: 100%; height: 40px;
          background: var(--input-bg); color: var(--text-primary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          padding: 0 14px; font-size: 14px;
          transition: border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
        }
        .volt-input.has-icon { padding-left: 36px; }
        .volt-input::placeholder { color: var(--text-muted); }
        .volt-input:focus {
          outline: none;
          border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(230,57,70,.15);
        }
        .volt-field-wrap.is-error .volt-input {
          border-color: var(--brand-danger);
        }
        .volt-field-error { color: var(--brand-danger); font-size: 12px; }
        .volt-field-hint { color: var(--text-muted); font-size: 12px; }
      `}</style>
    </div>
  );
});

export default Input;

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="volt-pwd">
      <Input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="volt-pwd-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <style>{`
        .volt-pwd { position: relative; }
        .volt-pwd-toggle {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(calc(-50% + 8px));
          background: none; border: 0;
          color: var(--text-muted);
          padding: 6px; border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .volt-pwd-toggle:hover { color: var(--text-primary); background: var(--bg-tertiary); }
      `}</style>
    </div>
  );
}

// Текстовая зона
export function Textarea({ label, error, hint, className = '', rows = 4, ...rest }) {
  const id = rest.id || rest.name;
  return (
    <div className="volt-field">
      {label && <label htmlFor={id} className="volt-field-label">{label}</label>}
      <textarea
        id={id} rows={rows}
        className={`volt-textarea ${className}`}
        {...rest}
      />
      {error && <div className="volt-field-error">{error}</div>}
      {!error && hint && <div className="volt-field-hint">{hint}</div>}
      <style>{`
        .volt-textarea {
          width: 100%;
          background: var(--input-bg); color: var(--text-primary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          padding: 10px 14px; font-size: 14px; font-family: inherit;
          resize: vertical; min-height: 80px;
          transition: border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
        }
        .volt-textarea:focus {
          outline: none; border-color: var(--input-focus);
          box-shadow: 0 0 0 3px rgba(230,57,70,.15);
        }
      `}</style>
    </div>
  );
}
