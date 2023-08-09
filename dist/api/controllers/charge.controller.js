"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_1 = require("lodash");
const charge_model_js_1 = require("../models/charge.model.js");
const charge_stock_model_js_1 = require("../models/charge_stock.model.js");
class ChargeController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q, filters, deleted } = req.query;
        const query = charge_model_js_1.Charge.query()
            .withGraphJoined('[type.stock, creator(identifier), editor(identifier)]')
            .where({
            'charges.user_id': req.session.user.user_id,
            'charges.deleted': deleted === 'true',
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('bestbefore' in v && typeof v['bestbefore'] === 'object') {
                            query.whereBetween('bestbefore', [
                                v.bestbefore.from,
                                v.bestbefore.to,
                            ]);
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
                    builder
                        .orWhere('type.name', 'like', `%${q}%`)
                        .orWhere('charges.name', 'like', `%${q}%`)
                        .orWhere('charges.charge', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('id');
        return { ...result };
    }
    static async getStock(req, reply) {
        const { order, direction, offset, limit, q } = req.query;
        const query = charge_stock_model_js_1.ChargeStock.query()
            .select('type.id', 'sum', 'type.name', 'type.unit', 'sum_in', 'sum_out')
            .leftJoinRelated('type')
            .where({
            'charge_stocks.user_id': req.session.user.user_id,
            'type.modus': true,
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
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
                    builder.orWhere('type.name', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('type_id');
        return { ...result };
    }
    static async post(req, reply) {
        const body = req.body;
        const insert = {
            date: body.date,
            bestbefore: body.bestbefore,
            name: body.name,
            charge: body.charge,
            price: body.price,
            amount: body.amount,
            url: body.url,
            kind: body.kind,
            type_id: body.type_id,
            note: body.note,
        };
        const result = await charge_model_js_1.Charge.transaction(async (trx) => {
            const result = [];
            const res = await charge_model_js_1.Charge.query(trx).insert({
                ...insert,
                user_id: req.session.user.user_id,
                bee_id: req.session.user.bee_id,
            });
            result.push(res.id);
            return result;
        });
        return result;
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await charge_model_js_1.Charge.transaction(async (trx) => {
            return await charge_model_js_1.Charge.query(trx)
                .patch({ ...insert, edit_id: req.session.user.bee_id })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await charge_model_js_1.Charge.transaction(async (trx) => {
            const res = await charge_model_js_1.Charge.query(trx)
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const query = req.query;
        const body = req.body;
        const hardDelete = query.hard ? true : false;
        const restoreDelete = query.restore ? true : false;
        const result = await charge_model_js_1.Charge.transaction(async (trx) => {
            const res = await charge_model_js_1.Charge.query()
                .where('user_id', req.session.user.user_id)
                .whereIn('id', body.ids);
            const softIds = [];
            const hardIds = [];
            (0, lodash_1.map)(res, (obj) => {
                if ((obj.deleted || hardDelete) && !restoreDelete)
                    hardIds.push(obj.id);
                else
                    softIds.push(obj.id);
            });
            if (hardIds.length > 0) {
                await charge_model_js_1.Charge.query(trx).delete().whereIn('id', hardIds);
            }
            if (softIds.length > 0)
                await charge_model_js_1.Charge.query(trx)
                    .patch({
                    deleted: restoreDelete ? false : true,
                    deleted_at: (0, dayjs_1.default)()
                        .utc()
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' '),
                    edit_id: req.session.user.bee_id,
                })
                    .findByIds(softIds);
            return res;
        });
        return result;
    }
}
exports.default = ChargeController;
