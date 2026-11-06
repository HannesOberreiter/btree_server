CREATE VIEW stats_hives_feeds AS
SELECT 
	YEAR(date) as year, QUARTER(date) as quarter, 
    hive_id, 
    hives.name as hive_name,
    type.id as type_id, 
	type.name as type_name,
    sum(amount) as sum_amount, 
    feeds.user_id as user_id
FROM feeds
INNER JOIN hives ON feeds.hive_id = hives.id
INNER JOIN feed_types as type ON feeds.type_id = type.id
WHERE feeds.deleted = false AND done = true AND hives.deleted = false
GROUP BY year, quarter, hive_id, type.id, user_id