CREATE VIEW stats_hives_harvests AS
SELECT 
	YEAR(date) as year, QUARTER(date) as quarter, 
    hive_id, 
    hives.name as hive_name,
    type.id as type_id, 
	type.name as type_name,
    sum(amount) as sum_amount, 
    sum(frames) as sum_frames,
    harvests.user_id as user_id
FROM harvests
INNER JOIN hives ON harvests.hive_id = hives.id
INNER JOIN harvest_types as type ON harvests.type_id = type.id
WHERE harvests.deleted = false AND done = true AND hives.deleted = false
GROUP BY year, quarter, hive_id, type.id, user_id