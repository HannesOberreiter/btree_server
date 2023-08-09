"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const connect_redis_1 = __importDefault(require("connect-redis"));
const node_crypto_1 = require("node:crypto");
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const zod_1 = require("zod");
const redis_server_js_1 = require("../servers/redis.server.js");
const environment_config_js_1 = require("../config/environment.config.js");
const logger_service_js_1 = require("../services/logger.service.js");
const constants_config_js_1 = require("./constants.config.js");
const index_js_1 = __importDefault(require("../api/routes/index.js"));
const error_util_js_1 = require("../api/utils/error.util.js");
const fastify_1 = __importDefault(require("fastify"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const session_1 = __importDefault(require("@fastify/session"));
const compress_1 = __importDefault(require("@fastify/compress"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
/**
 * @description Instantiate server application.
 */
class Application {
    app;
    redisStore;
    logger;
    constructor() {
        this.init();
        this.createSessionStore();
        this.plug();
    }
    init() {
        this.logger = logger_service_js_1.Logger.getInstance();
        this.app = (0, fastify_1.default)({
            logger: this.logger.pino,
            disableRequestLogging: false,
            trustProxy: true,
            bodyLimit: 1048576 * 50,
            maxParamLength: 10000,
            ajv: {
                customOptions: {
                    removeAdditional: false, // Refer to [ajv options](https://ajv.js.org/options.html#removeadditional)
                },
            },
        });
    }
    createSessionStore() {
        const redis = redis_server_js_1.RedisServer.client;
        this.redisStore = new connect_redis_1.default({
            client: redis,
            prefix: 'btree_sess:',
        });
    }
    plug() {
        /**
         * @description GZIP compression
         * @see https://www.npmjs.com/package/@fastify/compress
         */
        this.app.register(compress_1.default);
        /**
         * @description Important security headers for Fastify. It is a tiny wrapper around helmet.
         * @see https://github.com/fastify/fastify-helmet
         */
        this.app.register(helmet_1.default, {
            hidePoweredBy: true,
            noSniff: true,
            referrerPolicy: { policy: 'no-referrer' },
        });
        /**
         * @description Enable CORS - Cross Origin Resource Sharing
         */
        this.app.addHook('onRequest', (req, reply, done) => {
            // Set undefined CORS header
            // https://github.com/expressjs/cors/issues/262
            if (!req.headers.origin) {
                if (req.headers.referer) {
                    const url = new URL(req.headers.referer);
                    req.headers.origin = url.origin;
                }
                else if (req.headers.host) {
                    req.headers.origin = req.headers.host;
                }
            }
            const origin = req.headers.origin;
            if (req.url.indexOf('external') >= 0 ||
                req.url.indexOf('auth/google/callback') >= 0 ||
                environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.development ||
                environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.ci) {
                reply.header('Access-Control-Allow-Origin', '*');
            }
            else {
                reply.header('Access-Control-Allow-Origin', origin);
                reply.header('Access-Control-Allow-Credentials', 'true');
            }
            if (environment_config_js_1.authorized.indexOf(origin) === -1) {
                reply.status(406).send();
            }
            reply.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
            reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
            if (req.method.toLowerCase() === 'options') {
                reply.send();
            }
            done();
        });
        this.app.register(cookie_1.default);
        this.app.register(session_1.default, {
            idGenerator: function (req) {
                let id = (0, node_crypto_1.randomUUID)();
                if ('bee_id' in req) {
                    id = `${req.bee_id}:${id}`;
                }
                return id;
            },
            cookieName: environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.staging
                ? '_auth-btree-session-staging'
                : '_auth-btree-session',
            cookiePrefix: 's:',
            secret: environment_config_js_1.sessionSecret,
            saveUninitialized: false,
            rolling: false,
            store: this.redisStore,
            cookie: {
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 30,
                secure: environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.production,
                domain: environment_config_js_1.env === constants_config_js_1.ENVIRONMENT.production ? 'btree.at' : '',
                path: '/',
            },
        });
        /**
         * @description Configure API Rate limit
         * @see https://github.com/fastify/fastify-rate-limit
         */
        this.app.register(rate_limit_1.default, {
            timeWindow: 1000 * 60,
            max: 1000,
        });
        /**
         * @description Global validator and serializer compiler using Zod
         */
        this.app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
        this.app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
        /**
         * @description Global logger
         */
        this.app.setErrorHandler(function (error, request, reply) {
            if (error instanceof zod_1.ZodError) {
                request.log.error({
                    user: request?.session?.user,
                    req: request,
                    error: error.issues,
                    path: request.url,
                }, 'Zod validation error');
                reply.status(400).send({
                    statusCode: 400,
                    error: 'Bad Request',
                    issues: error.issues,
                });
                return;
            }
            let e = (0, error_util_js_1.checkMySQLError)(error);
            this.log.error({
                user: request?.session?.user,
                req: request,
                error: e.cause ? e.cause : e,
                path: request.url,
            }, e.message ? e.message : 'Unhandled error');
            if (e.statusCode) {
                reply.status(e.statusCode).send({
                    statusCode: e.statusCode,
                    error: e.message,
                });
                return;
            }
            throw e;
        });
        this.app.register(index_js_1.default, {
            prefix: '/api/',
        });
        this.app.ready();
    }
}
exports.Application = Application;
