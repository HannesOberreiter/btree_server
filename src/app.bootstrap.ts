import { env } from './config/environment.config.js';
import { Application } from './config/app.config.js';
import { Logger } from './services/logger.service.js';
import closeWithGrace from 'close-with-grace';

import { DatabaseServer } from './servers/db.server.js';
import { RedisServer } from './servers/redis.server.js';
import { HTTPServer } from './servers/http.server.js';
import { VectorServer } from './servers/vector.server.js';
import { MailService } from './services/mail.service.js';

const logger = Logger.getInstance();
logger.log('debug', 'Starting server...', { label: 'Server' });

const dbServer = DatabaseServer.getInstance();
const redisServer = new RedisServer();
const mailServer = MailService.getInstance();

let vectorServer;
if (env !== 'ci') {
  vectorServer = new VectorServer();
  vectorServer.start();
}

dbServer.start();
redisServer.start();
mailServer.setup();

const application = new Application();
const httpServer = new HTTPServer(application.app);
httpServer.start();

closeWithGrace({ delay: 5000 }, async function (res) {
  if (res.err) {
    console.error(res.err);
  }
  await gracefulShutdown();
});

async function gracefulShutdown() {
  //process.on('SIGTERM', afterFirstSignal);
  //process.on('SIGINT', afterFirstSignal);
  try {
    if (env === 'ci') {
      await Promise.allSettled([
        dbServer.stop(),
        redisServer.stop(),
        httpServer.stop(),
      ]);
    } else {
      await Promise.allSettled([
        vectorServer.stop(),
        dbServer.stop(),
        redisServer.stop(),
        httpServer.stop(),
      ]);
    }
  } catch (error) {
    console.error('Failed to stop server', error);
  }
}

const wrappedHttpForTesting = httpServer.app.server;

export {
  gracefulShutdown,
  httpServer as boot,
  wrappedHttpForTesting as server,
};
