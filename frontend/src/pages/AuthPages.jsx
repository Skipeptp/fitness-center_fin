import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input, { PasswordInput } from '../components/ui/Input.jsx';
import Logo from '../components/ui/Logo.jsx';
import { parseApiError } from '../utils/format.js';

const TABS = [
  { key: 'client', label: 'Клиент' },
  { key: 'employee', label: 'Сотрудник' }
];

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [tab, setTab] = useState('client');
  const [form, setForm] = useState({ email: '', login: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (tab === 'client' && !form.email) e.email = 'Введи email';
    if (tab === 'employee' && !form.login) e.login = 'Введи логин';
    if (!form.password) e.password = 'Введи пароль';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const creds = tab === 'client'
        ? { email: form.email, password: form.password, type: 'client' }
        : { login: form.login, password: form.password, type: 'employee' };
      await login(creds);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(parseApiError(err, 'Неверный логин или пароль'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo"><Logo size={36} withText /></div>
        <h2>Войти в VOLT</h2>
        <p className="text-muted text-center" style={{ marginTop: -8 }}>
          Заряжай тело. Бей рекорды.
        </p>
        <div className="auth-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`auth-tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="auth-form">
          {tab === 'client' ? (
            <Input label="Email" type="email" name="email" icon={Mail}
              value={form.email} onChange={e => set('email', e.target.value)}
              error={errors.email} placeholder="demo@volt.ru" />
          ) : (
            <Input label="Логин" name="login" icon={User}
              value={form.login} onChange={e => set('login', e.target.value)}
              error={errors.login} placeholder="admin" />
          )}
          <PasswordInput label="Пароль" name="password"
            value={form.password} onChange={e => set('password', e.target.value)}
            error={errors.password} placeholder="••••••••" />
          <Button fullWidth loading={loading} onClick={submit}>Войти</Button>
        </div>
        <div className="auth-switch">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
      </div>
      <AuthStyles />
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Введи имя';
    if (!form.last_name.trim()) e.last_name = 'Введи фамилию';
    if (!form.email.includes('@')) e.email = 'Некорректный email';
    if (form.password.length < 8) e.password = 'Минимум 8 символов';
    if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Нужны буквы и цифры';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone || undefined, password: form.password });
      navigate('/dashboard');
      toast.success('Добро пожаловать в VOLT!');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 460 }}>
        <div className="auth-logo"><Logo size={36} withText /></div>
        <h2>Создать аккаунт</h2>
        <div className="auth-form">
          <div className="auth-row">
            <Input label="Имя" name="first_name" icon={User} value={form.first_name}
              onChange={e => set('first_name', e.target.value)} error={errors.first_name} placeholder="Алексей" />
            <Input label="Фамилия" name="last_name" value={form.last_name}
              onChange={e => set('last_name', e.target.value)} error={errors.last_name} placeholder="Петров" />
          </div>
          <Input label="Email" type="email" name="email" icon={Mail} value={form.email}
            onChange={e => set('email', e.target.value)} error={errors.email} placeholder="demo@volt.ru" />
          <Input label="Телефон (необязательно)" name="phone" icon={Phone} value={form.phone}
            onChange={e => set('phone', e.target.value)} placeholder="+7 900 000-00-00" />
          <PasswordInput label="Пароль" name="password" value={form.password}
            onChange={e => set('password', e.target.value)} error={errors.password}
            hint="Минимум 8 символов, буквы + цифры" />
          <PasswordInput label="Подтвердить пароль" name="confirm" value={form.confirm}
            onChange={e => set('confirm', e.target.value)} error={errors.confirm} />
          <Button fullWidth loading={loading} onClick={submit}>Зарегистрироваться</Button>
        </div>
        <div className="auth-switch">Уже есть аккаунт? <Link to="/login">Войти</Link></div>
      </div>
      <AuthStyles />
    </div>
  );
}

function AuthStyles() {
  return (
    <style>{`
      .auth-page {
        min-height: 100vh;
        display: flex; align-items: center; justify-content: center;
        background: var(--bg-primary); padding: 24px;
      }
      .auth-card {
        background: var(--bg-secondary); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 36px;
        width: 100%; max-width: 400px;
      }
      .auth-logo { text-align: center; margin-bottom: 20px; }
      .auth-card h2 { text-align: center; margin: 0 0 20px; }
      .auth-tabs {
        display: flex; background: var(--bg-tertiary);
        border-radius: var(--radius-md); padding: 3px; margin-bottom: 20px;
      }
      .auth-tab {
        flex: 1; padding: 8px; border: 0; background: none;
        color: var(--text-muted); font-weight: 500; font-size: 14px;
        border-radius: var(--radius-sm); cursor: pointer;
        transition: all var(--t-fast) var(--ease);
      }
      .auth-tab.is-active {
        background: var(--bg-elevated); color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
      .auth-form { display: flex; flex-direction: column; gap: 14px; }
      .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .auth-switch { text-align: center; font-size: 13px; color: var(--text-muted); margin-top: 16px; }
      @media (max-width: 480px) {
        .auth-card { padding: 24px; }
        .auth-row { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}

export default LoginPage;
