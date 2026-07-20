import process from 'node:process';

import type { Level, Logger as PinoLogger } from 'pino';
import { pino, stdSerializers } from 'pino';

import { ENVIRONMENT } from '../config/constants.config.js';
import { env } from '../config/environment.config.js';

const LOG_LEVELS = new Set<Level>([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
]);

function getLogLevel(): Level {
  const configuredLevel = process.env.LOG_LEVEL;
  if (configuredLevel && LOG_LEVELS.has(configuredLevel as Level)) {
    return configuredLevel as Level;
  }
  return env === ENVIRONMENT.development ? 'debug' : 'info';
}

export class Logger {
  private static instance: Logger;
  pino: PinoLogger;

  static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    this.pino = pino({
      level: getLogLevel(),
      base: {
        service: process.env.SERVICE_NAME ?? 'btree-server',
        environment: env,
        version: process.env.SERVICE_VERSION ?? 'unknown',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'res.headers["set-cookie"]',
          'authorization',
          'cookie',
          'password',
          'token',
          'accessToken',
          'refreshToken',
          'body.password',
          'body.token',
          'body.accessToken',
          'body.refreshToken',
        ],
        censor: '[REDACTED]',
      },
      serializers: {
        err: stdSerializers.err,
        error: stdSerializers.err,
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
          };
        },
        res(response) {
          return {
            statusCode: response.statusCode,
          };
        },
      },
    });
  }

  /**
   * @description Do log action
   * @param {string} level
   * @param {string} message
   * @param {object} scope
   */
  log(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: string,
    scope: unknown,
  ) {
    try {
      this.pino[level](scope, message);
    } catch (error) {
      console.error(error);
      throw new Error('Error in logger service');
    }
  }

  /** Flush pending logs during graceful shutdown. */
  close(): void {
    this.pino.flush();
  }
}
