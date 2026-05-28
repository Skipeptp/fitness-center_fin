-- =============================================================
-- ИС "ФИТНЕС-ЦЕНТР VOLT" - схема БД (DDL)
-- PostgreSQL 15+
-- Именование: snake_case, префиксы idx_/unq_/fn_/pr_/trg_
-- =============================================================

SET client_encoding = 'UTF8';

-- ---------- Справочники ----------

CREATE TABLE IF NOT EXISTS role (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS position (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100)
);

-- ---------- Клиенты (содержит ПДн - 152-ФЗ) ----------

CREATE TABLE IF NOT EXISTS client (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,    -- ПДн
    last_name   VARCHAR(100) NOT NULL,    -- ПДн
    email       VARCHAR(150) NOT NULL UNIQUE,  -- ПДн
    phone       VARCHAR(20),              -- ПДн
    birth_date  DATE,                     -- ПДн
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt, никогда не в открытом виде
    gender      VARCHAR(10) CHECK (gender IN ('male','female','other')),
    goals       TEXT,
    medical_notes TEXT,                   -- строго конф. (мед. ограничения)
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_client_email ON client(email);

-- ---------- Сотрудники ----------

CREATE TABLE IF NOT EXISTS employee (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,  -- ПДн
    last_name     VARCHAR(100) NOT NULL,  -- ПДн
    email         VARCHAR(150) NOT NULL UNIQUE,  -- ПДн
    login         VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt
    position_id   INT REFERENCES position(id) ON DELETE SET NULL,
    role_id       INT REFERENCES role(id)     ON DELETE SET NULL,
    phone         VARCHAR(20),            -- ПДн
    hire_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS unq_employee_login ON employee(login);

-- ---------- Тренеры ----------

CREATE TABLE IF NOT EXISTS trainer (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL UNIQUE REFERENCES employee(id) ON DELETE CASCADE,
    specialization  VARCHAR(150) NOT NULL,
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
    bio             TEXT,
    rating          NUMERIC(3,2) DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
    photo_url       VARCHAR(500),
    certificates    TEXT
);

-- ---------- Залы и оборудование ----------

CREATE TABLE IF NOT EXISTS hall (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    hall_type      VARCHAR(50),  -- gym/group/pool/box/yoga
    capacity       INT NOT NULL CHECK (capacity > 0),
    area_m2        NUMERIC(8,2),
    description    TEXT,
    equipment_list TEXT
);

CREATE TABLE IF NOT EXISTS equipment (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    hall_id              INT REFERENCES hall(id) ON DELETE SET NULL,
    equipment_type       VARCHAR(50),
    inventory_number     VARCHAR(50) UNIQUE,
    purchase_date        DATE,
    condition            VARCHAR(30) DEFAULT 'ok',  -- ok/repair/decommissioned
    last_maintenance_date DATE
);

-- ---------- Тренировки ----------

CREATE TABLE IF NOT EXISTS workout_type (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE,
    category         VARCHAR(30),  -- group/personal
    description      TEXT,
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    calories_burn    INT,
    max_participants INT DEFAULT 20,
    color_hex        VARCHAR(7)  -- для UI: #RRGGBB
);

CREATE TABLE IF NOT EXISTS schedule (
    id                  SERIAL PRIMARY KEY,
    trainer_id          INT NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
    hall_id             INT NOT NULL REFERENCES hall(id) ON DELETE RESTRICT,
    workout_type_id     INT NOT NULL REFERENCES workout_type(id) ON DELETE RESTRICT,
    start_datetime      TIMESTAMP NOT NULL,
    end_datetime        TIMESTAMP NOT NULL,
    max_participants    INT NOT NULL DEFAULT 20,
    current_participants INT NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'planned',
        -- planned/cancelled/completed
    CHECK (end_datetime > start_datetime)
);
CREATE INDEX IF NOT EXISTS idx_schedule_start ON schedule(start_datetime);

-- ---------- Бронирования ----------

CREATE TABLE IF NOT EXISTS booking (
    id                  SERIAL PRIMARY KEY,
    client_id           INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    schedule_id         INT NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
    booking_datetime    TIMESTAMP NOT NULL DEFAULT NOW(),
    status              VARCHAR(20) NOT NULL DEFAULT 'booked',
        -- booked/cancelled/visited/no_show
    cancellation_reason TEXT,
    UNIQUE(client_id, schedule_id)
);
CREATE INDEX IF NOT EXISTS idx_booking_datetime ON booking(booking_datetime);
CREATE INDEX IF NOT EXISTS idx_booking_client ON booking(client_id);

-- ---------- Абонементы ----------

CREATE TABLE IF NOT EXISTS membership_type (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    duration_days INT NOT NULL CHECK (duration_days > 0),
    visit_limit   INT,  -- NULL = безлимит
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),  -- КТ
    description   TEXT,
    features      JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS membership (
    id                 SERIAL PRIMARY KEY,
    client_id          INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    membership_type_id INT NOT NULL REFERENCES membership_type(id) ON DELETE RESTRICT,
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    visits_used        INT NOT NULL DEFAULT 0,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    payment_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending/paid/refunded
    purchased_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS membership_freeze (
    id            SERIAL PRIMARY KEY,
    membership_id INT NOT NULL REFERENCES membership(id) ON DELETE CASCADE,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    reason        TEXT
);

-- ---------- Платежи ----------

CREATE TABLE IF NOT EXISTS payment (
    id             SERIAL PRIMARY KEY,
    client_id      INT NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
    membership_id  INT REFERENCES membership(id) ON DELETE SET NULL,
    employee_id    INT REFERENCES employee(id) ON DELETE SET NULL,
    amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    payment_date   TIMESTAMP NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(20) NOT NULL,  -- cash/card/online
    status         VARCHAR(20) NOT NULL DEFAULT 'completed',
        -- pending/completed/failed/refunded
    transaction_id VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_payment_client ON payment(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment(payment_date);

-- ---------- Достижения и программы ----------

CREATE TABLE IF NOT EXISTS achievement (
    id           SERIAL PRIMARY KEY,
    client_id    INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    title        VARCHAR(150) NOT NULL,
    description  TEXT,
    achieved_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    category     VARCHAR(50),  -- weight/strength/cardio/visits/measurement
    value        NUMERIC(10,2),
    unit         VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS training_program (
    id          SERIAL PRIMARY KEY,
    trainer_id  INT NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
    client_id   INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    goals       TEXT,
    start_date  DATE,
    end_date    DATE,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',  -- active/completed
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- Отзывы ----------

CREATE TABLE IF NOT EXISTS review (
    id          SERIAL PRIMARY KEY,
    client_id   INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    trainer_id  INT REFERENCES trainer(id) ON DELETE SET NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------- Чат поддержки ----------

CREATE TABLE IF NOT EXISTS support_message (
    id             SERIAL PRIMARY KEY,
    client_id      INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    employee_id    INT REFERENCES employee(id) ON DELETE SET NULL,
    message        TEXT NOT NULL,
    sent_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    is_from_client BOOLEAN NOT NULL DEFAULT TRUE,
    room_id        VARCHAR(50) NOT NULL,
    is_read        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_support_room ON support_message(room_id);

-- ---------- Уведомления ----------

CREATE TABLE IF NOT EXISTS notification (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL,
    user_type  VARCHAR(20) NOT NULL,  -- client/employee
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    type       VARCHAR(50),  -- booking/payment/achievement/system
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id, user_type);

-- ---------- Аудит (для роли LOG_READER) ----------

CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    table_name  VARCHAR(64) NOT NULL,
    operation   VARCHAR(10) NOT NULL,
    row_id      INT,
    actor       VARCHAR(64) DEFAULT CURRENT_USER,
    payload     JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
