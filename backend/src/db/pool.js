// PostgreSQL connection pool
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'fitness_db',
  user: process.env.DB_USER || 'fitness_admin',
  password: process.env.DB_PASSWORD || 'fitness_pass_2026',
  max: 20,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// query - тонкая обёртка с логированием времени
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const ms = Date.now() - start;
  if (ms > 200) console.warn(`[slow query ${ms}ms]`, text.slice(0, 100));
  return res;
};

module.exports = { pool, query };
