import { useState, useEffect } from 'react';
import { analyticsApi, clientsApi, reviewsApi, bookingsApi, membershipsApi, scheduleApi, trainersApi, hallsApi } from '../api/index.js';
import { KpiCard } from '../components/features/KpiCard.jsx';
import { Badge, Avatar, Skeleton, EmptyState } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { Tabs, Modal } from '../components/ui/Modal.jsx';
import { formatRub, formatDate, fullName, parseApiError } from '../utils/format.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
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
            <thead>
              <tr><th>Тренер</th><th>Занятий</th><th>Записей</th><th>Рейтинг</th><th>Отзывов</th></tr>
            </thead>
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

const ALL_ADMIN_TABS = [
  { key: 'clients',    label: 'Клиенты',              roles: ['ADMIN', 'VORD'] },
  { key: 'manage',     label: 'Управление',            roles: ['ADMIN', 'VORD', 'MANAGER'] },
  { key: 'booking',    label: 'Запись на тренировку',  roles: ['ADMIN', 'VORD', 'MANAGER'] },
  { key: 'membership', label: 'Выдать абонемент',      roles: ['ADMIN', 'VORD', 'MANAGER'] },
  { key: 'schedule',   label: 'Создать тренировку',    roles: ['ADMIN', 'VORD', 'MANAGER'] },
  { key: 'reviews',    label: 'Отзывы',                roles: ['ADMIN', 'VORD'] },
];
const ADMIN_TABS = ALL_ADMIN_TABS.filter(t => t.roles.includes(userRole));
function ParticipantsList({ scheduleId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    bookingsApi.all({ schedule_id: scheduleId })
      .then(r => setList((r.data || []).filter(b => b.status !== 'cancelled')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scheduleId]);

  if (loading) return <Skeleton height={60} radius="var(--radius-md)" style={{ marginTop: 12 }} />;
  if (!list.length) return <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Нет записей на это занятие</p>;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
        Записаны ({list.length}):
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(b => (
          <div key={b.id} style={{ fontSize: 13, padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            {b.client_name || b.client_email || `Клиент #${b.client_id}`}
          </div>
        ))}
      </div>
    </div>
  );
}
export function AdminPage() {
  const toast = useToast();
  const { role } = useAuth();                          // берём role напрямую из контекста
  const userRole = (role || '').toUpperCase();         // нормализуем к верхнему регистру

  const ADMIN_TABS = ALL_TABS.filter(t =>
    t.roles.includes(userRole)
  );

  const [tab, setTab] = useState(() => ADMIN_TABS[0]?.key || 'booking');

  // --- клиенты ---
  const [clients, setClients]               = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [editClient, setEditClient]         = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [editLoading, setEditLoading]       = useState(false);

  // --- отзывы ---
  const [pending, setPending]               = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // --- запись на тренировку ---
  const [schedule, setSchedule]             = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [bookClientId, setBookClientId]     = useState('');
  const [bookScheduleId, setBookScheduleId] = useState('');
  const [bookLoading, setBookLoading]       = useState(false);

  // --- выдача абонемента ---
  const [membTypes, setMembTypes]           = useState([]);
  const [membClientId, setMembClientId]     = useState('');
  const [membTypeId, setMembTypeId]         = useState('');
  const [membMethod, setMembMethod]         = useState('card');
  const [membLoading, setMembLoading]       = useState(false);

  // --- создание тренировки ---
  const [trainers, setTrainers]             = useState([]);
  const [halls, setHalls]                   = useState([]);
  const [wTypes, setWTypes]                 = useState([]);
  const [schedForm, setSchedForm]           = useState({
    trainer_id: '', hall_id: '', workout_type_id: '',
    start_datetime: '', end_datetime: '', max_participants: 15
  });
  const [schedLoading, setSchedLoading]     = useState(false);

  // загрузка клиентов и отзывов при монтировании
  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const r = await clientsApi.list({ limit: 100 });
      setClients(r.data || []);
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setLoadingClients(false); }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const r = await reviewsApi.pending();
      setPending(r.data || []);
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setLoadingReviews(false); }
  };

  useEffect(() => { loadClients(); loadReviews(); }, []);

  // ленивая загрузка при переключении таба
  useEffect(() => {
    if (tab === 'booking' && !schedule.length) {
      setLoadingSchedule(true);
      scheduleApi.list({ limit: 100 })
        .then(r => setSchedule(r.data || []))
        .catch(e => toast.error(parseApiError(e)))
        .finally(() => setLoadingSchedule(false));
    }
    if (tab === 'membership' && !membTypes.length) {
      membershipsApi.types().then(r => setMembTypes(r.data || []));
    }
    if (tab === 'schedule' && !trainers.length) {
      Promise.all([
        trainersApi.list(),
        hallsApi.list(),
        scheduleApi.list({ limit: 1 }) // чтобы получить workout_types через другой способ
      ]).then(([tr, ha]) => {
        setTrainers(tr.data || []);
        setHalls(ha.data || []);
      });
      // workout types через /schedule или напрямую через апи
      fetch('/api/schedule?limit=1')
        .then(() => {})
        .catch(() => {});
      // Используем прямой запрос к workout_types через scheduleApi
      scheduleApi.list({ limit: 200 }).then(r => {
        const seen = new Set();
        const types = (r.data || []).reduce((acc, s) => {
          if (!seen.has(s.workout_type_id)) {
            seen.add(s.workout_type_id);
            acc.push({ id: s.workout_type_id, name: s.workout_type_name });
          }
          return acc;
        }, []);
        setWTypes(types);
      });
    }
  }, [tab]);

  // --- редактирование клиента ---
  const openEdit = (c) => {
    const form = {
      first_name: c.first_name ?? '',
      last_name:  c.last_name  ?? '',
      phone:      c.phone      ?? ''
    };
    setEditForm(form);       
    setEditClient(c);        
  };
  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await clientsApi.update(editClient.id, editForm);
      toast.success('Данные обновлены');
      setEditClient(null); loadClients();
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setEditLoading(false); }
  };
  const handleDeactivate = async (id) => {
    if (!window.confirm('Деактивировать клиента?')) return;
    try { await clientsApi.remove(id); toast.info('Деактивирован'); loadClients(); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  // --- запись на тренировку ---
  const handleBook = async () => {
    if (!bookClientId || !bookScheduleId) return toast.error('Выбери клиента и занятие');
    setBookLoading(true);
    try {
      await bookingsApi.create(Number(bookScheduleId), Number(bookClientId));
      toast.success('Клиент записан!');
      setBookClientId(''); setBookScheduleId('');
    } catch (e) {
      const msg = e?.response?.data?.error || parseApiError(e);
      if (msg === 'No active membership') toast.error('У клиента нет активного абонемента');
      else if (msg === 'Already booked')  toast.error('Клиент уже записан на это занятие');
      else toast.error(msg);
    } finally { setBookLoading(false); }
  };

  // --- выдача абонемента ---
  const handleMembership = async () => {
    if (!membClientId || !membTypeId) return toast.error('Выбери клиента и тип абонемента');
    setMembLoading(true);
    try {
      await membershipsApi.purchase({
        client_id: Number(membClientId),
        membership_type_id: Number(membTypeId),
        payment_method: membMethod
      });
      toast.success('Абонемент выдан!');
      setMembClientId(''); setMembTypeId('');
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setMembLoading(false); }
  };

  // --- создание тренировки ---
  const sf = (k) => (e) => setSchedForm(f => ({ ...f, [k]: e.target.value }));
  const handleSchedule = async () => {
    const { trainer_id, hall_id, workout_type_id, start_datetime, end_datetime } = schedForm;
    if (!trainer_id || !hall_id || !workout_type_id || !start_datetime || !end_datetime)
      return toast.error('Заполни все поля');
    setSchedLoading(true);
    try {
      await scheduleApi.create({
        trainer_id:      Number(schedForm.trainer_id),
        hall_id:         Number(schedForm.hall_id),
        workout_type_id: Number(schedForm.workout_type_id),
        start_datetime:  schedForm.start_datetime,
        end_datetime:    schedForm.end_datetime,
        max_participants: Number(schedForm.max_participants) || 15
      });
      toast.success('Тренировка добавлена в расписание!');
      setSchedForm({ trainer_id:'', hall_id:'', workout_type_id:'', start_datetime:'', end_datetime:'', max_participants: 15 });
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setSchedLoading(false); }
  };

    // ── Функции таба "Управление" ──

  const loadMgmtBookings = async (schedId) => {
    if (!schedId) { setMgmtBookings([]); return; }
    try {
      const r = await bookingsApi.bySchedule(schedId);
      setMgmtBookings(r.data || []);
    } catch { setMgmtBookings([]); }
  };

  const loadMgmtMemberships = async (clientId) => {
    if (!clientId) { setMgmtMemberships([]); return; }
    try {
      const r = await membershipsApi.byClient(clientId);
      setMgmtMemberships(r.data || []);
    } catch { setMgmtMemberships([]); }
  };

  const handleMgmtCancelBooking = async (bookingId) => {
    setMgmtBookLoading(bookingId);
    try {
      const reason = cancelReasonMap[bookingId] || null;
      await bookingsApi.cancel(bookingId, reason);
      setMgmtBookings(prev =>
        prev.map(x => x.id === bookingId ? { ...x, status: 'cancelled' } : x)
      );
      toast.success('Запись отменена.');
    } catch (e) {
      toast.error(parseApiError(e));
    } finally { setMgmtBookLoading(null); }
  };

  const handleMgmtDeactivateMembership = async (membId) => {
    setMgmtMembLoading(membId);
    try {
      await membershipsApi.deactivate(membId);
      setMgmtMemberships(prev =>
        prev.map(x => x.id === membId ? { ...x, is_active: false } : x)
      );
      toast.success('Абонемент деактивирован.');
    } catch (e) {
      toast.error(parseApiError(e));
    } finally { setMgmtMembLoading(null); }
  };

  const handleMoveBooking = async () => {
    if (!moveBookingId || !moveTargetId) return;
    setMoveLoading(true);
    try {
      await bookingsApi.move(moveBookingId, Number(moveTargetId));
      // обновляем локальный список — отмечаем перенесённую запись
      setMgmtBookings(prev =>
        prev.map(x =>
          x.id === moveBookingId
            ? { ...x, schedule_id: Number(moveTargetId), _moved: true }
            : x
        )
      );
      setMoveBookingId(null);
      setMoveTargetId('');
      toast.success('Запись перенесена!');
    } catch (e) {
      toast.error(parseApiError(e));
    } finally { setMoveLoading(false); }
  };

  // --- отзывы ---
  const approveReview = async (id) => {
    try { await reviewsApi.approve(id); setPending(p => p.filter(r => r.id !== id)); toast.success('Отзыв одобрен'); }
    catch (e) { toast.error(parseApiError(e)); }
  };
  const deleteReview = async (id) => {
    try { await reviewsApi.remove(id); setPending(p => p.filter(r => r.id !== id)); toast.info('Отзыв удалён'); }
    catch (e) { toast.error(parseApiError(e)); }
  };

  return (
    <div className="fade-in">
      <h1>Управление</h1>
      <Tabs
        tabs={ADMIN_TABS.map(t => t.key === 'reviews' ? { ...t, count: pending.length } : t)}
        value={tab}
        onChange={setTab}
      />

      {/* ── КЛИЕНТЫ ── */}
      {tab === 'clients' && (
        loadingClients ? <Skeleton height={200} radius="var(--radius-lg)" />
        : !clients.length ? <EmptyState title="Нет клиентов" />
        : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {clients.map(c => (
              <div key={c.id} className="admin-client-row">
                <Avatar user={c} size={36} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{fullName(c) || c.email}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.email}</div>
                </div>
                <Badge color={c.is_active ? 'success' : 'danger'} size="sm">
                  {c.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
                <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{formatDate(c.created_at)}</span>
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>Изменить</Button>
                {c.is_active && <Button size="sm" variant="danger" onClick={() => handleDeactivate(c.id)}>Деактивировать</Button>}
              </div>
            ))}
          </div>
      )}

            {/* ── УПРАВЛЕНИЕ ── */}
      {tab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Блок 1: Участники занятия */}
          <div className="admin-form" style={{ maxWidth: '100%' }}>
            <h3 style={{ margin: 0 }}>Участники тренировки</h3>

            <div className="volt-field">
              <label className="volt-field-label">Выбери занятие</label>
              {loadingSchedule
                ? <Skeleton height={40} />
                : <select className="volt-input" value={mgmtScheduleId}
                    onChange={e => {
                      setMgmtScheduleId(e.target.value);
                      loadMgmtBookings(e.target.value);
                    }}>
                    <option value="">-- выбери занятие --</option>
                    {schedule.filter(s => s.status !== 'cancelled').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.workout_name || s.workout_type_name} —{' '}
                        {new Date(s.start_datetime).toLocaleString('ru-RU', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                        {' '}({s.current_participants}/{s.max_participants})
                      </option>
                    ))}
                  </select>
              }
            </div>

            {mgmtScheduleId && (
              mgmtBookings.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    Нет записей на это занятие
                  </p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Всего записей: {mgmtBookings.filter(b => b.status !== 'cancelled').length}
                    </div>

                    {mgmtBookings.map(bk => (
                      <div key={bk.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        opacity: bk.status === 'cancelled' ? 0.5 : 1
                      }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                          {bk.client_name || bk.client_email}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {bk.client_phone || ''}
                        </span>
                        <Badge variant={
                          bk.status === 'cancelled' ? 'error' :
                          bk.status === 'attended'  ? 'success' : 'info'
                        }>
                          {bk.status === 'cancelled' ? 'Отменена' :
                          bk.status === 'attended'  ? 'Посетил'  : 'Записан'}
                        </Badge>

                        {bk.status !== 'cancelled' && (
                          <>
                            <input
                              className="volt-input"
                              style={{ width: 170, height: 34, fontSize: 12 }}
                              placeholder="Причина отмены (необяз.)"
                              value={cancelReasonMap[bk.id] || ''}
                              onChange={e =>
                                setCancelReasonMap(m => ({ ...m, [bk.id]: e.target.value }))
                              }
                            />
                            <Button size="sm" variant="danger"
                              loading={mgmtBookLoading === bk.id}
                              onClick={() => handleMgmtCancelBooking(bk.id)}>
                              Отменить запись
                            </Button>
                            <Button size="sm" variant="secondary"
                              onClick={() =>
                                setMoveBookingId(prev => prev === bk.id ? null : bk.id)
                              }>
                              Перенести
                            </Button>
                          </>
                        )}

                        {/* Форма переноса — раскрывается под строкой */}
                        {moveBookingId === bk.id && bk.status !== 'cancelled' && (
                          <div style={{ width: '100%', display: 'flex', gap: 8,
                            marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select className="volt-input" style={{ flex: 1, minWidth: 200 }}
                              value={moveTargetId}
                              onChange={e => setMoveTargetId(e.target.value)}>
                              <option value="">-- новое занятие --</option>
                              {schedule
                                .filter(s =>
                                  String(s.id) !== mgmtScheduleId &&
                                  s.status !== 'cancelled'
                                )
                                .map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.workout_name || s.workout_type_name} —{' '}
                                    {new Date(s.start_datetime).toLocaleString('ru-RU', {
                                      day: 'numeric', month: 'short',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                    {' '}({s.current_participants}/{s.max_participants})
                                  </option>
                                ))
                              }
                            </select>
                            <Button size="sm" loading={moveLoading}
                              disabled={!moveTargetId}
                              onClick={handleMoveBooking}>
                              Подтвердить перенос
                            </Button>
                            <Button size="sm" variant="secondary"
                              onClick={() => { setMoveBookingId(null); setMoveTargetId(''); }}>
                              Отмена
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
            )}
          </div>

          {/* Блок 2: Абонементы клиента */}
          <div className="admin-form" style={{ maxWidth: '100%' }}>
            <h3 style={{ margin: 0 }}>Абонементы клиента</h3>

            <div className="volt-field">
              <label className="volt-field-label">Выбери клиента</label>
              <select className="volt-input" value={mgmtClientId}
                onChange={e => {
                  setMgmtClientId(e.target.value);
                  loadMgmtMemberships(e.target.value);
                }}>
                <option value="">-- выбери клиента --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {fullName(c) || c.email} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {mgmtClientId && (
              mgmtMemberships.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    Нет абонементов у этого клиента
                  </p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {mgmtMemberships.map(m => (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        opacity: m.is_active ? 1 : 0.5
                      }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                          {m.type_name}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(m.start_date).toLocaleDateString('ru-RU')}
                          {' – '}
                          {new Date(m.end_date).toLocaleDateString('ru-RU')}
                        </span>
                        <Badge variant={m.is_active ? 'success' : 'error'}>
                          {m.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                        {m.is_active && (
                          <Button size="sm" variant="danger"
                            loading={mgmtMembLoading === m.id}
                            onClick={() => handleMgmtDeactivateMembership(m.id)}>
                            Забрать абонемент
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
            )}
          </div>

        </div>
      )}




      {/* ── ЗАПИСЬ НА ТРЕНИРОВКУ ── */}
      {tab === 'booking' && (
        <div className="admin-form">
          <h3 style={{ marginTop:0 }}>Записать клиента на тренировку</h3>
          <div className="volt-field">
            <label className="volt-field-label">Клиент</label>
            <select className="volt-input" value={bookClientId} onChange={e => setBookClientId(e.target.value)}>
              <option value="">-- выбери клиента --</option>
              {clients.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{fullName(c) || c.email} ({c.email})</option>
              ))}
            </select>
          </div>
          <div className="volt-field">
            <label className="volt-field-label">Занятие</label>
            {loadingSchedule ? <Skeleton height={40} /> :
              <select className="volt-input" value={bookScheduleId} onChange={e => setBookScheduleId(e.target.value)}>
                <option value="">-- выбери занятие --</option>
                {schedule.filter(s => s.status !== 'cancelled').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.workout_name || s.workout_type_name} —{' '}
                    {new Date(s.start_datetime).toLocaleString('ru-RU', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    {' '}({s.current_participants}/{s.max_participants})
                  </option>
                ))}
              </select>
            }
          </div>
          <Button loading={bookLoading} onClick={handleBook}>Записать</Button>
          {bookScheduleId && (
            <ParticipantsList scheduleId={bookScheduleId} />
          )}
        </div>
      )}

      {/* ── ВЫДАЧА АБОНЕМЕНТА ── */}
      {tab === 'membership' && (
        <div className="admin-form">
          <h3 style={{ marginTop:0 }}>Выдать абонемент клиенту</h3>
          <div className="volt-field">
            <label className="volt-field-label">Клиент</label>
            <select className="volt-input" value={membClientId} onChange={e => setMembClientId(e.target.value)}>
              <option value="">-- выбери клиента --</option>
              {clients.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{fullName(c) || c.email}</option>
              ))}
            </select>
          </div>
          <div className="volt-field">
            <label className="volt-field-label">Тип абонемента</label>
            <select className="volt-input" value={membTypeId} onChange={e => setMembTypeId(e.target.value)}>
              <option value="">-- выбери тип --</option>
              {membTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {formatRub(t.price)}</option>
              ))}
            </select>
          </div>
          <div className="volt-field">
            <label className="volt-field-label">Способ оплаты</label>
            <select className="volt-input" value={membMethod} onChange={e => setMembMethod(e.target.value)}>
              <option value="card">Карта</option>
              <option value="cash">Наличные</option>
              <option value="online">Онлайн</option>
            </select>
          </div>
          <Button loading={membLoading} onClick={handleMembership}>Выдать абонемент</Button>
        </div>
      )}

      {/* ── СОЗДАНИЕ ТРЕНИРОВКИ ── */}
      {tab === 'schedule' && (
        <div className="admin-form">
          <h3 style={{ marginTop:0 }}>Добавить тренировку в расписание</h3>
          <div className="admin-form-grid">
            <div className="volt-field">
              <label className="volt-field-label">Тренер</label>
              <select className="volt-input" value={schedForm.trainer_id} onChange={sf('trainer_id')}>
                <option value="">-- тренер --</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name || (t.first_name + ' ' + t.last_name)}</option>
                ))}
              </select>
            </div>
            <div className="volt-field">
              <label className="volt-field-label">Зал</label>
              <select className="volt-input" value={schedForm.hall_id} onChange={sf('hall_id')}>
                <option value="">-- зал --</option>
                {halls.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="volt-field">
              <label className="volt-field-label">Тип тренировки</label>
              <select className="volt-input" value={schedForm.workout_type_id} onChange={sf('workout_type_id')}>
                <option value="">-- тип --</option>
                {wTypes.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="volt-field">
              <label className="volt-field-label">Макс. участников</label>
              <input type="number" className="volt-input" min={1} max={100}
                value={schedForm.max_participants} onChange={sf('max_participants')} />
            </div>
            <div className="volt-field">
              <label className="volt-field-label">Начало</label>
              <input type="datetime-local" className="volt-input"
                value={schedForm.start_datetime} onChange={sf('start_datetime')} />
            </div>
            <div className="volt-field">
              <label className="volt-field-label">Конец</label>
              <input type="datetime-local" className="volt-input"
                value={schedForm.end_datetime} onChange={sf('end_datetime')} />
            </div>
          </div>
          <Button loading={schedLoading} onClick={handleSchedule} style={{ marginTop:8 }}>
            Добавить в расписание
          </Button>
        </div>
      )}

      {/* ── ОТЗЫВЫ ── */}
      {tab === 'reviews' && (
        loadingReviews ? <Skeleton height={200} radius="var(--radius-lg)" />
        : !pending.length ? <EmptyState title="Нет отзывов на модерации" icon={CheckCircle2} />
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pending.map(r => (
              <div key={r.id} className="admin-review-row">
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {Array(5).fill(0).map((_,i) => (
                      <Star key={i} size={13}
                        fill={i < r.rating ? 'var(--brand-warning)' : 'none'}
                        color="var(--brand-warning)" />
                    ))}
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>{formatDate(r.created_at)}</span>
                  </div>
                  {r.comment && <p style={{ margin:'6px 0 0', fontSize:13, color:'var(--text-secondary)' }}>{r.comment}</p>}
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <Button size="sm" onClick={() => approveReview(r.id)}>Одобрить</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteReview(r.id)}>Удалить</Button>
                </div>
              </div>
            ))}
          </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      <Modal
        open={!!editClient}
        onClose={() => setEditClient(null)}
        title={`Редактировать: ${editClient ? (fullName(editClient) || editClient.email) : ''}`}
        footer={<>
          <Button variant="secondary" onClick={() => setEditClient(null)}>Отмена</Button>
          <Button loading={editLoading} onClick={handleEditSave}>Сохранить</Button>
        </>}
      >
        {editClient && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[['first_name','Имя'],['last_name','Фамилия'],['phone','Телефон']].map(([k,l]) => (
              <div className="volt-field" key={k}>
                <label className="volt-field-label">{l}</label>
                <input className="volt-input" value={editForm[k]}
                  onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <style>{`
        .admin-client-row { display:flex; align-items:center; gap:12px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-lg); padding:12px 16px; flex-wrap:wrap; }
        .admin-review-row { display:flex; align-items:flex-start; gap:14px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-lg); padding:14px 16px; }
        .admin-form { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px; display:flex; flex-direction:column; gap:16px; max-width:600px; }
        .admin-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .volt-field { display:flex; flex-direction:column; gap:6px; }
        .volt-field-label { font-size:13px; font-weight:500; color:var(--text-secondary); }
        .volt-input { height:40px; padding:0 14px; background:var(--input-bg); color:var(--text-primary); border:1px solid var(--input-border); border-radius:var(--radius-md); font-size:14px; font-family:inherit; width:100%; box-sizing:border-box; }
        .volt-input:focus { outline:none; border-color:var(--input-focus); box-shadow:0 0 0 3px rgba(230,57,70,.15); }
        @media(max-width:600px){ .admin-form-grid{ grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}

export default AnalyticsPage;