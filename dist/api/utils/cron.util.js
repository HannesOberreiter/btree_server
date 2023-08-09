"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderDeletion = exports.reminderPremium = exports.reminderVIS = exports.cleanupDatabase = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const apiary_model_js_1 = require("../models/apiary.model.js");
const company_model_js_1 = require("../models/company.model.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const hive_model_js_1 = require("../models/hive.model.js");
const movedate_model_js_1 = require("../models/movedate.model.js");
const user_model_js_1 = require("../models/user.model.js");
const error_util_js_1 = require("./error.util.js");
const dropbox_model_js_1 = require("../models/dropbox.model.js");
const charge_type_model_js_1 = require("../models/option/charge_type.model.js");
const checkup_type_model_js_1 = require("../models/option/checkup_type.model.js");
const feed_type_model_js_1 = require("../models/option/feed_type.model.js");
const harvest_type_model_js_1 = require("../models/option/harvest_type.model.js");
const hive_source_model_js_1 = require("../models/option/hive_source.model.js");
const hive_type_mode_js_1 = require("../models/option/hive_type.mode.js");
const login_attempt_model_js_1 = require("../models/login_attempt.model.js");
const queen_mating_model_js_1 = require("../models/option/queen_mating.model.js");
const queen_race_model_js_1 = require("../models/option/queen_race.model.js");
const rearing_detail_model_js_1 = require("../models/rearing/rearing_detail.model.js");
const rearing_type_model_js_1 = require("../models/rearing/rearing_type.model.js");
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
const refresh_token_model_js_1 = require("../models/refresh_token.model.js");
const scale_model_js_1 = require("../models/scale.model.js");
const scale_data_model_js_1 = require("../models/scale_data.model.js");
const treatment_disease_model_js_1 = require("../models/option/treatment_disease.model.js");
const treatment_type_model_js_1 = require("../models/option/treatment_type.model.js");
const treatment_vet_model_js_1 = require("../models/option/treatment_vet.model.js");
const feed_model_js_1 = require("../models/feed.model.js");
const treatment_model_js_1 = require("../models/treatment.model.js");
const checkup_model_js_1 = require("../models/checkup.model.js");
const harvest_model_js_1 = require("../models/harvest.model.js");
const queen_model_js_1 = require("../models/queen.model.js");
const objection_1 = require("objection");
const environment_config_js_1 = require("../../config/environment.config.js");
const app_bootstrap_js_1 = require("../../app.bootstrap.js");
const constants_config_js_1 = require("../../config/constants.config.js");
const cleanupDatabase = async () => {
    try {
        const cleanup = { type: 'cleanup' };
        // Delete data which is marked as "deleted" and older than one month
        const lastMonth = (0, dayjs_1.default)().subtract(1, 'month').toISOString();
        // Delete user if they did not login in the past 5 years and are the only users in a company
        const timeToBeForgotten = (0, dayjs_1.default)().subtract(5, 'year').toISOString();
        return await company_model_js_1.Company.transaction(async (trx) => {
            cleanup['CompanyBee'] = await company_bee_model_js_1.CompanyBee.query(trx)
                .delete()
                .leftJoinRelated('company')
                .leftJoinRelated('user')
                .whereNull('company.id')
                .orWhereNull('user.id');
            cleanup['Company'] = await company_model_js_1.Company.query(trx)
                .delete()
                .leftJoinRelated('user')
                .whereNull('user.id');
            cleanup['User'] = await user_model_js_1.User.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            const forgottenIds = await company_bee_model_js_1.CompanyBee.query(trx)
                .distinct('bee_id')
                .leftJoinRelated('user')
                .where('user.last_visit', '<=', timeToBeForgotten)
                .groupBy('company_bee.user_id')
                .having((0, objection_1.raw)('COUNT(bee_id)'), '=', 1);
            cleanup['Forgotten'] = forgottenIds.length;
            forgottenIds.forEach(async (v) => {
                await user_model_js_1.User.query(trx).delete().findById(v.bee_id);
            });
            cleanup['LoginAttemp'] = await login_attempt_model_js_1.LoginAttemp.query(trx)
                .delete()
                .andWhere('time', '<=', lastMonth);
            cleanup['Apiary'] = await apiary_model_js_1.Apiary.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id')
                .orWhere('deleted', true)
                .andWhere('deleted_at', '<=', lastMonth);
            cleanup['Hive'] = await hive_model_js_1.Hive.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id')
                .orWhere('deleted', true)
                .andWhere('deleted_at', '<=', lastMonth);
            cleanup['Movedate'] = await movedate_model_js_1.Movedate.query(trx)
                .delete()
                .leftJoinRelated('hive')
                .leftJoinRelated('apiary')
                .whereNull('hive.id')
                .orWhereNull('apiary.id');
            cleanup['Dropbox'] = await dropbox_model_js_1.Dropbox.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['charge_types'] = await charge_type_model_js_1.ChargeType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['checkup_types'] = await checkup_type_model_js_1.CheckupType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['feed_types'] = await feed_type_model_js_1.FeedType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['harvest_types'] = await harvest_type_model_js_1.HarvestType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['hive_sources'] = await hive_source_model_js_1.HiveSource.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['hive_types'] = await hive_type_mode_js_1.HiveType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['hive_types'] = await hive_type_mode_js_1.HiveType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['queen_matings'] = await queen_mating_model_js_1.QueenMating.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['queen_races'] = await queen_race_model_js_1.QueenRace.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['rearing_details'] = await rearing_detail_model_js_1.RearingDetail.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['rearing_types'] = await rearing_type_model_js_1.RearingType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['rearings'] = await rearing_model_js_1.Rearing.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['rearing_steps'] = await rearing_step_model_js_1.RearingStep.query(trx)
                .delete()
                .leftJoinRelated('type')
                .leftJoinRelated('detail')
                .whereNull('type.id')
                .orWhereNull('detail.id');
            cleanup['refresh_tokens'] = await refresh_token_model_js_1.RefreshToken.query(trx)
                .delete()
                .leftJoinRelated('company_bee')
                .whereNull('company_bee.id');
            cleanup['scales'] = await scale_model_js_1.Scale.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['scale_data'] = await scale_data_model_js_1.ScaleData.query(trx)
                .delete()
                .leftJoinRelated('scale')
                .whereNull('scale.id');
            cleanup['treatment_diseases'] = await treatment_disease_model_js_1.TreatmentDisease.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['treatment_types'] = await treatment_type_model_js_1.TreatmentType.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['treatment_vets'] = await treatment_vet_model_js_1.TreatmentVet.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id');
            cleanup['Feed'] = await feed_model_js_1.Feed.query(trx)
                .delete()
                .leftJoinRelated('hive')
                .whereNull('hive.id')
                .orWhere('feeds.deleted', true)
                .andWhere('feeds.deleted_at', '<=', lastMonth);
            cleanup['Treatment'] = await treatment_model_js_1.Treatment.query(trx)
                .delete()
                .leftJoinRelated('hive')
                .whereNull('hive.id')
                .orWhere('treatments.deleted', true)
                .andWhere('treatments.deleted_at', '<=', lastMonth);
            cleanup['Checkup'] = await checkup_model_js_1.Checkup.query(trx)
                .delete()
                .leftJoinRelated('hive')
                .whereNull('hive.id')
                .orWhere('checkups.deleted', true)
                .andWhere('checkups.deleted_at', '<=', lastMonth);
            cleanup['Harvest'] = await harvest_model_js_1.Harvest.query(trx)
                .delete()
                .leftJoinRelated('hive')
                .whereNull('hive.id')
                .orWhere('harvests.deleted', true)
                .andWhere('harvests.deleted_at', '<=', lastMonth);
            cleanup['Queen'] = await queen_model_js_1.Queen.query(trx)
                .delete()
                .leftJoinRelated('company')
                .whereNull('company.id')
                .orWhere('deleted', true)
                .andWhere('deleted_at', '<=', lastMonth);
            return cleanup;
        });
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.cleanupDatabase = cleanupDatabase;
/**
 * Send reminder five days before VIS action is required
 * @returns Count of mails send as object {type: 'vis_reminder', mails: count}
 */
const reminderVIS = async () => {
    try {
        const result = { type: 'vis_reminder', mails: 0 };
        const checkDate = (0, dayjs_1.default)().add(5, 'day');
        const lastDate = (0, dayjs_1.default)().subtract(1, 'day').toDate();
        const nowDate = new Date();
        const year = (0, dayjs_1.default)().year();
        // Stichtag Zählung
        const countDay1 = year + '-10-31';
        const countDay2 = year + '-04-30';
        // VIS Eingabe
        const reportDay1 = year + '-12-31';
        const reportDay2 = year + '-06-30';
        let mailDate, mailSubject;
        if ((0, dayjs_1.default)(countDay1).isSame(checkDate, 'day')) {
            mailDate = countDay1;
            mailSubject = 'vis_count';
        }
        else if ((0, dayjs_1.default)(countDay2).isSame(checkDate, 'day')) {
            mailDate = countDay2;
            mailSubject = 'vis_count';
        }
        else if ((0, dayjs_1.default)(reportDay1).isSame(checkDate, 'day')) {
            mailDate = reportDay1;
            mailSubject = 'vis_submit';
        }
        else if ((0, dayjs_1.default)(reportDay2).isSame(checkDate, 'day')) {
            mailDate = reportDay2;
            mailSubject = 'vis_submit';
        }
        if (mailDate && mailSubject) {
            const users = await user_model_js_1.User.query()
                .select('username', 'email', 'id')
                .where({
                lang: 'de',
                acdate: true,
            })
                .where((builder) => builder
                .where('reminder_vis', '<', lastDate)
                .orWhereNull('reminder_vis'));
            result.mails = users.length;
            // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
            if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.staging) {
                for (const i in users) {
                    const user = users[i];
                    await app_bootstrap_js_1.MailServer.sendMail({
                        to: user.email,
                        lang: 'de',
                        subject: mailSubject,
                        name: user.username,
                        key: mailDate,
                    });
                    await user_model_js_1.User.query().findById(user.id).patch({
                        reminder_vis: nowDate,
                    });
                }
            }
        }
        return result;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.reminderVIS = reminderVIS;
/**
 * Send reminder five days before premium membership runs out
 * @returns Count of mails send as object {type: 'premium_reminder', mails: count}
 */
const reminderPremium = async () => {
    try {
        const result = { type: 'premium_reminder', mails: 0 };
        const startDate = (0, dayjs_1.default)().format('YYYY-MM-DD');
        const endDate = (0, dayjs_1.default)().add(1, 'day').format('YYYY-MM-DD');
        const lastDate = (0, dayjs_1.default)().subtract(7, 'day').format('YYYY-MM-DD');
        const nowDate = new Date();
        const companies = await company_model_js_1.Company.query()
            .select('user_id', 'companies.name', 'paid')
            .withGraphJoined('user')
            .where('paid', '>=', startDate)
            .where('paid', '<', endDate)
            .where((builder) => builder
            .where('reminder_premium', '<', lastDate)
            .orWhereNull('reminder_premium'))
            .where('user_join.rank', 1)
            .where('newsletter', true);
        // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
        if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.staging) {
            companies.forEach(async (company) => {
                company.user.forEach(async (u) => {
                    await app_bootstrap_js_1.MailServer.sendMail({
                        to: u.email,
                        lang: u.lang,
                        subject: 'premium_reminder',
                        name: u.username,
                    });
                    await user_model_js_1.User.query().findById(u.id).patch({
                        reminder_premium: nowDate,
                    });
                });
            });
        }
        result.mails = companies.length;
        return result;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.reminderPremium = reminderPremium;
/**
 * Send reminder six days before user account gets deleted (right to be forgotten)
 * if user logs into the app in the next six days the account will not be deleted
 * @returns Count of mails send as object {type: 'deletion_reminder', mails: count}
 */
const reminderDeletion = async () => {
    try {
        const result = { type: 'deletion_reminder', mails: 0 };
        const timeToBeForgotten = (0, dayjs_1.default)()
            .subtract(5, 'year')
            .subtract(6, 'day')
            .toISOString();
        const lastDate = (0, dayjs_1.default)().subtract(7, 'day').format('YYYY-MM-DD');
        const nowDate = new Date();
        const forgottenIds = await company_bee_model_js_1.CompanyBee.query()
            .select('username', 'email', 'lang', 'user.id', 'last_visit')
            .distinct('bee_id')
            .leftJoinRelated('user')
            .where('user.last_visit', '<=', timeToBeForgotten)
            .where((builder) => builder
            .where('reminder_deletion', '<', lastDate)
            .orWhereNull('reminder_deletion'))
            .where('newsletter', true)
            .groupBy('company_bee.user_id')
            .having((0, objection_1.raw)('COUNT(bee_id)'), '=', 1);
        // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
        if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.staging) {
            forgottenIds.forEach(async (u) => {
                await app_bootstrap_js_1.MailServer.sendMail({
                    to: u['email'],
                    lang: u['lang'],
                    subject: 'deletion_reminder',
                    name: u['username'],
                });
                await user_model_js_1.User.query().findById(u.id).patch({
                    reminder_deletion: nowDate,
                });
            });
        }
        result.mails = forgottenIds.length;
        return result;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.reminderDeletion = reminderDeletion;
