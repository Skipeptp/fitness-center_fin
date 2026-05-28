import { Clock, Users, MapPin, Zap } from 'lucide-react';
import { Badge, ProgressBar } from '../ui/Primitives.jsx';
import Button from '../ui/Button.jsx';
import { formatTime, formatDate } from '../../utils/format.js';

// Карточка занятия в расписании
export function ScheduleCard({ item, onBook, onCancel, isBooked, loading }) {
  const start = new Date(item.start_datetime);
  const end = new Date(item.end_datetime);
  const isFull = item.current_participants >= item.max_participants;
  const fillPct = Math.round((item.current_participants / item.max_participants) * 100);
  const color = item.color_hex || 'var(--brand-primary)';

  return (
    <div className={`sched-card ${isFull && !isBooked ? 'is-full' : ''}`}>
      <div className="sched-card-accent" style={{ background: color }} />
      <div className="sched-card-body">
        <div className="sched-card-head">
          <span className="sched-type" style={{ color }}>{item.workout_type_name || 'Тренировка'}</span>
          {isBooked && <Badge color="success" size="sm">Записан</Badge>}
          {isFull && !isBooked && <Badge color="warning" size="sm">Полная</Badge>}
        </div>
        <h4 className="sched-title">{item.title || item.workout_type_name}</h4>
        <div className="sched-meta">
          <span><Clock size={13} /> {formatTime(item.start_datetime)} - {formatTime(item.end_datetime)}</span>
          <span><MapPin size={13} /> {item.hall_name || 'Зал'}</span>
          <span><Users size={13} /> {item.current_participants}/{item.max_participants}</span>
        </div>
        {item.trainer_name && (
          <div className="sched-trainer">Тренер: {item.trainer_name}</div>
        )}
        <ProgressBar value={item.current_participants} max={item.max_participants} height={4} color={color} />
        <div className="sched-actions">
          <span className="sched-date">{formatDate(item.start_datetime)}</span>
          {isBooked ? (
            <Button size="sm" variant="danger" loading={loading} onClick={onCancel}>Отменить</Button>
          ) : (
            <Button
              size="sm"
              variant={isFull ? 'secondary' : 'primary'}
              disabled={isFull}
              loading={loading}
              onClick={onBook}
              icon={isFull ? undefined : Zap}
              className="sched-book-btn"
            >
              {isFull ? 'Мест нет' : 'Записаться'}
            </Button>
          )}
        </div>
      </div>
      <style>{`
        .sched-card {
          position: relative;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
          transition: transform var(--t-base) var(--ease),
                      border-color var(--t-base) var(--ease),
                      box-shadow var(--t-base) var(--ease);
        }
        .sched-card:hover {
          transform: translateY(-2px); box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
        }
        .sched-card.is-full { opacity: .75; }
        .sched-card-accent { height: 3px; width: 100%; }
        .sched-card-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .sched-card-head { display: flex; align-items: center; justify-content: space-between; }
        .sched-type { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
        .sched-title { margin: 0; font-size: 15px; color: var(--text-primary); }
        .sched-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--text-muted); }
        .sched-meta span { display: flex; align-items: center; gap: 4px; }
        .sched-trainer { font-size: 12px; color: var(--text-muted); }
        .sched-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
        .sched-date { font-size: 12px; color: var(--text-muted); }
        /* Микровзаимодействие - hover меняет текст кнопки */
        .sched-book-btn span { pointer-events: none; }
        .sched-card:hover .sched-book-btn:not(:disabled) span { }
      `}</style>
    </div>
  );
}

// Карточка бронирования (для страницы "Мои записи")
export function BookingCard({ booking, onCancel, loading }) {
  const isPast = new Date(booking.start_datetime) < new Date();
  const statusColor = {
    confirmed: 'success', cancelled: 'danger', pending: 'warning', attended: 'info'
  }[booking.status] || 'default';

  return (
    <div className="booking-card">
      <div className="booking-card-left" style={{ borderColor: booking.color_hex || 'var(--brand-primary)' }} />
      <div className="booking-card-body">
        <div className="booking-card-head">
          <h4>{booking.workout_type_name || 'Тренировка'}</h4>
          <Badge color={statusColor} size="sm">{booking.status}</Badge>
        </div>
        <div className="booking-card-meta">
          <span><Clock size={13} /> {formatTime(booking.start_datetime)}</span>
          <span>{formatDate(booking.start_datetime)}</span>
          {booking.hall_name && <span><MapPin size={13} /> {booking.hall_name}</span>}
          {booking.trainer_name && <span>Тренер: {booking.trainer_name}</span>}
        </div>
      </div>
      {!isPast && booking.status === 'confirmed' && (
        <Button size="sm" variant="danger" loading={loading} onClick={() => onCancel(booking.id)}>
          Отменить
        </Button>
      )}
      <style>{`
        .booking-card {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 14px;
          display: flex; align-items: center; gap: 14px;
          transition: background-color var(--t-fast) var(--ease);
        }
        .booking-card:hover { background: var(--bg-tertiary); }
        .booking-card-left {
          width: 3px; height: 48px; border-radius: var(--radius-full);
          border-left: 3px solid; flex-shrink: 0;
        }
        .booking-card-body { flex: 1; }
        .booking-card-head { display: flex; align-items: center; justify-content: space-between; }
        .booking-card-head h4 { margin: 0; font-size: 14px; }
        .booking-card-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-muted); margin-top: 4px; }
        .booking-card-meta span { display: flex; align-items: center; gap: 3px; }
      `}</style>
    </div>
  );
}
