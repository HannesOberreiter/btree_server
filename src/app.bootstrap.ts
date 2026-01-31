import closeWithGrace from 'close-with-grace';
import { Application } from './config/app.config.js';
import { env } from './config/environment.config.js';
import { DatabaseServer } from './servers/db.server.js';

import { HTTPServer } from './servers/http.server.js';
import { KyselyServer } from './servers/kysely.server.js';
import { RedisServer } from './servers/redis.server.js';
import { VectorServer } from './servers/vector.server.js';
import { Logger } from './services/logger.service.js';
import { MailService } from './services/mail.service.js';

const logger = Logger.getInstance();
logger.log('debug', 'Starting server...', { label: 'Server' });

const dbServer = DatabaseServer.getInstance();
const redisServer = new RedisServer();
const mailServer = MailService.getInstance();
const kyselyServer = KyselyServer.getInstance();

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
// eslint-disable-next-line antfu/no-top-level-await
await httpServer.start();

closeWithGrace({ delay: 10000 }, async (res) => {
  if (res.err) {
    console.error(res.err);
  }
  await gracefulShutdown();
});

async function gracefulShutdown() {
  // process.on('SIGTERM', afterFirstSignal);
  // process.on('SIGINT', afterFirstSignal);
  try {
    logger.log('debug', 'Starting graceful shutdown...', { label: 'Server' });
    await Promise.allSettled([
      vectorServer?.stop(),
      dbServer.stop(),
      redisServer.stop(),
      httpServer.stop(),
      kyselyServer.stop(),
    ].filter(Boolean));
    logger.log('debug', 'Graceful shutdown completed', { label: 'Server' });
  }
  catch (error) {
    console.error('Failed to stop server', error);
  }
}

const wrappedHttpForTesting = httpServer.app.server;

export {
  httpServer as boot,
  gracefulShutdown,
  wrappedHttpForTesting as server,
};
