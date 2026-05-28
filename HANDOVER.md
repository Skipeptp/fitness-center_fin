# VOLT — Передаточный документ v3 (ФИНАЛЬНЫЙ)

> Проект завершён. Этот документ нужен только если потребуется доработка или дебаг.

---

## 1. Контекст

**Что сделано:** fullstack веб-приложение для фитнес-центра. 97 файлов, ~5500 строк кода.

**Стек (зафиксирован):**
- Backend: Node.js 20 / Express / `pg` (без ORM) / JWT / bcrypt / Socket.io
- Frontend: React 18 + Vite + React Router v6 + Axios + чистый CSS
- БД: PostgreSQL 15+, 5 SQL-файлов
- Деплой: Docker Compose (3 сервиса)

---

## 2. Запуск (2 команды)

```bash
docker-compose up --build
# Bootstrap паролей запускается автоматически через entrypoint.sh.
# Ждать ~30 сек пока postgres поднимется + сиды применятся.

open http://localhost:5173
```

Для разработки без Docker:
```bash
psql -U postgres -d fitness_db -f database/01_schema.sql
psql -U postgres -d fitness_db -f database/02_roles.sql
psql -U postgres -d fitness_db -f database/03_functions.sql
psql -U postgres -d fitness_db -f database/04_triggers.sql
psql -U postgres -d fitness_db -f database/05_seed.sql

cd backend && cp .env.example .env && npm install && npm run dev
# В отдельном терминале:
node src/utils/bootstrap.js

cd ../frontend && cp .env.example .env.local && npm install && npm run dev
```

---

## 3. Тестовые аккаунты

| Тип | Логин / Email | Пароль |
|---|---|---|
| Admin (сотрудник) | `admin` | `Admin123!` |
| Тренеры | `trainer1` ... `trainer8` | `Trainer1!` |
| Менеджер | `manager1` | `Manager1!` |
| Demo-клиент | `demo@volt.ru` | `Test123!` |
| Все клиенты | `user1@example.com` ... `user25@example.com` | `Test123!` |

---

## 4. Архитектурные решения (неизменны)

1. **Без ORM** — голый `pg`, параметризованные запросы `$1, $2...`
2. **Bootstrap-скрипт** — `src/utils/bootstrap.js`. Seed кладёт заглушки, скрипт ставит bcrypt. Теперь запускается **автоматически** через `entrypoint.sh` при первом старте.
3. **JWT stateless** — один секрет (`JWT_SECRET`) для access и refresh (MVP). В прод добавить `JWT_REFRESH_SECRET` отдельно.
4. **Роли через `role.name`** — `requireRoles('VORD','MANAGER')`. Роли БД и приложения — разные сущности с пересекающимися именами (по ТЗ).
5. **trg_invoice_after_update** — только на UPDATE. Костыль: `membershipController.purchase` делает INSERT → UPDATE подряд.
6. **current_participants** — только через триггер `trg_booking_count`. Руками не трогать.
7. **Аудит ПДн** — через `fn_audit_pd_tables` в `audit_log`, пароли вырезаны.
8. **Цвета тренировок** — из `workout_type.color_hex` в БД, фронт не хардкодит.
9. **Каждый файл < 200 строк** — соблюдается. Крупные страницы разбиты на контейнеры с реэкспортами.
10. **Цвета только через CSS-переменные** — никакого `#FFFFFF` в компонентах.

---

## 5. Полная структура файлов

