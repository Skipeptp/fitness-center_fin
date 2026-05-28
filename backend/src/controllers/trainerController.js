const { pool } = require('../db/pool');

const list = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.specialization, t.experience_years, t.bio, t.rating, t.photo_url,
              e.first_name, e.last_name
         FROM trainer t
         JOIN employee e ON e.id = t.employee_id
        WHERE e.is_active = TRUE
        ORDER BY t.rating DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const get = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, e.first_name, e.last_name, e.email
         FROM trainer t JOIN employee e ON e.id = t.employee_id
        WHERE t.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const schedule = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, wt.name AS workout_type_name, wt.name AS workout_name, wt.color_hex, h.name AS hall_name
         FROM schedule s
         JOIN workout_type wt ON wt.id = s.workout_type_id
         JOIN hall h ON h.id = s.hall_id
        WHERE s.trainer_id = $1 AND s.start_datetime >= NOW()
        ORDER BY s.start_datetime`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const reviews = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              c.first_name, c.last_name
         FROM review r
         JOIN client c ON c.id = r.client_id
        WHERE r.trainer_id = $1 AND r.is_approved = TRUE
        ORDER BY r.created_at DESC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

module.exports = { list, get, schedule, reviews };
