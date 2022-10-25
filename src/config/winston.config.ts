import { env } from '@config/environment.config';
import * as Winston from 'winston';
import { format } from 'winston';
import p from 'path';
import { ENVIRONMENT } from '@/api/types/enums/environment.enum';

/**
 * This logger implements Winston module for writing custom logs
 *
 * @see https://github.com/winstonjs/winston
 */
export class WinstonConfiguration {
  /**
   * @description Wrapped Winston instance
   */
  private logger: Winston.Logger;

  /**
   * @description Wrap and expose Winston.logger.stream
   * @alias this.logger.stream
   */
  private stream;

  /**
   * @description File name
   */
  private output = env;

  /**
   * @description Output format
   */
  private formater = format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${level}] ${label} : ${message}`;
  });

  private isCron = format((info, opts) => {
    if (info.label === 'CronJob' && opts) return info;
    if (info.label !== 'CronJob' && !opts) return info;
    return false;
  });

  /**
   * @description Default options
   */
  private options = {
    cron: {
      level: 'info',
      format: format.combine(
        this.isCron(true),
        format.timestamp(),
        this.formater
      ),
      filename: p.join(__dirname, `../../logs/cron-${this.output}.log`),
      handleException: true,
      json: true,
      maxSize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
    },
    error: {
      level: 'error',
      format: format.combine(
        this.isCron(false),
        format.timestamp(),
        this.formater
      ),
      filename: p.join(__dirname, `../../logs/error-${this.output}.log`),
      handleException: true,
      json: true,
      maxSize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
    },
    info: {
      level: 'info',
      format: format.combine(
        this.isCron(false),
        format.timestamp(),
        this.formater
      ),
      filename: p.join(__dirname, `../../logs/combined-${this.output}.log`),
      handleException: false,
      json: true,
      maxSize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
    },
    console: {
      // format: Winston.format.simple(),
      format: format.combine(format.timestamp(), this.formater),
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    },
  };

  constructor() {
    const logger = Winston.createLogger({
      level: 'info',
      transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        // - Write all logs with label 'CronJob' to cron.log
        //
        new Winston.transports.File(this.options.cron),
        new Winston.transports.File(this.options.error),
        new Winston.transports.File(this.options.info),
      ],
      exitOnError: false,
    });

    if (env === ENVIRONMENT.development) {
      logger.add(new Winston.transports.Console(this.options.console));
    }

    logger.stream = {
      write: function (message: string, _encoding: string) {
        logger.info(message.trim(), {
          label: 'Stream',
        });
      },
    } as any;

    this.logger = logger;
    this.stream = this.logger.stream;
  }

  /**
   * @description Generic property getter
   *
   * @param {string} property Property name to returns
   */
  get(property: string) {
    return this[property];
  }
}
