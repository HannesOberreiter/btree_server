"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scale_model_js_1 = require("../models/scale.model.js");
const hive_model_js_1 = require("../models/hive.model.js");
const scale_data_model_js_1 = require("../models/scale_data.model.js");
const premium_util_js_1 = require("../utils/premium.util.js");
const http_errors_1 = __importDefault(require("http-errors"));
class ScaleController {
    static async get(req, reply) {
        const params = req.params;
        const query = scale_model_js_1.Scale.query()
            .withGraphFetched('hive')
            .where('user_id', req.session.user.user_id);
        if (params.id) {
            query.findById(params.id);
        }
        const result = params.id ? [await query] : await query; // array is returned to be consistent with batchGet function
        return result;
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await scale_model_js_1.Scale.transaction(async (trx) => {
            if (insert.hive_id)
                await hive_model_js_1.Hive.query(trx)
                    .where({ id: insert.hive_id, user_id: req.session.user.user_id })
                    .throwIfNotFound();
            return await scale_model_js_1.Scale.query(trx)
                .patch(insert)
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const body = req.body;
        const limit = await (0, premium_util_js_1.limitScale)(req.session.user.user_id);
        if (limit) {
            throw http_errors_1.default.PaymentRequired('no premium access');
        }
        const result = await scale_model_js_1.Scale.transaction(async (trx) => {
            if (body.hive_id)
                await hive_model_js_1.Hive.query(trx)
                    .where({ id: body.hive_id, user_id: req.session.user.user_id })
                    .throwIfNotFound();
            return await scale_model_js_1.Scale.query(trx).insert({
                name: body.name,
                hive_id: body.hive_id,
                user_id: req.session.user.user_id,
            });
        });
        return { ...result };
    }
    static async delete(req, reply) {
        const params = req.params;
        const result = await scale_model_js_1.Scale.transaction(async (trx) => {
            await scale_data_model_js_1.ScaleData.query(trx).delete().joinRelated('scale').where({
                scale_id: params.id,
                'scale.user_id': req.session.user.user_id,
            });
            return await scale_model_js_1.Scale.query(trx)
                .deleteById(params.id)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = ScaleController;
