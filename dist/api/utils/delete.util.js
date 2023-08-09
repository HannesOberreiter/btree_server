"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHiveConnections = exports.deleteCompany = exports.deleteUser = void 0;
const apiary_model_js_1 = require("../models/apiary.model.js");
const charge_model_js_1 = require("../models/charge.model.js");
const charge_type_model_js_1 = require("../models/option/charge_type.model.js");
const error_util_js_1 = require("./error.util.js");
const checkup_model_js_1 = require("../models/checkup.model.js");
const checkup_type_model_js_1 = require("../models/option/checkup_type.model.js");
const company_model_js_1 = require("../models/company.model.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const feed_model_js_1 = require("../models/feed.model.js");
const feed_type_model_js_1 = require("../models/option/feed_type.model.js");
const field_setting_model_js_1 = require("../models/field_setting.model.js");
const harvest_model_js_1 = require("../models/harvest.model.js");
const harvest_type_model_js_1 = require("../models/option/harvest_type.model.js");
const hive_model_js_1 = require("../models/hive.model.js");
const hive_source_model_js_1 = require("../models/option/hive_source.model.js");
const hive_type_mode_js_1 = require("../models/option/hive_type.mode.js");
const movedate_model_js_1 = require("../models/movedate.model.js");
const queen_mating_model_js_1 = require("../models/option/queen_mating.model.js");
const queen_race_model_js_1 = require("../models/option/queen_race.model.js");
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
const rearing_detail_model_js_1 = require("../models/rearing/rearing_detail.model.js");
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
const rearing_type_model_js_1 = require("../models/rearing/rearing_type.model.js");
const refresh_token_model_js_1 = require("../models/refresh_token.model.js");
const todo_model_js_1 = require("../models/todo.model.js");
const treatment_model_js_1 = require("../models/treatment.model.js");
const treatment_disease_model_js_1 = require("../models/option/treatment_disease.model.js");
const treatment_type_model_js_1 = require("../models/option/treatment_type.model.js");
const treatment_vet_model_js_1 = require("../models/option/treatment_vet.model.js");
const user_model_js_1 = require("../models/user.model.js");
const queen_model_js_1 = require("../models/queen.model.js");
const dropbox_model_js_1 = require("../models/dropbox.model.js");
const deleteUser = async (bee_id) => {
    try {
        const result = await user_model_js_1.User.transaction(async (trx) => {
            await company_bee_model_js_1.CompanyBee.query(trx).delete().where({ bee_id: bee_id });
            await field_setting_model_js_1.FieldSetting.query(trx).delete().where({ bee_id: bee_id });
            await refresh_token_model_js_1.RefreshToken.query(trx).delete().where({ bee_id: bee_id });
            await user_model_js_1.User.query(trx).deleteById(bee_id);
            return true;
        });
        return result;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.deleteUser = deleteUser;
const deleteCompany = async (company_id) => {
    try {
        await company_model_js_1.Company.transaction(async (trx) => {
            await Promise.all([
                rearing_model_js_1.Rearing.query(trx).delete().where({ user_id: company_id }),
                rearing_detail_model_js_1.RearingDetail.query(trx).delete().where({ user_id: company_id }),
                rearing_step_model_js_1.RearingStep.query(trx)
                    .delete()
                    .withGraphJoined('type')
                    .where({ user_id: company_id }),
                rearing_type_model_js_1.RearingType.query(trx).delete().where({ user_id: company_id }),
                queen_model_js_1.Queen.query(trx).delete().where({ user_id: company_id }),
            ]);
            await Promise.all([
                charge_model_js_1.Charge.query(trx).delete().where({ user_id: company_id }),
                checkup_model_js_1.Checkup.query(trx).delete().where({ user_id: company_id }),
                harvest_model_js_1.Harvest.query(trx).delete().where({ user_id: company_id }),
                feed_model_js_1.Feed.query(trx).delete().where({ user_id: company_id }),
                treatment_model_js_1.Treatment.query(trx).delete().where({ user_id: company_id }),
                todo_model_js_1.Todo.query(trx).delete().where({ user_id: company_id }),
            ]);
            await Promise.all([
                charge_type_model_js_1.ChargeType.query(trx).delete().where({ user_id: company_id }),
                checkup_type_model_js_1.CheckupType.query(trx).delete().where({ user_id: company_id }),
                feed_type_model_js_1.FeedType.query(trx).delete().where({ user_id: company_id }),
                harvest_type_model_js_1.HarvestType.query(trx).delete().where({ user_id: company_id }),
                hive_source_model_js_1.HiveSource.query(trx).delete().where({ user_id: company_id }),
                hive_type_mode_js_1.HiveType.query(trx).delete().where({ user_id: company_id }),
                queen_mating_model_js_1.QueenMating.query(trx).delete().where({ user_id: company_id }),
                queen_race_model_js_1.QueenRace.query(trx).delete().where({ user_id: company_id }),
                treatment_disease_model_js_1.TreatmentDisease.query(trx).delete().where({ user_id: company_id }),
                treatment_type_model_js_1.TreatmentType.query(trx).delete().where({ user_id: company_id }),
                treatment_vet_model_js_1.TreatmentVet.query(trx).delete().where({ user_id: company_id }),
            ]);
            await hive_model_js_1.Hive.query(trx).delete().where({ user_id: company_id });
            await dropbox_model_js_1.Dropbox.query(trx).delete().where({ user_id: company_id });
            await movedate_model_js_1.Movedate.query(trx)
                .delete()
                .withGraphJoined('apiary')
                .where({ 'apiary.user_id': company_id });
            await apiary_model_js_1.Apiary.query(trx).delete().where({ user_id: company_id });
            await company_bee_model_js_1.CompanyBee.query(trx).delete().where({ user_id: company_id });
            await company_model_js_1.Company.query(trx).deleteById(company_id);
            return true;
        });
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.deleteCompany = deleteCompany;
const deleteHiveConnections = async (hive_ids, trx) => {
    await Promise.all([
        movedate_model_js_1.Movedate.query(trx).delete().whereIn('hive_id', hive_ids),
        feed_model_js_1.Feed.query(trx).delete().whereIn('hive_id', hive_ids),
        treatment_model_js_1.Treatment.query(trx).delete().whereIn('hive_id', hive_ids),
        checkup_model_js_1.Checkup.query(trx).delete().whereIn('hive_id', hive_ids),
        harvest_model_js_1.Harvest.query(trx).delete().whereIn('hive_id', hive_ids),
        queen_model_js_1.Queen.query(trx).delete().whereIn('hive_id', hive_ids),
    ]);
};
exports.deleteHiveConnections = deleteHiveConnections;
