"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseServer = void 0;
const knex_1 = __importDefault(require("knex"));
const objection_1 = require("objection");
const environment_config_js_1 = require("../config/environment.config.js");
const logger_service_js_1 = require("../services/logger.service.js");
const constants_config_js_1 = require("../config/constants.config.js");
/**
 * @description Database connection manager for MariaDb server
 */
class DatabaseServer {
    static instance;
    knex;
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
    constructor() {
        this.knex = (0, knex_1.default)(environment_config_js_1.knexConfig);
    }
    logger = logger_service_js_1.Logger.getInstance();
    start() {
        try {
            objection_1.Model.knex(this.knex);
            if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.test) {
                this.logger.log('debug', `Connection to database established on port ${environment_config_js_1.knexConfig.connection.port} (${environment_config_js_1.env})`, { label: 'Database' });
            }
        }
        catch (error) {
            this.logger.log('error', `Database connection error : ${error.message}`, {
                label: 'Database',
            });
        }
    }
    stop() {
        try {
            this.knex.destroy();
        }
        catch (error) {
            this.logger.log('error', 'Database connection error', { error });
        }
    }
}
exports.DatabaseServer = DatabaseServer;
