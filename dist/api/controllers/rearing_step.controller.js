"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
class RearingStepController {
    static async post(req, reply) {
        const body = req.body;
        const result = await rearing_step_model_js_1.RearingStep.transaction(async (trx) => {
            return await rearing_step_model_js_1.RearingStep.query(trx).insert({
                ...body,
            });
        });
        return { ...result };
    }
    static async delete(req, reply) {
        const params = req.params;
        const result = await rearing_step_model_js_1.RearingStep.transaction(async (trx) => {
            const result = await rearing_step_model_js_1.RearingStep.query(trx)
                .delete()
                .withGraphJoined('detail')
                .where('detail.user_id', req.session.user.user_id)
                .findById(params.id);
            return result;
        });
        return result;
    }
    static async updatePosition(req, reply) {
        const body = req.body;
        const steps = body.data;
        const result = await rearing_step_model_js_1.RearingStep.transaction(async (trx) => {
            const res = [];
            for (const step of steps) {
                res.push(await rearing_step_model_js_1.RearingStep.query(trx)
                    .withGraphJoined('detail')
                    .patch({
                    position: step.position,
                    sleep_before: step.sleep_before,
                })
                    .findById(step.id)
                    .where('detail.user_id', req.session.user.user_id));
            }
            return res;
        });
        return result;
    }
}
exports.default = RearingStepController;