```
fitness-center/
├── .gitignore
├── README.md
├── HANDOVER.md
├── docker-compose.yml            # healthcheck, depends_on: condition: service_healthy
├── database/
│   ├── 01_schema.sql             # 18 таблиц + индексы + ограничения
│   ├── 02_roles.sql              # 5 ролей PostgreSQL + гранты
│   ├── 03_functions.sql          # fn_get_client_total_debt, pr_calculate_occupancy_rate,
│   │                             #   fn_get_trainer_avg_rating, view v_client_public
│   ├── 04_triggers.sql           # trg_booking_count, trg_invoice_after_update,
│   │                             #   trg_review_rating_update, trg_client_audit, trg_employee_audit
│   └── 05_seed.sql               # 30 клиентов, 8 тренеров, 4 зала, 8 типов, 60 занятий,
│                                 #   5 типов абонементов, 20 отзывов, 10 достижений
├── backend/
│   ├── .dockerignore
│   ├── .env.example              # JWT_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, DB_*, BCRYPT_ROUNDS
│   ├── Dockerfile                # node:20-alpine, ENTRYPOINT entrypoint.sh, healthcheck
│   ├── entrypoint.sh             # ждёт postgres → auto-bootstrap → node src/app.js
│   ├── package.json
│   └── src/
│       ├── app.js                # Express + Socket.io, все 14 роутов
│       ├── db/pool.js            # pg.Pool + slow-query логирование
│       ├── middleware/
│       │   ├── auth.js           # authRequired, authOptional
│       │   ├── roles.js          # requireRoles, requireEmployee, requireClient
│       │   ├── validate.js       # handleValidation (express-validator)
│       │   ├── rateLimiter.js    # globalLimiter (100/15м), loginLimiter (5/15м)
│       │   ├── errorHandler.js   # централизованный обработчик
│       │   └── logger.js         # простой
│       ├── controllers/
│       │   ├── authController.js       # register / login(email|login+type) / refresh / me / logout
│       │   ├── scheduleController.js   # list(+limit param) / week / get / create / update / remove
│       │   ├── bookingController.js    # create / cancel / my(+workout_type_name alias) / all
│       │   ├── membershipController.js # types / purchase (INSERT→UPDATE для триггера) / my / get
│       │   └── trainerController.js    # list / get / schedule(+workout_type_name) / reviews
│       ├── routes/
│       │   ├── auth.js           # register, login(без жёсткой валидации login), refresh, me, logout
│       │   ├── clients.js        # CRUD(+DELETE soft), bookings, memberships, achievements, stats
│       │   ├── schedule.js
│       │   ├── bookings.js
│       │   ├── memberships.js
│       │   ├── trainers.js
│       │   ├── payments.js
│       │   ├── reviews.js
│       │   ├── support.js        # /rooms, /rooms/:id/messages, /rooms/:id/message
│       │   ├── achievements.js
│       │   ├── programs.js
│       │   ├── halls.js          # + pr_calculate_occupancy_rate со страховочным SELECT
│       │   ├── analytics.js      # dashboard, revenue(?period), popular-classes,
│       │   │                     #   trainer-performance, member-retention
│       │   └── notifications.js  # my, /:id/read, /read-all, DELETE, POST(+socket push)
│       └── utils/
│           ├── jwtHelper.js      # snake_case токены (access_token/refresh_token), единый секрет с fallback
│           ├── bootstrap.js      # bcrypt-хэши для тестовых аккаунтов + все остальные клиенты Test123!
│           └── chatHandler.js    # Socket.io: auth handshake, join_room, chat_message, persist в БД
└── frontend/
    ├── .dockerignore
    ├── .env.example              # VITE_API_URL
    ├── Dockerfile                # multi-stage: node build → nginx:1.25-alpine
    ├── nginx.conf                # SPA fallback, gzip, кэш статики (1y)
    ├── package.json
    ├── vite.config.js            # proxy /api и /socket.io на backend в dev-режиме
    ├── index.html                # Inter+Raleway из Google Fonts, splash-экран
    └── src/
        ├── main.jsx              # ReactDOM.createRoot + BrowserRouter + CSS imports
        ├── App.jsx               # 17 роутов, ThemeProvider → AuthProvider → ToastProvider
        ├── api/
        │   ├── client.js         # axios instance + tokenStore + refresh interceptor (1 retry)
        │   └── index.js          # все 14 API-обёрток (authApi, scheduleApi, bookingsApi, ...)
        ├── context/
        │   ├── AuthContext.jsx   # login/register/logout/updateUser + volt:logout event
        │   ├── ThemeContext.jsx  # dark/light, localStorage persist, системная тема
        │   └── ToastContext.jsx  # push/success/error/warning/info, auto-dismiss, анимация
        ├── hooks/
        │   ├── useFetch.js       # универсальный хук с mounted-guard
        │   └── useDebounce.js    # для поиска
        ├── utils/
        │   ├── format.js         # formatRub, formatDate/Time, daysTo, fullName, initials,
        │   │                     #   ageFromBirth, fireConfetti, parseApiError
        │   └── quotes.js         # 20 авторских цитат, getQuoteOfTheDay, EMPTY_STATES
        ├── styles/
        │   ├── variables.css     # все токены: dark+light темы, бренд, типы тренировок, радиусы
        │   ├── base.css          # reset, типографика, утилиты, скроллбар, a11y, prefers-motion
        │   └── animations.css    # fadeIn, slideIn, pulse, pulseRed, spin, shine, confettiBurst
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx        # Sidebar + Header + Outlet, мобильный burger
        │   │   ├── Sidebar.jsx       # NavLink active-стиль, клиент/сотрудник nav, logout
        │   │   ├── Header.jsx        # burger, theme-toggle, notifications, avatar
        │   │   └── ProtectedRoute.jsx # employeeOnly опция, loading fallback
        │   ├── ui/
        │   │   ├── Button.jsx        # 4 варианта × 3 размера, loading-spinner, icon
        │   │   ├── Input.jsx         # Input + PasswordInput(eye) + Textarea
        │   │   ├── Modal.jsx         # Modal(Esc+backdrop) + Tabs + Select
        │   │   ├── Primitives.jsx    # Card, Badge(hex+named), Avatar, ProgressBar, Skeleton, EmptyState
        │   │   └── Logo.jsx          # SVG-молния, withText вариант
        │   └── features/
        │       ├── KpiCard.jsx       # KpiCard(trend) + MotivationalQuote(цитата дня)
        │       ├── ScheduleCard.jsx  # ScheduleCard(микровзаимодействия) + BookingCard
        │       └── TrainerCard.jsx   # TrainerCard(hover-оверлей) + PricingCard(visit_limit)
        └── pages/
            ├── AuthPages.jsx         # LoginPage(client/employee таб) + RegisterPage(валидация)
            ├── DashboardPage.jsx     # Onboarding → клиент(цитата+расписание+счётчик дней);
            │                         #   сотрудник(KPI 4 метрики)
            ├── SchedulePage.jsx      # grid+list, поиск(debounce), book/cancel, конфетти
            ├── TrainersPage.jsx      # список + TrainerDetailPage(расписание+отзывы)
            ├── MembershipsPage.jsx   # pricing-карточки, confirm-модалка, активные абонементы
            ├── MyBookingsPage.jsx    # 3 таба: предстоящие/прошедшие/отменённые
            ├── ProfilePage.jsx       # просмотр + редактирование(имя, телефон, пол, цели)
            ├── SupportChatPage.jsx   # Socket.io, roomId=String(user.id), оптимистичные msg
            ├── CalculatorPage.jsx    # 3 таба: ИМТ / TDEE+КБЖУ / % жира (чистый JS)
            ├── OtherPages.jsx        # Notifications + Programs + Halls + Landing + NotFound
            └── AdminAnalytics.jsx    # AnalyticsPage(бар-чарт дохода, топ занятий, тренеры)
                                      #   + AdminPage(клиенты, модерация отзывов)
```

