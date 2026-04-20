import type {
  DestinationStream,
  Logger as PinoLogger,
  StreamEntry,
} from 'pino';
import { stdout } from 'node:process';
import {
  multistream,
  pino,
} from 'pino';

import * as rfs from 'rotating-file-stream';
import { ENVIRONMENT } from '../config/constants.config.js';
import { env, rootDirectory } from '../config/environment.config.js';

function logFileNameGenerator(time: number | Date, name: string) {
  if (!time)
    return `${name}.log`;
  if (typeof time === 'number')
    time = new Date(time);
  const iso = time.toISOString().split('T')[0];
  return `${name}-${iso}.log`;
}

export class Logger {
  private static instance: Logger;
  private _streams: (DestinationStream | StreamEntry)[] = [];
  pino: PinoLogger;

  static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    const streams:
      | DestinationStream
      | StreamEntry
      | (DestinationStream | StreamEntry)[] = [
        {
          level: 'debug',
          stream: rfs.createStream(
            time => logFileNameGenerator(time, `info-${env}`),
            {
              interval: '1d',
              maxFiles: 90,
              immutable: true,
              history: `history-info-${env}.txt`,
              path: `${rootDirectory}/logs`,
            },
          ),
        },
        {
          level: 'error',
          stream: rfs.createStream(
            time => logFileNameGenerator(time, `error-${env}`),
            {
              interval: '1d',
              maxFiles: 90,
              immutable: true,
              history: `history-error-${env}.txt`,
              path: `${rootDirectory}/logs`,
            },
          ),
        },
      ];

    if (env === ENVIRONMENT.development) {
      streams.push({
        level: 'debug',
        stream: stdout,
      });
    }

    this._streams = streams as (DestinationStream | StreamEntry)[];

    const ms = multistream(streams, {
      dedupe: false,
    });

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
      ms,
    );
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
    scope: undefined | unknown,
  ) {
    try {
      this.pino[level](scope, message);
    }
    catch (e) {
      console.error(e);
      throw new Error('Error in logger service');
    }
  }

  /**
   * Flush and close all log streams (rotating-file-stream file handles).
   * Call during graceful shutdown to prevent dangling FILEHANDLE leaks.
   */
  close(): void {
    this.pino.flush();
    for (const entry of this._streams) {
      const stream = (entry as StreamEntry).stream ?? entry;
      if (stream && stream !== stdout && typeof (stream as any).end === 'function') {
        (stream as any).end();
      }
    }
  }
}
