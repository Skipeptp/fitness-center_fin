const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

router.post('/', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { client_id, title, description, category, value, unit } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO achievement (client_id, title, description, category, value, unit)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [client_id, title, description || null, category || null, value || null, unit || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.get('/client/:id', authRequired, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM achievement WHERE client_id = $1 ORDER BY achieved_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
