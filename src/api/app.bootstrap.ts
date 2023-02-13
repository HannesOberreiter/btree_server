require('module-alias/register');

import { MySQLServer } from '@servers/mysql.server';
import { RedisServer } from '@servers/redis.server';

import { Application } from '@config/app.config';
import { HTTPServer } from '@servers/http.server';
import { MailService } from './services/mail.service';

const dbServer = new MySQLServer();
const redisServer = new RedisServer();
const mailServer = new MailService();

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
};
