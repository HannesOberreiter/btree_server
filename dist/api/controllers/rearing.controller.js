"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
class RearingController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q, filters } = req.query;
        const query = rearing_model_js_1.Rearing.query()
            .withGraphJoined('[type, start]')
            .where({
            'rearings.user_id': req.session.user.user_id,
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
        if (q) {
            if (q.trim() !== '') {
                query.where((builder) => {
                    builder.orWhere('type.name', 'like', `%${q}%`);
                    builder.orWhere('rearings.name', 'like', `%${q}%`);
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
        const result = await rearing_model_js_1.Rearing.transaction(async (trx) => {
            return await rearing_model_js_1.Rearing.query(trx)
                .patch({ ...insert, edit_id: req.session.user.bee_id })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const body = req.body;
        const result = await rearing_model_js_1.Rearing.query().insert({
            ...body,
            user_id: req.session.user.user_id,
            bee_id: req.session.user.bee_id,
        });
        return [result.id];
    }
    static async updateDate(req, reply) {
        const body = req.body;
        const result = await rearing_model_js_1.Rearing.transaction(async (trx) => {
            return rearing_model_js_1.Rearing.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                date: body.start,
            })
                .findByIds(body.ids)
                .where('rearings.user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const result = await rearing_model_js_1.Rearing.transaction(async (trx) => {
            return rearing_model_js_1.Rearing.query(trx)
                .delete()
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await rearing_model_js_1.Rearing.transaction(async (trx) => {
            const res = await rearing_model_js_1.Rearing.query(trx)
                .findByIds(body.ids)
                .where('rearings.user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
}
exports.default = RearingController;
