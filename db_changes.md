# Logfile of changes to the Database to the original

Changes are logged because later migration of the live database.

- PK are all renamed to ID
- created and edited renamed to created_at and updated_at

## members

- table renamed to companies
- creation_date renamed to created_at
- username renamed to name
- companynumber removed
- added updated_at field

## bee

- table renamed to bees
- removed rank, task, task_year
- creation_date renamed to created_at
- last_visit renamed to last_visit
- added updated_at
- deleted_date renamed to deleted_at

## apiary

- tables renamed to apiaries
- adress, zip, city -- combined to field "description"
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## treatment_type & disease

- table renamed to treatment_types
- table renamed to treatment_diseases
- type renamed to name
- added created_at & updated_at

## feed_type

- table renamed to feed_types
- type renamed to name
- added created_at & updated_at

## harvest_source

- table renamed to harvest_types
- source renamed to name
- added created_at & updated_at

## checkup_type

- table renamed to checkup_types
- type renamed to name
- added created_at & updated_at

## charge_type

- table renamed to charge_types
- type renamed to name
- added created_at & updated_at

## race

- table renamed to queen_races
- race renamed to name
- added created_at & updated_at

## source

- table renamed to hive_sources
- source renamed to name
- added created_at & updated_at

## type

- table renamed to hive_types
- type renamed to name
- added created_at & updated_at

## vet

- table renamed to treatment_vets
- vet renamed to name
- added created_at & updated_at

## mating

- table renamed to queen_matings
- mating_place renamed to name
- added created_at & updated_at

## charge_control

- table renamed to charges
- amount changed to float
- price changed to float
- ct_id renamed to type_id
- created renamed to created_at
- added updated_at
- deleted_date renamed to deleted_at

## hive

- table renamed to hives
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

table hive_group is not anymore, need to get amount and save into grouphive field

## movedate

- table renamed to movedates
- created renamed to created_at
- edited renamed to updated_at

## feed

- table renamed to feeds
- ft_id renamed to type_id
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## harvest

- table renamed to harvests
- hs_id renamed to type_id
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## treatment

- table renamed to treatments
- tt_type renamed to type_id
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## checkup

- table renamed to checkups
- queen, eggs, capped_brood, queen_cells changed to boolean
- varroa changed to float
- ct_id renamed to type_id
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## queens

- table renamed to queens
- created renamed to created_at
- edited renamed to updated_at
- deleted_date renamed to deleted_at

## customEvent

- table renamed to reminders
- added deleted
- added deleted_at
- created renamed to created_at
- edited renamed to updated_at

## promo

- table renamed to promos
- used changed to boolean

## rear_detail

- table renamed to rearing_details

## rear_type

- table renamed to rearing_types

## rear_mn

- table renamed to rearing_steps
## rear

- table renamed to rearings

## scale

- table renamed to scales

## login_attempts

- added PK id
- added FK bee_id
- removed user_id
- time changed to datetime

