const router = require('express').Router();
const { pool } = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { requireEmployee, requireRoles } = require('../middleware/roles');

// Все эндпоинты только для сотрудников; для совсем критичных - VORD/MANAGER.
// На больших объёмах часть запросов нужно вынести в материализованные представления.

// GET /api/analytics/dashboard - общие KPI
router.get('/dashboard', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const monthRevenue = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS revenue
         FROM payment
        WHERE status = 'completed'
          AND payment_date >= date_trunc('month', NOW())`
    );
    const activeClients = await pool.query(
      `SELECT COUNT(DISTINCT m.client_id) AS cnt
         FROM membership m
        WHERE m.is_active = TRUE
          AND m.end_date >= CURRENT_DATE`
    );
    const newClientsWeek = await pool.query(
      `SELECT COUNT(*) AS cnt
         FROM client
        WHERE created_at >= NOW() - INTERVAL '7 days'`
    );
    const avgOccupancy = await pool.query(
      `SELECT COALESCE(AVG(
                CASE WHEN max_participants > 0
                     THEN (current_participants::NUMERIC / max_participants) * 100
                     ELSE 0 END
              ), 0) AS pct
         FROM schedule
        WHERE start_datetime BETWEEN NOW() - INTERVAL '7 days' AND NOW()`
    );
    const totalBookingsToday = await pool.query(
      `SELECT COUNT(*) AS cnt FROM booking
        WHERE DATE(booking_datetime) = CURRENT_DATE`
    );
    res.json({
      success: true,
      data: {
        month_revenue: Number(monthRevenue.rows[0].revenue),
        active_clients: Number(activeClients.rows[0].cnt),
        new_clients_week: Number(newClientsWeek.rows[0].cnt),
        avg_occupancy_pct: Math.round(Number(avgOccupancy.rows[0].pct) * 100) / 100,
        bookings_today: Number(totalBookingsToday.rows[0].cnt)
      }
    });
  } catch (e) { next(e); }
});

// GET /api/analytics/revenue?period=month|week
router.get('/revenue', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const period = req.query.period === 'week' ? 'week' : 'month';
    const interval = period === 'week' ? '12 weeks' : '12 months';
    const { rows } = await pool.query(
      `SELECT date_trunc($1, payment_date) AS bucket,
              SUM(amount) AS amount
         FROM payment
        WHERE status = 'completed'
          AND payment_date >= NOW() - INTERVAL '${interval}'
        GROUP BY 1
        ORDER BY 1`,
      [period]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/analytics/popular-classes - топ-10 по числу бронирований
router.get('/popular-classes', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT wt.id, wt.name, wt.color_hex,
              COUNT(b.id) AS bookings_count,
              COUNT(DISTINCT b.client_id) AS unique_clients
         FROM workout_type wt
         LEFT JOIN schedule s ON s.workout_type_id = wt.id
         LEFT JOIN booking b ON b.schedule_id = s.id AND b.status != 'cancelled'
        GROUP BY wt.id, wt.name, wt.color_hex
        ORDER BY bookings_count DESC
        LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/analytics/trainer-performance - рейтинги и нагрузка тренеров
router.get('/trainer-performance', authRequired, requireEmployee, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id,
              e.first_name || ' ' || e.last_name AS name,
              t.specialization,
              t.rating,
              COUNT(DISTINCT s.id) AS classes_total,
              COUNT(DISTINCT b.id) FILTER (WHERE b.status != 'cancelled') AS bookings_total,
              COUNT(DISTINCT r.id) AS reviews_total,
              COALESCE(AVG(r.rating) FILTER (WHERE r.is_approved), 0) AS avg_review_rating
         FROM trainer t
         JOIN employee e ON e.id = t.employee_id
         LEFT JOIN schedule s ON s.trainer_id = t.id
         LEFT JOIN booking b ON b.schedule_id = s.id
         LEFT JOIN review r ON r.trainer_id = t.id
        GROUP BY t.id, e.first_name, e.last_name, t.specialization, t.rating
        ORDER BY bookings_total DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/analytics/member-retention - возврат клиентов
router.get('/member-retention', authRequired, requireRoles('VORD','MANAGER'), async (req, res, next) => {
  try {
    const total = await pool.query(`SELECT COUNT(*) AS cnt FROM client WHERE is_active`);
    const repeat = await pool.query(
      `SELECT COUNT(*) AS cnt FROM (
         SELECT client_id, COUNT(*) AS n FROM membership
          GROUP BY client_id HAVING COUNT(*) > 1
       ) t`
    );
    const totalDebt = await pool.query(
      `SELECT COALESCE(SUM(fn_get_client_total_debt(c.id)), 0) AS debt
         FROM client c WHERE c.is_active`
    );
    const all = Number(total.rows[0].cnt) || 1;
    const back = Number(repeat.rows[0].cnt);
    res.json({
      success: true,
      data: {
        active_clients: all,
        repeat_clients: back,
        retention_pct: Math.round((back / all) * 10000) / 100,
        total_debt: Number(totalDebt.rows[0].debt)
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
