"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rearing_detail_model_js_1 = require("../models/rearing/rearing_detail.model.js");
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
class RearingDetailController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q } = req.query;
        const query = rearing_detail_model_js_1.RearingDetail.query()
            .where({
            user_id: req.session.user.user_id,
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
                    builder.orWhere('job', 'like', `%${q}%`);
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
        const result = await rearing_detail_model_js_1.RearingDetail.transaction(async (trx) => {
            return await rearing_detail_model_js_1.RearingDetail.query(trx)
                .patch({ ...insert })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const body = req.body;
        const result = await rearing_detail_model_js_1.RearingDetail.transaction(async (trx) => {
            return await rearing_detail_model_js_1.RearingDetail.query(trx).insert({
                ...body,
                user_id: req.session.user.user_id,
            });
        });
        return { ...result };
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await rearing_detail_model_js_1.RearingDetail.transaction(async (trx) => {
            const res = await rearing_detail_model_js_1.RearingDetail.query(trx)
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const result = await rearing_detail_model_js_1.RearingDetail.transaction(async (trx) => {
            await rearing_step_model_js_1.RearingStep.query(trx)
                .withGraphJoined('detail')
                .delete()
                .where('detail.user_id', req.session.user.user_id)
                .whereIn('detail_id', body.ids);
            return await rearing_detail_model_js_1.RearingDetail.query(trx)
                .delete()
                .whereIn('id', body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = RearingDetailController;
