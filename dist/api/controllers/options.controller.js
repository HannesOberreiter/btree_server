"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const charge_type_model_js_1 = require("../models/option/charge_type.model.js");
const checkup_type_model_js_1 = require("../models/option/checkup_type.model.js");
const feed_type_model_js_1 = require("../models/option/feed_type.model.js");
const harvest_type_model_js_1 = require("../models/option/harvest_type.model.js");
const treatment_type_model_js_1 = require("../models/option/treatment_type.model.js");
const treatment_disease_model_js_1 = require("../models/option/treatment_disease.model.js");
const treatment_vet_model_js_1 = require("../models/option/treatment_vet.model.js");
const hive_source_model_js_1 = require("../models/option/hive_source.model.js");
const hive_type_mode_js_1 = require("../models/option/hive_type.mode.js");
const queen_mating_model_js_1 = require("../models/option/queen_mating.model.js");
const queen_race_model_js_1 = require("../models/option/queen_race.model.js");
class OptionController {
    static tables = {
        charge_types: charge_type_model_js_1.ChargeType,
        hive_sources: hive_source_model_js_1.HiveSource,
        hive_types: hive_type_mode_js_1.HiveType,
        feed_types: feed_type_model_js_1.FeedType,
        harvest_types: harvest_type_model_js_1.HarvestType,
        checkup_types: checkup_type_model_js_1.CheckupType,
        queen_matings: queen_mating_model_js_1.QueenMating,
        queen_races: queen_race_model_js_1.QueenRace,
        treatment_diseases: treatment_disease_model_js_1.TreatmentDisease,
        treatment_types: treatment_type_model_js_1.TreatmentType,
        treatment_vets: treatment_vet_model_js_1.TreatmentVet,
    };
    static async get(req, reply) {
        const params = req.params['table'];
        const { order, direction, modus } = req.query;
        const table = OptionController.tables[params];
        const query = table
            .query()
            .where(`${params}.user_id`, req.session.user.user_id);
        if (params === 'charge_types') {
            query.withGraphJoined('stock');
        }
        if (modus) {
            query.where('modus', modus === 'true');
        }
        if (order) {
            if (Array.isArray(order)) {
                order.forEach((field, index) => query.orderBy(field, direction[index]));
            }
            else {
                query.orderBy(order, direction);
            }
        }
        const result = await query;
        return result;
    }
    static async patch(req, reply) {
        const body = req.body;
        const params = req.params['table'];
        const ids = body.ids;
        const insert = { ...body.data };
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            return await table
                .query(trx)
                .patch({ ...insert })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async post(req, reply) {
        const params = req.params['table'];
        const body = req.body;
        const insert = { ...body };
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            if (insert.favorite == true) {
                await table
                    .query(trx)
                    .patch({ favorite: false })
                    .where('user_id', req.session.user.user_id);
            }
            return await table.query(trx).insert({
                ...insert,
                user_id: req.session.user.user_id,
            });
        });
        return result;
    }
    static async updateStatus(req, reply) {
        const params = req.params['table'];
        const body = req.body;
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            return await table
                .query(trx)
                .patch({
                modus: body.status,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async updateFavorite(req, reply) {
        const params = req.params['table'];
        const body = req.body;
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            await table
                .query(trx)
                .patch({ favorite: false })
                .where('user_id', req.session.user.user_id);
            return await table
                .query(trx)
                .patch({ favorite: true })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchGet(req, reply) {
        const params = req.params['table'];
        const body = req.body;
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            const res = await table
                .query(trx)
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const params = req.params['table'];
        const body = req.body;
        const table = OptionController.tables[params];
        const result = await table.transaction(async (trx) => {
            return await table
                .query(trx)
                .delete()
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = OptionController;
