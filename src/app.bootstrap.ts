import closeWithGrace from 'close-with-grace';

import { Application } from './config/app.config.js';
import { HTTPServer } from './servers/http.server.js';
import { KyselyServer } from './servers/kysely.server.js';
import { RedisServer } from './servers/redis.server.js';
import { Logger } from './services/logger.service.js';
import { MailService } from './services/mail.service.js';

const logger = Logger.getInstance();
logger.log('debug', 'Starting server...', { label: 'Server' });

const redisServer = new RedisServer();
const mailServer = MailService.getInstance();
const kyselyServer = KyselyServer.getInstance();

// eslint-disable-next-line antfu/no-top-level-await
await redisServer.start();
void mailServer.setup();

const application = new Application();
const httpServer = new HTTPServer(application.app);
// eslint-disable-next-line antfu/no-top-level-await
await httpServer.start();

const cwgHandler = closeWithGrace({ delay: 10000 }, async (res) => {
  if (res.err) {
    console.error(res.err);
  }
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    logger.log('debug', 'Starting graceful shutdown...', { label: 'Server' });
    cwgHandler.uninstall();
    await Promise.allSettled(
      [redisServer.stop(), httpServer.stop(), kyselyServer.stop()].filter(
        Boolean,
      ),
    );
    logger.log('debug', 'Graceful shutdown completed', { label: 'Server' });
    logger.close();
  } catch (error) {
    console.error('Failed to stop server', error);
  }
}

const wrappedHttpForTesting = httpServer.app.server;

export {
  httpServer as boot,
  gracefulShutdown,
  wrappedHttpForTesting as server,
};
