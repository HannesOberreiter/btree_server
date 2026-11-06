CREATE VIEW charge_stocks AS
SELECT 
	sum((case when (kind = 'in') then amount else 0 end)) as sum_in,
	sum((case when (kind = 'out') then amount else 0 end)) as sum_out,
	sum((case when (kind = 'in') then amount else 0 end)) - sum((case when (kind = 'out') then amount else 0 end)) as sum,
    type_id,
    user_id
FROM
	charges
WHERE 
	deleted = 0
GROUP BY user_id, type_id
