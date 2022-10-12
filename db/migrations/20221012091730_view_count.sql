CREATE VIEW counts AS
SELECT
    count(id) as count,
    user_id,
    'checkup' as kind
FROM
    checkups
WHERE
    done = 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'harvest' as kind
FROM
    harvests
WHERE
    done = 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'treatment' as kind
FROM
    treatments
WHERE
    done = 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'feed' as kind
FROM
    feeds
WHERE
    done = 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'todo' as kind
FROM
    todos
WHERE
    done = 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'hive' as kind
FROM
    hives
WHERE
    modus = 1
GROUP BY
    user_id
UNION
SELECT
    SUM(grouphive) as count,
    user_id,
    'hivegroup_sum' as kind
FROM
    hives
WHERE
    modus = 1
    AND grouphive > 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'hivegroup_count' as kind
FROM
    hives
WHERE
    modus = 1
    AND grouphive > 0
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'apiary' as kind
FROM
    apiaries
WHERE
    modus = 1
GROUP BY
    user_id
UNION
SELECT
    count(id) as count,
    user_id,
    'virgin' as kind
FROM
    queens
WHERE
    modus = 1
    AND hive_id is null
GROUP BY
    user_id
UNION
SELECT
    count(queen_id) as count,
    user_id,
    'queen' as kind
FROM
    queens_locations
    LEFT JOIN hives ON hives.id = queens_locations.hive_id
WHERE
    modus = 1
GROUP BY
    user_id