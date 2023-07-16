import { WinstonConfiguration } from '@config/winston.config';
import { User } from '../models/user.model';

/**
 * Log service
 */
export class Logger {
  /**
   * @description Wrapped WinstonConfiguration
   */
  private configuration: WinstonConfiguration;

  /**
   * @description Wrapped logger instance, here winston
   */
  private logger;

  /**
   * @description Wrapped logger.stream property
   * @alias Winston.stream
   */
  private stream;

  constructor() {
    this.configuration = new WinstonConfiguration();
    this.logger = this.configuration.get('logger');
    this.stream = this.configuration.get('stream');
  }

  /**
   * @description Generic property getter
   * @param {string} property
   */
  get(property: 'logger' | 'stream') {
    return this[property];
  }

  /**
   * @description Do log action
   * @param {string} level
   * @param {string} message
   * @param {object} scope
   */
  log(
    level: string,
    message: string,
    scope: { label: string; user: User | undefined },
  ) {
    this.logger[level](message, { label: scope.label, user: scope.user });
  }
}
