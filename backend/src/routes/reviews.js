const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

// POST /api/reviews
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { trainer_id, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, error: 'Rating must be 1..5' });
    const { rows } = await pool.query(
      `INSERT INTO review (client_id, trainer_id, rating, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, trainer_id || null, rating, comment || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

// GET /api/reviews - одобренные
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, c.first_name, c.last_name,
              t.id AS trainer_id, e.first_name AS t_first, e.last_name AS t_last
         FROM review r
         JOIN client c ON c.id = r.client_id
         LEFT JOIN trainer t ON t.id = r.trainer_id
         LEFT JOIN employee e ON e.id = t.employee_id
        WHERE r.is_approved = TRUE
        ORDER BY r.created_at DESC LIMIT 100`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// PUT /api/reviews/:id/approve - admin
router.put('/:id/approve', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE review SET is_approved = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', authRequired, requireEmployee, async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM review WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// pending для админки
router.get('/pending', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, c.first_name, c.last_name FROM review r
         JOIN client c ON c.id = r.client_id
        WHERE r.is_approved = FALSE ORDER BY r.created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
