CREATE VIEW hives_counts AS
    SELECT 
        apiaries.id AS id,
        apiaries.name AS apiary_name,
        COUNT(hives.id) AS count,
        (
            COALESCE(SUM(IF(hives.grouphive > 1, hives.grouphive, 0)),0) - 
            COALESCE(SUM(IF(hives.grouphive > 1, 1, 0)),0)
        ) AS grouphivescount
    FROM
        apiaries
        LEFT JOIN hives_locations ON hives_locations.apiary_id = apiaries.id
        LEFT JOIN hives ON hives.id = hives_locations.hive_id
    WHERE
        hives.modus = 1
            AND hives.deleted = 0
    GROUP BY apiaries.id
    ORDER BY apiaries.name