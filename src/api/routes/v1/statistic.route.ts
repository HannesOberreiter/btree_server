import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Validator } from '@/api/middlewares/validator.middleware';
import { query } from 'express-validator';

export class StatisticRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/hive_count_total')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getHiveCountTotal
      );
    this.router
      .route('/hive_count_apiary')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Validator.validate([query('date').exists().isString().toDate()]),
        Container.resolve('StatisticController').getHiveCountApiary
      );
    this.router
      .route('/harvest/hive')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getHarvestHive
      );
    this.router
      .route('/harvest/year')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getHarvestYear
      );
    this.router
      .route('/harvest/apiary')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getHarvestApiary
      );
    this.router
      .route('/harvest/type')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getHarvestType
      );
    this.router
      .route('/feed/hive')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getFeedHive
      );
    this.router
      .route('/feed/year')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getFeedYear
      );
    this.router
      .route('/feed/apiary')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getFeedApiary
      );
    this.router
      .route('/feed/type')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getFeedType
      );
    this.router
      .route('/treatment/hive')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getTreatmentHive
      );
    this.router
      .route('/treatment/year')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getTreatmentYear
      );
    this.router
      .route('/treatment/apiary')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getTreatmentApiary
      );
    this.router
      .route('/treatment/type')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getTreatmentType
      );
    this.router
      .route('/rating/hive')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('StatisticController').getCheckupRatingHive
      );
  }
}
