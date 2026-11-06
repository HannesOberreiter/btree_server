CREATE VIEW queen_durations AS
SELECT
    t.id,
    t.move_date,
    t.hive_id,
    t.user_id,
    t.duration,
    IFNULL(
        DATE_ADD(t.move_date, INTERVAL t.duration DAY),
        CURDATE()
    ) AS last_date
FROM
    (
        SELECT
            q.id,
            q.move_date,
            q.hive_id,
            q.user_id,
            DATEDIFF(q1.move_date, q.move_date) duration
        FROM
            queens q
            INNER JOIN queens q1 ON q.id <> q1.id
            AND q.hive_id = q1.hive_id
            AND q.move_date < q1.move_date
        WHERE
            q.deleted = 0
        UNION
        SELECT
            q.id,
            q.move_date,
            q.hive_id,
            q.user_id,
            NULL Duration
        FROM
            queens q
            LEFT JOIN queens q1 ON q.hive_id = q1.hive_id
            AND q.id <> q1.id
            AND q.move_date < q1.move_date
            AND q1.deleted = 0
        WHERE
            q1.id IS NULL
            AND q.deleted = 0
        ORDER BY
            id
    ) t
    LEFT JOIN (
        SELECT
            q.id,
            q.move_date,
            q.hive_id,
            q.user_id,
            DATEDIFF(q1.move_date, q.move_date) duration
        FROM
            queens q
            INNER JOIN queens q1 ON q.id <> q1.id
            AND q.hive_id = q1.hive_id
            AND q.move_date < q1.move_date
        WHERE
            q.deleted = 0
    ) a ON a.id = t.id
    AND a.hive_id = t.hive_id
    AND a.move_date = t.move_date
    AND a.Duration < t.Duration
WHERE
    a.duration IS NULL