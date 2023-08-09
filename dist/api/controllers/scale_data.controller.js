"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scale_data_model_js_1 = require("../models/scale_data.model.js");
const dayjs_1 = __importDefault(require("dayjs"));
const api_util_js_1 = require("../utils/api.util.js");
const premium_util_js_1 = require("../utils/premium.util.js");
const scale_model_js_1 = require("../models/scale.model.js");
const user_model_js_1 = require("../models/user.model.js");
const app_bootstrap_js_1 = require("../../app.bootstrap.js");
const http_errors_1 = __importDefault(require("http-errors"));
class ScaleDataController {
    static async api(req, reply) {
        const q = req.query;
        const params = req.params;
        const insertDate = q.datetime ? q.datetime : new Date();
        const company = await (0, api_util_js_1.getCompany)(params.api);
        const premium = await (0, premium_util_js_1.isPremium)(company.id);
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        const result = await scale_data_model_js_1.ScaleData.transaction(async (trx) => {
            const scale = await scale_model_js_1.Scale.query(trx)
                .select()
                .where({ name: params.ident, user_id: company.id })
                .throwIfNotFound()
                .first();
            const lastInsert = await scale_data_model_js_1.ScaleData.query(trx)
                .select()
                .where({ scale_id: scale.id })
                .orderBy('datetime', 'DESC')
                .first();
            if (lastInsert) {
                if (q.action === 'CREATE') {
                    if ((0, dayjs_1.default)(lastInsert.datetime) >
                        (0, dayjs_1.default)(insertDate).subtract(1, 'hour')) {
                        throw http_errors_1.default.TooManyRequests();
                    }
                }
                if (q.weight && lastInsert.weight && q.action === 'CREATE') {
                    try {
                        const currentWeight = parseFloat(q.weight);
                        const checkWeight = Math.abs(lastInsert.weight - currentWeight);
                        if (checkWeight > 5) {
                            const user = await user_model_js_1.User.query()
                                .leftJoinRelated('company_bee')
                                .where({
                                'company_bee.rank': 1,
                                'company_bee.user_id': company.id,
                            });
                            user.forEach((u) => {
                                app_bootstrap_js_1.MailServer.sendMail({
                                    to: u.email,
                                    lang: u.lang,
                                    subject: 'weight_warning',
                                    key: `${scale.name}: ${checkWeight} (${lastInsert.weight} - ${currentWeight})`,
                                    name: u.username,
                                });
                            });
                        }
                    }
                    catch (e) {
                        req.log.error(e);
                    }
                }
            }
            const insert = {
                datetime: insertDate,
                weight: q.weight ? q.weight : 0,
                temp1: q.temp1 ? q.temp1 : 0,
                temp2: q.temp2 ? q.temp2 : 0,
                rain: q.rain ? q.rain : 0,
                humidity: q.hum ? q.hum : 0,
                note: q.note ? q.note : '',
                scale_id: scale.id,
            };
            if (q.action === 'CREATE_DEMO')
                return insert;
            const query = await scale_data_model_js_1.ScaleData.query(trx).insert({ ...insert });
            return query;
        });
        return { ...result };
    }
    static async get(req, reply) {
        const { order, direction, offset, limit, q, filters } = req.query;
        const query = scale_data_model_js_1.ScaleData.query()
            .withGraphJoined('[scale.hive]')
            .where({
            'scale.user_id': req.session.user.user_id,
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('date' in v && typeof v['date'] === 'object') {
                            query.whereBetween('datetime', [v.date.from, v.date.to]);
                        }
                        else {
                            query.where(v);
                        }
                    });
                }
            }
            catch (e) {
                req.log.error(e);
            }
        }
        if (order) {
            if (Array.isArray(order)) {
                order.forEach((field, index) => query.orderBy(field, direction[index]));
            }
            else {
                query.orderBy(order, direction);
            }
        }
        if (q) {
            if (q.trim() !== '') {
                query.where((builder) => {
                    builder.orWhere('scale.name', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('id');
        return { ...result };
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await scale_data_model_js_1.ScaleData.transaction(async (trx) => {
            return await scale_data_model_js_1.ScaleData.query(trx)
                .withGraphJoined('scale')
                .patch({ ...insert })
                .findByIds(ids)
                .where('scale.user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const insert = req.body;
        const result = await scale_data_model_js_1.ScaleData.transaction(async (trx) => {
            return await scale_data_model_js_1.ScaleData.query(trx)
                .withGraphJoined('scale')
                .insertGraphAndFetch({
                ...insert,
            })
                .where('scale.user_id', req.session.user.user_id);
        });
        return { ...result };
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await scale_data_model_js_1.ScaleData.transaction(async (trx) => {
            const res = await scale_data_model_js_1.ScaleData.query(trx)
                .findByIds(body.ids)
                .withGraphJoined('scale')
                .where('scale.user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const result = await scale_data_model_js_1.ScaleData.transaction(async (trx) => {
            return await scale_data_model_js_1.ScaleData.query(trx)
                .delete()
                .withGraphJoined('scale')
                .where('scale.user_id', req.session.user.user_id)
                .findByIds(body.ids);
        });
        return result;
    }
}
exports.default = ScaleDataController;
