CREATE VIEW hives_locations AS
    SELECT 
        apiaries.id AS apiary_id,
        apiaries.user_id AS user_id,
        am.id AS move_id,
        apiaries.name AS apiary_name,
        hives.id AS hive_id,
        hives.name AS hive_name,
        hives.modus AS hive_modus,
        hives.deleted AS hive_deleted
    FROM
        apiaries
        LEFT JOIN movedates as am ON am.apiary_id = apiaries.id
        LEFT JOIN hives ON am.hive_id = hives.id
        LEFT JOIN movedates as hm ON
            am.hive_id = hm.hive_id
            AND (am.date < hm.date
            OR (am.date = hm.date
            AND am.id < hm.id))
    WHERE
        Isnull(hm.hive_id)
        AND am.hive_id IS NOT NULL
    ORDER BY apiaries.name

