import {
  DestinationStream,
  pino,
  Logger as PinoLogger,
  StreamEntry,
} from 'pino';
import * as rfs from 'rotating-file-stream';
import p from 'path';
import pretty from 'pino-pretty';

import { ENVIRONMENT } from '../config/constants.config.js';
import { env } from '../config/environment.config.js';

function logFileNameGenerator(time: number | Date, name: string) {
  if (!time) return `${name}.log`;
  if (typeof time === 'number') time = new Date(time);
  const iso = time.toISOString().split('T')[0];
  return `${name}-${iso}.log`;
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
    let streams:
      | DestinationStream
      | StreamEntry
      | (DestinationStream | StreamEntry)[] = [
      {
        level: 'debug',
        stream: rfs.createStream(
          (time) => logFileNameGenerator(time, `info-${env}`),
          {
            interval: '1d',
            maxFiles: 90,
            immutable: true,
            history: `history-info-${env}.txt`,
            path: p.join(__dirname, `../../logs`),
          },
        ),
      },
      {
        level: 'error',
        stream: rfs.createStream(
          (time) => logFileNameGenerator(time, `error-${env}`),
          {
            interval: '1d',
            maxFiles: 90,
            immutable: true,
            history: `history-error-${env}.txt`,
            path: p.join(__dirname, `../../logs`),
          },
        ),
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
        level: 'debug',
        base: undefined,
        timestamp: pino.stdTimeFunctions.isoTime,
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
        dedupe: false,
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
    try {
      this.pino[level](scope, message);
    } catch (e) {
      throw new Error('Error in logger service');
    }
  }
}
