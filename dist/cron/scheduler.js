"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.task = void 0;
const node_schedule_1 = __importDefault(require("node-schedule"));
const cron_util_js_1 = require("../api/utils/cron.util.js");
const environment_config_js_1 = require("../config/environment.config.js");
const logger_service_js_1 = require("../services/logger.service.js");
let job;
const logger = logger_service_js_1.Logger.getInstance();
function Logging(input) {
    logger.log('debug', JSON.stringify(input), {
        label: 'CronJob',
    });
}
const task = {
    start: async () => {
        const rule = environment_config_js_1.cronjobTimer;
        logger.log('debug', `Test Cron-Job is starting with rule: ${rule}`, {
            label: 'Server',
        });
        job = node_schedule_1.default.scheduleJob({
            // https://crontab.guru/
            rule: rule,
            tz: 'Europe/Vienna',
        }, async function () {
            try {
                logger.log('debug', 'Test Cron-Job', {
                    label: 'CronJob',
                });
                Logging(await (0, cron_util_js_1.cleanupDatabase)());
                Logging(await (0, cron_util_js_1.reminderDeletion)());
                Logging(await (0, cron_util_js_1.reminderVIS)());
                Logging(await (0, cron_util_js_1.reminderPremium)());
            }
            catch (e) {
                logger.log('error', e, { label: 'CronJob' });
            }
        });
    },
    nextRun: () => logger.log('debug', `Next CronJob at: ${job.nextInvocation()}`, {
        label: 'CronJob',
    }),
    stop: () => node_schedule_1.default.gracefulShutdown(),
};
exports.task = task;
