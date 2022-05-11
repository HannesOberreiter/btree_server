CREATE VIEW stats_hives_harvests AS
SELECT 
	YEAR(date) as year, QUARTER(date) as quarter, hive_id, type_id, sum(amount) as sum_amount, sum(frames) as sum_frames 
FROM harvests 
WHERE deleted = false AND done = true
GROUP BY year, quarter, hive_id, type_id