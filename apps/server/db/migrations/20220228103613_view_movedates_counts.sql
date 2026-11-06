CREATE VIEW movedates_counts AS
    SELECT hive_id, count(hive_id) as count 
    FROM movedates 
    GROUP BY hive_id