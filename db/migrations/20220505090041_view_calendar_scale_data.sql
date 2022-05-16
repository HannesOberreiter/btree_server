CREATE VIEW calendar_scale_data AS
    SELECT 
	    DATE_FORMAT(datetime, '%Y-%m-%d') as date, ROUND(AVG(weight),1) as average, scale_id, user_id, name
    FROM scale_data 
    LEFT JOIN scales ON scales.id = scale_data.scale_id
    GROUP BY user_id, scale_id, date;
