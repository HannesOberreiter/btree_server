import Helmet from 'helmet';

/**
 * Set Helmet security middleware
 *
 * @see https://github.com/helmetjs/helmet
 */
export class HelmetConfiguration {
  /**
   * @description Wrapped Helmet instance
   */
  private static helmet: Function;

  /**
   * @description Plugins options. Add options to activate a specific plugin.
   */
  private static options = {
    contentSecurityPolicy: {
      directives: {
        ...Helmet.contentSecurityPolicy.getDefaultDirectives()
      }
    },
    referrerPolicy: { policy: 'no-referrer' }
  };

  constructor() {}

  /**
   * @description Set plugins according to scope options
   */
  private static plug(): Function {
    this.helmet = Helmet;
    for (let key of Object.keys(this.options)) {
      this.helmet[key](this.options[key]);
    }

    /*Object.keys(this.options).forEach( key => {
      this.helmet[key](this.options[key]);
    });*/
    return this.helmet;
  }

  /**
   * @description Helmet instance getter as Singleton
   */
  static get(): Function {
    if (!this.helmet) {
      return this.plug();
    }
    return this.helmet;
  }
}
