-- =============================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =============================================================
-- Все пароли захэшированы bcrypt (rounds=12)
-- Известные пароли (см. README):
--   client_demo / Test123!  -> $2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m
--   admin       / Admin123! -> $2a$12$FGgX5z9N3eN3.qEHmNCPEOvqKLLrFLBcxQgHQ2cLKNc5BKrP/bDQy
--   trainer1    / Trainer1! -> $2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u
-- =============================================================

-- ---------- Роли и должности ----------
INSERT INTO role (name, description) VALUES
    ('VORD',        'Полный доступ (метод VORD - супер-админ)'),
    ('DBA',         'Администратор БД'),
    ('DATA_WRITER', 'Запись в операционные таблицы'),
    ('DATA_READER', 'Чтение справочников'),
    ('LOG_READER',  'Чтение логов аудита'),
    ('CLIENT',      'Клиент фитнес-центра'),
    ('TRAINER',     'Тренер'),
    ('MANAGER',     'Менеджер')
ON CONFLICT (name) DO NOTHING;

INSERT INTO position (name, department) VALUES
    ('Администратор',         'Управление'),
    ('Старший тренер',        'Тренеры'),
    ('Тренер',                'Тренеры'),
    ('Менеджер по продажам',  'Продажи'),
    ('Уборщик',               'Хозчасть'),
    ('Системный администратор','IT')
ON CONFLICT (name) DO NOTHING;

-- ---------- Залы ----------
INSERT INTO hall (name, hall_type, capacity, area_m2, description, equipment_list) VALUES
    ('Тренажёрный зал', 'gym',   40, 300.00, 'Современный зал с кардио- и силовой зонами', 'Беговые дорожки, штанги, тренажёры'),
    ('Зал йоги',        'yoga',  20, 80.00,  'Тёплый зал для йоги и стретчинга',           'Коврики, пропсы'),
    ('Бассейн',         'pool',  30, 250.00, '25-метровый бассейн на 5 дорожек',           'Дорожки, пляжные шезлонги'),
    ('Зал единоборств', 'box',   16, 120.00, 'Ринг и зона татами',                         'Ринг, груши, мешки')
ON CONFLICT DO NOTHING;

-- ---------- Виды тренировок (с цветами для UI) ----------
INSERT INTO workout_type (name, category, description, difficulty_level, duration_minutes, calories_burn, max_participants, color_hex) VALUES
    ('Йога',         'group',    'Хатха-йога для всех уровней',       2, 60,  250, 20, '#A78BFA'),
    ('Кардио',       'group',    'Сжигание жира, выносливость',       3, 45,  500, 25, '#F87171'),
    ('Силовая',      'group',    'Работа с весами, гипертрофия',      4, 60,  400, 15, '#F59E0B'),
    ('Плавание',     'group',    'Свободное плавание + тренер',       2, 60,  450, 10, '#38BDF8'),
    ('Бокс',         'group',    'Техника, спарринг по желанию',      4, 75,  600, 12, '#EF4444'),
    ('Стретчинг',    'group',    'Растяжка после тренировок',         1, 45,  150, 20, '#34D399'),
    ('Кроссфит',     'group',    'WOD-программа, высокоинтенсив.',    5, 60,  700, 16, '#FB923C'),
    ('Персональная', 'personal', 'Индивидуальная тренировка',         3, 60,  500,  1, '#6366F1')
ON CONFLICT (name) DO NOTHING;

-- ---------- Сотрудники + тренеры ----------
-- Пароль admin: Admin123!
INSERT INTO employee (first_name, last_name, email, login, password_hash, position_id, role_id, phone, hire_date) VALUES
    ('Иван',     'Адмиралов',  'admin@volt.ru',     'admin',     '$2a$12$FGgX5z9N3eN3.qEHmNCPEOvqKLLrFLBcxQgHQ2cLKNc5BKrP/bDQy', 1, 1, '+79000000001', '2024-01-15'),
    ('Александр','Сергеев',    'sergeev@volt.ru',   'trainer1',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 2, 7, '+79000000002', '2023-03-01'),
    ('Мария',    'Иванова',    'ivanova@volt.ru',   'trainer2',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 3, 7, '+79000000003', '2023-05-10'),
    ('Дмитрий',  'Боксёров',   'boxer@volt.ru',     'trainer3',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 3, 7, '+79000000004', '2022-11-20'),
    ('Елена',    'Гибкова',    'flex@volt.ru',      'trainer4',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 3, 7, '+79000000005', '2024-02-01'),
    ('Олег',     'Кроссфитов', 'cf@volt.ru',        'trainer5',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 2, 7, '+79000000006', '2021-06-15'),
    ('Наталья',  'Водная',     'pool@volt.ru',      'trainer6',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 3, 7, '+79000000007', '2023-09-01'),
    ('Сергей',   'Силкин',     'strong@volt.ru',    'trainer7',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 2, 7, '+79000000008', '2020-04-12'),
    ('Анна',     'Кардиоман',  'cardio@volt.ru',    'trainer8',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 3, 7, '+79000000009', '2024-01-01'),
    ('Павел',    'Менеджеров', 'manager@volt.ru',   'manager1',  '$2a$12$9lOaEFMrG0v9Zb5JZqB6OuMcOvI0YGYS6ZJp0r3HRG6Vd1LWvAU2u', 4, 8, '+79000000010', '2022-08-15')
