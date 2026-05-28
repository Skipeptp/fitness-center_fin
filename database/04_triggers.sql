-- =============================================================
-- ТРИГГЕРЫ
-- =============================================================

-- ---- trg_booking_count: при создании/отмене брони обновлять
--      schedule.current_participants ----

CREATE OR REPLACE FUNCTION fn_booking_count_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'booked' THEN
            UPDATE schedule
               SET current_participants = current_participants + 1
             WHERE id = NEW.schedule_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- было booked, стало cancelled - уменьшить
        IF OLD.status = 'booked' AND NEW.status IN ('cancelled','no_show') THEN
            UPDATE schedule
               SET current_participants = GREATEST(current_participants - 1, 0)
             WHERE id = NEW.schedule_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'booked' THEN
            UPDATE schedule
               SET current_participants = GREATEST(current_participants - 1, 0)
             WHERE id = OLD.schedule_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_count ON booking;
CREATE TRIGGER trg_booking_count
AFTER INSERT OR UPDATE OR DELETE ON booking
FOR EACH ROW EXECUTE FUNCTION fn_booking_count_trigger();

-- ---- trg_invoice_after_update: при обновлении платежа -
--      запись в audit_log + если статус completed и есть membership_id -
--      активировать абонемент ----

CREATE OR REPLACE FUNCTION fn_payment_after_update()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO audit_log(table_name, operation, row_id, payload)
    VALUES ('payment', 'UPDATE', NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'amount', NEW.amount,
                'client_id', NEW.client_id
            ));

    -- если оплата прошла - помечаем абонемент paid
    IF OLD.status <> 'completed' AND NEW.status = 'completed'
       AND NEW.membership_id IS NOT NULL THEN
        UPDATE membership
           SET payment_status = 'paid',
               is_active = TRUE
         WHERE id = NEW.membership_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_after_update ON payment;
CREATE TRIGGER trg_invoice_after_update
AFTER UPDATE ON payment
FOR EACH ROW EXECUTE FUNCTION fn_payment_after_update();

-- ---- trg_review_rating_update: при одобрении отзыва пересчитать
--      средний рейтинг тренера ----

CREATE OR REPLACE FUNCTION fn_review_rating_update()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_approved = TRUE AND NEW.trainer_id IS NOT NULL THEN
        UPDATE trainer
           SET rating = fn_get_trainer_avg_rating(NEW.trainer_id)
         WHERE id = NEW.trainer_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_rating_update ON review;
CREATE TRIGGER trg_review_rating_update
AFTER INSERT OR UPDATE ON review
FOR EACH ROW EXECUTE FUNCTION fn_review_rating_update();

-- ---- trg_audit_clients: аудит изменений в client (ПДн) ----

CREATE OR REPLACE FUNCTION fn_audit_pd_tables()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO audit_log(table_name, operation, row_id, payload)
    VALUES (TG_TABLE_NAME, TG_OP,
            COALESCE(NEW.id, OLD.id),
            CASE
              WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) - 'password_hash'
              ELSE to_jsonb(NEW) - 'password_hash'
            END);
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_client_audit ON client;
CREATE TRIGGER trg_client_audit
AFTER INSERT OR UPDATE OR DELETE ON client
FOR EACH ROW EXECUTE FUNCTION fn_audit_pd_tables();

DROP TRIGGER IF EXISTS trg_employee_audit ON employee;
CREATE TRIGGER trg_employee_audit
AFTER INSERT OR UPDATE OR DELETE ON employee
FOR EACH ROW EXECUTE FUNCTION fn_audit_pd_tables();
