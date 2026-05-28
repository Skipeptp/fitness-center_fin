// =============================================================
// Bootstrap: проставляет реальные bcrypt-хэши на тестовых
// пользователей после применения seed.sql.
// Запуск: node src/utils/bootstrap.js
// =============================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const testAccounts = [
  // [тип, login/email, пароль]
  { type: 'employee', login: 'admin',    password: 'Admin123!'   },
  { type: 'employee', login: 'trainer1', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer2', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer3', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer4', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer5', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer6', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer7', password: 'Trainer1!'   },
  { type: 'employee', login: 'trainer8', password: 'Trainer1!'   },
  { type: 'employee', login: 'manager1', password: 'Manager1!'   },
  { type: 'client',   login: 'demo@volt.ru', password: 'Test123!' }
];

(async () => {
  try {
    for (const acc of testAccounts) {
      const hash = await bcrypt.hash(acc.password, ROUNDS);
      if (acc.type === 'employee') {
        await pool.query(
          'UPDATE employee SET password_hash = $1 WHERE login = $2',
          [hash, acc.login]
        );
      } else {
        await pool.query(
          'UPDATE client SET password_hash = $1 WHERE email = $2',
          [hash, acc.login]
        );
      }
      console.log(`✓ ${acc.type} ${acc.login} -> password set`);
    }

    // также все остальные клиенты получают пароль 'Test123!'
    const commonHash = await bcrypt.hash('Test123!', ROUNDS);
    const r = await pool.query(
      "UPDATE client SET password_hash = $1 WHERE password_hash NOT LIKE '$2a$%' AND password_hash NOT LIKE '$2b$%'",
      [commonHash]
    );
    console.log(`✓ остальные клиенты получили пароль Test123! (затронуто: ${r.rowCount})`);

    console.log('\n✅ Bootstrap завершён. Можно логиниться.');
    process.exit(0);
  } catch (e) {
    console.error('Bootstrap error:', e);
    process.exit(1);
  }
})();
