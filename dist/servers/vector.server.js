"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorServer = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_config_js_1 = require("../config/environment.config.js");
const logger_service_js_1 = require("../services/logger.service.js");
const constants_config_js_1 = require("../config/constants.config.js");
/**
 * @description Connection to redis docker instance
 */
class VectorServer {
    logger = logger_service_js_1.Logger.getInstance();
    static client;
    start() {
        try {
            const config = {
                connectionName: 'btreeVector',
                enableOfflineQueue: false,
            };
            if (environment_config_js_1.vectorConfig.password) {
                config['username'] = environment_config_js_1.vectorConfig.user;
                config['password'] = environment_config_js_1.vectorConfig.password;
            }
            VectorServer.client = new ioredis_1.default(environment_config_js_1.vectorConfig.port, environment_config_js_1.vectorConfig.host, config);
            VectorServer.client.on('connect', () => {
                if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.test) {
                    this.logger.log('debug', `Connection to redis (vector) server established on port ${environment_config_js_1.vectorConfig.port} (${environment_config_js_1.env})`, { label: 'Vector' });
                }
            });
        }
        catch (error) {
            this.logger.log('error', `Redis connection error : ${error.message}`, {
                label: 'Vector',
            });
        }
    }
    stop() {
        try {
            VectorServer.client.save();
            VectorServer.client.quit();
        }
        catch (error) {
            this.logger.log('error', 'Redis connection error', { error });
        }
    }
}
exports.VectorServer = VectorServer;