ON CONFLICT (email) DO NOTHING;

INSERT INTO trainer (employee_id, specialization, experience_years, bio, rating, photo_url) VALUES
    (2, 'Кроссфит, функционал', 8, 'МСМК по тяжёлой атлетике. Веду Кроссфит с 2017.',     4.85, NULL),
    (3, 'Йога, стретчинг',      6, 'Сертифицированный йога-инструктор RYT-500.',          4.92, NULL),
    (4, 'Бокс',                12, 'Чемпион ЦФО по боксу. Тренирую любителей и любителей.', 4.70, NULL),
    (5, 'Стретчинг, пилатес',   5, 'Бывшая балерина. Делаю даже жёстких людей гибкими.',  4.88, NULL),
    (6, 'Кроссфит',             7, 'Кроссфит L2, сильный английский — занимаюсь и с экспатами.', 4.65, NULL),
    (7, 'Плавание',            10, 'КМС по плаванию. Поставлю технику кроля за 4 занятия.',    4.95, NULL),
    (8, 'Силовая, пауэрлифтинг',9, 'Тренер сборной области. Без нытья и философии.',       4.72, NULL),
    (9, 'Кардио, групповые',    4, 'Энергии больше, чем у вашего пылесоса.',              4.80, NULL)
ON CONFLICT DO NOTHING;

