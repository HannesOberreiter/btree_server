CREATE VIEW movedates_previous_apiary AS
SELECT 
    current_move.id AS current_move_id,
    current_move.date AS current_move_date,
    current_move.hive_id,
    previous_apiary.id AS previous_apiary_id,
    previous_apiary.name AS previous_apiary_name
FROM (
    SELECT
        id,
        date,
        hive_id,
        LAG(apiary_id) OVER (PARTITION BY hive_id ORDER BY date) AS previous_apiary_id
    FROM 
        movedates
) AS current_move
LEFT JOIN 
    apiaries AS previous_apiary
ON 
    current_move.previous_apiary_id = previous_apiary.id;