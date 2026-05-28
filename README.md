# ⚡ VOLT — Фитнес-центр

> **Заряжай тело. Бей рекорды.**

Учебный fullstack-проект: современное веб-приложение для фитнес-центра с реальным стеком, JWT-авторизацией, Socket.io-чатом и аналитикой.

---

## Стек

| Слой | Технологии |
|---|---|
| Backend | Node.js 20 + Express + pg (без ORM) + JWT + Socket.io |
| Frontend | React 18 + Vite + React Router v6 + Axios + чистый CSS |
| БД | PostgreSQL 15+, чистые SQL-файлы (DDL/DML) |
| Деплой | Docker Compose (3 сервиса) |

---

## Быстрый старт (3 команды)

```bash
git clone <repo> && cd volt-fitness
docker-compose up --build
docker-compose exec backend npm run bootstrap
```

Готово:
- Фронт: http://localhost:5173
- API:   http://localhost:3000/api/health

---

## Тестовые аккаунты (после bootstrap)

| Тип | Логин / Email | Пароль |
|---|---|---|
| Admin | `admin` | `Admin123!` |
| Тренеры | `trainer1` ... `trainer8` | `Trainer1!` |
| Менеджер | `manager1` | `Manager1!` |
| Demo-клиент | `demo@volt.ru` | `Test123!` |
| Все клиенты | `user1@example.com` ... `user25@example.com` | `Test123!` |

> ⚠️ Bootstrap ставит bcrypt-хэши поверх заглушек в seed.sql.
> Без него авторизация не будет работать.

---

## Bootstrap паролей

```bash
docker-compose exec backend npm run bootstrap
```

---

## Структура проекта

```
fitness-center/
├── docker-compose.yml
├── database/
│   ├── 01_schema.sql      # 18 таблиц + индексы
│   ├── 02_roles.sql       # 5 ролей PostgreSQL + гранты
│   ├── 03_functions.sql   # fn_, pr_ + views
│   ├── 04_triggers.sql    # trg_ (bookings, invoices, audit, rating)
│   └── 05_seed.sql        # 30 клиентов, 8 тренеров, 60 занятий...
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js          # Express + Socket.io
│       ├── db/pool.js
│       ├── middleware/     # auth, roles, validate, rate-limiter, errors
│       ├── controllers/    # auth, schedule, bookings, memberships, trainer
│       ├── routes/         # 14 роутеров
│       └── utils/          # jwtHelper, bootstrap, chatHandler
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/            # axios-клиент + обёртки по ресурсам
        ├── context/        # AuthContext, ThemeContext, ToastContext
        ├── components/
        │   ├── layout/     # Layout, Sidebar, Header, ProtectedRoute
        │   ├── ui/         # Button, Input, Modal, Primitives, Logo
        │   └── features/   # KpiCard, ScheduleCard, TrainerCard...
        ├── pages/          # 17 страниц
        ├── hooks/          # useFetch, useDebounce
        ├── utils/          # format.js, quotes.js
        └── styles/         # variables.css, base.css, animations.css
```

---

## API (краткий обзор)

| Группа | Основные эндпоинты |
|---|---|
| `/api/auth` | register, login (client+employee), refresh, me, logout |
| `/api/clients` | CRUD, bookings, memberships, achievements, stats |
| `/api/schedule` | list (фильтры), week, get, POST/PUT/DELETE |
| `/api/bookings` | POST, DELETE /cancel, my, all |
| `/api/memberships` | types, POST /purchase, my |
| `/api/trainers` | list, get, schedule, reviews |
| `/api/payments` | POST, my, all |
| `/api/reviews` | list, POST, approve, DELETE, pending |
| `/api/support` | rooms, messages, send |
| `/api/analytics` | dashboard, revenue, popular-classes, trainer-performance, retention |
| `/api/notifications` | my, read, read-all, DELETE |
| `/api/halls` | list, get, occupancy, CRUD |
| `/api/achievements` | POST, client/:id |
| `/api/programs` | my, get, POST, PUT |

---

## Разработка без Docker

```bash
# Postgres должен быть локально
psql -U postgres -d fitness_db -f database/01_schema.sql
psql -U postgres -d fitness_db -f database/02_roles.sql
psql -U postgres -d fitness_db -f database/03_functions.sql
psql -U postgres -d fitness_db -f database/04_triggers.sql
psql -U postgres -d fitness_db -f database/05_seed.sql

cd backend && cp .env.example .env && npm install && node src/utils/bootstrap.js && npm run dev

cd ../frontend && npm install && npm run dev
```

---

## Что добавлено от себя (творческие решения)

- **Название VOLT** + логотип-молния (SVG, `currentColor`) — идея ассоциации: электричество = мощь и скорость
- **Слоган:** "Заряжай тело. Бей рекорды."
- **20 авторских мотивационных цитат** с иронией и характером (`src/utils/quotes.js`)
- **Цитата дня** — стабильно-случайная (детерминирована по дате, не дёргается при ререндере)
- **Оригинальные пустые состояния** — "Тут пусто. Зато калории не сжигаются." и т.д.
- **Онбординг-экран** — три шага для новых клиентов без абонемента и записей
- **Конфетти-анимация** при успешной записи на тренировку (8 точек, чистый CSS keyframes)
- **Счётчик дней до конца абонемента** — три цвета: норм / внимание / пульс (pulse-red)
- **Splash-экран** в `index.html` — видно до загрузки JS, молния с анимацией
- **Цветовая карта типов тренировок** — берётся из БД (`workout_type.color_hex`), не хардкодится
- **Микровзаимодействие с тренерами** — аватар увеличивается, появляется кнопка с оверлеем при hover
- **Калькулятор** BMI / TDEE+КБЖУ / % жира — три формулы, чистый JS, без библиотек
- **Socket.io чат** с оптимистичными обновлениями и статусом подключения

---

## Лицензия

Учебный проект. Не для коммерческого использования.
