import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Wallet,
  User, Bookmark, MessageCircle, Bell, Calculator,
  Building2, ShieldCheck, BarChart3, Sparkles
} from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const CLIENT_NAV = [
  { to: '/dashboard',    label: 'Дашборд',     icon: LayoutDashboard },
  { to: '/schedule',     label: 'Расписание',  icon: Calendar },
  { to: '/trainers',     label: 'Тренеры',     icon: Users },
  { to: '/memberships',  label: 'Абонементы',  icon: Wallet },
  { to: '/bookings',     label: 'Мои записи',  icon: Bookmark },
  { to: '/programs',     label: 'Программы',   icon: Sparkles },
  { to: '/support',      label: 'Поддержка',   icon: MessageCircle },
  { to: '/notifications',label: 'Уведомления', icon: Bell },
  { to: '/calculator',   label: 'Калькулятор', icon: Calculator },
  { to: '/profile',      label: 'Профиль',     icon: User }
];

const EMPLOYEE_EXTRA = [
  { to: '/halls',     label: 'Залы',      icon: Building2 },
  { to: '/admin',     label: 'Админка',   icon: ShieldCheck },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 }
];

export default function Sidebar({ open, onClose }) {
  const { isEmployee, logout, user } = useAuth();
  const nav = isEmployee ? [...CLIENT_NAV, ...EMPLOYEE_EXTRA] : CLIENT_NAV;

  return (
    <>
      <aside className={`volt-sidebar ${open ? 'is-open' : ''}`}>
        <div className="volt-sidebar-head">
          <Logo size={28} withText />
        </div>
        <nav className="volt-sidebar-nav">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => 'volt-nav-item' + (isActive ? ' is-active' : '')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="volt-sidebar-foot">
          <div className="volt-sidebar-user">
            <div className="volt-user-name">{user?.first_name || user?.login || 'VOLT'}</div>
            <div className="volt-user-role">{user?.role || (user?.type === 'client' ? 'Клиент' : 'Гость')}</div>
          </div>
          <button className="volt-logout" onClick={logout}>Выйти</button>
        </div>
      </aside>
      {open && <div className="volt-sidebar-bg" onClick={onClose} />}
      <style>{`
        .volt-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          z-index: 50;
          transition: transform var(--t-base) var(--ease);
        }
        .volt-sidebar-head {
          padding: 18px 20px; border-bottom: 1px solid var(--border);
          height: var(--header-h);
          display: flex; align-items: center;
        }
        .volt-sidebar-nav {
          flex: 1; padding: 12px 8px;
          overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
        }
        .volt-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          color: var(--text-secondary);
          font-weight: 500; font-size: 14px;
          border-radius: var(--radius-md);
          transition: background-color var(--t-fast) var(--ease),
                      color var(--t-fast) var(--ease);
        }
        .volt-nav-item:hover { background: var(--bg-tertiary); color: var(--text-primary); }
        .volt-nav-item.is-active {
          background: rgba(230,57,70,.12);
          color: var(--brand-primary);
        }
        .volt-sidebar-foot {
          padding: 14px 16px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 10px;
        }
        .volt-sidebar-user { font-size: 13px; }
        .volt-user-name { font-weight: 600; color: var(--text-primary); }
        .volt-user-role { color: var(--text-muted); font-size: 12px; text-transform: capitalize; }
        .volt-logout {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 8px 12px; font-size: 13px;
          border-radius: var(--radius-md); cursor: pointer;
          transition: all var(--t-fast) var(--ease);
        }
        .volt-logout:hover {
          background: var(--brand-primary); color: #fff; border-color: var(--brand-primary);
        }
        .volt-sidebar-bg {
          position: fixed; inset: 0; background: var(--bg-overlay);
          z-index: 40;
          display: none;
        }
        @media (max-width: 900px) {
          .volt-sidebar {
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .volt-sidebar.is-open { transform: translateX(0); }
          .volt-sidebar-bg { display: block; }
        }
      `}</style>
    </>
  );
}
