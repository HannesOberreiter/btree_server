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

// Helper function to copy session from MySQL to redis
async function transferSession() {
  const oldSession = await MySQLServer.knex('sessions').select('*');
  for (const session of oldSession) {
    const sessionData = JSON.parse(session.sess);
    const newSession = {
      cookie: {
        ...sessionData.cookie,
      },
      user: {
        ...sessionData.user,
        last_visit: new Date(),
      },
    };
    await RedisServer.client.set(
      `btree_sess:${session.sid}`,
      JSON.stringify(newSession),
      'EX',
      sessionData.cookie.originalMaxAge
    );
    await RedisServer.client.set(
      session.sid,
      JSON.stringify(newSession),
      'EX',
      sessionData.cookie.originalMaxAge
    );
  }
  console.log(`Copied old session: ${oldSession.length}`);
}

transferSession();

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
