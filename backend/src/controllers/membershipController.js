const { pool } = require('../db/pool');

// GET /api/memberships/types
const types = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM membership_type ORDER BY price ASC'
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

// POST /api/memberships - купить, { membership_type_id, payment_method }
const purchase = async (req, res, next) => {
  if (req.user.type !== 'client') {
    return res.status(403).json({ success: false, error: 'Only clients can buy' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { membership_type_id, payment_method = 'card' } = req.body;
    const t = await client.query(
      'SELECT * FROM membership_type WHERE id = $1', [membership_type_id]
    );
    if (!t.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Type not found' });
    }
    const mt = t.rows[0];
    const start = new Date();
    const end = new Date(Date.now() + mt.duration_days * 86400000);

    const m = await client.query(
      `INSERT INTO membership (client_id, membership_type_id, start_date, end_date, payment_status, is_active)
       VALUES ($1, $2, $3, $4, 'pending', FALSE) RETURNING *`,
      [req.user.id, membership_type_id, start, end]
    );

    const p = await client.query(
      `INSERT INTO payment (client_id, membership_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, 'completed') RETURNING *`,
      [req.user.id, m.rows[0].id, mt.price, payment_method]
    );

    // триггер trg_invoice_after_update срабатывает только на UPDATE -
    // принудительно "пинаем" статус, чтобы триггер активировал membership
    await client.query(
      `UPDATE payment SET status = 'completed' WHERE id = $1`,
      [p.rows[0].id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { membership: m.rows[0], payment: p.rows[0] } });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};

// GET /api/memberships/my
const my = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, mt.name, mt.duration_days, mt.visit_limit, mt.price, mt.features
         FROM membership m
         JOIN membership_type mt ON mt.id = m.membership_type_id
        WHERE m.client_id = $1
        ORDER BY m.purchased_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const get = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, mt.name AS type_name, mt.features
         FROM membership m
         JOIN membership_type mt ON mt.id = m.membership_type_id
        WHERE m.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
};

module.exports = { types, purchase, my, get };
