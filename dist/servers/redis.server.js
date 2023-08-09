"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisServer = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_config_js_1 = require("../config/environment.config.js");
const logger_service_js_1 = require("../services/logger.service.js");
const constants_config_js_1 = require("../config/constants.config.js");
/**
 * @description Connection to redis docker instance
 */
class RedisServer {
    logger = logger_service_js_1.Logger.getInstance();
    static client;
    start() {
        try {
            const config = {
                connectionName: 'btreeSession',
                enableOfflineQueue: false,
            };
            if (environment_config_js_1.redisConfig.password) {
                config['username'] = environment_config_js_1.redisConfig.user;
                config['password'] = environment_config_js_1.redisConfig.password;
            }
            RedisServer.client = new ioredis_1.default(environment_config_js_1.redisConfig.port, environment_config_js_1.redisConfig.host, config);
            RedisServer.client.on('connect', () => {
                if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.test) {
                    this.logger.log('debug', `Connection to redis (session) server established on port ${environment_config_js_1.redisConfig.port} (${environment_config_js_1.env})`, { label: 'Redis' });
                }
            });
        }
        catch (error) {
            this.logger.log('error', `Redis connection error : ${error.message}`, {
                label: 'Redis',
            });
        }
    }
    stop() {
        try {
            RedisServer.client.save();
            RedisServer.client.quit();
        }
        catch (error) {
            this.logger.log('error', 'Redis connection error', { error });
        }
    }
}
exports.RedisServer = RedisServer;
