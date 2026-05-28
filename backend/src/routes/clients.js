const { pool } = require('../db/pool');

const list = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, created_at, is_active
         FROM client ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const get = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM client WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    delete rows[0].password_hash;
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  // клиент может менять только свои данные; сотрудник - любые
  const targetId = parseInt(req.params.id, 10);
  if (req.user.type === 'client' && req.user.id !== targetId) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  try {
    const fields = ['first_name','last_name','phone','goals','medical_notes','gender','birth_date'];
    const set = []; const params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { params.push(req.body[f]); set.push(`${f} = $${params.length}`); }
    });
    if (!set.length) return res.status(400).json({ success: false, error: 'Nothing to update' });
    params.push(targetId);
    const { rows } = await pool.query(
      `UPDATE client SET ${set.join(', ')} WHERE id = $${params.length}
       RETURNING id, first_name, last_name, email, phone, birth_date, gender, goals`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

const bookings = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, s.start_datetime, wt.name AS workout_name
         FROM booking b
         JOIN schedule s ON s.id = b.schedule_id
         JOIN workout_type wt ON wt.id = s.workout_type_id
        WHERE b.client_id = $1 ORDER BY s.start_datetime DESC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const memberships = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, mt.name FROM membership m
         JOIN membership_type mt ON mt.id = m.membership_type_id
        WHERE m.client_id = $1 ORDER BY m.purchased_at DESC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const achievements = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM achievement WHERE client_id = $1 ORDER BY achieved_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const stats = async (req, res, next) => {
  try {
    const id = req.params.id;
    const visits   = await pool.query(`SELECT COUNT(*) FROM booking WHERE client_id = $1 AND status = 'visited'`, [id]);
    const total    = await pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payment WHERE client_id = $1 AND status = 'completed'`, [id]);
    const debt     = await pool.query(`SELECT fn_get_client_total_debt($1) AS debt`, [id]);
    const fav      = await pool.query(
      `SELECT t.id, e.first_name || ' ' || e.last_name AS name, COUNT(*) AS cnt
         FROM booking b JOIN schedule s ON s.id = b.schedule_id
         JOIN trainer t ON t.id = s.trainer_id
         JOIN employee e ON e.id = t.employee_id
        WHERE b.client_id = $1 GROUP BY t.id, e.first_name, e.last_name
        ORDER BY cnt DESC LIMIT 1`, [id]);
    res.json({
      success: true,
      data: {
        total_visits: Number(visits.rows[0].count),
        total_spent: Number(total.rows[0].total),
        current_debt: Number(debt.rows[0].debt),
        favorite_trainer: fav.rows[0] || null
      }
    });
  } catch (e) { next(e); }
};

// router
const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

router.get('/',                authRequired, requireEmployee, list);
router.get('/:id',             authRequired, get);
router.put('/:id',             authRequired, update);
router.delete('/:id',          authRequired, requireEmployee, async (req, res, next) => {
  try {
    await pool.query('UPDATE client SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});
router.get('/:id/bookings',    authRequired, bookings);
router.get('/:id/memberships', authRequired, memberships);
router.get('/:id/achievements',authRequired, achievements);
router.get('/:id/stats',       authRequired, stats);

module.exports = router;
