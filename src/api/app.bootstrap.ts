require('module-alias/register');

import { MySQLServer } from "@root/servers/mysql.server";

const dbServer = new MySQLServer();

dbServer.start();

import { Application } from "@root/config/app.config";
import { HTTPServer } from "@root/servers/http.server";

const application = new Application();
const httpServer = new HTTPServer(application.app);

httpServer.start();

const wrappedHttpServerForTesting = httpServer.http;
const wrappedApplicationForTesting = application.app;

export { wrappedApplicationForTesting as application, wrappedHttpServerForTesting as server };