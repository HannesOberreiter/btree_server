"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_setting_model_js_1 = require("../models/field_setting.model.js");
class FieldSettingController {
    static async get(req, reply) {
        const result = await field_setting_model_js_1.FieldSetting.query()
            .select('settings')
            .first()
            .where({ bee_id: req.session.user.bee_id });
        return result ? result : false;
    }
    static async patch(req, reply) {
        const body = req.body;
        const trx = await field_setting_model_js_1.FieldSetting.startTransaction();
        try {
            const settings = JSON.parse(body.settings);
            const current = await field_setting_model_js_1.FieldSetting.query()
                .first()
                .where('bee_id', req.session.user.bee_id);
            if (current) {
                await field_setting_model_js_1.FieldSetting.query(trx)
                    .where('bee_id', req.session.user.bee_id)
                    .patch({ settings: settings });
            }
            else {
                await field_setting_model_js_1.FieldSetting.query(trx).insert({
                    bee_id: req.session.user.bee_id,
                    settings: settings,
                });
            }
            await trx.commit();
            return settings;
        }
        catch (e) {
            await trx.rollback();
            throw e;
        }
    }
}
exports.default = FieldSettingController;
