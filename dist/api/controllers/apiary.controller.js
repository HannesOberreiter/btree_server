"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const lodash_1 = require("lodash");
const dayjs_1 = __importDefault(require("dayjs"));
const apiary_model_js_1 = require("../models/apiary.model.js");
const hive_location_model_js_1 = require("../models/hive_location.model.js");
const movedate_model_js_1 = require("../models/movedate.model.js");
const premium_util_js_1 = require("../utils/premium.util.js");
async function isDuplicateApiaryName(user_id, name) {
    const checkDuplicate = await apiary_model_js_1.Apiary.query().select('id').findOne({
        user_id,
        name,
        deleted: false,
    });
    if (checkDuplicate?.id)
        return true;
    return false;
}
class ApiaryController {
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await apiary_model_js_1.Apiary.transaction(async (trx) => {
            if (body.name) {
                if (ids.length > 1) {
                    throw http_errors_1.default.Conflict('name');
                }
            }
            return await apiary_model_js_1.Apiary.query(trx)
                .patch({ ...insert, edit_id: req.session.user.bee_id })
                .findByIds(ids)
                .withGraphFetched('hive_count')
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async get(req, reply) {
        const { order, direction, offset, limit, modus, deleted, q, details } = req.query;
        const query = apiary_model_js_1.Apiary.query()
            .where({
            'apiaries.user_id': req.session.user.user_id,
            'apiaries.deleted': deleted === 'true',
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (modus) {
            query.where('apiaries.modus', modus === 'true');
        }
        if (details === 'true') {
            query.withGraphJoined('[hive_count, creator(identifier),editor(identifier)]');
        }
        else {
            query.withGraphJoined('[hive_count]');
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
                    builder.orWhere('name', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('id');
        return result;
    }
    static async getDetail(req, reply) {
        const id = req.params.id;
        const query = apiary_model_js_1.Apiary.query()
            .findById(id)
            .where({
            'apiaries.user_id': req.session.user.user_id,
            'apiaries.deleted': false,
        })
            .withGraphFetched('[hive_count, creator(identifier), editor(identifier)]')
            .throwIfNotFound();
        const result = await query;
        const query_others = await apiary_model_js_1.Apiary.query()
            .select('id', 'name')
            .where({
            user_id: req.session.user.user_id,
            deleted: false,
            modus: true,
        })
            .orderBy('name');
        const query_first = await movedate_model_js_1.Movedate.query()
            .first()
            .where('apiary_id', result.id)
            .orderBy('date', 'desc');
        const query_hives = await hive_location_model_js_1.HiveLocation.query()
            .select('hive.name as name', 'hive.id as id', 'position', 'hive:queen_location.queen_name', 'hive:queen_location.queen_modus', 'hive:queen_location:queen.mark_colour as mark_colour')
            .leftJoinRelated('hive.[queen_location.[queen]]')
            .where({
            apiary_id: result.id,
            hive_deleted: false,
            hive_modus: true,
        })
            .orderBy('hive.position')
            .orderBy('hive.name');
        return {
            ...result,
            firstMovedate: query_first,
            sameLocation: query_others,
            hives: query_hives,
        };
    }
    static async post(req, reply) {
        const limit = await (0, premium_util_js_1.limitApiary)(req.session.user.user_id);
        if (limit) {
            throw http_errors_1.default.PaymentRequired('no premium access');
        }
        const name = req.body.name;
        const result = await apiary_model_js_1.Apiary.transaction(async (trx) => {
            if (name) {
                if (await isDuplicateApiaryName(req.session.user.user_id, req.body.name)) {
                    throw http_errors_1.default.Conflict('name');
                }
            }
            return apiary_model_js_1.Apiary.query(trx).insertAndFetch({
                bee_id: req.session.user.bee_id,
                user_id: req.session.user.user_id,
                ...req.body,
            });
        });
        return { ...result };
    }
    static async updateStatus(req, reply) {
        const body = req.body;
        const result = await apiary_model_js_1.Apiary.transaction(async (trx) => {
            return apiary_model_js_1.Apiary.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                modus: body.status,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const query = req.query;
        const body = req.body;
        const hardDelete = query.hard ? true : false;
        const restoreDelete = query.restore ? true : false;
        const result = await apiary_model_js_1.Apiary.transaction(async (trx) => {
            const res = await apiary_model_js_1.Apiary.query()
                .withGraphFetched('hive_count')
                .where('user_id', req.session.user.user_id)
                .whereIn('id', body.ids);
            const softIds = [];
            const hardIds = [];
            (0, lodash_1.map)(res, (obj) => {
                if (obj.hive_count) {
                    throw http_errors_1.default.Forbidden();
                }
                if ((obj.deleted || hardDelete) && !restoreDelete)
                    hardIds.push(obj.id);
                else
                    softIds.push(obj.id);
            });
            if (hardIds.length > 0) {
                await apiary_model_js_1.Apiary.query(trx).delete().whereIn('id', hardIds);
            }
            if (softIds.length > 0)
                await apiary_model_js_1.Apiary.query(trx)
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
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await apiary_model_js_1.Apiary.query().findByIds(body.ids).where({
            user_id: req.session.user.user_id,
        });
        return result;
    }
}
exports.default = ApiaryController;
