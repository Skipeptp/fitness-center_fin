#!/bin/sh
# VOLT backend entrypoint.
# Ждёт postgres, затем всегда запускает bootstrap (идемпотентно).
set -e

echo "⚡ VOLT Backend starting..."

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

echo "Running bootstrap (setting bcrypt hashes)..."
node src/utils/bootstrap.js && echo "✓ Bootstrap done." || echo "⚠ Bootstrap failed, continuing..."

exec node src/app.js