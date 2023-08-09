"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isContainer = exports.openAI = exports.googleOAuth = exports.foxyOfficeUrl = exports.foxyOfficeKey = exports.discourseSecret = exports.sessionSecret = exports.cronjobTimer = exports.totalLimit = exports.basicLimit = exports.paypalBase = exports.stripeSecret = exports.paypalAppSecret = exports.paypalClientId = exports.dropboxClientSecret = exports.dropboxClientId = exports.mailConfig = exports.authorized = exports.meteoblueKey = exports.frontend = exports.url = exports.port = exports.env = exports.vectorConfig = exports.knexConfig = exports.redisConfig = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_config_js_1 = require("./constants.config.js");
/**
 * @description Configure dotenv with variables.env file before app
 * @dependency dotenv
 * @see https://www.npmjs.com/package/dotenv
 */
class EnvironmentConfiguration {
    /**
     * @description Current environment (default dev)
     */
    static environment = constants_config_js_1.ENVIRONMENT.development;
    /**
     * @description Set environment according to current process args
     */
    static set() {
        if (process.argv[2] &&
            process.argv[2] === '--env' &&
            process.argv[3] &&
            // eslint-disable-next-line no-prototype-builtins
            constants_config_js_1.ENVIRONMENT.hasOwnProperty(process.argv[3])) {
            this.environment = constants_config_js_1.ENVIRONMENT[process.argv[3]];
        }
        else if (process.env.ENVIRONMENT &&
            // eslint-disable-next-line no-prototype-builtins
            constants_config_js_1.ENVIRONMENT.hasOwnProperty(process.env.ENVIRONMENT)) {
            this.environment = process.env.ENVIRONMENT;
        }
    }
    /**
     * @description Load .env file according to environment
     */
    static load() {
        this.set();
        // https://www.npmjs.com/package/dotenv
        const result = dotenv_1.default.config({
            path: path_1.default.join(__dirname, `../../env/${this.environment}.env`),
        });
        if (result.error) {
            throw result.error;
        }
    }
}
EnvironmentConfiguration.load();
const env = EnvironmentConfiguration.environment;
exports.env = env;
const port = parseInt(process.env.PORT);
exports.port = port;
const url = process.env.URL;
exports.url = url;
const frontend = process.env.FRONTEND;
exports.frontend = frontend;
const authorized = process.env.AUTHORIZED;
exports.authorized = authorized;
const isContainer = !!process.env.CONTAINER;
exports.isContainer = isContainer;
const sessionSecret = process.env.SESSION_SECRET;
exports.sessionSecret = sessionSecret;
const meteoblueKey = process.env.METEOBLUE_KEY;
exports.meteoblueKey = meteoblueKey;
const dropboxClientId = process.env.DROPBOX_CLIENT_ID;
exports.dropboxClientId = dropboxClientId;
const dropboxClientSecret = process.env.DROPBOX_CLIENT_SECRET;
exports.dropboxClientSecret = dropboxClientSecret;
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
exports.paypalClientId = paypalClientId;
const paypalAppSecret = process.env.PAYPAL_APP_SECRET;
exports.paypalAppSecret = paypalAppSecret;
const paypalBase = env === constants_config_js_1.ENVIRONMENT.production
    ? 'https://api-m.paypal.com'
    : 'https.//api-m.sandbox.paypal.com.js';
exports.paypalBase = paypalBase;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
exports.stripeSecret = stripeSecret;
const discourseSecret = process.env.DISCOURSE_SSO;
exports.discourseSecret = discourseSecret;
const foxyOfficeKey = process.env.FOXY_OFFICE_KEY;
exports.foxyOfficeKey = foxyOfficeKey;
const foxyOfficeUrl = process.env.FOXY_OFFICE_URL;
exports.foxyOfficeUrl = foxyOfficeUrl;
const googleOAuth = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
};
exports.googleOAuth = googleOAuth;
const basicLimit = {
    hive: parseInt(process.env.LIMIT_HIVE),
    apiary: parseInt(process.env.LIMIT_APIARY),
    scale: parseInt(process.env.LIMIT_SCALE),
};
exports.basicLimit = basicLimit;
const totalLimit = {
    hive: parseInt(process.env.TOTAL_LIMIT_HIVE),
    apiary: parseInt(process.env.TOTAL_LIMIT_APIARY),
    scale: parseInt(process.env.TOTAL_LIMIT_SCALE),
};
exports.totalLimit = totalLimit;
const cronjobTimer = process.env.CRONJOB
    ? process.env.CRONJOB
    : '0 11 ./1 * *.js';
exports.cronjobTimer = cronjobTimer;
const redisConfig = {
    host: process.env.REDIS_HOSTNAME,
    port: parseInt(process.env.REDIS_PORT),
    user: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD ?? '',
};
exports.redisConfig = redisConfig;
const vectorConfig = {
    host: process.env.VECTOR_HOSTNAME,
    port: parseInt(process.env.VECTOR_PORT),
    user: process.env.VECTOR_USERNAME,
    password: process.env.VECTOR_PASSWORD ?? '',
};
exports.vectorConfig = vectorConfig;
const knexConfig = {
    client: process.env.DB_TYPE,
    connection: {
        host: process.env.DB_HOSTNAME,
        database: process.env.DB_NAME,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT),
        charset: 'utf8mb4',
        timezone: 'UTC',
        typeCast(field, next) {
            // https://github.com/Vincit/objection.js/issues/174#issuecomment-424873063
            // Convert 1 to true, 0 to false, and leave null alone
            if (field.type === 'TINY' && field.length === 1) {
                const value = field.string();
                return value ? value === '1' : null;
            }
            return next();
        },
    },
    debug: env === constants_config_js_1.ENVIRONMENT.development ? true : false,
    pool: {
        min: parseInt(process.env.DB_POOL_MIN),
        max: parseInt(process.env.DB_POOL_MAX),
        afterCreate: function (conn, done) {
            // Extend max group concant mainly for calendar view if many ids are concated
            conn.query('SET SESSION group_concat_max_len = 100000;', function (err) {
                done(err, conn);
            });
        },
    },
    migrations: {
        directory: 'db/migrations',
        tableName: 'KnexMigrations',
    },
    seeds: {
        directory: 'db/seeds',
    },
};
exports.knexConfig = knexConfig;
const mailConfig = {
    host: process.env.MAIL_SMTP,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true' ? true : false,
    auth: {
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_PASSWORD,
    },
    dkim: {
        domainName: process.env.MAIL_DKIM_SELECTOR ? 'btree.at' : '',
        keySelector: process.env.MAIL_DKIM_SELECTOR,
        privateKey: process.env.MAIL_DKIM_PRIVATE === 'false'
            ? ''
            : Buffer.from(process.env.MAIL_DKIM_PRIVATE, 'base64').toString('ascii'),
    },
};
exports.mailConfig = mailConfig;
const openAI = {
    key: process.env.OPEN_AI_KEY ?? '',
    dailyUserTokenLimit: parseInt(process.env.OPEN_AI_DAILY_USER_TOKEN_LIMIT ?? '0'),
};
exports.openAI = openAI;
