const { pool } = require('../db/pool');

// POST /api/bookings - { schedule_id }
const create = async (req, res, next) => {
  if (req.user.type !== 'client') {
    return res.status(403).json({ success: false, error: 'Only clients can book' });
  }
  try {
    const { schedule_id } = req.body;
    // проверяем доступность
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
      [req.user.id]
    );
    if (!memb.rows.length)
      return res.status(402).json({ success: false, error: 'No active membership' });

    const { rows } = await pool.query(
      `INSERT INTO booking (client_id, schedule_id, status)
       VALUES ($1, $2, 'booked') RETURNING *`,
      [req.user.id, schedule_id]
    );

    // уведомление
    await pool.query(
      `INSERT INTO notification (user_id, user_type, title, message, type)
       VALUES ($1, 'client', 'Запись подтверждена', 'Вы записаны на тренировку.', 'booking')`,
      [req.user.id]
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
    const own = await pool.query(
      'SELECT * FROM booking WHERE id = $1 AND client_id = $2',
      [req.params.id, req.user.id]
    );
    if (!own.rows.length)
      return res.status(404).json({ success: false, error: 'Booking not found' });

    await pool.query(
      `UPDATE booking SET status = 'cancelled', cancellation_reason = $1
        WHERE id = $2`,
      [reason || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};

// GET /api/bookings/my
const my = async (req, res, next) => {
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

module.exports = { create, cancel, my, all };
