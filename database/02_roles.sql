-- =============================================================
-- РОЛИ БД (по ТЗ "Фитнес-центр")
-- =============================================================
-- VORD       (ADMIN)     - полный доступ (суперпользователь приложения)
-- DBA                    - CREATE/ALTER/DROP/BACKUP
-- DATA_WRITER            - INSERT/UPDATE в операционные таблицы
-- DATA_READER            - SELECT с LIMIT
-- LOG_READER             - только чтение audit_log
-- =============================================================

-- Роли в PG не пересоздаются IF NOT EXISTS, поэтому делаем через DO-блок
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='vord') THEN
        CREATE ROLE vord LOGIN PASSWORD 'vord_secure_pass_2026' SUPERUSER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dba') THEN
        CREATE ROLE dba LOGIN PASSWORD 'dba_secure_pass_2026' CREATEDB CREATEROLE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='data_writer') THEN
        CREATE ROLE data_writer LOGIN PASSWORD 'writer_pass_2026';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='data_reader') THEN
        CREATE ROLE data_reader LOGIN PASSWORD 'reader_pass_2026';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='log_reader') THEN
        CREATE ROLE log_reader LOGIN PASSWORD 'log_pass_2026';
    END IF;
END$$;

-- ---------- Гранты для DBA ----------
GRANT ALL PRIVILEGES ON DATABASE fitness_db TO dba;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dba;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dba;

-- ---------- DATA_WRITER (операционные таблицы) ----------
GRANT CONNECT ON DATABASE fitness_db TO data_writer;
GRANT USAGE ON SCHEMA public TO data_writer;
GRANT SELECT, INSERT, UPDATE ON
    client, employee, trainer, booking, schedule,
    membership, membership_freeze, payment, achievement,
    training_program, review, support_message, notification
TO data_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO data_writer;

-- ---------- DATA_READER (только справочники + LIMIT на ПДн) ----------
GRANT CONNECT ON DATABASE fitness_db TO data_reader;
GRANT USAGE ON SCHEMA public TO data_reader;
-- открытые справочники - полный SELECT
GRANT SELECT ON
    workout_type, hall, equipment, membership_type, role, position
TO data_reader;
-- На таблицы с ПДн - выдаём через VIEW с LIMIT (см. 03_functions.sql)

-- ---------- LOG_READER ----------
GRANT CONNECT ON DATABASE fitness_db TO log_reader;
GRANT USAGE ON SCHEMA public TO log_reader;
GRANT SELECT ON audit_log TO log_reader;

-- ---------- Запрет правки логов (даже DBA) ----------
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON audit_log FROM dba;
GRANT INSERT ON audit_log TO data_writer;
GRANT INSERT ON audit_log TO dba;
