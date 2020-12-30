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

## mating

- table renamed to queen_matings
- mating_place rennamed to name
