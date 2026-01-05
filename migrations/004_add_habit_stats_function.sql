-- Migration: 004_add_habit_stats_function.sql
-- Purpose: Créer une fonction pour calculer les stats d'une habitude côté serveur
-- This centralizes all habit statistics calculation in the database

BEGIN;

-- Fonction pour calculer les stats d'une habitude
CREATE OR REPLACE FUNCTION get_habit_stats(
  p_habit_id UUID,
  p_user_id UUID,
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  habit_id UUID,
  today_count INT,
  current_streak INT,
  last_7_days_count INT,
  month_completion_rate NUMERIC,
  total_count BIGINT,
  last_action_date DATE,
  last_action_timestamp TIMESTAMPTZ
) AS $$
DECLARE
  v_tracking_mode TEXT;
  v_habit_type TEXT;
BEGIN
  -- Récupérer le mode de tracking et le type
  SELECT h.tracking_mode, h.type
  INTO v_tracking_mode, v_habit_type
  FROM habits h
  WHERE h.id = p_habit_id AND h.user_id = p_user_id;

  IF v_tracking_mode IS NULL THEN
    RAISE EXCEPTION 'Habit not found';
  END IF;

  -- Pour les mauvaises habitudes (mode events)
  IF v_habit_type = 'bad' THEN
    RETURN QUERY
    WITH event_stats AS (
      SELECT
        COUNT(*) FILTER (WHERE event_date = p_today) AS today_cnt,
        COUNT(*) FILTER (WHERE event_date >= p_today - INTERVAL '7 days') AS week_cnt,
        COUNT(*) AS total_cnt,
        MAX(event_date) AS last_date,
        MAX(occurred_at) AS last_timestamp
      FROM habit_events
      WHERE habit_id = p_habit_id
        AND user_id = p_user_id
    ),
    -- Calcul du streak (jours consécutifs SANS craquage pour bad habits)
    streak_calc AS (
      SELECT COUNT(*) AS streak_days
      FROM generate_series(p_today - INTERVAL '365 days', p_today, INTERVAL '1 day') AS d(day)
      WHERE NOT EXISTS (
        SELECT 1
        FROM habit_events e
        WHERE e.habit_id = p_habit_id
          AND e.user_id = p_user_id
          AND e.event_date = d.day::DATE
      )
      AND d.day::DATE <= p_today
      AND d.day::DATE >= (
        SELECT COALESCE(MAX(event_date) + 1, p_today - INTERVAL '365 days')
        FROM habit_events
        WHERE habit_id = p_habit_id
          AND user_id = p_user_id
          AND event_date < p_today
      )
    ),
    month_stats AS (
      -- Pour les bad habits : % de jours sans craquage ce mois
      SELECT
        (DATE_PART('day', DATE_TRUNC('month', p_today) + INTERVAL '1 month' - INTERVAL '1 day')::INT -
         COUNT(DISTINCT event_date)::INT) * 100.0 /
        DATE_PART('day', DATE_TRUNC('month', p_today) + INTERVAL '1 month' - INTERVAL '1 day')::INT AS completion_pct
      FROM habit_events
      WHERE habit_id = p_habit_id
        AND user_id = p_user_id
        AND event_date >= DATE_TRUNC('month', p_today)
        AND event_date <= p_today
    )
    SELECT
      p_habit_id,
      CASE
        WHEN v_tracking_mode = 'counter' THEN es.today_cnt::INT
        ELSE LEAST(es.today_cnt, 1)::INT -- Binary mode: max 1
      END,
      COALESCE(sc.streak_days, 0)::INT,
      es.week_cnt::INT,
      COALESCE(ms.completion_pct, 100)::NUMERIC,
      es.total_cnt,
      es.last_date,
      es.last_timestamp
    FROM event_stats es
    CROSS JOIN streak_calc sc
    CROSS JOIN month_stats ms;

  ELSE
    -- Pour les bonnes habitudes (mode logs)
    RETURN QUERY
    WITH log_stats AS (
      SELECT
        COALESCE(SUM(value) FILTER (WHERE completed_date = p_today), 0) AS today_cnt,
        COALESCE(SUM(value) FILTER (WHERE completed_date >= p_today - INTERVAL '7 days'), 0) AS week_cnt,
        COALESCE(SUM(value), 0) AS total_cnt,
        MAX(completed_date) AS last_date
      FROM logs
      WHERE habit_id = p_habit_id
        AND user_id = p_user_id
    ),
    -- Calcul du streak (jours consécutifs avec validation)
    streak_calc AS (
      SELECT COUNT(*) AS streak_days
      FROM generate_series(p_today, p_today - INTERVAL '365 days', INTERVAL '-1 day') AS d(day)
      WHERE EXISTS (
        SELECT 1
        FROM logs l
        WHERE l.habit_id = p_habit_id
          AND l.user_id = p_user_id
          AND l.completed_date = d.day::DATE
      )
    ),
    month_stats AS (
      -- Pour les good habits : % de jours avec validation ce mois
      SELECT
        COUNT(DISTINCT completed_date)::INT * 100.0 /
        DATE_PART('day', DATE_TRUNC('month', p_today) + INTERVAL '1 month' - INTERVAL '1 day')::INT AS completion_pct
      FROM logs
      WHERE habit_id = p_habit_id
        AND user_id = p_user_id
        AND completed_date >= DATE_TRUNC('month', p_today)
        AND completed_date <= p_today
    )
    SELECT
      p_habit_id,
      ls.today_cnt::INT,
      COALESCE(sc.streak_days, 0)::INT,
      ls.week_cnt::INT,
      COALESCE(ms.completion_pct, 0)::NUMERIC,
      ls.total_cnt,
      ls.last_date,
      ls.last_date::TIMESTAMPTZ -- Pour logs, on n'a pas de timestamp précis
    FROM log_stats ls
    CROSS JOIN streak_calc sc
    CROSS JOIN month_stats ms;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_habit_stats TO authenticated;

COMMIT;
