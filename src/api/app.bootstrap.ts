require('module-alias/register');

import { MySQLServer } from '@servers/mysql.server';

const dbServer = new MySQLServer();

dbServer.start();

import { Application } from '@config/app.config';
import { HTTPServer } from '@servers/http.server';

const application = new Application();
const httpServer = new HTTPServer(application.app);

httpServer.start();

const wrappedServerForTesting = httpServer;
const wrappedHttpForTesting = httpServer.http;
const wrappedSQLServerForTesting = dbServer;

export {
  wrappedServerForTesting as boot,
  wrappedHttpForTesting as server,
  wrappedSQLServerForTesting as dbServer,
};
