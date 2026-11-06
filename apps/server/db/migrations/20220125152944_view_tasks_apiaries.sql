CREATE VIEW tasks_apiaries AS
    SELECT 
        a.id AS apiary_id,
        a.name AS apiary_name,
        a.user_id AS user_id,
        t.id AS task_id,
        t.date AS task_date
    FROM
        apiaries a
        LEFT JOIN movedates as m ON m.apiary_id = a.id
        LEFT JOIN tasks as t  ON t.hive_id = m.hive_id
    WHERE
    m.date IN (
            SELECT MAX(md.date)
            FROM movedates as md
            WHERE md.hive_id = m.hive_id AND t.date >= CAST(md.date AS DATE)
            GROUP BY md.hive_id
            )
    AND t.date >= CAST(m.date AS DATE)