require('module-alias/register');

import { MySQLServer } from '@servers/mysql.server';
import { Application } from '@config/app.config';
import { HTTPServer } from '@servers/http.server';
import { MailService } from './services/mail.service';

const dbServer = new MySQLServer();
const application = new Application();
const httpServer = new HTTPServer(application.app);
const mailServer = new MailService();

dbServer.start();
mailServer.setup();
httpServer.start();

const wrappedServerForTesting = httpServer;
const wrappedHttpForTesting = httpServer.http;
const wrappedSQLServerForTesting = dbServer;
const wrappedMailServerForTesting = mailServer;

export {
  wrappedServerForTesting as boot,
  wrappedHttpForTesting as server,
  wrappedSQLServerForTesting as dbServer,
  wrappedMailServerForTesting as MailServer
};
