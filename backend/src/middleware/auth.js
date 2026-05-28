const jwt = require('jsonwebtoken');

// Проверяет access token из заголовка Authorization: Bearer <token>
// Кладёт req.user = { id, type, role }
const authRequired = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Опциональная авторизация (для эндпоинтов где данные могут зависеть
// от наличия пользователя, но они доступны и анонимам)
const authOptional = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); }
    catch (_) { /* ignore */ }
  }
  next();
};

module.exports = { authRequired, authOptional };
