"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistic_util_js_1 = require("../utils/statistic.util.js");
const harvest_model_js_1 = require("../models/harvest.model.js");
const feed_model_js_1 = require("../models/feed.model.js");
const treatment_model_js_1 = require("../models/treatment.model.js");
const checkup_model_js_1 = require("../models/checkup.model.js");
class StatisticController {
    static async getHiveCountTotal(req, reply) {
        const result = await (0, statistic_util_js_1.hiveCountTotal)(req.session.user.user_id);
        return result;
    }
    static async getHiveCountApiary(req, reply) {
        let date = new Date();
        const query = req.query;
        try {
            date = new Date(query.date);
        }
        catch (e) {
            throw new Error('Invalid date');
        }
        const result = await (0, statistic_util_js_1.hiveCountApiary)(date, req.session.user.user_id);
        return result;
    }
    static async getHarvestHive(req, reply) {
        const { order, direction, offset, limit, q, filters, groupByType } = req.query;
        const query = harvest_model_js_1.Harvest.query()
            .select(harvest_model_js_1.Harvest.raw('YEAR(date) as year'), 'hive_id')
            .sum('amount as amount_sum')
            .sum('frames as frames_sum')
            .avg('amount as amount_avg')
            .avg('frames as frames_avg')
            .avg('water as water_avg')
            .withGraphJoined('hive')
            .withGraphJoined('harvest_apiary as task_apiary')
            .groupBy('hive_id', 'year')
            .where({
            'hive.deleted': false,
            'harvests.deleted': false,
            'harvests.user_id': req.session.user.user_id,
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
                    builder.orWhere('hive.name', 'like', `%${q}%`);
                });
            }
        }
        if (groupByType) {
            if (groupByType === 'true') {
                query
                    .groupBy('harvests.type_id')
                    .withGraphJoined('type')
                    .select('type.name');
            }
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
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
        const result = await query.orderBy('hive.name');
        return { ...result };
    }
    static async getHarvestYear(req, reply) {
        const { filters } = req.query;
        const query = harvest_model_js_1.Harvest.query()
            .select(harvest_model_js_1.Harvest.raw('YEAR(date) as year'))
            .select(harvest_model_js_1.Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            .select(harvest_model_js_1.Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'))
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .sum('frames as frames_sum')
            //.avg('amount as amount_avg')
            //.avg('frames as frames_avg')
            .avg('water as water_avg')
            .withGraphJoined('harvest_apiary as task_apiary')
            .groupBy('year')
            .where({
            'harvests.deleted': false,
            'harvests.user_id': req.session.user.user_id,
        })
            .orderBy('year', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            return;
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        const result = await query;
        return result;
    }
    static async getHarvestApiary(req, reply) {
        const { filters } = req.query;
        const query = harvest_model_js_1.Harvest.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .sum('frames as frames_sum')
            .select(harvest_model_js_1.Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            .select(harvest_model_js_1.Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'))
            //.avg('amount as amount_avg')
            //.avg('frames as frames_avg')
            .avg('water as water_avg')
            .withGraphJoined('harvest_apiary as task_apiary')
            .groupBy('apiary_id')
            .where({
            'harvests.deleted': false,
            'harvests.user_id': req.session.user.user_id,
        })
            .orderBy('task_apiary.apiary_name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getHarvestType(req, reply) {
        const { filters } = req.query;
        const query = harvest_model_js_1.Harvest.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .sum('frames as frames_sum')
            .select(harvest_model_js_1.Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            .select(harvest_model_js_1.Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'))
            //.avg('amount as amount_avg')
            //.avg('frames as frames_avg')
            .avg('water as water_avg')
            .withGraphJoined('harvest_apiary as task_apiary')
            .withGraphJoined('type')
            .groupBy('type_id')
            .where({
            'harvests.deleted': false,
            'harvests.user_id': req.session.user.user_id,
        })
            .orderBy('type.name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getFeedHive(req, reply) {
        const { order, direction, offset, limit, q, filters, groupByType } = req.query;
        const query = feed_model_js_1.Feed.query()
            .select(feed_model_js_1.Feed.raw('YEAR(date) as year'), 'hive_id')
            .sum('amount as amount_sum')
            .select(feed_model_js_1.Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('hive')
            .withGraphJoined('feed_apiary as task_apiary')
            .groupBy('hive_id', 'year')
            .where({
            'hive.deleted': false,
            'feeds.deleted': false,
            'feeds.user_id': req.session.user.user_id,
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
                    builder.orWhere('hive.name', 'like', `%${q}%`);
                });
            }
        }
        if (groupByType) {
            if (groupByType === 'true') {
                query
                    .groupBy('feeds.type_id')
                    .withGraphJoined('type')
                    .select('type.name');
            }
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
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
        const result = await query.orderBy('hive.name');
        return { ...result };
    }
    static async getFeedYear(req, reply) {
        const { filters } = req.query;
        const query = feed_model_js_1.Feed.query()
            .select(feed_model_js_1.Feed.raw('YEAR(date) as year'))
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(feed_model_js_1.Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('feed_apiary as task_apiary')
            .groupBy('year')
            .where({
            'feeds.deleted': false,
            'feeds.user_id': req.session.user.user_id,
        })
            .orderBy('year', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            return;
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        const result = await query;
        return result;
    }
    static async getFeedApiary(req, reply) {
        const { filters } = req.query;
        const query = feed_model_js_1.Feed.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(feed_model_js_1.Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('feed_apiary as task_apiary')
            .groupBy('apiary_id')
            .where({
            'feeds.deleted': false,
            'feeds.user_id': req.session.user.user_id,
        })
            .orderBy('task_apiary.apiary_name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getFeedType(req, reply) {
        const { filters } = req.query;
        const query = feed_model_js_1.Feed.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(feed_model_js_1.Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('feed_apiary as task_apiary')
            .withGraphJoined('type')
            .groupBy('type_id')
            .where({
            'feeds.deleted': false,
            'feeds.user_id': req.session.user.user_id,
        })
            .orderBy('type.name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getTreatmentHive(req, reply) {
        const { order, direction, offset, limit, q, filters } = req.query;
        const query = treatment_model_js_1.Treatment.query()
            .select(treatment_model_js_1.Treatment.raw('YEAR(date) as year'), 'hive_id')
            .sum('amount as amount_sum')
            .select(treatment_model_js_1.Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('hive')
            .withGraphJoined('treatment_apiary as task_apiary')
            .groupBy('hive_id', 'year')
            .where({
            'hive.deleted': false,
            'treatments.deleted': false,
            'treatments.user_id': req.session.user.user_id,
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
                    builder.orWhere('hive.name', 'like', `%${q}%`);
                });
            }
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
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
        const result = await query.orderBy('hive.name');
        return { ...result };
    }
    static async getTreatmentYear(req, reply) {
        const { filters } = req.query;
        const query = treatment_model_js_1.Treatment.query()
            .select(treatment_model_js_1.Treatment.raw('YEAR(date) as year'))
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(treatment_model_js_1.Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            .withGraphJoined('treatment_apiary as task_apiary')
            .groupBy('year')
            .where({
            'treatments.deleted': false,
            'treatments.user_id': req.session.user.user_id,
        })
            .orderBy('year', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            return;
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        const result = await query;
        return result;
    }
    static async getTreatmentApiary(req, reply) {
        const { filters } = req.query;
        const query = treatment_model_js_1.Treatment.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(treatment_model_js_1.Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('treatment_apiary as task_apiary')
            .groupBy('apiary_id')
            .where({
            'treatments.deleted': false,
            'treatments.user_id': req.session.user.user_id,
        })
            .orderBy('task_apiary.apiary_name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getTreatmentType(req, reply) {
        const { filters } = req.query;
        const query = treatment_model_js_1.Treatment.query()
            .countDistinct('hive_id as hive_count')
            .sum('amount as amount_sum')
            .select(treatment_model_js_1.Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
            //.avg('amount as amount_avg')
            .withGraphJoined('treatment_apiary as task_apiary')
            .withGraphJoined('type')
            .groupBy('type_id')
            .where({
            'treatments.deleted': false,
            'treatments.user_id': req.session.user.user_id,
        })
            .orderBy('type.name', 'asc');
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(harvest_model_js_1.Harvest.raw('YEAR(date)'), v.year);
                        }
                        else if ('hive_id_array' in v) {
                            query.whereIn('hive_id', v['hive_id_array']);
                        }
                        else if ('apiary_id_array' in v) {
                            query.whereIn('apiary_id', v['apiary_id_array']);
                        }
                        else if ('hive_id_array_exclude' in v) {
                            query.whereNotIn('hive_id', v['hive_id_array_exclude']);
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
        else {
            query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
        }
        const result = await query;
        return result;
    }
    static async getCheckupRatingHive(req, reply) {
        const { order, direction, offset, limit, q, filters } = req.query;
        const query = checkup_model_js_1.Checkup.query()
            .select('hive_id', checkup_model_js_1.Checkup.raw('AVG(NULLIF(brood, 0)) as brood'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(pollen, 0)) as pollen'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(comb, 0)) as comb'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(temper, 0)) as temper'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(calm_comb, 0)) as calm_comb'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(swarm, 0)) as swarm'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(varroa, 0)) as varroa'), checkup_model_js_1.Checkup.raw('AVG(NULLIF(strong, 0)) as strong'))
            .select(checkup_model_js_1.Checkup.raw('YEAR(date) as year'))
            .withGraphJoined('hive')
            .where({
            'checkups.deleted': false,
            'checkups.user_id': req.session.user.user_id,
            'hive.deleted': false,
        })
            .groupBy('hive_id', 'year')
            .havingRaw('(SUM(brood) + SUM(pollen) + SUM(comb) + SUM(temper) + SUM(calm_comb) + SUM(swarm) + SUM(varroa) + SUM(strong)) > 0')
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
                    builder.orWhere('hive.name', 'like', `%${q}%`);
                });
            }
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('year' in v) {
                            query.where(checkup_model_js_1.Checkup.raw('YEAR(date)'), v.year);
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
        const result = await query.orderBy('hive.name');
        return { ...result };
    }
}
exports.default = StatisticController;
