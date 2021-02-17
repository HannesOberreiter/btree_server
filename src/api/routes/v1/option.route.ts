import { Router } from "@classes/router.class";
import { Container } from "@config/container.config";
import { Validator } from "@middlewares/validator.middleware";

export class OptionRouter extends Router {

  constructor() { super(); }

  define() {

    this.router
      .route('/:table')
      .get(Validator.handleOption, Container.resolve('OptionController').get);
      
  }

};