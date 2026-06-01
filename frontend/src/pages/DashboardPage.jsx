import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Wallet, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { clientsApi, analyticsApi, scheduleApi, bookingsApi, membershipsApi } from '../api/index.js';
import { KpiCard, MotivationalQuote } from '../components/features/KpiCard.jsx';
import { ScheduleCard } from '../components/features/ScheduleCard.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Skeleton, EmptyState } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { formatRub, daysTo, fireConfetti } from '../utils/format.js';
import { EMPTY_STATES } from '../utils/quotes.js';

// Онбординг для нового клиента без абонемента и бронирований
function Onboarding() {
  const navigate = useNavigate();
  return (
    <div className="dash-onboard fade-in">
      <div className="dash-onboard-icon"><Zap size={48} /></div>
      <h2>Добро пожаловать в VOLT!</h2>
      <p>Три шага до первой тренировки:</p>
      <div className="dash-steps">
        {[
          { n: 1, t: 'Купи абонемент', to: '/memberships' },
          { n: 2, t: 'Запишись на тренировку', to: '/schedule' },
          { n: 3, t: 'Приди и не сдохни', to: null }
        ].map(s => (
          <div key={s.n} className="dash-step" onClick={() => s.to && navigate(s.to)}>
            <div className="dash-step-n">{s.n}</div>
            <div className="dash-step-t">{s.t}</div>
          </div>
        ))}
      </div>
      <Button variant="primary" onClick={() => navigate('/memberships')} icon={Wallet}>
        Выбрать абонемент
      </Button>
      <style>{`
        .dash-onboard {
          text-align: center; padding: 60px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 20px;
        }
        .dash-onboard-icon { color: var(--brand-primary); }
        .dash-steps { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin: 8px 0; }
        .dash-step {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px; min-width: 160px; flex: 1;
          cursor: pointer; transition: all var(--t-base) var(--ease);
        }
        .dash-step:last-child { cursor: default; }
        .dash-step:hover:not(:last-child) { border-color: var(--brand-primary); transform: translateY(-2px); }
        .dash-step-n {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--brand-primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; margin: 0 auto 10px;
        }
        .dash-step-t { font-weight: 600; font-size: 14px; color: var(--text-primary); }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isEmployee } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState(null);
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        if (isEmployee) {
          const res = await analyticsApi.dashboard();
          setKpi(res.data);
        } else {
          const [statsRes, schedRes, bookRes, memRes] = await Promise.all([
            clientsApi.stats(user.id).catch(() => null),
            scheduleApi.list({ limit: 6 }),
            bookingsApi.my().catch(() => ({ data: [] })),
            membershipsApi.my().catch(() => ({ data: [] }))
          ]);
          setStats({ ...(statsRes?.data || {}), memberships: memRes?.data || [] });
          setUpcoming((schedRes?.data || []).slice(0, 6));
          setMyBookings(bookRes?.data || []);
        }
      } catch (e) {
        // нестрашно
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEmployee, user.id]);

  const handleBook = async (schedule_id) => {
    setBookingLoading(b => ({ ...b, [schedule_id]: true }));
    try {
      await bookingsApi.create(schedule_id);
      const fresh = await bookingsApi.my();
      setMyBookings(fresh.data || []);
      setUpcoming(u => u.map(s => s.id === schedule_id
        ? { ...s, current_participants: s.current_participants + 1 }
        : s));
      toast.success('Ты записан! Не подведи.');
      fireConfetti();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Ошибка записи');
    } finally {
      setBookingLoading(b => ({ ...b, [schedule_id]: false }));
    }
  };
  const handleCancel = async (schedule_id) => {
    setBookingLoading(b => ({ ...b, [schedule_id]: true }));
    try {
      const bk = myBookings.find(b => b.schedule_id === schedule_id && b.status !== 'cancelled');
      if (!bk) return;
      await bookingsApi.cancel(bk.id);
      setMyBookings(b => b.map(x => x.id === bk.id ? { ...x, status: 'cancelled' } : x));
      setUpcoming(u => u.map(s => s.id === schedule_id
        ? { ...s, current_participants: Math.max(0, s.current_participants - 1) }
        : s));
      toast.info('Запись отменена.');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Ошибка отмены');
    } finally {
      setBookingLoading(b => ({ ...b, [schedule_id]: false }));
    }
  };

  const bookedIds = new Set(myBookings.filter(b => b.status !== 'cancelled').map(b => b.schedule_id));
  const hasActivity = myBookings.length > 0 || (stats?.active_memberships > 0);
  const membership = stats?.memberships?.[0];
  const daysLeft = membership ? daysTo(membership.end_date) : null;

  if (!isEmployee && !loading && !hasActivity) return <Onboarding />;

  return (
    <div className="fade-in">
      <div className="dash-header">
        <div>
          <h1>Привет, {user.first_name || user.login}!</h1>
          <p className="text-muted">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {!isEmployee && daysLeft !== null && (
          <div className={`dash-membership-badge ${daysLeft < 7 ? 'pulse-red' : ''}`}
            style={{ color: daysLeft > 14 ? 'var(--text-muted)' : daysLeft > 7 ? 'var(--brand-accent)' : 'var(--brand-primary)' }}>
            <Wallet size={16} />
            {daysLeft > 0 ? `${daysLeft} дн.` : 'Истёк'}
          </div>
        )}
      </div>

      {isEmployee ? (
        <>
          <div className="dash-kpi-grid">
            {loading ? Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 20, height: 120 }}>
                <Skeleton width={100} height={16} />
              </div>
            )) : kpi ? <>
              <KpiCard title="Доход за месяц" value={formatRub(kpi.month_revenue)} icon={TrendingUp} color="var(--brand-success)" />
              <KpiCard title="Активных клиентов" value={kpi.active_clients} icon={Users} color="var(--brand-info)" />
              <KpiCard title="Новых за неделю" value={kpi.new_clients_week} icon={Users} color="var(--brand-warning)" />
              <KpiCard title="Загруженность залов" value={`${kpi.avg_occupancy_pct}%`} icon={Calendar} color="var(--brand-primary)" />
            </> : null}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {['ADMIN', 'VORD', 'MANAGER'].includes((user?.role || '').toUpperCase()) && (
              <Button onClick={() => navigate('/analytics')}>Аналитика</Button>
            )}
            {['ADMIN', 'VORD'].includes((user?.role || '').toUpperCase()) && (
              <Button variant="secondary" onClick={() => navigate('/admin')}>Управление</Button>
            )}
          </div>
        </>
      ) : (
        <>
          <MotivationalQuote />
          <div className="dash-upcoming mt-3">
            <div className="dash-section-head">
              <h3>Ближайшие занятия</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/schedule')}>Все →</Button>
            </div>
            {loading ? (
              <div className="dash-sched-grid">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} height={160} radius="var(--radius-lg)" />
                ))}
              </div>
            ) : upcoming.length ? (
              <div className="dash-sched-grid">
                {upcoming.map(s => (
                  <ScheduleCard key={s.id} item={s}
                    isBooked={bookedIds.has(s.id)}
                    loading={bookingLoading[s.id]}
                    onBook={() => handleBook(s.id)}
                    onCancel={() => handleCancel(s.id)} />
                ))}
              </div>
            ) : (
              <EmptyState title={EMPTY_STATES.schedule}
                action={<Button onClick={() => navigate('/schedule')}>Расписание</Button>} />
            )}
          </div>
        </>
      )}

      <style>{`
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
        .dash-header h1 { margin: 0; }
        .dash-membership-badge {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 8px 14px;
          font-weight: 600; font-size: 14px;
        }
        .dash-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .dash-upcoming { }
        .dash-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .dash-section-head h3 { margin: 0; }
        .dash-sched-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 1100px) { .dash-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 768px) {
          .dash-kpi-grid { grid-template-columns: 1fr; }
          .dash-sched-grid { grid-template-columns: 1fr; }
          .dash-header { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
