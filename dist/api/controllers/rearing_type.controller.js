"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rearing_type_model_js_1 = require("../models/rearing/rearing_type.model.js");
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
class RearingTypeController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q } = req.query;
        const query = rearing_type_model_js_1.RearingType.query()
            .withGraphFetched('step(orderByPosition).detail')
            .where({
            'rearing_types.user_id': req.session.user.user_id,
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
                    builder.orWhere('rearing_types.name', 'like', `%${q}%`);
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
        const result = await rearing_type_model_js_1.RearingType.transaction(async (trx) => {
            return await rearing_type_model_js_1.RearingType.query(trx)
                .patch({ ...insert })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const body = req.body;
        const result = await rearing_type_model_js_1.RearingType.transaction(async (trx) => {
            return await rearing_type_model_js_1.RearingType.query(trx).insert({
                ...body,
                user_id: req.session.user.user_id,
            });
        });
        return { ...result };
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await rearing_type_model_js_1.RearingType.transaction(async (trx) => {
            const res = await rearing_type_model_js_1.RearingType.query(trx)
                .withGraphFetched('detail')
                .findByIds(body.ids)
                .where('rearing_types.user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const result = await rearing_type_model_js_1.RearingType.transaction(async (trx) => {
            await rearing_step_model_js_1.RearingStep.query(trx)
                .withGraphJoined('type')
                .delete()
                .where('type.user_id', req.session.user.user_id)
                .whereIn('type_id', body.ids);
            await rearing_model_js_1.Rearing.query(trx)
                .delete()
                .where('rearings.user_id', req.session.user.user_id)
                .whereIn('type_id', body.ids);
            return await rearing_type_model_js_1.RearingType.query(trx)
                .delete()
                .whereIn('id', body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = RearingTypeController;
