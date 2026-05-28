#!/bin/sh
# VOLT backend entrypoint.
# Ждёт postgres, при первом старте проверяет нужен ли bootstrap.
set -e

echo "⚡ VOLT Backend starting..."

# Ждём, пока postgres реально примет соединение
until node -e "
  const { Pool } = require('pg');
  const p = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  p.query('SELECT 1').then(() => { p.end(); process.exit(0); })
   .catch(() => { p.end(); process.exit(1); });
" 2>/dev/null; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✓ PostgreSQL is ready."

# Проверяем нужен ли bootstrap — смотрим, есть ли реальный bcrypt-хэш у admin
# (bcrypt всегда начинается с $2b$, заглушки не начинаются)
NEEDS_BOOTSTRAP=$(node -e "
  const { Pool } = require('pg');
  const p = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  p.query(\"SELECT password_hash FROM employee WHERE login='admin' LIMIT 1\")
   .then(r => {
     const hash = r.rows[0]?.password_hash || '';
     // Если хэш не bcrypt — нужен bootstrap
     process.stdout.write(hash.startsWith('\$2') ? 'no' : 'yes');
     p.end();
   })
   .catch(() => { process.stdout.write('yes'); p.end(); });
" 2>/dev/null)

if [ "$NEEDS_BOOTSTRAP" = "yes" ]; then
  echo "Running bootstrap (setting bcrypt hashes)..."
  node src/utils/bootstrap.js && echo "✓ Bootstrap done." || echo "⚠ Bootstrap failed, continuing..."
else
  echo "✓ Bootstrap already done, skipping."
fi

exec node src/app.js
