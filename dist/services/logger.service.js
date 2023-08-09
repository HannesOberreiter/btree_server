"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const pino_1 = require("pino");
const rfs = __importStar(require("rotating-file-stream"));
const path_1 = __importDefault(require("path"));
const pino_pretty_1 = __importDefault(require("pino-pretty"));
const constants_config_js_1 = require("../config/constants.config.js");
const environment_config_js_1 = require("../config/environment.config.js");
class Logger {
    static instance;
    pino;
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
    constructor() {
        let streams = [
            {
                level: 'info',
                stream: rfs.createStream(`pino-info-${environment_config_js_1.env}.log`, {
                    interval: '7d',
                    maxFiles: 10,
                    path: path_1.default.join(__dirname, `../../../logs`),
                }),
            },
            {
                level: 'debug',
                stream: rfs.createStream(`pino-debug-${environment_config_js_1.env}.log`, {
                    interval: '7d',
                    maxFiles: 10,
                    path: path_1.default.join(__dirname, `../../../logs`),
                }),
            },
            {
                level: 'error',
                stream: rfs.createStream(`pino-error-${environment_config_js_1.env}.log`, {
                    interval: '7d',
                    maxFiles: 10,
                    path: path_1.default.join(__dirname, `../../../logs`),
                }),
            },
        ];
        if (environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.development) {
            streams.push({
                stream: (0, pino_pretty_1.default)({
                    colorize: true,
                }),
            });
        }
        this.pino = (0, pino_1.pino)({
            level: environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.production ? 'info' : 'debug',
            base: undefined,
            timestamp: () => {
                return `,"time":"${new Date().toISOString()}"`;
            },
            formatters: {
                level: (label) => {
                    return { level: label.toUpperCase() };
                },
            },
            redact: ['req.headers.authorization'],
            serializers: {
                req(request) {
                    return {
                        method: request.method,
                        url: request.url,
                    };
                },
            },
        }, pino_1.pino.multistream(streams, {
            dedupe: true,
        }));
    }
    /**
     * @description Do log action
     * @param {string} level
     * @param {string} message
     * @param {object} scope
     */
    log(level, message, scope) {
        try {
            this.pino[level](scope, message);
        }
        catch (e) {
            throw new Error('Error in logger service');
        }
    }
}
exports.Logger = Logger;
