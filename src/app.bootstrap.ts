import { env } from './config/environment.config.js';
import { Application } from './config/app.config.js';
import { Logger } from './services/logger.service.js';

import { DatabaseServer } from './servers/db.server.js';
import { RedisServer } from './servers/redis.server.js';
import { HTTPServer } from './servers/http.server.js';
import { VectorServer } from './servers/vector.server.js';
import { MailService } from './services/mail.service.js';

const logger = Logger.getInstance();
logger.log('debug', 'Starting server...', { label: 'Server' });

const dbServer = DatabaseServer.getInstance();
const redisServer = new RedisServer();
const mailServer = new MailService();

let wrappedVectorServerForTesting;

if (env !== 'ci') {
  const vectorServer = new VectorServer();
  vectorServer.start();
  wrappedVectorServerForTesting = vectorServer;
}

dbServer.start();
redisServer.start();
mailServer.setup();

const application = new Application();
const httpServer = new HTTPServer(application.app);
httpServer.start();

const wrappedServerForTesting = httpServer;
const wrappedHttpForTesting = httpServer.http;
const wrappedSQLServerForTesting = dbServer;
const wrappedRedisServerForTesting = redisServer;
const wrappedMailServerForTesting = mailServer;

export {
  wrappedServerForTesting as boot,
  wrappedHttpForTesting as server,
  wrappedSQLServerForTesting as dbServer,
  wrappedRedisServerForTesting as redisServer,
  wrappedMailServerForTesting as MailServer,
  wrappedVectorServerForTesting as vectorServer,
};
