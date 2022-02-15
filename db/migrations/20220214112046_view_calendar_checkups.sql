CREATE VIEW calendar_checkups AS
    SELECT
        apiary_id, apiary_name, date, enddate, done, ta.user_id,
        GROUP_CONCAT(task.id) as task_ids,
        GROUP_CONCAT(hive_id) as hive_ids,
        GROUP_CONCAT(hives.name) as hive_names,
        task_type.id as type_id,
        task_type.name as type_name,
        GROUP_CONCAT(created.email) as creators,
        GROUP_CONCAT(edited.email) as editors
    FROM checkups_apiaries as ta 
    LEFT JOIN checkups as task
        ON task.id = ta.checkup_id
    LEFT JOIN checkup_types as task_type
        ON task_type.id = task.type_id
    LEFT JOIN hives
        ON hives.id = task.hive_id
    LEFT JOIN bees as created
        ON created.id = task.bee_id
    LEFT JOIN bees as edited
        ON edited.id = task.edit_id
    WHERE task.deleted = 0
    GROUP BY ta.apiary_id, task.date, task.enddate, task.done, task.type_id