-- ---------- Типы абонементов ----------
INSERT INTO membership_type (name, duration_days, visit_limit, price, description, features) VALUES
    ('Разовое посещение', 1,    1,    700.00,  'Один визит, любое время',
     '["1 любая групповая тренировка"]'::jsonb),
    ('Базовый',          30,    8,   2900.00, '8 посещений в месяц - идеально на старт',
     '["8 посещений", "Любые групповые", "Раздевалка"]'::jsonb),
    ('Стандарт',         30,   12,   3900.00, '12 посещений + 1 персональная',
     '["12 посещений", "1 персональная", "Бассейн", "Сауна"]'::jsonb),
    ('Премиум',          30,  NULL,  5900.00, 'Безлимит на месяц + 4 персональные',
     '["Безлимит", "4 персональных", "Полотенца", "Парковка", "Гостевой день"]'::jsonb),
    ('VIP Год',         365,  NULL, 49900.00, 'Безлимит на год, всё включено',
     '["Безлимит", "12 персональных", "Массаж 2 раза/мес", "Парковка", "Заморозка 60 дней"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ---------- Клиенты ----------
-- Демо-клиент пароль: Test123!
INSERT INTO client (first_name, last_name, email, phone, birth_date, password_hash, gender, goals, created_at) VALUES
    ('Демо',     'Клиентов',  'demo@volt.ru',          '+79111111111', '1995-05-15', '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m', 'male',   'Похудеть на 10 кг', NOW() - INTERVAL '30 days'),
    ('Анна',     'Спортивная','anna@example.com',      '+79121111111', '1992-03-21', '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m', 'female', 'Подготовка к марафону', NOW() - INTERVAL '60 days'),
    ('Михаил',   'Качков',    'mikhail@example.com',   '+79131111111', '1988-07-08', '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m', 'male',   'Жим 150 кг',   NOW() - INTERVAL '90 days'),
    ('Ольга',    'Йоги',      'olga@example.com',      '+79141111111', '1990-11-30', '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m', 'female', 'Шпагат',       NOW() - INTERVAL '15 days'),
    ('Андрей',   'Бойцов',    'andrey@example.com',    '+79151111111', '1985-02-14', '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m', 'male',   'Любительский бокс',  NOW() - INTERVAL '45 days')
ON CONFLICT (email) DO NOTHING;

-- ещё 25 клиентов для статистики
INSERT INTO client (first_name, last_name, email, phone, birth_date, password_hash, gender, created_at)
SELECT
    (ARRAY['Игорь','Алексей','Светлана','Татьяна','Юлия','Денис','Артём','Виктор','Ирина','Елизавета','Никита','Роман','Дарья','Ксения','Вероника','Стас','Влад','Кирилл','Полина','Маргарита','Богдан','Тимур','Илья','Степан','Мирон'])[i],
    (ARRAY['Петров','Сидоров','Кузнецов','Васильев','Морозов','Романов','Лебедев','Соколов','Орлов','Зайцев','Попов','Сергеев','Иванов','Степанов','Никитин','Михайлов','Фёдоров','Ефимов','Беляев','Тарасов','Власов','Гаврилов','Маркин','Нестеров','Пушкин'])[i],
    'user' || i || '@example.com',
    '+791512' || lpad(i::text, 5, '0'),
    DATE '1985-01-01' + (i * 23) * INTERVAL '1 day',
    '$2a$12$LQnB8Uq9pZdZQF.dGkZJxOUEpYqEx8mVyxR5x.YEwMzq8wVNCkP/m',
    CASE WHEN i % 2 = 0 THEN 'male' ELSE 'female' END,
    NOW() - (i * INTERVAL '3 days')
FROM generate_series(1, 25) i
ON CONFLICT (email) DO NOTHING;

-- ---------- Расписание (50+ занятий на ближайший месяц) ----------
INSERT INTO schedule (trainer_id, hall_id, workout_type_id, start_datetime, end_datetime, max_participants)
SELECT
    ((day_offset + slot) % 8) + 1                                      AS trainer_id,
    ((day_offset + slot) % 4) + 1                                      AS hall_id,
    ((day_offset * 2 + slot) % 8) + 1                                  AS workout_type_id,
    (CURRENT_DATE + day_offset * INTERVAL '1 day' + (8 + slot * 2) * INTERVAL '1 hour'),
    (CURRENT_DATE + day_offset * INTERVAL '1 day' + (8 + slot * 2 + 1) * INTERVAL '1 hour'),
    15 + (slot % 3) * 5
FROM generate_series(0, 29) AS day_offset,
     generate_series(0, 1) AS slot;

-- ---------- Абонементы клиентов ----------
INSERT INTO membership (client_id, membership_type_id, start_date, end_date, visits_used, is_active, payment_status, purchased_at)
SELECT
    c.id,
    (c.id % 5) + 1,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    (c.id % 8),
    TRUE,
    'paid',
    NOW() - INTERVAL '10 days'
FROM client c
LIMIT 20;

-- ---------- Платежи ----------
INSERT INTO payment (client_id, membership_id, employee_id, amount, payment_date, payment_method, status)
SELECT
    m.client_id,
    m.id,
    1,
    mt.price,
    m.purchased_at,
    (ARRAY['card','cash','online'])[(m.id % 3) + 1],
    'completed'
FROM membership m
JOIN membership_type mt ON mt.id = m.membership_type_id;

-- ---------- Бронирования ----------
INSERT INTO booking (client_id, schedule_id, status, booking_datetime)
SELECT
    ((s.id - 1) % 30) + 1,
    s.id,
    CASE WHEN s.id % 7 = 0 THEN 'cancelled' ELSE 'booked' END,
    NOW() - INTERVAL '2 days'
FROM schedule s
WHERE s.id <= 40;

-- ---------- Отзывы ----------
INSERT INTO review (client_id, trainer_id, rating, comment, is_approved, created_at) VALUES
    (1, 1, 5, 'Олег - зверь. Реально качает.',                         TRUE, NOW() - INTERVAL '5 days'),
    (2, 2, 5, 'Мария знает йогу как себя.',                            TRUE, NOW() - INTERVAL '3 days'),
    (3, 8, 4, 'Сергей помог пробить плато в жиме. Спасибо.',           TRUE, NOW() - INTERVAL '7 days'),
    (4, 4, 5, 'Без Елены я бы не сел на шпагат.',                      TRUE, NOW() - INTERVAL '10 days'),
    (5, 3, 4, 'Дмитрий жёсткий, но справедливый. Бокс - топ.',         TRUE, NOW() - INTERVAL '12 days'),
    (1, 7, 5, 'Наталья поставила технику плавания. Учился 10 лет - не получалось, тут за месяц.', TRUE, NOW() - INTERVAL '4 days'),
    (2, 5, 4, 'Кроссфит у Олега - закаляет характер.',                 TRUE, NOW() - INTERVAL '6 days'),
    (6, 1, 5, 'Лучший зал в городе.',                                  TRUE, NOW() - INTERVAL '1 day'),
    (7, 2, 5, 'После йоги ощущение полёта.',                           TRUE, NOW() - INTERVAL '2 days'),
    (8, 8, 3, 'Норм, но местами скучно.',                              FALSE, NOW() - INTERVAL '8 days'),
    (9, 3, 5, 'Бокс - огонь. Жду следующий уровень.',                  TRUE, NOW() - INTERVAL '14 days'),
    (10, 6, 5, 'Кардио на максимум - почти умер, но в хорошем смысле.', TRUE, NOW() - INTERVAL '9 days'),
    (11, 1, 4, 'Зал нравится, иногда бывают очереди на тренажёры.',    TRUE, NOW() - INTERVAL '11 days'),
    (12, 4, 5, 'Стретчинг - топ, я теперь как кошка.',                 TRUE, NOW() - INTERVAL '15 days'),
    (13, 7, 5, 'Бассейн чистый, тренер - топ.',                        TRUE, NOW() - INTERVAL '13 days'),
    (14, 2, 4, 'Йога классная, но утром в 7 - жестко.',                TRUE, NOW() - INTERVAL '20 days'),
    (15, 8, 5, 'Аня - ураган, заряжает на неделю.',                    TRUE, NOW() - INTERVAL '18 days'),
    (16, 5, 4, 'Кроссфит идёт нормально.',                             TRUE, NOW() - INTERVAL '22 days'),
    (17, 3, 5, 'После бокса агрессии в жизни ноль.',                   TRUE, NOW() - INTERVAL '25 days'),
    (18, 1, 5, 'Олег - машина, мотивирует одним взглядом.',            TRUE, NOW() - INTERVAL '28 days')
ON CONFLICT DO NOTHING;

-- ---------- Достижения ----------
INSERT INTO achievement (client_id, title, description, category, value, unit, achieved_at) VALUES
    (1,  'Первая тренировка',     'Начало пути',                  'visits',      1,  'visit',  NOW() - INTERVAL '29 days'),
    (1,  '10 тренировок',          '10 посещений выполнено',       'visits',     10,  'visit',  NOW() - INTERVAL '5 days'),
    (1,  'Минус 2 кг',             'Похудение продолжается',       'weight',     -2,  'kg',     NOW() - INTERVAL '7 days'),
    (2,  'Первая тренировка',     '',                              'visits',      1,  'visit',  NOW() - INTERVAL '59 days'),
    (2,  '50 тренировок',          'Полтинник за плечами',         'visits',     50,  'visit',  NOW() - INTERVAL '2 days'),
    (3,  'Жим 100 кг',             'Сотка взята!',                 'strength',  100,  'kg',     NOW() - INTERVAL '14 days'),
    (4,  'Шпагат',                 'Дошла до пола',                'measurement', 0,  'cm',     NOW() - INTERVAL '21 days'),
    (5,  'Первый спарринг',        'Не упал, не сдался',           'visits',      1,  'spar',   NOW() - INTERVAL '10 days'),
    (1,  '+5 кг к становой',       'Прогресс есть',                'strength',    5,  'kg',     NOW() - INTERVAL '3 days'),
    (2,  'Год в VOLT',              'Спасибо, что с нами',         'visits',    365,  'day',    NOW() - INTERVAL '1 day');

-- ---------- Программы тренировок ----------
INSERT INTO training_program (trainer_id, client_id, name, description, goals, start_date, end_date, status) VALUES
    (1, 1, 'Жиросжигание 12 недель',  'Программа для снижения веса',           'Минус 8-10 кг',         CURRENT_DATE - 14, CURRENT_DATE + 70, 'active'),
    (2, 4, 'Гибкость с нуля',          'От ноль гибкости до шпагата',           'Шпагат за 3 месяца',    CURRENT_DATE - 30, CURRENT_DATE + 60, 'active'),
    (8, 3, 'Силовой цикл',             'Linear progression 5x5',                'Жим 150',               CURRENT_DATE - 7,  CURRENT_DATE + 84, 'active');

-- ---------- Уведомления ----------
INSERT INTO notification (user_id, user_type, title, message, type) VALUES
    (1, 'client', 'Добро пожаловать в VOLT!',     'Ваш аккаунт активирован.',                        'system'),
    (1, 'client', 'Тренировка завтра в 18:00',     'Не забудь про тренировку «Кардио» с Анной.',       'booking'),
    (1, 'client', 'Достижение разблокировано!',    'Поздравляем с 10-й тренировкой.',                  'achievement');
