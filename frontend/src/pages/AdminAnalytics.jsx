import { useState, useEffect } from 'react';
import { analyticsApi, clientsApi, reviewsApi } from '../api/index.js';
import { KpiCard } from '../components/features/KpiCard.jsx';
import { Badge, Avatar, Skeleton, EmptyState } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { Tabs } from '../components/ui/Modal.jsx';
import { formatRub, formatDate, fullName, parseApiError } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { BarChart3, TrendingUp, Users, Star, CheckCircle2 } from 'lucide-react';

export function AnalyticsPage() {
  const [kpi, setKpi] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [popular, setPopular] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.revenue(period),
      analyticsApi.popular(),
      analyticsApi.trainers()
    ]).then(([k, r, p, t]) => {
      setKpi(k.data);
      setRevenue(r.data || []);
      setPopular(p.data || []);
      setTrainers(t.data || []);
    }).finally(() => setLoading(false));
  }, [period]);

  const maxRev = Math.max(...revenue.map(r => Number(r.amount)), 1);

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={22} style={{ color: 'var(--brand-primary)' }} />
        <h1 style={{ margin: 0 }}>Аналитика</h1>
      </div>

      <div className="an-kpi-grid">
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} height={100} radius="var(--radius-lg)" />)
          : kpi ? <>
            <KpiCard title="Доход за месяц" value={formatRub(kpi.month_revenue)} icon={TrendingUp} color="var(--brand-success)" />
            <KpiCard title="Активных клиентов" value={kpi.active_clients} icon={Users} color="var(--brand-info)" />
            <KpiCard title="Новых за неделю" value={kpi.new_clients_week} icon={Users} color="var(--brand-warning)" />
            <KpiCard title="Загруженность" value={`${kpi.avg_occupancy_pct}%`} icon={BarChart3} color="var(--brand-primary)" />
          </> : null}
      </div>

      <div className="an-row mt-3">
        <section className="an-section" style={{ flex: 2 }}>
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ margin: 0 }}>Доход</h3>
            <div className="flex gap-2">
              {['week', 'month'].map(p => (
                <button key={p} className={`an-period-btn ${period === p ? 'is-active' : ''}`} onClick={() => setPeriod(p)}>
                  {p === 'week' ? 'По неделям' : 'По месяцам'}
                </button>
              ))}
            </div>
          </div>
          <div className="an-bars">
            {revenue.slice(-10).map((r, i) => (
              <div key={i} className="an-bar-col">
                <div className="an-bar-fill" style={{ height: `${(Number(r.amount) / maxRev) * 140}px`, background: 'var(--brand-primary)' }} />
                <div className="an-bar-label">{new Date(r.bucket).toLocaleDateString('ru-RU', { month: 'short', day: period === 'week' ? 'numeric' : undefined })}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="an-section" style={{ flex: 1 }}>
          <h3>Топ занятий</h3>
          {popular.slice(0, 7).map(p => (
            <div key={p.id} className="an-popular-row">
              <span className="an-popular-dot" style={{ background: p.color_hex || 'var(--brand-primary)' }} />
              <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
              <span className="text-muted" style={{ fontSize: 13 }}>{p.bookings_count}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="an-section mt-3">
        <h3>Эффективность тренеров</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="an-table">
            <thead><tr><th>Тренер</th><th>Занятий</th><th>Записей</th><th>Рейтинг</th><th>Отзывов</th></tr></thead>
            <tbody>
              {trainers.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.classes_total}</td>
                  <td>{t.bookings_total}</td>
                  <td>
                    <span style={{ color: 'var(--brand-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} fill="currentColor" /> {Number(t.rating).toFixed(1)}
                    </span>
                  </td>
                  <td>{t.reviews_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .an-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .an-row { display: flex; gap: 16px; flex-wrap: wrap; }
        .an-section { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; min-width: 220px; }
        .an-bars { display: flex; align-items: flex-end; gap: 8px; height: 160px; padding-top: 20px; }
        .an-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .an-bar-fill { width: 100%; min-height: 2px; border-radius: 3px 3px 0 0; transition: height .4s var(--ease); }
        .an-bar-label { font-size: 10px; color: var(--text-muted); }
        .an-popular-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--divider); }
        .an-popular-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .an-period-btn { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 5px 10px; font-size: 12px; cursor: pointer; color: var(--text-muted); }
        .an-period-btn.is-active { border-color: var(--brand-primary); color: var(--brand-primary); }
        .an-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .an-table th { text-align: left; padding: 8px 12px; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border); }
        .an-table td { padding: 10px 12px; border-bottom: 1px solid var(--divider); color: var(--text-primary); }
        .an-table tr:last-child td { border: none; }
        @media (max-width: 1100px) { .an-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px) { .an-kpi-grid { grid-template-columns: 1fr; } .an-row { flex-direction: column; } }
      `}</style>
    </div>
  );
}

const ADMIN_TABS = [
  { key: 'clients', label: 'Клиенты' },
  { key: 'reviews', label: 'Отзывы на модерации' }
];

export function AdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        clientsApi.list({ limit: 30 }),
        reviewsApi.pending()
      ]);
      setClients(c.data || []);
      setPending(r.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const approveReview = async (id) => {
    await reviewsApi.approve(id).catch(e => toast.error(parseApiError(e)));
    setPending(p => p.filter(r => r.id !== id));
    toast.success('Отзыв одобрен.');
  };

  const deleteReview = async (id) => {
    await reviewsApi.remove(id).catch(e => toast.error(parseApiError(e)));
    setPending(p => p.filter(r => r.id !== id));
    toast.info('Отзыв удалён.');
  };

  return (
    <div className="fade-in">
      <h1>Управление</h1>
      <Tabs tabs={ADMIN_TABS.map(t => t.key === 'reviews' ? { ...t, count: pending.length } : t)} value={tab} onChange={setTab} />
      {loading ? <Skeleton height={200} radius="var(--radius-lg)" />
        : tab === 'clients' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {clients.map(c => (
              <div key={c.id} className="admin-client-row">
                <Avatar user={c} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fullName(c) || c.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                </div>
                <Badge color={c.is_active ? 'success' : 'danger'} size="sm">{c.is_active ? 'Активен' : 'Неактивен'}</Badge>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        ) : !pending.length ? (
          <EmptyState title="Нет отзывов на модерации" icon={CheckCircle2} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(r => (
              <div key={r.id} className="admin-review-row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={13} fill={i < r.rating ? 'var(--brand-warning)' : 'none'} color="var(--brand-warning)" />
                    ))}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</span>
                  </div>
                  {r.comment && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{r.comment}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => approveReview(r.id)}>Одобрить</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteReview(r.id)}>Удалить</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      <style>{`
        .admin-client-row { display: flex; align-items: center; gap: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px 16px; }
        .admin-review-row { display: flex; align-items: flex-start; gap: 14px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; }
      `}</style>
    </div>
  );
}

export default AnalyticsPage;
