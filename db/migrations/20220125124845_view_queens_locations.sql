CREATE VIEW queens_locations AS
    SELECT 
        hives.id AS hive_id,
        hives.name AS hive_name,
        qt.name AS queen_name,
        qt.modus AS queen_modus,
        qt.modus_date AS queen_modus_date,
        qt.mark_colour AS queen_mark_colour,
        qt.id AS queen_id
    FROM
        hives
    LEFT JOIN  (
        SELECT *
        FROM queens as q
        WHERE
            q.deleted = 0
            AND
            q.id = (
                SELECT qs.id FROM queens as qs 
                WHERE qs.hive_id = q.hive_id AND qs.deleted = 0
                ORDER BY qs.move_date ASC, qs.modus DESC, qs.id DESC
                LIMIT 1
            )
        ) as qt ON qt.hive_id = hives.id
    WHERE
    hives.deleted = 0 AND hives.modus = 1
	AND qt.id IS NOT NULL