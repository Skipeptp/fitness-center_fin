import { useState, useEffect } from 'react';
import { bookingsApi } from '../api/index.js';
import { BookingCard } from '../components/features/ScheduleCard.jsx';
import { Tabs } from '../components/ui/Modal.jsx';
import { Skeleton, EmptyState } from '../components/ui/Primitives.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { parseApiError } from '../utils/format.js';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { EMPTY_STATES } from '../utils/quotes.js';
import { Calendar } from 'lucide-react';

const TABS = [
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'past',     label: 'Прошедшие' },
  { key: 'cancelled',label: 'Отменённые' }
];

export default function MyBookingsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [cancelLoading, setCancelLoading] = useState({});

  const load = () => {
    setLoading(true);
    bookingsApi.my().then(r => setBookings(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const now = new Date();
  const groups = {
    upcoming: bookings.filter(b => b.status !== 'cancelled' && new Date(b.start_datetime) >= now),
    past:     bookings.filter(b => b.status !== 'cancelled' && new Date(b.start_datetime) < now),
    cancelled:bookings.filter(b => b.status === 'cancelled')
  };

  const handleCancel = async (id) => {
    setCancelLoading(l => ({ ...l, [id]: true }));
    try {
      await bookingsApi.cancel(id);
      setBookings(b => b.map(x => x.id === id ? { ...x, status: 'cancelled' } : x));
      toast.info('Запись отменена.');
    } catch (e) { toast.error(parseApiError(e)); }
    finally { setCancelLoading(l => ({ ...l, [id]: false })); }
  };

  const current = groups[tab] || [];
  const tabs = TABS.map(t => ({ ...t, count: groups[t.key]?.length }));

  return (
    <div className="fade-in">
      <h1>Мои записи</h1>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} height={72} radius="var(--radius-lg)" />)}
        </div>
      ) : !current.length ? (
        <EmptyState
          title={EMPTY_STATES.bookings}
          icon={Calendar}
          action={tab === 'upcoming'
            ? <Button onClick={() => navigate('/schedule')}>Записаться на тренировку</Button>
            : null}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.map(b => (
            <BookingCard key={b.id} booking={b}
              loading={cancelLoading[b.id]}
              onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
