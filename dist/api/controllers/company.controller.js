"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const crypto_1 = require("crypto");
const archiver_1 = __importDefault(require("archiver"));
const sync_1 = require("csv-stringify/sync");
const company_model_js_1 = require("../models/company.model.js");
const login_util_js_1 = require("../utils/login.util.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const autofill_util_js_1 = require("../utils/autofill.util.js");
const user_model_js_1 = require("../models/user.model.js");
const user_controller_js_1 = __importDefault(require("../controllers/user.controller.js"));
const delete_util_js_1 = require("../utils/delete.util.js");
const premium_util_js_1 = require("../utils/premium.util.js");
const apiary_model_js_1 = require("../models/apiary.model.js");
const hive_model_js_1 = require("../models/hive.model.js");
const movedate_model_js_1 = require("../models/movedate.model.js");
const checkup_model_js_1 = require("../models/checkup.model.js");
const feed_model_js_1 = require("../models/feed.model.js");
const treatment_model_js_1 = require("../models/treatment.model.js");
const harvest_model_js_1 = require("../models/harvest.model.js");
const scale_model_js_1 = require("../models/scale.model.js");
const scale_data_model_js_1 = require("../models/scale_data.model.js");
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
const rearing_type_model_js_1 = require("../models/rearing/rearing_type.model.js");
const promos_model_js_1 = require("../models/promos.model.js");
const counts_model_js_1 = require("../models/counts.model.js");
class CompanyController {
    static async postCoupon(req, reply) {
        const body = req.body;
        const promo = await promos_model_js_1.Promo.query()
            .select()
            .where({ code: body.coupon, used: false })
            .throwIfNotFound()
            .first();
        const paid = await (0, premium_util_js_1.addPremium)(req.session.user.user_id, promo.months, 0, 'promo');
        await promos_model_js_1.Promo.query()
            .patch({
            used: true,
            date: new Date(),
            user_id: req.session.user.user_id,
        })
            .findById(promo.id);
        return { paid: paid };
    }
    static async download(req, reply) {
        const stringifyOptions = {
            header: true,
            cast: {
                date: function (value) {
                    return value.toISOString();
                },
            },
        };
        const arch = (0, archiver_1.default)('zip');
        await user_model_js_1.User.transaction(async (trx) => {
            const company = await company_model_js_1.Company.query(trx).findById(req.session.user.user_id);
            arch.append((0, sync_1.stringify)([company], stringifyOptions), {
                name: 'company.csv',
            });
            const apiaries = await apiary_model_js_1.Apiary.query(trx).where('user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(apiaries, stringifyOptions), {
                name: 'apiaries.csv',
            });
            const hives = await hive_model_js_1.Hive.query(trx).where('user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(hives, stringifyOptions), { name: 'hives.csv' });
            const movedates = await movedate_model_js_1.Movedate.query(trx)
                .withGraphJoined('apiary')
                .where('user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(movedates, stringifyOptions), {
                name: 'movedates.csv',
            });
            const checkups = await checkup_model_js_1.Checkup.query(trx)
                .withGraphJoined('type')
                .where('checkups.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(checkups, stringifyOptions), {
                name: 'checkups.csv',
            });
            const feeds = await feed_model_js_1.Feed.query(trx)
                .withGraphJoined('type')
                .where('feeds.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(feeds, stringifyOptions), { name: 'feeds.csv' });
            const treatments = await treatment_model_js_1.Treatment.query(trx)
                .withGraphJoined('[type, disease, vet]')
                .where('treatments.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(treatments, stringifyOptions), {
                name: 'treatments.csv',
            });
            const harvests = await harvest_model_js_1.Harvest.query(trx)
                .withGraphJoined('type')
                .where('harvests.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(harvests, stringifyOptions), {
                name: 'harvests.csv',
            });
            const scales = await scale_model_js_1.Scale.query(trx).where('user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(scales, stringifyOptions), {
                name: 'scales.csv',
            });
            const scale_data = await scale_data_model_js_1.ScaleData.query(trx)
                .withGraphJoined('scale')
                .where('scale.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(scale_data, stringifyOptions), {
                name: 'scale_data.csv',
            });
            const rearings = await rearing_model_js_1.Rearing.query(trx).where('user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(rearings, stringifyOptions), {
                name: 'rearings.csv',
            });
            const rearing_types = await rearing_type_model_js_1.RearingType.query(trx)
                .withGraphJoined('[detail, step]')
                .where('rearing_types.user_id', req.session.user.user_id);
            arch.append((0, sync_1.stringify)(rearing_types, stringifyOptions), {
                name: 'rearing_types.csv',
            });
        });
        // reply.header('Content-Type', 'application/zip');
        reply.header('Content-Type', 'application/octet-stream');
        reply.header('Content-Disposition', 'attachment; filename="btree_data.zip"');
        arch.on('error', (err) => {
            throw err;
        });
        arch.pipe(reply.raw);
        arch.on('end', () => reply.raw.end()); // end response when archive stream ends
        return arch.finalize();
    }
    static async getApikey(req, reply) {
        const premium = await (0, premium_util_js_1.isPremium)(req.session.user.user_id);
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        const result = await company_model_js_1.Company.query()
            .select('api_key')
            .findById(req.session.user.user_id);
        return { ...result };
    }
    static async getCounts(req, reply) {
        const result = await counts_model_js_1.Counts.query().where('user_id', req.session.user.user_id);
        return result;
    }
    static async delete(req, reply) {
        const params = req.params;
        const otherUser = await company_model_js_1.Company.query()
            .select('user.id')
            .withGraphJoined('user')
            .whereNot({
            'user.id': req.session.user.bee_id,
        })
            .where({
            'companies.id': params.id,
        });
        if (otherUser.length > 0) {
            reply.send(http_errors_1.default.Forbidden('Other user(s) found, please remove them first.'));
            return;
        }
        const otherCompanies = await company_model_js_1.Company.query()
            .select('companies.id as id')
            .withGraphJoined('user')
            .where({
            'user.id': req.session.user.bee_id,
        })
            .whereNot({
            'companies.id': params.id,
        });
        if (otherCompanies.length === 0) {
            reply.send(http_errors_1.default.Forbidden('This is your last company, you cannot delete it.'));
            return;
        }
        req.body['saved_company'] = otherCompanies[0].id;
        await (0, delete_util_js_1.deleteCompany)(parseInt(params.id));
        return await user_controller_js_1.default.changeCompany(req, reply);
    }
    static async post(req, reply) {
        const body = req.body;
        const result = await company_model_js_1.Company.transaction(async (trx) => {
            const check = await company_model_js_1.Company.query(trx)
                .select('companies.id')
                .withGraphJoined('user')
                .where({
                name: body.name,
                'user.id': req.session.user.bee_id,
            });
            if (check.length > 0) {
                throw http_errors_1.default.Conflict('Company name already exists');
            }
            const c = await company_model_js_1.Company.query(trx).insert({ name: body.name });
            const u = await user_model_js_1.User.query(trx)
                .select('lang')
                .findById(req.session.user.bee_id);
            await company_bee_model_js_1.CompanyBee.query(trx).insert({
                bee_id: req.session.user.bee_id,
                user_id: c.id,
            });
            await (0, autofill_util_js_1.autoFill)(trx, c.id, u.lang);
            return c;
        });
        return { ...result };
    }
    static async patch(req, reply) {
        const body = req.body;
        if ('password' in body) {
            await (0, login_util_js_1.reviewPassword)(req.session.user.bee_id, body.password);
            delete body.password;
        }
        const result = await company_model_js_1.Company.transaction(async (trx) => {
            const company = await company_model_js_1.Company.query(trx).findById(req.session.user.user_id);
            let api_change = false;
            if ('api_change' in body) {
                const premium = await (0, premium_util_js_1.isPremium)(req.session.user.user_id);
                if (!premium) {
                    throw http_errors_1.default.PaymentRequired();
                }
                api_change = body.api_change ? true : false;
                delete body.api_change;
            }
            const res = await company.$query().patchAndFetch({ ...body });
            if (api_change ||
                (res.api_active && (res.api_key === '' || res.api_key === null))) {
                const apiKey = await (0, crypto_1.randomBytes)(25).toString('hex');
                await company.$query().patch({
                    api_key: apiKey,
                });
            }
            delete res.api_key;
            return res;
        });
        return { ...result };
    }
}
exports.default = CompanyController;
