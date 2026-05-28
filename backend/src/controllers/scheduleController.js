const { pool } = require('../db/pool');

// GET /api/schedule - фильтры: from, to, trainer_id, hall_id, workout_type_id, limit
const list = async (req, res, next) => {
  try {
    const { from, to, trainer_id, hall_id, workout_type_id, limit } = req.query;
    const where = []; const params = [];

    if (from)             { params.push(from);            where.push(`s.start_datetime >= $${params.length}`); }
    if (to)               { params.push(to);              where.push(`s.start_datetime <  $${params.length}`); }
    if (trainer_id)       { params.push(trainer_id);      where.push(`s.trainer_id = $${params.length}`); }
    if (hall_id)          { params.push(hall_id);         where.push(`s.hall_id = $${params.length}`); }
    if (workout_type_id)  { params.push(workout_type_id); where.push(`s.workout_type_id = $${params.length}`); }

    const safeLimit = Math.min(parseInt(limit, 10) || 200, 500);

    const sql = `
      SELECT s.id, s.start_datetime, s.end_datetime, s.max_participants,
             s.current_participants, s.status,
             wt.id AS workout_type_id, wt.name AS workout_type_name, wt.name AS workout_name, wt.color_hex,
             wt.calories_burn, wt.duration_minutes,
             h.id AS hall_id, h.name AS hall_name,
             t.id AS trainer_id, t.specialization,
             e.first_name AS trainer_first_name, e.last_name AS trainer_last_name,
             e.first_name || ' ' || e.last_name AS trainer_name,
             t.rating AS trainer_rating
        FROM schedule s
        JOIN workout_type wt ON wt.id = s.workout_type_id
        JOIN hall h          ON h.id = s.hall_id
        JOIN trainer t       ON t.id = s.trainer_id
        JOIN employee e      ON e.id = t.employee_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY s.start_datetime ASC
       LIMIT ${safeLimit}`;

    const { rows } = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

// GET /api/schedule/week
const week = async (req, res, next) => {
  req.query.from = new Date().toISOString();
  req.query.to   = new Date(Date.now() + 7 * 86400000).toISOString();
  return list(req, res, next);
};

// GET /api/schedule/:id
const get = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, wt.name AS workout_name, wt.color_hex, wt.description AS workout_desc,
              h.name AS hall_name,
              e.first_name || ' ' || e.last_name AS trainer_name, t.id AS trainer_id
         FROM schedule s
         JOIN workout_type wt ON wt.id = s.workout_type_id
         JOIN hall h ON h.id = s.hall_id
         JOIN trainer t ON t.id = s.trainer_id
         JOIN employee e ON e.id = t.employee_id
        WHERE s.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { trainer_id, hall_id, workout_type_id, start_datetime, end_datetime, max_participants } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO schedule (trainer_id, hall_id, workout_type_id, start_datetime, end_datetime, max_participants)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [trainer_id, hall_id, workout_type_id, start_datetime, end_datetime, max_participants || 20]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const fields = ['trainer_id','hall_id','workout_type_id','start_datetime','end_datetime','max_participants','status'];
    const set = [], params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { params.push(req.body[f]); set.push(`${f} = $${params.length}`); }
    });
    if (!set.length) return res.status(400).json({ success: false, error: 'Nothing to update' });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE schedule SET ${set.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query("UPDATE schedule SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

module.exports = { list, week, get, create, update, remove };
