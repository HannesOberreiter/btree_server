require('module-alias/register');

import { DatabaseServer } from '@/servers/db.server';
import { RedisServer } from '@servers/redis.server';

import { Application } from '@config/app.config';
import { HTTPServer } from '@servers/http.server';
import { MailService } from './services/mail.service';
import { VectorServer } from '@/servers/vector.server';
import { env } from '@/config/environment.config';

const dbServer = new DatabaseServer();
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
