const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

// public list
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hall ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const hall = await pool.query('SELECT * FROM hall WHERE id = $1', [req.params.id]);
    const equipment = await pool.query('SELECT * FROM equipment WHERE hall_id = $1', [req.params.id]);
    if (!hall.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: { ...hall.rows[0], equipment: equipment.rows } });
  } catch (e) { next(e); }
});

// occupancy на дату
router.get('/:id/occupancy', authRequired, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    // используем процедуру pr_calculate_occupancy_rate
    const { rows } = await pool.query(
      `CALL pr_calculate_occupancy_rate($1, $2, NULL)`,
      [req.params.id, date]
    );
    // CALL не возвращает значения через rows (зависит от драйвера),
    // делаем ещё прямой запрос для надёжности
    const r = await pool.query(
      `SELECT COALESCE(SUM(max_participants), 0) AS total,
              COALESCE(SUM(current_participants), 0) AS taken
         FROM schedule WHERE hall_id = $1 AND DATE(start_datetime) = $2`,
      [req.params.id, date]
    );
    const total = Number(r.rows[0].total) || 0;
    const taken = Number(r.rows[0].taken);
    const pct = total ? Math.round((taken / total) * 10000) / 100 : 0;
    res.json({ success: true, data: { hall_id: Number(req.params.id), date, total, taken, occupancy_pct: pct } });
  } catch (e) { next(e); }
});

router.post('/', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { name, hall_type, capacity, area_m2, description, equipment_list } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO hall (name, hall_type, capacity, area_m2, description, equipment_list)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, hall_type || null, capacity, area_m2 || null, description || null, equipment_list || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.put('/:id', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const fields = ['name','hall_type','capacity','area_m2','description','equipment_list'];
    const set = [], params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { params.push(req.body[f]); set.push(`${f} = $${params.length}`); }
    });
    if (!set.length) return res.status(400).json({ success: false, error: 'Nothing to update' });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE hall SET ${set.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', authRequired, requireEmployee, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM hall WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
