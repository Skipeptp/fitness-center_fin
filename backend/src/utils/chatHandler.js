// Socket.io обработчик чата поддержки
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

module.exports = (io) => {
  // Аутентификация по токену в auth handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.user;
    console.log(`[chat] ${u.type}#${u.id} connected`);

    // комната по client_id (для клиента - своя; сотрудник присоединяется по запросу)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('peer_joined', { user: { id: u.id, type: u.type } });
    });

    socket.on('chat_message', async ({ roomId, message }) => {
      if (!message || !roomId) return;

      // определяем кто пишет
      const is_from_client = u.type === 'client';
      const client_id   = is_from_client ? u.id : Number(roomId);
      const employee_id = is_from_client ? null : u.id;

      try {
        const { rows } = await pool.query(
          `INSERT INTO support_message
              (client_id, employee_id, message, is_from_client, room_id)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING id, sent_at`,
          [client_id, employee_id, message, is_from_client, String(roomId)]
        );
        const out = {
          id: rows[0].id,
          message,
          is_from_client,
          sent_at: rows[0].sent_at,
          room_id: String(roomId),
          sender: { id: u.id, type: u.type }
        };
        io.to(roomId).emit('chat_message', out);
      } catch (e) {
        console.error('chat insert error', e);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[chat] ${u.type}#${u.id} disconnected`);
    });
  });
};
