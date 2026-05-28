const jwt = require('jsonwebtoken');

// Используем один секрет для обоих токенов (MVP).
// В проде — разные секреты через JWT_SECRET и JWT_REFRESH_SECRET.
const getSecret  = () => process.env.JWT_SECRET || 'volt_dev_secret';
const getRefresh = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'volt_dev_secret';

const signAccess = (payload) =>
  jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  });

const signRefresh = (payload) =>
  jwt.sign(payload, getRefresh(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });

const verifyRefresh = (token) =>
  jwt.verify(token, getRefresh());

// Возвращает snake_case — так ждёт фронт (tokenStore.set(access_token, refresh_token))
const issueTokens = (user) => {
  const payload = { id: user.id, type: user.type, role: user.role };
  return {
    access_token:  signAccess(payload),
    refresh_token: signRefresh(payload),
    user
  };
};

module.exports = { signAccess, signRefresh, verifyRefresh, issueTokens };
