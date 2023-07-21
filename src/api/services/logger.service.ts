import {
  DestinationStream,
  pino,
  Logger as PinoLogger,
  StreamEntry,
} from 'pino';
import * as rfs from 'rotating-file-stream';
import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import { env } from '@config/environment.config';
import p from 'path';
import pretty from 'pino-pretty';

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
    let streams:
      | DestinationStream
      | StreamEntry
      | (DestinationStream | StreamEntry)[] = [
      {
        level: 'debug',
        stream: rfs.createStream(`pino-info-${env}.log`, {
          interval: '7d',
          maxFiles: 10,
          path: p.join(__dirname, `../../../logs`),
        }),
      },
      {
        level: 'error',
        stream: rfs.createStream(`pino-error-${env}.log`, {
          interval: '7d',
          maxFiles: 10,
          path: p.join(__dirname, `../../../logs`),
        }),
      },
    ];

    if (env === ENVIRONMENT.development) {
      streams.push({
        stream: pretty({
          colorize: true,
        }),
      });
    }

    this.pino = pino(
      {
        level: env === ENVIRONMENT.production ? 'info' : 'debug',
        timestamp: () => {
          return `,"time":"${new Date().toISOString()}"`;
        },
        formatters: {
          level: (label: string) => {
            return { level: label.toUpperCase() };
          },
        },
        redact: ['req.headers.authorization'],
        serializers: {
          req(request) {
            return {
              method: request.method,
              url: request.url,
            };
          },
        },
      },
      pino.multistream(streams, {
        dedupe: true,
      }),
    );
  }

  /**
   * @description Do log action
   * @param {string} level
   * @param {string} message
   * @param {object} scope
   */
  log(level: string, message: string, scope: undefined | unknown) {
    this.pino[level](scope, message);
  }
}
