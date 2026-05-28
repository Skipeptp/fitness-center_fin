import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../ui/Primitives.jsx';
import { useNavigate } from 'react-router-dom';

function Header({ onBurger }) {
  const { toggle, isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="volt-header">
      <button className="volt-burger" onClick={onBurger} aria-label="Меню">
        <Menu size={20} />
      </button>
      <div className="volt-header-spacer" />
      <button
        className="volt-header-btn"
        onClick={() => navigate('/notifications')}
        aria-label="Уведомления"
        title="Уведомления"
      >
        <Bell size={18} />
      </button>
      <button
        className="volt-header-btn"
        onClick={toggle}
        aria-label="Сменить тему"
        title="Сменить тему"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button
        className="volt-header-user"
        onClick={() => navigate('/profile')}
        aria-label="Профиль"
      >
        <Avatar user={user} size={34} />
      </button>
      <style>{`
        .volt-header {
          position: sticky; top: 0; z-index: 30;
          height: var(--header-h);
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px;
          padding: 0 20px;
        }
        .volt-header-spacer { flex: 1; }
        .volt-burger {
          background: none; border: 0; padding: 8px;
          color: var(--text-primary);
          border-radius: var(--radius-md); cursor: pointer;
          display: none;
        }
        @media (max-width: 900px) { .volt-burger { display: inline-flex; } }

        .volt-header-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 36px; height: 36px;
          border-radius: var(--radius-md);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all var(--t-fast) var(--ease);
        }
        .volt-header-btn:hover {
          color: var(--brand-primary); border-color: var(--brand-primary);
        }
        .volt-header-user {
          background: none; border: 0; padding: 0;
          cursor: pointer; border-radius: 50%;
          transition: transform var(--t-fast) var(--ease);
        }
        .volt-header-user:hover { transform: scale(1.05); }
      `}</style>
    </header>
  );
}

export default function Layout() {
  const [sbOpen, setSbOpen] = useState(false);
  return (
    <div className="volt-app">
      <Sidebar open={sbOpen} onClose={() => setSbOpen(false)} />
      <div className="volt-main">
        <Header onBurger={() => setSbOpen(true)} />
        <main className="volt-content fade-in">
          <Outlet />
        </main>
      </div>
      <style>{`
        .volt-app { min-height: 100vh; }
        .volt-main {
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          display: flex; flex-direction: column;
        }
        .volt-content {
          flex: 1;
          padding: 24px;
          max-width: var(--container-max);
          width: 100%;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .volt-main { margin-left: 0; }
          .volt-content { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
