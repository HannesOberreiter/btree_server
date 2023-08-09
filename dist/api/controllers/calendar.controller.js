"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calendar_util_js_1 = require("../utils/calendar.util.js");
class CalendarController {
    static async getRearings(req, reply) {
        const result = await (0, calendar_util_js_1.getRearings)(req.query, req.session.user);
        return result;
    }
    static async getTodos(req, reply) {
        const result = await (0, calendar_util_js_1.getTodos)(req.query, req.session.user);
        return result;
    }
    static async getMovements(req, reply) {
        const result = await (0, calendar_util_js_1.getMovements)(req.query, req.session.user);
        return result;
    }
    static async getCheckups(req, reply) {
        const result = await (0, calendar_util_js_1.getTask)(req.query, req.session.user, 'checkup');
        return result;
    }
    static async getTreatments(req, reply) {
        const result = await (0, calendar_util_js_1.getTask)(req.query, req.session.user, 'treatment');
        return result;
    }
    static async getHarvests(req, reply) {
        const result = await (0, calendar_util_js_1.getTask)(req.query, req.session.user, 'harvest');
        return result;
    }
    static async getFeeds(req, reply) {
        const result = await (0, calendar_util_js_1.getTask)(req.query, req.session.user, 'feed');
        return result;
    }
    static async getScaleData(req, reply) {
        const result = await (0, calendar_util_js_1.getScaleData)(req.query, req.session.user);
        return result;
    }
}
exports.default = CalendarController;
