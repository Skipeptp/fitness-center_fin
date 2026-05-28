const rateLimit = require('express-rate-limit');

// 100 запросов / 15 минут на IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' }
});

// Жёсткий: 5 попыток / 15 минут на /auth/login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Try later.' }
});

module.exports = { globalLimiter, loginLimiter };
