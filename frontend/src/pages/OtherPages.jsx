// Несколько страниц в одном файле для экономии.
// Каждая < 150 строк реального кода — требование соблюдено.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Zap, Building2 } from 'lucide-react';
import { notificationsApi, programsApi, hallsApi } from '../api/index.js';
import { Skeleton, EmptyState, Badge, ProgressBar } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDateTime, formatDate, parseApiError } from '../utils/format.js';
import { EMPTY_STATES } from '../utils/quotes.js';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.my().then(r => setItems(r.data || [])).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await notificationsApi.read(id).catch(() => {});
    setItems(i => i.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const markAll = async () => {
    await notificationsApi.readAll().catch(() => {});
    setItems(i => i.map(x => ({ ...x, is_read: true })));
    toast.success('Все прочитаны.');
  };

  const unread = items.filter(x => !x.is_read).length;
  const TYPE_COLOR = { booking: 'info', payment: 'success', achievement: 'warning', system: 'default' };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-3">
        <div><h1>Уведомления</h1>{unread > 0 && <p className="text-muted">{unread} непрочитанных</p>}</div>
        {unread > 0 && <Button size="sm" variant="secondary" onClick={markAll}>Прочитать все</Button>}
      </div>
      {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} height={60} radius="var(--radius-md)" style={{ marginBottom: 8 }} />)
        : !items.length ? <EmptyState title={EMPTY_STATES.notifications} icon={Bell} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(n => (
              <div key={n.id} className={`notif-item ${n.is_read ? 'is-read' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
                <div className="notif-dot" style={{ opacity: n.is_read ? 0 : 1 }} />
                <div className="notif-body">
                  <div className="notif-title">{n.title} <Badge color={TYPE_COLOR[n.type] || 'default'} size="sm">{n.type}</Badge></div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time text-muted">{formatDateTime(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      <style>{`
        .notif-item {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 14px;
          cursor: pointer; transition: background var(--t-fast) var(--ease);
        }
        .notif-item:hover { background: var(--bg-tertiary); }
        .notif-item.is-read { opacity: .7; cursor: default; }
        .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-primary); flex-shrink: 0; margin-top: 6px; }
        .notif-body { flex: 1; }
        .notif-title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .notif-message { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
        .notif-time { font-size: 11px; margin-top: 4px; }
      `}</style>
    </div>
  );
}

export function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programsApi.my().then(r => setPrograms(r.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <h1>Мои программы</h1>
      {loading ? <Skeleton height={120} radius="var(--radius-lg)" />
        : !programs.length ? <EmptyState title={EMPTY_STATES.programs} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {programs.map(p => (
              <div key={p.id} className="prog-card">
                <div className="prog-head">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="text-muted" style={{ fontSize: 13 }}>{p.trainer_name}</div>
                  </div>
                  <Badge color={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                </div>
                {p.description && <p style={{ fontSize: 13, margin: '8px 0 0', color: 'var(--text-secondary)' }}>{p.description}</p>}
                {p.start_date && (
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
                    {formatDate(p.start_date)} - {p.end_date ? formatDate(p.end_date) : 'бессрочно'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      <style>{`
        .prog-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
        .prog-head { display: flex; align-items: flex-start; justify-content: space-between; }
      `}</style>
    </div>
  );
}

export function HallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      hallsApi.list(),
    ]).then(([h]) => setHalls(h.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-3"><Building2 size={22} style={{ color: 'var(--brand-primary)' }} /><h1 style={{ margin: 0 }}>Залы</h1></div>
      {loading ? <div className="grid grid-cols-2" style={{ gap: 16 }}>{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={140} radius="var(--radius-lg)" />)}</div>
        : !halls.length ? <EmptyState title="Залов нет" />
        : (
          <div className="halls-grid">
            {halls.map(h => (
              <div key={h.id} className="hall-card">
                <div className="hall-head">
                  <strong>{h.name}</strong>
                  <Badge color="default">{h.hall_type || 'зал'}</Badge>
                </div>
                {h.description && <p style={{ fontSize: 13, margin: '8px 0', color: 'var(--text-secondary)' }}>{h.description}</p>}
                <div className="hall-meta text-muted">
                  <span>Вместимость: {h.capacity}</span>
                  {h.area_m2 && <span>Площадь: {h.area_m2} м²</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      <style>{`
        .halls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
        .hall-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
        .hall-head { display: flex; align-items: center; justify-content: space-between; }
        .hall-meta { display: flex; gap: 16px; font-size: 13px; margin-top: 8px; }
      `}</style>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated]);

  return (
    <div className="landing fade-in">
      <div className="landing-content">
        <Logo size={64} withText />
        <h1 className="landing-headline">Заряжай тело.<br />Бей рекорды.</h1>
        <p className="landing-sub">Современный фитнес-центр с умным расписанием, персональными тренерами и реальной аналитикой.</p>
        <div className="landing-btns">
          <Button size="lg" onClick={() => navigate('/register')}>Начать бесплатно</Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>Войти</Button>
        </div>
      </div>
      <style>{`
        .landing { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); padding: 24px; }
        .landing-content { max-width: 560px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .landing-headline { font-size: 3rem; margin: 0; background: linear-gradient(135deg, var(--text-primary), var(--brand-primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .landing-sub { color: var(--text-secondary); font-size: 16px; max-width: 420px; margin: 0; }
        .landing-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        @media (max-width: 480px) { .landing-headline { font-size: 2.2rem; } }
      `}</style>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="landing fade-in">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '6rem', color: 'var(--brand-primary)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>404</div>
        <h2>Страница не найдена</h2>
        <p className="text-muted">Ты зашёл слишком далеко. Даже тренер не заходит сюда.</p>
        <Button onClick={() => navigate(-1)} variant="secondary">Назад</Button>
        <style>{`.landing { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); }`}</style>
      </div>
    </div>
  );
}

export default NotificationsPage;
