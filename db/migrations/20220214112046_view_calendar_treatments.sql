CREATE VIEW calendar_treatments AS
    SELECT
		a.id AS apiary_id, 
		a.name AS apiary_name,
		t.date,
		t.enddate, 
		t.done, 
		t.user_id,
        GROUP_CONCAT(t.id) as task_ids,
        GROUP_CONCAT(DISTINCT t.hive_id) as hive_ids,
        GROUP_CONCAT(DISTINCT hives.name ORDER BY hives.name) as hive_names,
        task_type.id as type_id,
        task_type.name as type_name,
        disease_id,
        treatment_diseases.name as disease_name,
        GROUP_CONCAT(DISTINCT created.name ORDER BY created.name) as creators,
        GROUP_CONCAT(DISTINCT edited.name ORDER BY edited.name) as editors
    FROM
        treatments as t
		INNER JOIN hives ON hives.id = t.hive_id
        INNER JOIN movedates as m ON m.hive_id = hives.id
        INNER JOIN apiaries as a ON a.id= m.apiary_id
		LEFT JOIN treatment_types as task_type ON task_type.id = t.type_id
        LEFT JOIN treatment_diseases ON treatment_diseases.id = t.disease_id
		LEFT JOIN (SELECT COALESCE(NULLIF(username,''), email) as name, id FROM bees) as created ON created.id = t.bee_id
		LEFT JOIN (SELECT COALESCE(NULLIF(username,''), email) as name, id FROM bees) as edited ON edited.id = t.edit_id
	WHERE
		t.deleted = 0
		AND hives.deleted = 0
		AND
		m.date IN (
            SELECT MAX(md.date)
            FROM movedates as md
            WHERE md.hive_id = m.hive_id AND t.date >= CAST(md.date AS DATE)
            GROUP BY md.hive_id
            )
		AND t.date >= CAST(m.date AS DATE)
    GROUP BY a.id, t.date, t.enddate, t.done, t.type_id, t.disease_id, t.user_id