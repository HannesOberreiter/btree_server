import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@middlewares/validator.middleware';
import { param } from 'express-validator';

export class ApiaryRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('ApiaryController').getApiaries
      );
    this.router
      .route('/:id')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('ApiaryController').getApiary
      );
    this.router
      .route('/')
      .post(
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').createApiary
      );
    this.router
      .route('/')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').updateApiary
      );
    this.router
      .route('/:id')
      .delete(
        Guard.authorize([ROLES.admin]),
        Validator.validate([param('id').isNumeric()]),
        Container.resolve('ApiaryController').deleteApiary
      );
  }
}
