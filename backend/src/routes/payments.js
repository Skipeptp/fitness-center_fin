const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

// POST /api/payments
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { membership_id, amount, payment_method } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payment (client_id, membership_id, amount, payment_method, status)
       VALUES ($1,$2,$3,$4,'completed') RETURNING *`,
      [req.user.id, membership_id || null, amount, payment_method || 'card']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

// GET /api/payments/my
router.get('/my', authRequired, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, mt.name AS membership_name
         FROM payment p
         LEFT JOIN membership m ON m.id = p.membership_id
         LEFT JOIN membership_type mt ON mt.id = m.membership_type_id
        WHERE p.client_id = $1
        ORDER BY p.payment_date DESC`, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/payments - все (admin/manager)
router.get('/', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.first_name || ' ' || c.last_name AS client_name
         FROM payment p JOIN client c ON c.id = p.client_id
        ORDER BY p.payment_date DESC LIMIT 200`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
