const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

// GET /api/notifications/my - мои уведомления (последние 50)
router.get('/my', authRequired, async (req, res, next) => {
  try {
    const { id, type } = req.user;
    const { rows } = await pool.query(
      `SELECT * FROM notification
        WHERE user_id = $1 AND user_type = $2
        ORDER BY created_at DESC
        LIMIT 50`,
      [id, type]
    );
    const unread = await pool.query(
      `SELECT COUNT(*) AS cnt FROM notification
        WHERE user_id = $1 AND user_type = $2 AND is_read = FALSE`,
      [id, type]
    );
    res.json({
      success: true,
      data: rows,
      meta: { unread_count: Number(unread.rows[0].cnt) }
    });
  } catch (e) { next(e); }
});

// PUT /api/notifications/:id/read - пометить прочитанным
router.put('/:id/read', authRequired, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE notification
          SET is_read = TRUE
        WHERE id = $1 AND user_id = $2 AND user_type = $3`,
      [req.params.id, req.user.id, req.user.type]
    );
    if (!rowCount) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// PUT /api/notifications/read-all
router.put('/read-all', authRequired, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE notification
          SET is_read = TRUE
        WHERE user_id = $1 AND user_type = $2 AND is_read = FALSE`,
      [req.user.id, req.user.type]
    );
    res.json({ success: true, data: { updated: rowCount } });
  } catch (e) { next(e); }
});

// DELETE /api/notifications/:id - удалить (только своё)
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM notification
        WHERE id = $1 AND user_id = $2 AND user_type = $3`,
      [req.params.id, req.user.id, req.user.type]
    );
    if (!rowCount) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// POST /api/notifications - создать уведомление (только сотрудники, для рассылок)
router.post('/', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { user_id, user_type, title, message, type } = req.body;
    if (!user_id || !user_type || !title || !message) {
      return res.status(400).json({ success: false, error: 'user_id, user_type, title, message required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO notification (user_id, user_type, title, message, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, user_type, title, message, type || 'system']
    );
    // Если получатель онлайн в socket.io - можно толкнуть push (для будущего)
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user_type}:${user_id}`).emit('notification:new', rows[0]);
    }
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;
