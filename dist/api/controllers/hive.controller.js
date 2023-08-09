"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const lodash_1 = require("lodash");
const dayjs_1 = __importDefault(require("dayjs"));
const hive_model_js_1 = require("../models/hive.model.js");
const movedate_model_js_1 = require("../models/movedate.model.js");
const apiary_model_js_1 = require("../models/apiary.model.js");
const delete_util_js_1 = require("../utils/delete.util.js");
const hive_location_model_js_1 = require("../models/hive_location.model.js");
const harvest_model_js_1 = require("../models/harvest.model.js");
const feed_model_js_1 = require("../models/feed.model.js");
const treatment_model_js_1 = require("../models/treatment.model.js");
const checkup_model_js_1 = require("../models/checkup.model.js");
const premium_util_js_1 = require("../utils/premium.util.js");
async function isDuplicateHiveName(user_id, name) {
    const checkDuplicate = await hive_model_js_1.Hive.query().select('id').findOne({
        user_id,
        name,
        deleted: false,
    });
    if (checkDuplicate?.id)
        return true;
    return false;
}
class HiveController {
    static async get(req, reply) {
        const { order, direction, offset, limit, modus, deleted, q, details, filters, } = req.query;
        const query = hive_model_js_1.Hive.query()
            .where({
            'hives.user_id': req.session.user.user_id,
            'hives.deleted': deleted === 'true',
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (modus) {
            query.where('hives.modus', modus === 'true');
        }
        if (details === 'true') {
            query.withGraphJoined('[hive_location.[movedate], queen_location, hive_source, hive_type, creator(identifier), editor(identifier)]');
        }
        else {
            query.withGraphJoined('hive_location.[movedate]');
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        query.where(v);
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
                    builder
                        .orWhere('hives.name', 'like', `%${q}%`)
                        .orWhere('hive_location.apiary_name', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('id');
        return { ...result };
    }
    static async post(req, reply) {
        const body = req.body;
        const start = parseInt(body.start);
        const repeat = parseInt(body.repeat) > 1 ? parseInt(body.repeat) : 1;
        const insertMovement = {
            apiary_id: body.apiary_id,
            date: body.date,
        };
        const insert = {
            position: body.position,
            type_id: body.type_id,
            source_id: body.source_id,
            grouphive: body.grouphive,
            note: body.note,
            modus: body.modus,
            modus_date: body.modus_date,
        };
        const limit = await (0, premium_util_js_1.limitHive)(req.session.user.user_id, repeat);
        if (limit) {
            throw http_errors_1.default.PaymentRequired('no premium access');
        }
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            await apiary_model_js_1.Apiary.query(trx)
                .findByIds(insertMovement.apiary_id)
                .throwIfNotFound()
                .where('user_id', req.session.user.user_id);
            const result = [];
            for (let i = 0; i < repeat; i++) {
                const name = repeat > 1 ? body.name + (start + i) : body.name;
                if (await isDuplicateHiveName(req.session.user.user_id, name)) {
                    throw http_errors_1.default.Conflict('name');
                }
                const res = await hive_model_js_1.Hive.query(trx).insert({
                    ...insert,
                    name: name,
                    bee_id: req.session.user.bee_id,
                    user_id: req.session.user.user_id,
                });
                await movedate_model_js_1.Movedate.query(trx).insert({
                    ...insertMovement,
                    hive_id: res.id,
                    bee_id: req.session.user.bee_id,
                });
                result.push(res.id);
            }
            return result;
        });
        return result;
    }
    static async getDetail(req, reply) {
        const params = req.params;
        const id = params.id;
        const query = hive_model_js_1.Hive.query()
            .findById(id)
            .where({
            'hives.user_id': req.session.user.user_id,
            'hives.deleted': false,
        })
            .withGraphFetched('[hive_location.[movedate], queen_location.[queen.[race, mating]], hive_source, hive_type, creator(identifier), editor(identifier)]')
            .throwIfNotFound();
        const result = await query;
        const query_first = await movedate_model_js_1.Movedate.query()
            .first()
            .where('hive_id', result.id)
            .orderBy('date', 'desc');
        const query_apiary = await hive_location_model_js_1.HiveLocation.query()
            .select('hive.id', 'hive.position', 'hive.name')
            .leftJoinRelated('hive')
            .where({
            apiary_id: result.hive_location ? result.hive_location.apiary_id : 0,
            hive_deleted: false,
            hive_modus: true,
        })
            .orderBy('hive.position')
            .orderBy('hive.name');
        return {
            ...result,
            sameLocation: query_apiary,
            firstMovedate: query_first,
        };
    }
    static async getTasks(req, reply) {
        const params = req.params;
        const q = req.query;
        const id = params.id;
        const year = q.year ? q.year : new Date().getFullYear();
        const apiary = q.apiary ? q.apiary : false;
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            let hives = [];
            if (apiary) {
                await apiary_model_js_1.Apiary.query(trx).findById(id).throwIfNotFound().where({
                    'apiaries.user_id': req.session.user.user_id,
                    'apiaries.deleted': false,
                });
                const query_hives = await hive_location_model_js_1.HiveLocation.query().select('hive_id').where({
                    apiary_id: id,
                    hive_deleted: false,
                    hive_modus: true,
                });
                hives = query_hives.map((hive) => hive.hive_id);
            }
            else {
                await hive_model_js_1.Hive.query(trx).findById(id).throwIfNotFound().where({
                    'hives.user_id': req.session.user.user_id,
                    'hives.deleted': false,
                });
                hives.push(id);
            }
            const harvest = await harvest_model_js_1.Harvest.query()
                .select('*', hive_model_js_1.Hive.raw('? as kind', ['harvest']))
                .withGraphFetched('[hive, harvest_apiary, type, creator(identifier), editor(identifier)]')
                .whereIn('hive_id', hives)
                .where({
                deleted: false,
            })
                .whereRaw('YEAR(date) = ?', year)
                .orderBy('date', 'desc');
            const feed = await feed_model_js_1.Feed.query()
                .select('*', hive_model_js_1.Hive.raw('? as kind', ['feed']))
                .withGraphFetched('[hive, feed_apiary, type, creator(identifier), editor(identifier)]')
                .whereIn('hive_id', hives)
                .where({
                deleted: false,
            })
                .whereRaw('YEAR(date) = ?', year)
                .orderBy('date', 'desc');
            const treatment = await treatment_model_js_1.Treatment.query()
                .select('*', hive_model_js_1.Hive.raw('? as kind', ['treatment']))
                .withGraphFetched('[hive, treatment_apiary, type, disease, vet, creator(identifier), editor(identifier)]')
                .whereIn('hive_id', hives)
                .where({
                deleted: false,
            })
                .whereRaw('YEAR(date) = ?', year)
                .orderBy('date', 'desc');
            const checkup = await checkup_model_js_1.Checkup.query()
                .select('*', hive_model_js_1.Hive.raw('? as kind', ['checkup']))
                .withGraphFetched('[hive, checkup_apiary, type, creator(identifier), editor(identifier)]')
                .whereIn('hive_id', hives)
                .where({
                deleted: false,
            })
                .whereRaw('YEAR(date) = ?', year)
                .orderBy('date', 'desc');
            const movedate = await movedate_model_js_1.Movedate.query()
                .select('*', hive_model_js_1.Hive.raw('? as kind', ['movedate']))
                .withGraphFetched('[hive, apiary, creator(identifier), editor(identifier)]')
                .whereIn('hive_id', hives)
                .whereRaw('YEAR(date) = ?', year)
                .orderBy('date', 'desc');
            return {
                harvest: harvest,
                feed: feed,
                treatment: treatment,
                checkup: checkup,
                movedate: movedate,
            };
        });
        return { ...result };
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            if ('name' in body.data) {
                if (ids.length > 1) {
                    throw http_errors_1.default.Conflict('name');
                }
            }
            return await hive_model_js_1.Hive.query(trx)
                .patch({ ...insert, edit_id: req.session.user.bee_id })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async updateStatus(req, reply) {
        const body = req.body;
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            return hive_model_js_1.Hive.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                modus: body.status,
                modus_date: (0, dayjs_1.default)().format('YYYY-MM-DD'),
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const q = req.query;
        const hardDelete = q.hard ? true : false;
        const restoreDelete = q.restore ? true : false;
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            const res = await hive_model_js_1.Hive.query()
                .select('id', 'deleted')
                .where('user_id', req.session.user.user_id)
                .whereIn('id', body.ids);
            const softIds = [];
            const hardIds = [];
            (0, lodash_1.map)(res, (obj) => {
                if ((obj.deleted || hardDelete) && !restoreDelete)
                    hardIds.push(obj.id);
                else
                    softIds.push(obj.id);
            });
            if (hardIds.length > 0) {
                await hive_model_js_1.Hive.query(trx).delete().whereIn('id', hardIds);
                await (0, delete_util_js_1.deleteHiveConnections)(hardIds, trx);
            }
            if (softIds.length > 0)
                await hive_model_js_1.Hive.query(trx)
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
        const result = await hive_model_js_1.Hive.query().findByIds(body.ids).where({
            user_id: req.session.user.user_id,
        });
        return result;
    }
    static async updatePosition(req, reply) {
        const body = req.body;
        const hives = body.data;
        const result = await hive_model_js_1.Hive.transaction(async (trx) => {
            const res = [];
            for (const hive of hives) {
                res.push(await hive_model_js_1.Hive.query(trx)
                    .patch({ position: hive.position })
                    .findById(hive.id)
                    .where('user_id', req.session.user.user_id));
            }
            return res;
        });
        return result;
    }
}
exports.default = HiveController;
