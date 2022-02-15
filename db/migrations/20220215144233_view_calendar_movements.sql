CREATE VIEW calendar_movements AS
    SELECT
		date, apiary_id, apiaries.name as apiary_name, user_id,
        GROUP_CONCAT(movedates.id) as move_ids,
        GROUP_CONCAT(hive_id) as hive_ids,
        GROUP_CONCAT(hives.name) as hive_names,
        GROUP_CONCAT(created.email) as creators,
        GROUP_CONCAT(edited.email) as editors
    FROM movedates
    LEFT JOIN hives
        ON hives.id = movedates.hive_id
    LEFT JOIN apiaries
        ON apiaries.id = movedates.apiary_id
    LEFT JOIN bees as created
        ON created.id = movedates.bee_id
    LEFT JOIN bees as edited
        ON edited.id = movedates.edit_id
    WHERE hives.deleted = 0 AND apiaries.deleted = 0
    GROUP BY apiary_id, date, apiary_name, user_id