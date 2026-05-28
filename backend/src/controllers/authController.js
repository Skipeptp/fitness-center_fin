const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { issueTokens, verifyRefresh } = require('../utils/jwtHelper');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// POST /api/auth/register - регистрация клиента
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, birth_date, gender } = req.body;
    const exists = await pool.query('SELECT id FROM client WHERE email = $1', [email]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, error: 'Email already used' });
    }
    const hash = await bcrypt.hash(password, ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO client (first_name, last_name, email, password_hash, phone, birth_date, gender)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, first_name, last_name, email, phone, birth_date, gender, created_at`,
      [first_name, last_name, email, hash, phone || null, birth_date || null, gender || null]
    );
    const user = { ...rows[0], type: 'client', role: 'CLIENT' };
    res.status(201).json({ success: true, data: issueTokens(user) });
  } catch (e) { next(e); }
};

// POST /api/auth/login - { login?, email?, password, type? }
// type: 'client' (default) | 'employee'
// Фронт для клиентов присылает email, для сотрудников - login; принимаем оба поля.
const login = async (req, res, next) => {
  try {
    const loginOrEmail = req.body.login || req.body.email;
    const { password, type = 'client' } = req.body;
    if (!loginOrEmail) {
      return res.status(400).json({ success: false, error: 'login or email required' });
    }

    let row, user;
    if (type === 'employee') {
      const { rows } = await pool.query(
        `SELECT e.*, r.name AS role_name FROM employee e
         LEFT JOIN role r ON r.id = e.role_id
         WHERE e.login = $1 OR e.email = $1`,
        [loginOrEmail]
      );
      row = rows[0];
      if (!row || !row.is_active) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      user = {
        id: row.id, type: 'employee',
        role: row.role_name || 'MANAGER',
        first_name: row.first_name, last_name: row.last_name,
        email: row.email, login: row.login
      };
    } else {
      const { rows } = await pool.query(
        'SELECT * FROM client WHERE email = $1', [loginOrEmail]
      );
      row = rows[0];
      if (!row || !row.is_active) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      user = {
        id: row.id, type: 'client', role: 'CLIENT',
        first_name: row.first_name, last_name: row.last_name,
        email: row.email
      };
    }
    res.json({ success: true, data: issueTokens(user) });
  } catch (e) { next(e); }
};

// POST /api/auth/refresh - принимает refreshToken (camelCase) или refresh_token (snake_case)
const refresh = async (req, res) => {
  const refreshToken = req.body.refreshToken || req.body.refresh_token;
  if (!refreshToken) return res.status(400).json({ success: false, error: 'No refresh token' });
  try {
    const payload = verifyRefresh(refreshToken);
    const user = { id: payload.id, type: payload.type, role: payload.role };
    res.json({ success: true, data: issueTokens(user) });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const { id, type } = req.user;
    if (type === 'employee') {
      const { rows } = await pool.query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.login, e.phone,
                p.name AS position, r.name AS role_name
           FROM employee e
           LEFT JOIN position p ON p.id = e.position_id
           LEFT JOIN role r ON r.id = e.role_id
          WHERE e.id = $1`, [id]
      );
      return res.json({ success: true, data: {
        ...rows[0],
        type: 'employee',
        role: rows[0].role_name   // явно для фронта
      } });
    }
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, birth_date, gender, goals, created_at
         FROM client WHERE id = $1`, [id]
    );
    res.json({ success: true, data: { ...rows[0], type: 'client', role: 'CLIENT' } });
  } catch (e) { next(e); }
};

// POST /api/auth/logout - JWT stateless, фронт просто стирает токены
const logout = async (req, res) => res.json({ success: true });

module.exports = { register, login, refresh, me, logout };
