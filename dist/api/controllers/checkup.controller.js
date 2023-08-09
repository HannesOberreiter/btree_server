"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_1 = require("lodash");
const checkup_model_js_1 = require("../models/checkup.model.js");
const hive_model_js_1 = require("../models/hive.model.js");
class CheckupController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q, filters, deleted, done } = req.query;
        const query = checkup_model_js_1.Checkup.query()
            .withGraphJoined('[checkup_apiary, type, hive, creator(identifier), editor(identifier)]')
            .where({
            'hive.deleted': false,
            'checkups.user_id': req.session.user.user_id,
            'checkups.deleted': deleted === 'true',
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (done) {
            query.where('checkups.done', done === 'true');
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('date' in v && typeof v['date'] === 'object') {
                            query.whereBetween('date', [v.date.from, v.date.to]);
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
                    builder.orWhere('hive.name', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy(['hive_id', 'id']);
        return { ...result };
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            return await checkup_model_js_1.Checkup.query(trx)
                .patch({ ...insert, edit_id: req.session.user.bee_id })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const body = req.body;
        const hive_ids = body.hive_ids;
        const interval = body.interval;
        const repeat = body.repeat;
        const insert = body;
        delete insert.hive_ids;
        delete insert.interval;
        delete insert.repeat;
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            const hives = await hive_model_js_1.Hive.query(trx)
                .distinct('hives.id')
                .findByIds(hive_ids)
                .leftJoinRelated('apiaries')
                .where('apiaries.user_id', req.session.user.user_id);
            const result = [];
            for (const hive in hives) {
                const res = await checkup_model_js_1.Checkup.query(trx).insert({
                    ...insert,
                    hive_id: hives[hive].id,
                    bee_id: req.session.user.bee_id,
                    user_id: req.session.user.user_id,
                });
                result.push(res.id);
                if (repeat > 0) {
                    const insert_repeat = { ...insert };
                    for (let i = 0; i < repeat; i++) {
                        insert_repeat.date = (0, dayjs_1.default)(insert_repeat.date)
                            .add(interval, 'days')
                            .format('YYYY-MM-DD');
                        insert_repeat.enddate = (0, dayjs_1.default)(insert_repeat.enddate)
                            .add(interval, 'days')
                            .format('YYYY-MM-DD');
                        const res = await checkup_model_js_1.Checkup.query(trx).insert({
                            ...insert_repeat,
                            hive_id: hives[hive].id,
                            bee_id: req.session.user.bee_id,
                            user_id: req.session.user.user_id,
                        });
                        result.push(res.id);
                    }
                }
            }
            return result;
        });
        return result;
    }
    static async updateStatus(req, reply) {
        const body = req.body;
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            return checkup_model_js_1.Checkup.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                done: body.status,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async updateDate(req, reply) {
        const body = req.body;
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            return checkup_model_js_1.Checkup.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                date: body.start,
                enddate: body.end,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            const res = await checkup_model_js_1.Checkup.query(trx)
                .findByIds(body.ids)
                .withGraphJoined('[type, hive]')
                .where('checkups.user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const query = req.query;
        const body = req.body;
        const hardDelete = query.hard ? true : false;
        const restoreDelete = query.restore ? true : false;
        const result = await checkup_model_js_1.Checkup.transaction(async (trx) => {
            const res = await checkup_model_js_1.Checkup.query(trx)
                .findByIds(body.ids)
                .select('id', 'deleted')
                .where('user_id', req.session.user.user_id);
            const softIds = [];
            const hardIds = [];
            (0, lodash_1.map)(res, (obj) => {
                if ((obj.deleted || hardDelete) && !restoreDelete)
                    hardIds.push(obj.id);
                else
                    softIds.push(obj.id);
            });
            if (hardIds.length > 0)
                await checkup_model_js_1.Checkup.query(trx).delete().whereIn('id', hardIds);
            if (softIds.length > 0)
                await checkup_model_js_1.Checkup.query(trx)
                    .patch({
                    deleted: restoreDelete ? false : true,
                    edit_id: req.session.user.bee_id,
                })
                    .findByIds(softIds);
            return res;
        });
        return result;
    }
}
exports.default = CheckupController;
