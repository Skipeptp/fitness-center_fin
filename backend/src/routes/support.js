const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

// GET /api/support/rooms (employee)
router.get('/rooms', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (sm.room_id) sm.room_id, sm.message AS last_message,
              sm.sent_at AS last_at,
              c.id AS client_id, c.first_name, c.last_name
         FROM support_message sm
         JOIN client c ON c.id = sm.client_id
        ORDER BY sm.room_id, sm.sent_at DESC`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/support/rooms/:id/messages
router.get('/rooms/:id/messages', authRequired, async (req, res, next) => {
  // клиент может видеть только свою комнату
  const roomId = String(req.params.id);
  if (req.user.type === 'client' && req.user.id !== Number(roomId)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM support_message WHERE room_id = $1 ORDER BY sent_at ASC`,
      [roomId]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// POST /api/support/rooms/:id/message - HTTP fallback (если сокет упал)
router.post('/rooms/:id/message', authRequired, async (req, res, next) => {
  try {
    const roomId = String(req.params.id);
    const { message } = req.body;
    const is_from_client = req.user.type === 'client';
    const client_id   = is_from_client ? req.user.id : Number(roomId);
    const employee_id = is_from_client ? null : req.user.id;

    const { rows } = await pool.query(
      `INSERT INTO support_message (client_id, employee_id, message, is_from_client, room_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [client_id, employee_id, message, is_from_client, roomId]
    );
    // отправляем по сокету тоже
    const io = req.app.get('io');
    io?.to(roomId).emit('chat_message', rows[0]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
