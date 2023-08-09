"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScaleData = exports.getRearings = exports.getTodos = exports.getMovements = exports.getTask = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_1 = require("lodash");
const db_server_js_1 = require("../../servers/db.server.js");
const todo_model_js_1 = require("../models/todo.model.js");
const rearing_model_js_1 = require("../models/rearing/rearing.model.js");
const rearing_step_model_js_1 = require("../models/rearing/rearing_step.model.js");
const convertDate = ({ start, end }) => {
    return {
        start: (0, dayjs_1.default)(start).toISOString().slice(0, 19).replace('T', ' '),
        end: (0, dayjs_1.default)(end).toISOString().slice(0, 19).replace('T', ' '),
    };
};
const getRearings = async (params, user) => {
    /*
     * Fetching Rearings and corresponding steps
     */
    const rearings_query = rearing_model_js_1.Rearing.query()
        .where('rearings.user_id', user.user_id)
        .withGraphFetched('[start, type]');
    if (params.id) {
        // if not used inside calendar and we only want one event
        rearings_query.where('id', params.id);
    }
    else {
        // Because Rearings could goes over multiple months we add / substract here to catch them
        const start = (0, dayjs_1.default)(params.start).subtract(2, 'month').toISOString();
        const end = (0, dayjs_1.default)(params.end).add(2, 'month').toISOString();
        rearings_query.where('date', '>=', start).where('date', '<=', end);
    }
    const rearings = await rearings_query;
    const rearingsSteps = [];
    for (const i in rearings) {
        const res = rearings[i];
        const steps = await rearing_step_model_js_1.RearingStep.query()
            .where('type_id', res.type_id)
            .withGraphFetched('detail')
            .orderBy('position', 'asc');
        for (const j in steps) {
            steps[j]['key'] = j;
            if (steps[j].detail_id === res.start.id) {
                res.startPosition = steps[j].position;
                res.startKey = j;
            }
        }
        res.steps = { ...steps };
        rearingsSteps.push(res);
    }
    /*
     * Create ordered calendar events from starting step
     */
    const results = [];
    for (const i in rearingsSteps) {
        // addDate is helper for steps after selected step
        let addDate = (0, dayjs_1.default)(rearingsSteps[i].date);
        for (const j in rearingsSteps[i].steps) {
            const result = { ...rearingsSteps[i] };
            result.steps = rearingsSteps[i].steps;
            result.currentStep = { ...result.steps[j] };
            if (result.startPosition === result.currentStep.position) {
                // Current Step is actual Start Step
                result.start = (0, dayjs_1.default)(result.date).toISOString();
            }
            else {
                if (parseInt(result.currentStep.position) > parseInt(result.startPosition)) {
                    // Step comes behind Start Step, we can simply add up the hours
                    addDate = addDate.add(result.currentStep.sleep_before, 'hour');
                    result.start = addDate.toISOString();
                }
                else {
                    // Step comes before Start Step, this is more complicated as
                    // we need to account for the steps which are coming before it
                    const steps_before = result.startKey - result.currentStep.key;
                    // subDate is helper to calculate the date
                    let subDate = (0, dayjs_1.default)(result.date);
                    for (let k = 0; k < steps_before; k++) {
                        subDate = subDate.subtract(result.steps[result.startKey - k].sleep_before, 'hour');
                    }
                    result.start = subDate.toISOString();
                }
            }
            result.steps[j].date = result.start;
            result.currentStep.date = result.start;
            result.title = `${result.currentStep.detail.job} ID: ${result.name ? result.name : result.id}`;
            result.table = 'rearing';
            result.allDay = false;
            result.icon = `fas fa-${result.symbol ? result.symbol : 'venus'}`;
            result.color = '#f5dfef';
            result.textColor = 'black';
            result.end = (0, dayjs_1.default)(result.start).add(1, 'second').toISOString();
            result.groupId = `Q${result.id}`;
            result.displayEventTime = true;
            result.durationEditable = false;
            results.push(result);
        }
    }
    return results;
};
exports.getRearings = getRearings;
const getTodos = async (params, user) => {
    const { start, end } = convertDate(params);
    const results = await todo_model_js_1.Todo.query()
        .where('user_id', user.user_id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .withGraphJoined('[creator(identifier), editor(identifier)]');
    let result = [];
    for (const i in results) {
        const res = results[i];
        res.allDay = true;
        res.task_ids = res.id;
        res.description = res.note;
        res.start = (0, dayjs_1.default)(res.date).format('YYYY-MM-DD');
        res.title = res.name;
        res.icon = 'fas fa-clipboard';
        res.durationEditable = false;
        if (res.done) {
            res.unicode = '✏️ ✅';
            res.color = 'green';
        }
        else {
            res.unicode = '✏️ ❎';
            res.color = 'red';
        }
        res.table = 'todo';
        if (res.editor) {
            res.editors = res.editor.username
                ? res.editor.username
                : res.editor.email;
        }
        else {
            res.editors = '';
        }
        if (res.creator) {
            res.creators = res.creator.username
                ? res.creator.username
                : res.creator.email;
        }
        else {
            res.creators = '';
        }
        result.push(res);
    }
    return result;
};
exports.getTodos = getTodos;
const getMovements = async (params, user) => {
    const { start, end } = convertDate(params);
    const instance = db_server_js_1.DatabaseServer.getInstance();
    const results = await instance
        .knex(`calendar_movements`)
        .where('user_id', user.user_id)
        .where('date', '>=', start)
        .where('date', '<=', end);
    let result = [];
    for (const i in results) {
        const res = results[i];
        res.allDay = true;
        res.task_ids = res.move_ids;
        res.start = (0, dayjs_1.default)(res.date).format('YYYY-MM-DD');
        const count = (res.hive_names.match(/,/g) || []).length + 1;
        if (count === 1) {
            res.title = `[${res.hive_names}] - ${res.apiary_name}`;
        }
        else {
            res.title = `${count}x ${res.apiary_name}`;
        }
        res.icon = 'fas fa-truck';
        res.unicode = '🚚';
        res.color = 'gray';
        res.table = 'movedate';
        res.description = res.hive_names;
        res.durationEditable = false;
        if (res.editors) {
            res.editors = String((0, lodash_1.intersection)(res.editors.split(',')));
        }
        else {
            res.editors = '';
        }
        if (res.creators) {
            res.creators = String((0, lodash_1.intersection)(res.creators.split(',')));
        }
        else {
            res.creators = '';
        }
        result.push(res);
    }
    return result;
};
exports.getMovements = getMovements;
const getTask = async (params, user, task) => {
    const { start, end } = convertDate(params);
    const instance = db_server_js_1.DatabaseServer.getInstance();
    const results = await instance
        .knex(`calendar_${task}s`)
        .where('user_id', user.user_id)
        .where('date', '>=', start)
        .where('enddate', '<=', end);
    let result = [];
    for (const i in results) {
        const res = results[i];
        res.id = task;
        res.description = res.hive_names;
        res.allDay = true;
        res.start = (0, dayjs_1.default)(res.date).format('YYYY-MM-DD');
        // https://stackoverflow.com/a/54035812/5316675
        const count = (res.hive_names.match(/,/g) || []).length + 1;
        if (count === 1) {
            res.title = `[${res.hive_names}] ${res.type_name} - ${res.apiary_name}`;
        }
        else {
            res.title = `${count}x ${res.type_name} - ${res.apiary_name}`;
        }
        if (task === 'checkup') {
            res.icon = 'fas fa-search';
            res.color = '#067558';
        }
        else if (task === 'treatment') {
            res.icon = 'fas fa-plus';
            res.color = '#cc5b9a';
            res.title += ` (${res.disease_name})`;
        }
        else if (task === 'feed') {
            res.icon = 'fas fa-cube';
            res.color = '#d55e00';
        }
        else if (task === 'harvest') {
            res.icon = 'fas fa-tint';
            res.color = 'yellow';
            res.textColor = 'black';
        }
        res.unicode = '✅';
        if (!res.done) {
            res.unicode = '❎';
            res.color = 'red';
            res.textColor = 'white';
        }
        res.table = task;
        if (res.editors) {
            res.editors = String((0, lodash_1.intersection)(res.editors.split(',')));
        }
        else {
            res.editors = '';
        }
        if (res.creators) {
            res.creators = String((0, lodash_1.intersection)(res.creators.split(',')));
        }
        else {
            res.creators = '';
        }
        // Event end Date is exclusive see docu https://fullcalendar.io/docs/event_data/Event_Object/
        res.end = (0, dayjs_1.default)(res.enddate).add(1, 'day').format('YYYY-MM-DD');
        result.push(res);
    }
    return result;
};
exports.getTask = getTask;
const getScaleData = async (params, user) => {
    const { start, end } = convertDate(params);
    const instance = db_server_js_1.DatabaseServer.getInstance();
    const results = await instance
        .knex(`calendar_scale_data`)
        .where('user_id', user.user_id)
        .where('date', '>=', start)
        .where('date', '<=', end);
    let result = [];
    let weight_last = 0;
    for (const i in results) {
        const res = results[i];
        res.id = res.name;
        res.allDay = true;
        // Event end Date is exclusive see docu https://fullcalendar.io/docs/event_data/Event_Object/
        res.start = (0, dayjs_1.default)(res.date).format('YYYY-MM-DD');
        res.end = (0, dayjs_1.default)(res.date).add(1, 'day').format('YYYY-MM-DD');
        res.difference = (0, lodash_1.round)(res.average - weight_last, 1);
        res.description = res.difference;
        weight_last = res.average;
        const weight_addon = res.difference > 0 ? '(+)' : '(-)';
        res.title = `${weight_addon} ${res.average} ${res.name}`;
        res.icon = res.difference > 0 ? `fas fa-plus` : 'fas fa-minus';
        res.color = res.difference > 0 ? 'green' : 'red';
        res.textColor = 'white';
        res.editable = false;
        result.push(res);
    }
    return result;
};
exports.getScaleData = getScaleData;
