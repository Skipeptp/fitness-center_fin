import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Award, ArrowLeft, Calendar } from 'lucide-react';
import { trainersApi, bookingsApi } from '../api/index.js';
import { TrainerCard } from '../components/features/TrainerCard.jsx';
import { ScheduleCard } from '../components/features/ScheduleCard.jsx';
import { Avatar, Skeleton, EmptyState, Badge } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { EMPTY_STATES } from '../utils/quotes.js';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainersApi.list().then(r => {
      setTrainers(r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <h1>Тренеры</h1>
      <p className="text-muted">Наша команда профессионалов</p>
      {loading ? (
        <div className="trainers-grid">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} height={220} radius="var(--radius-lg)" />)}
        </div>
      ) : !trainers.length ? (
        <EmptyState title={EMPTY_STATES.trainers} />
      ) : (
        <div className="trainers-grid">
          {trainers.map(t => <TrainerCard key={t.id} trainer={t} />)}
        </div>
      )}
      <style>{`
        .trainers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
      `}</style>
    </div>
  );
}

export function TrainerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isClient } = useAuth();

  const [trainer, setTrainer] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    Promise.all([
      trainersApi.get(id),
      trainersApi.schedule(id).catch(() => ({ data: [] })),
      trainersApi.reviews(id).catch(() => ({ data: [] })),
      isClient ? bookingsApi.my().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([t, s, r, bk]) => {
      setTrainer(t.data);
      setSchedule(s.data || []);
      setReviews((r.data || []).filter(rv => rv.is_approved));
      const bkData = bk.data || [];
      setBookings(bkData);
      setBookedIds(new Set(bkData.filter(b => b.status !== 'cancelled').map(b => b.schedule_id)));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (scheduleId) => {
    if (!isClient) {
      toast.error('Записаться могут только клиенты');
      return;
    }
    if (bookingLoading === scheduleId || bookedIds.has(scheduleId)) return;
  
    setBookingLoading(scheduleId);
    try {
      const res = await bookingsApi.create(scheduleId);
      setBookings(b => [...b, { ...(res.data || {}), schedule_id: scheduleId, status: 'booked' }]);
      setBookedIds(prev => new Set([...prev, scheduleId]));
      toast.success('Вы записаны на тренировку!');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Ошибка при записи';
      if (msg === 'No active membership') {
        toast.error('Нет активного абонемента. Купите абонемент в разделе "Абонементы".');
      } else if (msg === 'Already booked') {
        toast.error('Вы уже записаны на это занятие.');
      } else {
        toast.error(msg);
      }
    } finally {
      setBookingLoading(null);
    }
  };
  
  const handleCancel = async (scheduleId) => {
    if (bookingLoading === scheduleId) return;
  
    setBookingLoading(scheduleId);
    try {
      const bk = bookings.find(b => b.schedule_id === scheduleId && b.status !== 'cancelled');
      if (!bk) return;
      await bookingsApi.cancel(bk.id);
      setBookings(b => b.map(x => x.id === bk.id ? { ...x, status: 'cancelled' } : x));
      setBookedIds(prev => { const s = new Set(prev); s.delete(scheduleId); return s; });
      toast.success('Запись отменена.');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Ошибка при отмене');
    } finally {
      setBookingLoading(null);
    }
  };
  
  if (loading) return <div className="fade-in"><Skeleton height={300} radius="var(--radius-xl)" /></div>;
  if (!trainer) return <EmptyState title="Тренер не найден" action={<Button onClick={() => navigate(-1)}>Назад</Button>} />;
  
  const emp = trainer.employee || trainer;

  return (
    <div className="fade-in">
      <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Назад</Button>

      <div className="trainer-hero mt-2">
        <Avatar user={{ first_name: emp.first_name, last_name: emp.last_name, photo_url: trainer.photo_url }} size={96} />
        <div className="trainer-hero-info">
          <h1>{emp.first_name} {emp.last_name}</h1>
          <div className="flex gap-2 items-center flex-wrap mt-1">
            <Badge color="primary">{trainer.specialization}</Badge>
            <span className="flex items-center gap-1 text-muted">
              <Star size={14} fill="var(--brand-warning)" color="var(--brand-warning)" />
              {Number(trainer.rating).toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-muted">
              <Award size={14} /> {trainer.experience_years} лет опыта
            </span>
          </div>
          {trainer.bio && <p className="trainer-bio">{trainer.bio}</p>}
        </div>
      </div>

      {schedule.length > 0 && (
        <section className="trainer-section">
          <h3><Calendar size={18} /> Ближайшие занятия</h3>
          <div className="trainer-sched-grid">
            {schedule.slice(0, 6).map(s => (
              <ScheduleCard
                key={s.id}
                item={s}
                isBooked={bookedIds.has(s.id)}
                loading={bookingLoading === s.id}
                onBook={() => handleBook(s.id)}
                onCancel={() => handleCancel(s.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="trainer-section">
        <h3><Star size={18} /> Отзывы ({reviews.length})</h3>
        {!reviews.length ? (
          <EmptyState title={EMPTY_STATES.reviews} />
        ) : (
          <div className="reviews-list">
            {reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-head">
                  <div className="review-stars">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={14}
                        fill={i < r.rating ? 'var(--brand-warning)' : 'none'}
                        color="var(--brand-warning)" />
                    ))}
                  </div>
                  <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .trainer-hero { display: flex; gap: 24px; align-items: flex-start; padding: 24px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl); }
        .trainer-hero-info { flex: 1; }
        .trainer-hero-info h1 { margin: 0; }
        .trainer-bio { margin: 12px 0 0; color: var(--text-secondary); font-size: 14px; max-width: 600px; }
        .trainer-section { margin-top: 28px; }
        .trainer-section h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .trainer-sched-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
        .reviews-list { display: flex; flex-direction: column; gap: 10px; }
        .review-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px; }
        .review-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .review-stars { display: flex; gap: 2px; }
        .review-card p { margin: 0; font-size: 14px; color: var(--text-secondary); }
        @media (max-width: 600px) { .trainer-hero { flex-direction: column; } }
      `}</style>
    </div>
  );
}

export default TrainersPage;