"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPServer = void 0;
const environment_config_js_1 = require("../config/environment.config.js");
const scheduler_js_1 = require("../cron/scheduler.js");
const logger_service_js_1 = require("../services/logger.service.js");
const constants_config_js_1 = require("../config/constants.config.js");
/**
 * @description Application server wrapper instance
 */
class HTTPServer {
    logger = logger_service_js_1.Logger.getInstance();
    http;
    app;
    constructor(app) {
        this.app = app;
        this.http = this.app.server;
    }
    /**
     * @description Start servers
     */
    start() {
        try {
            const app = this.app;
            const logger = this.logger;
            const containerHost = environment_config_js_1.isContainer ? '0.0.0.0' : 'localhost';
            app.listen({
                port: environment_config_js_1.port,
                host: containerHost,
            }, function (err, address) {
                if (err) {
                    logger.log('error', 'Server creation error', { err });
                    process.exit(1);
                }
                if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.test) {
                    app.log.debug(`HTTP(S) server is now running on ${address} (${environment_config_js_1.env})`);
                }
            });
            /**
             * @description Start Cron Jobs
             */
            scheduler_js_1.task.start();
            scheduler_js_1.task.nextRun();
        }
        catch (error) {
            this.logger.log('error', 'Failed to create server', error);
        }
    }
    /**
     * @description stop servers
     */
    stop(callback = null) {
        scheduler_js_1.task.stop();
        this.app.log.info('Stopping server');
        return this.app.close(callback);
    }
}
exports.HTTPServer = HTTPServer;
