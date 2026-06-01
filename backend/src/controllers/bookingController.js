const { pool } = require('../db/pool');

// POST /api/bookings - { schedule_id, client_id? }
// client_id - только для менеджера/admin (запись другого клиента)
const create = async (req, res, next) => {
  const isEmployee = req.user.type === 'employee';
  const role = (req.user.role || '').toUpperCase();
  const canBookForOthers = isEmployee && ['ADMIN', 'MANAGER'].includes(role);

  // тренер не может делать записи
  if (isEmployee && !canBookForOthers) {
    return res.status(403).json({ success: false, error: 'Only clients or managers can book' });
  }

  try {
    const { schedule_id, client_id } = req.body;
    const targetClientId = canBookForOthers && client_id ? Number(client_id) : req.user.id;

    // проверяем существование занятия
    const schedule = await pool.query('SELECT * FROM schedule WHERE id = $1', [schedule_id]);
    if (!schedule.rows.length)
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    const s = schedule.rows[0];
    if (s.status === 'cancelled')
      return res.status(400).json({ success: false, error: 'Schedule cancelled' });
    if (s.current_participants >= s.max_participants)
      return res.status(409).json({ success: false, error: 'No seats left' });

    // проверка активного абонемента
    const memb = await pool.query(
      `SELECT id FROM membership
        WHERE client_id = $1 AND is_active = TRUE AND payment_status = 'paid'
              AND CURRENT_DATE BETWEEN start_date AND end_date`,
      [targetClientId]
    );
    if (!memb.rows.length)
      return res.status(402).json({ success: false, error: 'No active membership' });

    const { rows } = await pool.query(
      `INSERT INTO booking (client_id, schedule_id, status)
       VALUES ($1, $2, 'booked') RETURNING *`,
      [targetClientId, schedule_id]
    );

    // уведомление клиенту
    await pool.query(
      `INSERT INTO notification (user_id, user_type, title, message, type)
       VALUES ($1, 'client', 'Запись подтверждена', 'Вы записаны на тренировку.', 'booking')`,
      [targetClientId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ success: false, error: 'Already booked' });
    }
    next(e);
  }
};

// DELETE /api/bookings/:id
const cancel = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    let own;
    if (req.user.type === 'employee') {
      own = await pool.query('SELECT * FROM booking WHERE id = $1', [req.params.id]);
    } else {
      own = await pool.query(
        'SELECT * FROM booking WHERE id = $1 AND client_id = $2',
        [req.params.id, req.user.id]
      );
    }
    if (!own.rows.length)
      return res.status(404).json({ success: false, error: 'Booking not found' });

    await pool.query(
      `UPDATE booking SET status = 'cancelled', cancellation_reason = $1 WHERE id = $2`,
      [reason || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};

// GET /api/bookings/my
const my = async (req, res, next) => {
  if (req.user.type !== 'client') {
    return res.status(403).json({ success: false, error: 'Clients only' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT b.*, s.start_datetime, s.end_datetime,
              wt.name AS workout_type_name, wt.name AS workout_name, wt.color_hex,
              h.name AS hall_name,
              e.first_name || ' ' || e.last_name AS trainer_name
         FROM booking b
         JOIN schedule s     ON s.id = b.schedule_id
         JOIN workout_type wt ON wt.id = s.workout_type_id
         JOIN hall h          ON h.id = s.hall_id
         JOIN trainer t       ON t.id = s.trainer_id
         JOIN employee e      ON e.id = t.employee_id
        WHERE b.client_id = $1
        ORDER BY s.start_datetime DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const all = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.first_name || ' ' || c.last_name AS client_name,
              s.start_datetime, wt.name AS workout_name
         FROM booking b
         JOIN client c       ON c.id = b.client_id
         JOIN schedule s     ON s.id = b.schedule_id
         JOIN workout_type wt ON wt.id = s.workout_type_id
        ORDER BY b.booking_datetime DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

// GET /api/bookings/schedule/:scheduleId — список людей на занятии (только для сотрудников)
const bySchedule = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         b.status,
         b.booking_datetime,
         b.cancellation_reason,
         c.id          AS client_id,
         c.first_name || ' ' || c.last_name AS client_name,
         c.email       AS client_email,
         c.phone       AS client_phone
       FROM booking b
       JOIN client c ON c.id = b.client_id
       WHERE b.schedule_id = $1
       ORDER BY b.booking_datetime ASC`,
      [req.params.scheduleId]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

// PATCH /api/bookings/:id/move — перенос записи на другое занятие (только для сотрудников)
// Тело запроса: { new_schedule_id: number }
const move = async (req, res, next) => {
  try {
    const { new_schedule_id } = req.body;
    if (!new_schedule_id)
      return res.status(400).json({ success: false, error: 'new_schedule_id required' });

    // Проверяем целевое занятие
    const { rows: sc } = await pool.query(
      'SELECT * FROM schedule WHERE id = $1', [new_schedule_id]
    );
    if (!sc.length)
      return res.status(404).json({ success: false, error: 'Target schedule not found' });
    if (sc[0].status === 'cancelled')
      return res.status(400).json({ success: false, error: 'Target schedule is cancelled' });
    if (sc[0].current_participants >= sc[0].max_participants)
      return res.status(409).json({ success: false, error: 'No seats in target schedule' });

    // Берём текущую бронь
    const { rows: bk } = await pool.query(
      'SELECT * FROM booking WHERE id = $1', [req.params.id]
    );
    if (!bk.length)
      return res.status(404).json({ success: false, error: 'Booking not found' });
    if (bk[0].status === 'cancelled')
      return res.status(400).json({ success: false, error: 'Cannot move cancelled booking' });

    // Обновляем счётчики занятий
    await pool.query(
      'UPDATE schedule SET current_participants = current_participants - 1 WHERE id = $1',
      [bk[0].schedule_id]
    );
    await pool.query(
      'UPDATE schedule SET current_participants = current_participants + 1 WHERE id = $1',
      [new_schedule_id]
    );

    // Переносим запись
    const { rows } = await pool.query(
      'UPDATE booking SET schedule_id = $1 WHERE id = $2 RETURNING *',
      [new_schedule_id, req.params.id]
    );

    // Уведомляем клиента
    await pool.query(
      `INSERT INTO notification (user_id, user_type, title, message, type)
       VALUES ($1, 'client', 'Тренировка перенесена',
               'Ваша запись была перенесена администратором.', 'booking')`,
      [bk[0].client_id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

module.exports = { create, cancel, my, all, bySchedule, move };