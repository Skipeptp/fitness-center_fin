-- =============================================================
-- ФУНКЦИИ И ПРОЦЕДУРЫ
-- =============================================================

-- fn_get_client_total_debt(client_id) - сумма всех pending платежей клиента
CREATE OR REPLACE FUNCTION fn_get_client_total_debt(p_client_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql AS $$
DECLARE
    v_debt NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
      INTO v_debt
      FROM payment
     WHERE client_id = p_client_id
       AND status = 'pending';
    RETURN v_debt;
END;
$$;

-- pr_calculate_occupancy_rate(hall_id, date) - загруженность зала на дату (%).
-- Считаем как (sum(current_participants)/sum(max_participants))*100 по schedule
-- зала за указанную дату.
CREATE OR REPLACE PROCEDURE pr_calculate_occupancy_rate(
    p_hall_id INT,
    p_date    DATE,
    INOUT p_occupancy_pct NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_total_seats   INT := 0;
    v_taken_seats   INT := 0;
BEGIN
    SELECT COALESCE(SUM(max_participants), 0),
           COALESCE(SUM(current_participants), 0)
      INTO v_total_seats, v_taken_seats
      FROM schedule
     WHERE hall_id = p_hall_id
       AND DATE(start_datetime) = p_date
       AND status <> 'cancelled';

    IF v_total_seats = 0 THEN
        p_occupancy_pct := 0;
    ELSE
        p_occupancy_pct := ROUND((v_taken_seats::NUMERIC / v_total_seats) * 100, 2);
    END IF;
END;
$$;

-- fn_get_trainer_avg_rating(trainer_id) - средний рейтинг тренера
CREATE OR REPLACE FUNCTION fn_get_trainer_avg_rating(p_trainer_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql AS $$
DECLARE
    v_rating NUMERIC;
BEGIN
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
      INTO v_rating
      FROM review
     WHERE trainer_id = p_trainer_id
       AND is_approved = TRUE;
    RETURN v_rating;
END;
$$;

-- VIEW для DATA_READER - публичные данные клиентов с LIMIT 150
-- (по ТЗ: массовые выборки ПДн > 150 - под аудит)
CREATE OR REPLACE VIEW v_client_public AS
SELECT id, first_name, last_name, created_at, is_active
  FROM client
 LIMIT 150;

GRANT SELECT ON v_client_public TO data_reader;
