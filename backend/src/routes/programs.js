const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');

// POST - создаёт тренер
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { client_id, name, description, goals, start_date, end_date } = req.body;
    // ищем trainer.id по employee_id
    const tr = await pool.query('SELECT id FROM trainer WHERE employee_id = $1', [req.user.id]);
    const trainer_id = tr.rows[0]?.id;
    if (!trainer_id) return res.status(403).json({ success: false, error: 'Not a trainer' });

    const { rows } = await pool.query(
      `INSERT INTO training_program (trainer_id, client_id, name, description, goals, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [trainer_id, client_id, name, description || null, goals || null, start_date || null, end_date || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.get('/my', authRequired, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT tp.*,
              e.first_name || ' ' || e.last_name AS trainer_name
         FROM training_program tp
         JOIN trainer t ON t.id = tp.trainer_id
         JOIN employee e ON e.id = t.employee_id
        WHERE tp.client_id = $1 ORDER BY tp.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM training_program WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    const fields = ['name','description','goals','start_date','end_date','status'];
    const set = [], params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { params.push(req.body[f]); set.push(`${f} = $${params.length}`); }
    });
    if (!set.length) return res.status(400).json({ success: false, error: 'Nothing to update' });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE training_program SET ${set.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
