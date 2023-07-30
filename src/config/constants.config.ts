/**
 * @description Define application environments
 */
export const ENVIRONMENT = {
  development: 'development',
  staging: 'staging',
  production: 'production',
  test: 'test',
  ci: 'ci',
} as const;

/**
 * @description ICal endpoint sources /external/ical/:source/:api
 */
export const SOURCE = {
  checkup: 'checkup',
  treatment: 'treatment',
  feed: 'feed',
  harvest: 'harvest',
  movedate: 'movedate',
  rearing: 'rearing',
  scale_data: 'scale_data',
  todo: 'todo',
} as const;

/**
 * @description Dropdown / Option tables available for Endpoint /option/:table
 */
export const OPTION = {
  charge_types: 'charge_types',
  hive_sources: 'hive_sources',
  hive_types: 'hive_types',
  feed_types: 'feed_types',
  harvest_types: 'harvest_types',
  checkup_types: 'checkup_types',
  queen_matings: 'queen_matings',
  queen_races: 'queen_races',
  treatment_diseases: 'treatment_diseases',
  treatment_types: 'treatment_types',
  treatment_vets: 'treatment_vets',
} as const;

/**
 * @description Define supported roles
 */
export const ROLES = {
  admin: 1,
  user: 2,
  read: 3,
  ghost: 4,
} as const;
