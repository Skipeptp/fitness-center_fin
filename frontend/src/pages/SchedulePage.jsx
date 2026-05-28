import { useState, useEffect } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { scheduleApi, bookingsApi } from '../api/index.js';
import { ScheduleCard } from '../components/features/ScheduleCard.jsx';
import { Skeleton, EmptyState } from '../components/ui/Primitives.jsx';
import Input from '../components/ui/Input.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatTime, formatDate, fireConfetti, parseApiError } from '../utils/format.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { EMPTY_STATES } from '../utils/quotes.js';

const VIEWS = [
  { key: 'grid', Icon: LayoutGrid },
  { key: 'list', Icon: List }
];

export default function SchedulePage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookLoading, setBookLoading] = useState({});
  const dSearch = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const [sched, bk] = await Promise.all([
        scheduleApi.list({ limit: 40 }),
        bookingsApi.my().catch(() => ({ data: [] }))
      ]);
      setItems(sched.data || []);
      setBookings(bk.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const bookedIds = new Set(bookings.filter(b => b.status !== 'cancelled').map(b => b.schedule_id));

  const filtered = items.filter(s => {
    if (!dSearch) return true;
    const q = dSearch.toLowerCase();
    return (s.workout_type_name || '').toLowerCase().includes(q)
        || (s.trainer_name || '').toLowerCase().includes(q)
        || (s.hall_name || '').toLowerCase().includes(q);
  });

  const handleBook = async (id) => {
    setBookLoading(b => ({ ...b, [id]: true }));
    try {
      await bookingsApi.create(id);
      setBookings(b => [...b, { schedule_id: id, status: 'confirmed' }]);
      setItems(s => s.map(x => x.id === id ? { ...x, current_participants: x.current_participants + 1 } : x));
      toast.success('Записан! Теперь нельзя сдаться.');
      fireConfetti();
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setBookLoading(b => ({ ...b, [id]: false })); }
  };

  const handleCancel = async (id) => {
    setBookLoading(b => ({ ...b, [id]: true }));
    try {
      const bk = bookings.find(b => b.schedule_id === id && b.status !== 'cancelled');
      if (!bk) return;
      await bookingsApi.cancel(bk.id);
      setBookings(b => b.map(x => x.id === bk.id ? { ...x, status: 'cancelled' } : x));
      setItems(s => s.map(x => x.id === id ? { ...x, current_participants: Math.max(0, x.current_participants - 1) } : x));
      toast.info('Запись отменена.');
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setBookLoading(b => ({ ...b, [id]: false })); }
  };

  return (
    <div className="fade-in">
      <div className="sched-page-head">
        <div>
          <h1>Расписание</h1>
          <p className="text-muted">{filtered.length} занятий</p>
        </div>
        <div className="sched-controls">
          <Input icon={Search} placeholder="Поиск..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <div className="view-switcher">
            {VIEWS.map(({ key, Icon }) => (
              <button key={key} className={`view-btn ${view === key ? 'is-active' : ''}`}
                onClick={() => setView(key)} aria-label={key}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={view === 'grid' ? 'sched-grid' : 'sched-list'}>
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} height={180} radius="var(--radius-lg)" />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState title={EMPTY_STATES.schedule}
          message="Попробуй изменить фильтры." icon={Search} />
      ) : view === 'grid' ? (
        <div className="sched-grid">
          {filtered.map(s => (
            <ScheduleCard key={s.id} item={s}
              isBooked={bookedIds.has(s.id)}
              loading={bookLoading[s.id]}
              onBook={() => handleBook(s.id)}
              onCancel={() => handleCancel(s.id)} />
          ))}
        </div>
      ) : (
        <div className="sched-list">
          {filtered.map(s => (
            <div key={s.id} className={`sched-list-row ${bookedIds.has(s.id) ? 'is-booked' : ''}`}>
              <div className="sched-list-color" style={{ background: s.color_hex || 'var(--brand-primary)' }} />
              <div className="sched-list-info">
                <strong>{s.workout_type_name}</strong>
                <span className="text-muted">{formatTime(s.start_datetime)} - {formatTime(s.end_datetime)}</span>
                <span className="text-muted">{formatDate(s.start_datetime)}</span>
              </div>
              <div className="sched-list-trainer text-muted">{s.trainer_name}</div>
              <div className="sched-list-hall text-muted">{s.hall_name}</div>
              <div className="sched-list-spots">{s.current_participants}/{s.max_participants}</div>
              {bookedIds.has(s.id) ? (
                <button className="sched-list-btn is-cancel" onClick={() => handleCancel(s.id)}>Отменить</button>
              ) : (
                <button className="sched-list-btn" onClick={() => handleBook(s.id)}
                  disabled={s.current_participants >= s.max_participants}>
                  {s.current_participants >= s.max_participants ? 'Нет мест' : 'Записаться'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .sched-page-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .sched-page-head h1 { margin: 0; }
        .sched-controls { display: flex; align-items: center; gap: 10px; }
        .view-switcher { display: flex; background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 2px; }
        .view-btn { background: none; border: 0; padding: 7px; color: var(--text-muted); cursor: pointer; border-radius: var(--radius-sm); transition: all var(--t-fast) var(--ease); }
        .view-btn.is-active { background: var(--bg-elevated); color: var(--brand-primary); }
        .sched-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .sched-list { display: flex; flex-direction: column; gap: 4px; }
        .sched-list-row {
          display: grid; align-items: center; gap: 12px;
          grid-template-columns: 4px 1fr 1fr 1fr 60px 100px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 12px 16px;
          transition: background-color var(--t-fast) var(--ease);
        }
        .sched-list-row:hover { background: var(--bg-tertiary); }
        .sched-list-row.is-booked { border-left: 2px solid var(--brand-success); }
        .sched-list-color { height: 40px; width: 4px; border-radius: 2px; }
        .sched-list-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
        .sched-list-trainer, .sched-list-hall, .sched-list-spots { font-size: 13px; }
        .sched-list-btn {
          background: var(--brand-primary); color: #fff; border: 0;
          border-radius: var(--radius-md); padding: 7px 12px; font-size: 12px; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: background var(--t-fast) var(--ease);
        }
        .sched-list-btn:hover:not(:disabled) { background: var(--brand-primary-hover); }
        .sched-list-btn:disabled { opacity: .5; cursor: not-allowed; }
        .sched-list-btn.is-cancel { background: transparent; border: 1px solid var(--brand-danger); color: var(--brand-danger); }
        .sched-list-btn.is-cancel:hover { background: var(--brand-danger); color: #fff; }
        @media (max-width: 768px) {
          .sched-list-row { grid-template-columns: 4px 1fr 80px; }
          .sched-list-trainer, .sched-list-hall, .sched-list-spots { display: none; }
        }
      `}</style>
    </div>
  );
}
