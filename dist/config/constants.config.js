"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = exports.OPTION = exports.SOURCE = exports.ENVIRONMENT = void 0;
/**
 * @description Define application environments
 */
exports.ENVIRONMENT = {
    development: 'development',
    staging: 'staging',
    production: 'production',
    test: 'test',
    ci: 'ci',
};
/**
 * @description ICal endpoint sources /external/ical/:source/:api
 */
exports.SOURCE = {
    checkup: 'checkup',
    treatment: 'treatment',
    feed: 'feed',
    harvest: 'harvest',
    movedate: 'movedate',
    rearing: 'rearing',
    scale_data: 'scale_data',
    todo: 'todo',
};
/**
 * @description Dropdown / Option tables available for Endpoint /option/:table
 */
exports.OPTION = {
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
};
/**
 * @description Define supported roles
 */
exports.ROLES = {
    admin: 1,
    user: 2,
    read: 3,
    ghost: 4,
};
