import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class RearingStepRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .post(
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingStepController').post
      );
    this.router
      .route('/:id')
      .delete(
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingStepController').delete
      );
    this.router
      .route('/updatePosition')
      .patch(
        Validator.validate([body('data').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingStepController').updatePosition
      );
  }
}
