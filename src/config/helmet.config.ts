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
  private static helmet;

  /**
   * @description Plugins options. Add options to activate a specific plugin.
   */
  private static options = {
    contentSecurityPolicy: {
      directives: {
        ...Helmet.contentSecurityPolicy.getDefaultDirectives(),
      },
    },
    hidePoweredBy: true,
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
  };

  /**
   * @description Set plugins according to scope options
   */
  private static plug() {
    this.helmet = Helmet;
    for (const key of Object.keys(this.options)) {
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
  static get() {
    if (!this.helmet) {
      return this.plug();
    }
    return this.helmet;
  }
}