---

## 6. Исправленные баги (итерация 3)

| # | Файл | Баг | Фикс |
|---|---|---|---|
| 1 | `authController.js` | `req.body.login` — клиент присылает `email` | `req.body.login \|\| req.body.email` |
| 2 | `authController.js` | `req.body.refreshToken` — фронт присылает `refresh_token` | принимает оба варианта |
| 3 | `authController.js` | `me` для сотрудника не возвращал `role` | явный `role: rows[0].role_name` |
| 4 | `auth.js routes` | `body('login').isString()` — блокировал клиентов | убрана жёсткая валидация login |
| 5 | `jwtHelper.js` | `issueTokens` возвращал camelCase, фронт ждал snake_case | `access_token` / `refresh_token` |
| 6 | `jwtHelper.js` | `JWT_REFRESH_SECRET` не задан в env → исключение | fallback на `JWT_SECRET` |
| 7 | `api/index.js` | support URLs: `/support/${id}/messages` | `/support/rooms/${id}/messages` |
| 8 | `SupportChatPage.jsx` | `roomId='client:${id}'` — backend ждал числовой id | `String(user.id)` |
| 9 | `SupportChatPage.jsx` | emit `{room_id}` — chatHandler ждал `{roomId}` camelCase | `{ roomId, message }` |
| 10 | `DashboardPage.jsx` | `stats?.memberships` — stats не содержит memberships | отдельный `membershipsApi.my()` |
| 11 | `TrainerCard.jsx` | `membership.max_visits` — в БД поле `visit_limit` | `membership.visit_limit` |
| 12 | `scheduleController.js` | `workout_type_name` и `trainer_name` не возвращались | алиасы в SELECT |
| 13 | `bookingController.js` | `workout_type_name` не возвращался в `/my` | алиас в SELECT |
| 14 | `trainerController.js` | `workout_type_name` не возвращался в `/schedule` | алиас в SELECT |
| 15 | `clients.js routes` | не было `DELETE /:id` (AdminPage вызывал его) | soft-delete через `is_active=FALSE` |
| 16 | `scheduleController.js` | `limit` из query игнорировался | `safeLimit = Math.min(parseInt(limit)\|\|200, 500)` |

---

## 7. Известные нюансы (не менялись)

1. **trg_invoice_after_update** — только на UPDATE. Костыль в purchase — норм для MVP.
2. **JWT stateless** — logout только стирает локально. В прод — таблица `refresh_token`.
3. **Socket.io expired token** — соединение падает с "Invalid token". Нужно переподключение после refresh.
4. **CALL pg** — в halls.js страховочный SELECT после CALL из-за нестабильного поведения драйвера.
5. **audit_log** — при высоком RPS будет узким местом. Для прода — партиционирование.

---

## 8. Если нужно дорабатывать

| Задача | Сложность |
|---|---|
| Swagger/OpenAPI | средняя |
| Смена пароля в профиле | низкая |
| Хранение refresh token в БД (blacklist при logout) | низкая |
| Socket.io reconnect после refresh access token | средняя |
| E2E-тесты (Playwright) | высокая |
| Партиционирование audit_log | средняя |

---

**Уверенность в работоспособности: 9/10.**
Все известные баги исправлены. Непроверенное: реальный запуск docker-compose на живой машине.
